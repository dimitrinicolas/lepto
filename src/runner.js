const chokidar = require('chokidar');
const deepDiff = require('deep-object-diff');
const dirTree = require('directory-tree');
const fastGlob = require('fast-glob');
const fileType = require('file-type');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const defaultConfig = require('./default-config.js');
const events = require('./events.js');
const filters = require('./filters.js');
const gui = require('./gui.js');
const pipe = require('./pipe.js');
const saveData = require('./save-data.js');

class Runner {
  constructor(config={}, params={}) {
    this._extensions = /\.(jpg|jpeg|png|gif|svg|tiff|bmp|webp)/;
    this.unlinkFollowers = {};
    this.cli = params.cli ? true : false;;
    this.cliConfig = typeof params.cliConfig !== 'undefined' ? params.cliConfig : {};
    this.configFile = typeof params.configFile !== 'undefined' ? params.configFile : '';
    const configSet = this.setConfig(config);
    if (configSet.success) {
      if (this.config.gui) {
        if (this.cli && path.extname(this.configFile) === '.json') {
          gui.init(this.config.guiPort);
          this.updateGUIConfig();
          gui.on('config-update', (config) => {
            const normalizedConfig = this.normalizeConfig(config);
            const diff = deepDiff.diff(normalizedConfig, this.config);
            if (Object.keys(diff).length) {
              const configSet = this.setConfig(config);
              if (configSet.success) {
                this.processAll();
                const jsonStr = JSON.stringify(config, null, 2);
                fse.outputFile(this.configFile, jsonStr, err => {
                  this.configFileWritten = true;
                  if (err) {
                    gui.updateFinish();
                    events.dispatch('error', 'Unable to save config file from GUI update');
                  }
                  else {
                    gui.updateFinish(config);
                    events.dispatch('info', {
                      msg: 'Config updated from GUI'
                    });
                  }
                });
              }
              else if (!configSet.success) {
                events.dispatch('warn', {
                  msg: `Unable to update config from GUI: ${configSet.msg}`
                });
              }
            }
            else {
              events.dispatch('info', {
                msg: 'Config updated from GUI, but no difference found'
              });
            }
          });
          if (this.config.openGui) {
            // TODO open browser
          }
        }
        else {
          events.dispatch('error', `You can only use lepto GUI by cli with a json config file`);
        }
      }
      if (this.config.processAll) {
        this.processAll();
      }
    }
    else {
      events.dispatch('error', configSet.msg);
    }
  }

  setConfig(data) {
    const config = this.normalizeConfig(data);
    if (!config.input) {
      return {
        success: false,
        msg: 'Missing input'
      };
    }
    if (!config.output) {
      return {
        success: false,
        msg: 'Missing output'
      };
    }
    if (path.resolve(config.input) === path.resolve(config.output)) {
      return {
        success: false,
        msg: `Input and output can't be the same directory`
      };
    }

    this.configRaw = data;
    this.config = config;

    this.filtersList = filters.generate(path.resolve(this.config.input), this.config.filters);
    this.globAllInput = path.resolve(this.config.input) + '/**/*.*';
    this.globAllOutput = path.resolve(this.config.output) + '/**/*.*';

    if (this.watcher) {
      this.watcher.close();
    }
    if (this.config.watch) {
      this.watcher = chokidar.watch(this.globAllInput, {
        ignoreInitial: true,
        ignored: this.globAllOutput
      }).on('all', this.handleWatchEvent.bind(this));
    }

    return {
      success: true
    };
  }

  handleConfigUpdate(data) {
    const newConfig = this.normalizeConfig(data);
    const diff = deepDiff.diff(newConfig, this.config);
    if (Object.keys(diff).length) {
      this.configFileWritten = false;
      const configSet = this.setConfig(data);
      if (configSet.success) {
        events.dispatch('info', {
          msg: 'Config updated'
        });
        this.processAll();
        this.updateGUIConfig(this.config);
      }
      else if (!configSet.success) {
        events.dispatch('warn', {
          msg: `Unable to update config: ${configSet.msg}`
        });
      }
    }
    else {
      if (!this.configFileWritten) {
        this.configFileWritten = false;
        events.dispatch('info', {
          msg: 'Config file changed, but no difference found'
        });
      }
    }
  }

  normalizeConfig(config) {
    if (this.cli) {
      config = Object.assign({}, defaultConfig.main, defaultConfig.cli, config);
    }
    else {
      config = Object.assign({}, defaultConfig.main, config);
    }
    if (this.cliConfig) {
      Object.assign(config, this.cliConfig);
    }
    return config;
  }

  handleWatchEvent(event, filePath) {
    if (['add', 'change'].indexOf(event) !== -1) {
      this.processList([filePath], event);
    }
    if (event === 'unlink' && this.config.followUnlink) {
      this.unlink(filePath);
    }
    this.updateGUITree();
  }

  processList(list, event) {
    for (let item of list) {
      const processStart = Date.now();
      const pluginsList = filters.getPluginsList(this.filtersList, item);
      const relativePath = path.relative(path.resolve(process.cwd(), this.config.input), item);
      const adjs = {
        add: 'new',
        change: 'changed'
      };
      let adj = typeof adjs[event] !== 'undefined' ? adjs[event] + ' ' : '';
      if (pluginsList.length === 0) {
        fs.readFile(item, (err, buffer) => {
          if (err) {
            events.dispatch('error', `Unable to read ${item}`);
            return;
          }
          const outputPath = path.resolve(this.config.output + '/' + path.dirname(relativePath) + '/' + path.basename(relativePath));
          fse.outputFile(outputPath, buffer, err => {
            if (err) {
              events.dispatch('error', `Unable to save ${outputPath} file`);
            }
          });
        });
      }
      else {
        fs.readFile(item, (err, buffer) => {
          if (err) {
            events.dispatch('error', `Unable to read ${item}`);
            return;
          }
          let imgType = fileType(buffer);
          if (imgType !== null) {
            if (imgType.mime.split('/')[0] === 'image' || imgType.mime === 'application/xml') {
              const inputSize = buffer.length;
              const pipedData = {
                input: relativePath,
                outputs: [
                  {
                    dir: path.dirname(relativePath),
                    filename: path.basename(relativePath),
                    buffer: buffer
                  }
                ],
                data: {}
              };

              const pluginsFuncs = [];
              for (let item of pluginsList) {
                pluginsFuncs.push(item.__func);
              }
              pipe(pipedData, pluginsFuncs).then(function(res={}) {
                if (typeof res === null || typeof res !== 'object') {
                  events.dispatch('error', 'Some piped data have been deteriorated by a plugin');
                  return;
                }
                if (res.__error) {
                  let additionalInfo = '';
                  if (res.remainingPlugins) {
                    const failingPlugin = pluginsList[pluginsList.length - res.remainingPlugins - 1] || {};
                    if (failingPlugin.name) {
                      additionalInfo = `, some data have been deteriorated by the plugin ${failingPlugin.name}`;
                    }
                    else if (failingPlugin.__func) {
                      if (failingPlugin.__func.name) {
                        additionalInfo = `, some data have been deteriorated by the plugin function named "${failingPlugin.__func.name}"`;
                      }
                      else {
                        additionalInfo = `, some data have been deteriorated by the unamed plugin function: ${failingPlugin.__func}`;
                      }
                    }
                  }
                  events.dispatch('error', `Unable to process ${relativePath}${additionalInfo}`);
                  return;
                }
                const timeSpent = Date.now() - processStart;
                if (this.config.dataOutput && Object.keys(res.data).length) {
                  let inputName = res.input;
                  if (this.config.dataRootPath) {
                    inputName = path.relative(path.resolve(process.cwd(), this.config.dataRootPath), path.resolve(process.cwd(), this.config.input, inputName));
                  }
                  saveData(path.resolve(process.cwd(), this.config.dataOutput), inputName, res.data);
                }
                else if (!this.config.dataOutput && Object.keys(res.data).length) {
                  events.dispatch('info', {
                    msg: `Some plugins are outputing data but you didn't set up a dataOutput path`
                  });
                }
                let outputFiles = [];
                let outputSizes = [];
                for (let output of res.outputs) {
                  outputFiles.push(`${output.dir === '.' ? '' : output.dir + '/'}${output.filename}`);
                  outputSizes.push(output.buffer.length);
                }
                this.unlinkFollowers[path.resolve(process.cwd(), this.config.input, res.input)] = outputFiles.map(output => path.resolve(process.cwd(), this.config.output, output));
                events.dispatch('processed-file', {
                  adj,
                  input: relativePath,
                  inputSize,
                  output: outputFiles,
                  outputSizes: outputSizes,
                  timeSpent,
                  pluginsNumber: pluginsList.length
                });
                for (let output of res.outputs) {
                  const outputPath = path.resolve(this.config.output + '/' + output.dir + '/' + output.filename);
                  fse.outputFile(outputPath, output.buffer, err => {
                    if (err) {
                      events.dispatch('error', `Unable to save ${outputPath}`);
                    }
                  });
                }
              }.bind(this));
            }
          }
        });
      }
    }
  }

  updateGUIConfig() {
    gui.configUpdate(this.configRaw);
  }

  relativeTree(tree) {
    return Object.assign({}, tree, {
      path: path.relative(this.config.input, tree.path),
      children: tree.children ? tree.children.map(child => this.relativeTree(child)) : []
    })
  }

  updateGUITree() {
    let tree = dirTree(path.resolve(this.config.input));
    if (tree) {
      gui.treeUpdate(this.relativeTree(tree, {
        extensions: this._extensions
      }).children);
    }
  }

  processAll() {
    fastGlob(this.globAllInput, {
      ignore: [this.globAllOutput]
    }).then((entries) => {
      this.currentTree = entries;
      this.processList(entries);
    });
    this.updateGUITree();
  }

  unlink(filePath) {
    if (this.config.dataOutput) {
      let inputName = path.relative(path.resolve(process.cwd(), this.config.input), filePath);
      if (this.config.dataRootPath) {
        inputName = path.relative(path.resolve(process.cwd(), this.config.dataRootPath), path.resolve(process.cwd(), this.config.input, inputName));
      }
      saveData(path.resolve(process.cwd(), this.config.dataOutput), inputName, null);
    }
    if (Array.isArray(this.unlinkFollowers[filePath])) {
      for (let output of this.unlinkFollowers[filePath]) {
        fse.remove(output, function(output) {
          return (err) => {
            if (err) {
              events.dispatch('error', `Unable to follow unlink of ${output}`);
            }
            else {
              events.dispatch('success', {
                msg: `Removed ${output}`
              });
            }
          };
        }(output));
      }
    }
  }

  on(name, func) {
    events.on(name, func);
    return this;
  }
};

module.exports = Runner;

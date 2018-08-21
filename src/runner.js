const chokidar = require('chokidar');
const deepDiff = require('deep-object-diff');
const dirTree = require('directory-tree');
const fastGlob = require('fast-glob');
const fileType = require('file-type');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const defaultConfig = require('./default-config.js');
const EventsHandler = require('./events-handler.js');
const { generate, getPluginsList } = require('./filters.js');
const gui = require('./gui.js');
const pipe = require('./pipe.js');
const saveData = require('./save-data.js');

const EXTENSIONS_REGEXP = /\.(jpg|jpeg|png|gif|svg|tiff|bmp|webp)/;

class Runner {
  constructor(config = {}, params = {}) {
    this._extensions = EXTENSIONS_REGEXP;
    this.unlinkFollowers = {};
    this.cli = params.cli ? params.cli : false;
    this.cliConfig = typeof params.cliConfig !== 'undefined'
      ? params.cliConfig
      : {};
    this.configFile = typeof params.configFile !== 'undefined'
      ? params.configFile
      : '';
    this.filtersList = [];
    this.globAllInput = '';
    this.globAllOutput = '';
    this.eventsHandler = new EventsHandler();

    const configSet = this.setConfig(config);

    if (configSet.success) {
      if (this.config.gui) {
        if (this.cli && path.extname(this.configFile) !== '.js') {
          gui.init(
            this.config.guiPort,
            {
              openGui: this.config.openGui
            },
            this.eventsHandler
          );

          this.updateGUIConfig();

          gui.on('config-update', this.onGUIConfigUpdate.bind(this));
        } else {
          this.eventsHandler.dispatch(
            'error',
            'You can only use lepto GUI by CLI with a JSON formated config file'
              + ', see https://github.com/leptojs/lepto#gui'
          );
        }
      }
      if (this.config.processAll) {
        this.processAll();
      }
    } else {
      this.eventsHandler.dispatch('error', configSet.msg);
    }
  }

  setConfig(data) {
    const config = this.normalizeConfig(data);
    if (!config.input) {
      return {
        success: false,
        msg: 'Missing input, see https://github.com/leptojs/lepto#config'
      };
    }
    if (!config.output) {
      return {
        success: false,
        msg: 'Missing output, see https://github.com/leptojs/lepto#config'
      };
    }
    if (path.resolve(config.input) === path.resolve(config.output)) {
      return {
        success: false,
        msg: 'Input and output can\'t be the same directory'
      };
    }

    this.configRaw = data;
    this.config = config;

    this.filtersList = generate(
      path.resolve(this.config.input),
      this.config.filters,
      this.eventsHandler
    );
    this.globAllInput = `${path.resolve(this.config.input)}/**/*.*`;
    this.globAllOutput = `${path.resolve(this.config.output)}/**/*.*`;

    if (this.watcher) {
      this.watcher.close();
    }
    if (this.config.watch) {
      const ignore = [this.globAllOutput];
      if (Array.isArray(this.config.ignore)) {
        for (const item of this.config.ignore) {
          ignore.push(item);
        }
      } else if (typeof this.config.ignore !== 'undefined') {
        ignore.push(this.config.ignore);
      }
      this.watcher = chokidar
        .watch(this.globAllInput, {
          ignoreInitial: true,
          ignored: ignore
        })
        .on('all', this.handleWatchEvent.bind(this));
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
        this.eventsHandler.dispatch('info', {
          msg: 'Config updated'
        });
        this.processAll();
        this.updateGUIConfig(this.config);
      } else if (!configSet.success) {
        this.eventsHandler.dispatch('warn', {
          msg: `Unable to update config: ${configSet.msg}`
        });
      }
    } else if (!this.configFileWritten) {
      this.configFileWritten = false;
      this.eventsHandler.dispatch('info', {
        msg: 'Config file changed, but no difference found'
      });
    }
  }

  onGUIConfigUpdate(configOutput) {
    const normalizedConfig = this.normalizeConfig(configOutput);
    const configDiff = deepDiff.diff(normalizedConfig, this.config);

    if (Object.keys(configDiff).length) {
      const newConfigSet = this.setConfig(configOutput);

      if (newConfigSet.success) {
        this.processAll();
        const jsonStr = JSON.stringify(configOutput, null, 2);

        fse.outputFile(this.configFile, jsonStr, err => {
          this.configFileWritten = true;

          if (err) {
            gui.updateFinish();
            this.eventsHandler.dispatch(
              'error',
              'Unable to save config file from GUI update'
            );
          } else {
            gui.updateFinish(configOutput);
            this.eventsHandler.dispatch('info', {
              msg: 'Config updated from GUI'
            });
          }
        });
      } else if (!newConfigSet.success) {
        gui.updateFinish();
        this.eventsHandler.dispatch('warn', {
          msg: `Unable to update config from GUI: ${newConfigSet.msg}`
        });
      }
    } else {
      gui.updateFinish();
      this.eventsHandler.dispatch('info', {
        msg: 'Config updated from GUI, but no difference found'
      });
    }
  }

  normalizeConfig(config) {
    if (this.cli) {
      config = Object.assign({}, defaultConfig.main, defaultConfig.cli, config);
    } else {
      config = Object.assign({}, defaultConfig.main, config);
    }
    if (this.cliConfig) {
      Object.assign(config, this.cliConfig);
    }
    return config;
  }

  handleWatchEvent(event, filePath) {
    if (['add', 'change'].indexOf(event) !== -1) {
      /* Process an unique file  */
      this.processFile(filePath, event);
    }
    if (event === 'unlink' && this.config.followUnlink) {
      /* Process a removed file  */
      this.unlink(filePath);
    }
    this.updateGUITree();
  }

  processFile(item, event) {
    const processStart = Date.now();
    const pluginsList = getPluginsList(this.filtersList, item);
    const relativePath = path.relative(
      path.resolve(process.cwd(), this.config.input),
      item
    );
    const adjs = {
      add: 'new',
      change: 'changed'
    };
    const adj = typeof adjs[event] !== 'undefined' ? `${adjs[event]} ` : '';

    if (pluginsList.length === 0) {
      fs.readFile(item, (err, buffer) => {
        if (err) {
          this.eventsHandler.dispatch('error', `Unable to read ${item}`);
          return;
        }
        const outputPath = path.resolve(
          `${this.config.output}/${path.dirname(
            relativePath
          )}/${path.basename(relativePath)}`
        );
        fse.outputFile(outputPath, buffer, outputErr => {
          if (outputErr) {
            this.eventsHandler.dispatch(
              'error',
              `Unable to save ${outputPath} file`
            );
          }
        });
      });
      return;
    }

    fs.readFile(item, (err, buffer) => {
      if (err) {
        this.eventsHandler.dispatch('error', `Unable to read ${item}`);
        return;
      }

      const imgType = fileType(buffer);
      if (
        imgType === null
        || (
          imgType.mime.split('/')[0] !== 'image'
          && imgType.mime !== 'application/xml'
        )
      ) {
        return;
      }

      const inputSize = buffer.length;
      const pipedData = {
        input: relativePath,
        outputs: [
          {
            dir: path.dirname(relativePath),
            filename: path.basename(relativePath),
            buffer
          }
        ],
        data: {}
      };

      const pluginsFunc = pluginsList.map(plugin => plugin.__func);
      pipe(
        pipedData,
        pluginsFunc
      ).then(
        (res = {}) => {
          if (res === null || typeof res !== 'object') {
            /* Unhandled error occured during the process */
            this.eventsHandler.dispatch(
              'error',
              'Some piped data have been deteriorated by a plugin'
            );
            return;
          }

          if (res.__error) {
            /* Handled error occured during the process */
            let additionalInfo = '';
            if (res.remainingPlugins) {
              const failingPlugin = pluginsList[
                pluginsList.length - res.remainingPlugins - 1
              ] || {};
              if (failingPlugin.name) {
                additionalInfo = ', some data have been deteriorated by the'
                  + ` plugin ${
                    failingPlugin.name
                  }`;
              } else if (failingPlugin.__func) {
                if (failingPlugin.__func.name) {
                  additionalInfo = ', some data have been deteriorated by the'
                    + ` plugin function named "${
                      failingPlugin.__func.name
                    }"`;
                } else {
                  additionalInfo = ', some data have been deteriorated by the'
                    + ` unamed plugin function: ${
                      failingPlugin.__func
                    }`;
                }
              }
            }
            this.eventsHandler.dispatch(
              'error',
              `Unable to process ${relativePath}${additionalInfo}`
            );
            return;
          }

          const timeSpent = Date.now() - processStart;
          if (this.config.dataOutput && Object.keys(res.data).length) {
            let inputName = res.input;
            if (this.config.dataRootPath) {
              inputName = path.relative(
                path.resolve(process.cwd(), this.config.dataRootPath),
                path.resolve(
                  process.cwd(),
                  this.config.input,
                  inputName
                )
              );
            }
            saveData(
              path.resolve(process.cwd(), this.config.dataOutput),
              inputName,
              res.data,
              this.eventsHandler
            );
          } else if (
            !this.config.dataOutput
            && Object.keys(res.data).length
          ) {
            this.eventsHandler.dispatch('info', {
              msg: 'Some plugins are outputing data but you didn\'t set up a'
                + ' dataOutput path,'
                + ' see https://github.com/leptojs/lepto#config',
              callOnceId: 'unsaved-output-data'
            });
          }

          const outputFiles = [];
          const outputSizes = [];
          for (const output of res.outputs) {
            outputFiles.push(
              `${output.dir === '.' ? '' : `${output.dir}/`}${
                output.filename
              }`
            );
            outputSizes.push(output.buffer.length);
          }
          this.unlinkFollowers[
            path.resolve(process.cwd(), this.config.input, res.input)
          ] = outputFiles.map(output =>
            path.resolve(process.cwd(), this.config.output, output)
          );
          this.eventsHandler.dispatch('processed-file', {
            adj,
            input: relativePath,
            inputSize,
            output: outputFiles,
            outputSizes,
            timeSpent,
            pluginsNumber: pluginsList.length
          });

          for (const output of res.outputs) {
            const outputPath = path.resolve(
              `${this.config.output}/${output.dir}/${output.filename}`
            );
            fse.outputFile(outputPath, output.buffer, outputErr => {
              if (outputErr) {
                this.eventsHandler.dispatch(
                  'error',
                  `Unable to save ${outputPath}`
                );
              }
            });
          }
        }
      );
    });
  }

  processList(list, event) {
    for (const item of list) {
      this.processFile(item, event);
    }
  }

  processAll() {
    const ignore = [this.globAllOutput];
    if (Array.isArray(this.config.ignore)) {
      for (const item of this.config.ignore) {
        ignore.push(item);
      }
    } else if (typeof this.config.ignore !== 'undefined') {
      ignore.push(this.config.ignore);
    }
    fastGlob(this.globAllInput, {
      ignore
    }).then(entries => {
      this.currentTree = entries;
      this.processList(entries);
    });
    this.updateGUITree();
  }

  updateGUIConfig() {
    gui.configUpdate(this.configRaw);
  }

  relativeTree(tree) {
    return Object.assign({}, tree, {
      path: path.relative(this.config.input, tree.path),
      children: tree.children
        ? tree.children.map(child => this.relativeTree(child))
        : []
    });
  }

  updateGUITree() {
    const exclusion = [new RegExp(`${path.resolve(this.config.output)}/(.*)?`)];
    const tree = dirTree(path.resolve(this.config.input), {
      extensions: this._extensions,
      exclude: exclusion
    });
    if (tree) {
      gui.treeUpdate(this.relativeTree(tree).children);
    }
  }

  unlink(filePath) {
    if (this.config.dataOutput) {
      let inputName = path.relative(
        path.resolve(process.cwd(), this.config.input),
        filePath
      );
      if (this.config.dataRootPath) {
        inputName = path.relative(
          path.resolve(process.cwd(), this.config.dataRootPath),
          path.resolve(process.cwd(), this.config.input, inputName)
        );
      }
      saveData(
        path.resolve(process.cwd(), this.config.dataOutput),
        inputName,
        null,
        this.eventsHandler
      );
    }
    if (Array.isArray(this.unlinkFollowers[filePath])) {
      for (const output of this.unlinkFollowers[filePath]) {
        fse.remove(
          output,
          (removeOutput => {
            return err => {
              if (err) {
                this.eventsHandler.dispatch(
                  'error',
                  `Unable to follow unlink of ${removeOutput}`
                );
              } else {
                this.eventsHandler.dispatch('success', {
                  msg: `Removed ${removeOutput}`
                });
              }
            };
          })(output)
        );
      }
    }
  }

  on(name, func) {
    this.eventsHandler.on(name, func);
    return this;
  }
}

module.exports = Runner;

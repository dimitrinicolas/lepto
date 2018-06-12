const chokidar = require('chokidar');
const deepDiff = require('deep-object-diff');
const fastGlob = require('fast-glob');
const fileType = require('file-type');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const beautifier = require('./beautifier.js');
const defaultConfig = require('./default-config.js');
const filters = require('./filters.js');
const log = require('./log.js');
const pipe = require('./pipe.js');
const saveData = require('./save-data.js');

class Runner {
  constructor(config={}, params={}) {
    this.cli = params.cli ? true : false;;
    this.cliConfig = typeof params.cliConfig !== 'undefined' ? params.cliConfig : {};
    const configSet = this.setConfig(config);
    if (configSet.success) {
      if (this.config.processAll) {
        this.processAll();
      }
    }
    else {
      log.error(configSet.msg);
    }
  }

  setConfig(config) {
    config = this.normalizeConfig(config);

    this.filtersList = filters.generate({
      dir: config.input,
      use: config.use,
      filters: config.filters
    });

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

    this.config = config;

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

  handleConfigUpdate(newConfig) {
    newConfig = this.normalizeConfig(newConfig);

    const diff = deepDiff.diff(newConfig, this.config);
    if (Object.keys(diff).length) {
      const configSet = this.setConfig(newConfig);
      if (configSet.success) {
        log.info('Config updated');
        this.processAll();
      }
      else if (!configSet.success) {
        log.warn(['Unable to update config:', configSet.msg]);
      }
    }
    else {
      log.info('Config file changed, but no difference found');
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
            log.error(`Unable to read ${item}`);
            return;
          }
          const outputPath = path.resolve(this.config.output + '/' + path.dirname(relativePath) + '/' + path.basename(relativePath));
          fse.outputFile(outputPath, buffer, err => {
            if (err) {
              log.error(`Unable to save ${outputPath} file`);
            }
          });
        });
      }
      else {
        fs.readFile(item, (err, buffer) => {
          if (err) {
            log.error(`Unable to read ${item}`);
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
                  log.error('Some piped data have been deteriorated by a plugin');
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
                  log.error(`Unable to process ${relativePath}` + additionalInfo);
                  return;
                }
                const timeSpent = Date.now() - processStart;
                if (this.config.dataOutput && Object.keys(res.data).length) {
                  saveData(path.resolve(process.cwd(), this.config.dataOutput), res.input, res.data);
                }
                else if (!this.config.dataOutput && Object.keys(res.data).length) {
                  log.info(`Some plugins are outputing data but you didn't set up a dataOutput path`);
                }
                let maxSave = 0;
                let saveText = '';
                let outputsText = [];
                for (let output of res.outputs) {
                  maxSave = Math.min(Math.max(0, maxSave, 1 - output.buffer.length / inputSize), 1);
                  outputsText.push(`${output.dir === '.' ? '' : output.dir + '/'}${output.filename} (${beautifier.bytes(output.buffer.length)})`);
                }
                if (res.outputs.length > 1) {
                  outputsText = '[ ' + outputsText.join(', ') + ' ]';
                  saveText = `max save ${Math.floor(maxSave * 100 * 10) / 10 + '%'}`;
                }
                else {
                  saveText = `saved ${Math.floor(maxSave * 100 * 10) / 10 + '%'}`;
                }
                log.success(`Processed ${adj}${relativePath} (${beautifier.bytes(inputSize)}) in ${beautifier.time(timeSpent)} -> ${outputsText}, ${saveText}`);
                for (let output of res.outputs) {
                  const outputPath = path.resolve(this.config.output + '/' + output.dir + '/' + output.filename);
                  fse.outputFile(outputPath, output.buffer, err => {
                    if (err) {
                      log.error(`Unable to save ${outputPath}`);
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

  processAll() {
    fastGlob(this.globAllInput, {
      ignore: [this.globAllOutput]
    }).then((entries) => {
      this.processList(entries);
    })
  }

  unlink(filePath) {
    if (this.config.dataOutput) {
      const relativePath = path.relative(path.resolve(process.cwd(), this.config.input), filePath);
      saveData(path.resolve(process.cwd(), this.config.dataOutput), relativePath, null);
    }
    fse.remove(filePath, err => {
      if (err) {
        log.error(`Unable to follow unlink of ${filePath}`);
      }
      else {
        log.success(`Removed ${filePath}`);
      }
    });
  }

  handleLog(logger) {
    log.setLogger(logger);
  }
};

module.exports = Runner;

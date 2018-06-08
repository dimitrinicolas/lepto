const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const fastGlob = require('fast-glob');
const chokidar = require('chokidar');
const deepDiff = require('deep-object-diff');

const defaultConfig = require('./default-config.js');
const log = require('./log.js');
const pipe = require('./pipe.js');
const globbers = require('./globbers.js');
const saveData = require('./save-data.js');
const loadConfig = require('./load-config.js');

class Runner {
  constructor(config) {
    this.cli = config.___cli ? true : false;
    const configSet = this.setConfig(config);
    if (configSet.success) {
      this.processAll();
    }
    else {
      log(configSet.msg, 'red', 'error');
    }
  }

  setConfig(config) {
    const options = Object.assign({}, defaultConfig.main, config.config);

    this.globbersList = globbers.generate({
      dir: options.input,
      use: options.use,
      filters: options.filters
    });

    if (!options.input) {
      return {
        success: false,
        msg: 'Lepto - Missing input'
      };
    }
    if (!options.output) {
      return {
        success: false,
        msg: 'Lepto - Missing output'
      };
    }

    this.configPath = config.filepath;
    this.options = options;

    if (this.options.logLevel) {
       log.setLevel(this.options.logLevel);
    }
    else {
      log.setLevel('max');
    }

    this.globAllInput = path.resolve(this.options.input) + '/**/*.*';
    this.globAllOutput = path.resolve(this.options.output) + '/**/*.*';

    if (this.watcher) {
      this.watcher.close();
    }
    if (this.options.watch) {
      this.watcher = chokidar.watch(this.globAllInput, {
        ignoreInitial: true,
        ignored: this.globAllOutput
      }).on('all', this.handleWatchEvent.bind(this));
    }

    if (this.configWatcher) {
      this.configWatcher.close();
    }
    if (this.options.watchConfig && this.cli) {
      this.configWatcher = chokidar.watch(this.configPath, {
        ignoreInitial: true
      }).on('all', this.handleConfigWatchEvent.bind(this));
    }

    return {
      success: true
    };
  }

  handleWatchEvent(event, path) {
    if (['add', 'change'].indexOf(event) !== -1) {
      this.processList([path], event);
    }
  }

  handleConfigWatchEvent(event, path) {
    if (event === 'change') {
      const newConfigResult = loadConfig(path, { cli: true });
      if (newConfigResult.success) {
        const diff = deepDiff.diff(newConfigResult.config, this.options);
        if (Object.keys(diff).length) {
          const configSet = this.setConfig(newConfigResult);
          if (configSet.success) {
            log('Lepto - Config updated');
            this.processAll();
          }
          else if (!configSet.success) {
            log(['Lepto - Unable to update config:', configSet.msg], 'red', 'warn');
          }
        }
        else {
          log('Lepto - Config file changed, but no difference found', 'white', 1);
        }
      }
      else {
        log(['Lepto - Unable to get config file:', newConfigResult.msg], 'red', 'warn');
      }
    }
  }

  processList(list, event) {
    for (let item of list) {
      const pluginsList = globbers.getPluginsList(this.globbersList, item);
      const relativePath = path.relative(path.resolve(process.cwd(), this.options.input), item);
      const adjs = {
        add: 'new',
        change: 'changed'
      };
      let adj = typeof adjs[event] !== 'undefined' ? adjs[event] + ' ' : '';
      if (pluginsList.length) {
        const buffer = fs.readFileSync(item);
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
        pipe(pipedData, pluginsFuncs).then(function(res) {
          if (this.options.dataOutput && res.data) {
            saveData(path.resolve(process.cwd(), this.options.dataOutput), res.input, res.data);
          }
          else if (!this.options.dataOutput && res.data) {
            log(`Lepto - Some plugins are outputing data but you didn't set up a dataOutput path`, 'white', 'info', 'data-output-disabled');
          }
          log(`Lepto - Processed ${adj}file ${relativePath} with ${pluginsList.length} plugin${pluginsList.length > 1 ? 's' : ''} -> ${res.outputs.length} output file${res.outputs.length > 1 ? 's' : ''}`);
          for (let output of res.outputs) {
            const outputPath = path.resolve(this.options.output + '/' + output.dir + '/' + output.filename);
            fse.outputFile(outputPath, output.buffer, err => {
              if (err) {
                log(`Lepto - Unable to save ${outputPath} file`, 'red', 'error');
              }
            });
          }
        }.bind(this));
      }
    }
  }

  processAll() {
    const entries = fastGlob.sync(this.globAllInput, {
      ignore: [this.globAllOutput]
    });
    this.processList(entries);
  }
};

module.exports = Runner;

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const fastGlob = require('fast-glob');
const chokidar = require('chokidar');

const defaultConfig = require('./src/default-config.js');
const globbers = require('./src/globbers');

// TODO REMOVE USELESS DEPS

const pipe = (data, plugins) => {
  return new Promise(function(fulfill, reject) {
    let newPlugins = [];
    if (plugins.length > 1) {
      for (let i = 1; i < plugins.length; i++) {
        newPlugins.push(plugins[i]);
      }
      plugins[0](data, function(res) {
        pipe(res, newPlugins).then(fulfill);
      });
    }
    else {
      plugins[0](data, fulfill);
    }
  });
}

class Runner {
  process(list) {
    for (let item of list) {
      const pluginsList = globbers.get(this.globbersList, item);
      const relativePath = path.relative(path.resolve(process.cwd(), this.options.input), item);
      console.log(chalk.keyword('lime')('Lepto - Processing file', relativePath, 'with', pluginsList.length, 'plugin' + (pluginsList.length > 1 ? 's' : '')));
      let buffer = fs.readFileSync(item);
      let object = {
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

      let pluginsFuncs = [];
      for (let item of pluginsList) {
        pluginsFuncs.push(item.__func);
      }
      pipe(object, pluginsFuncs).then(function(res) {
        for (let output of res.outputs) {
          const outputPath = path.resolve(this.options.output + '/' + output.dir + '/' + output.filename);
          fse.outputFile(outputPath, output.buffer, err => {
            if(err) {
              console.log(err);
            }
          })
        }
      }.bind(this));
    }
  }

  processAll() {
    const globAll = path.resolve(this.options.input) + '/**/*.*';
    const entries = fastGlob.sync(globAll);
    this.process(entries);
  }

  handleWatchEvent(event, path) {
    console.log(event, path);
    if (['add', 'change'].indexOf(event) !== -1) {
      if (event === 'add') {
        console.log(chalk.keyword('lime')('Lepto - New file', path));
      }
      else if (event === 'change') {
        console.log(chalk.keyword('lime')('Lepto - Modified file', path));
      }
      this.process([path]);
    }
  }

  constructor(opts) {
    this.options = Object.assign({}, defaultConfig, opts);

    if (!this.options.input) {
      console.log(chalk.red.bold('Lepto - Unsetted input'));
      return;
    }
    if (!this.options.output) {
      console.log(chalk.red.bold('Lepto - Unsetted output'));
      return;
    }

    this.globbersList = globbers.generate({
      dir: this.options.input,
      use: this.options.use,
      filters: this.options.filters
    });

    if (this.options.watch) {
      const globAll = path.resolve(this.options.input) + '/**/*.*';
      chokidar.watch(globAll, {
        ignoreInitial: true
      }).on('all', this.handleWatchEvent.bind(this));
    }

    this.processAll();
  }
}

const lepto = (options) => {
  let runner = new Runner(options);
  return runner;
};

module.exports = Object.assign(lepto, {});

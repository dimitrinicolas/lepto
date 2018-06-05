const minimatch = require("minimatch");

const plugins = require('./plugins');
const tree = require('./tree');

const get = (globbers, path) => {
  let pluginsList = [];
  for (let globber of globbers) {
    if (typeof globber !== 'undefined') {
      for (let glob of globber.glob) {
        if (minimatch(path, glob)) {
          for (let plugin of globber.plugins) {
            pluginsList = plugins.merge(pluginsList, [plugin]);
          }
          break;
        }
      }
    }
  }
  return pluginsList;
};

const generate = (input) => {
  return tree.generate(input);
};

module.exports = {
  get,
  generate
};

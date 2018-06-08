const path = require('path');
const minimatch = require('minimatch');

const plugins = require('./plugins.js');

const getPluginsList = (globbers, path) => {
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

const generate = (input, parentDir) => {
  let resList = [];
  let res = {
    glob: [],
    plugins: []
  };

  const addPath = (glob) => {
    return (typeof parentDir !== 'undefined' ? parentDir + '/' : '') + glob;
  };

  if (!Array.isArray(input.glob)) {
    if (typeof input.glob !== 'undefined') {
      res.glob = [addPath(input.glob)];
    }
  }
  else {
    res.glob = input.glob.map(str => addPath(str));
  }
  const dirStr = path.resolve(addPath(input.dir || ''));
  if (!res.glob.length) {
    res.glob = [dirStr + '/**/*.*'];
  }

  res.plugins = plugins.satinize(input.use);

  resList.push(res);
  if (input.filters) {
    for (let filter of input.filters) {
      resList.push(generate(Object.assign({}, filter), dirStr)[0]);
    }
  }

  return resList;
};

module.exports = {
  getPluginsList,
  generate
};

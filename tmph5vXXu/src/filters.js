const minimatch = require('minimatch');
const path = require('path');

const plugins = require('./plugins-func.js');

const getPluginsList = (filters, rootPath) => {
  let pluginsList = [];
  for (const filterItem of filters) {
    if (typeof filterItem !== 'undefined') {
      for (const glob of filterItem.glob) {
        if (minimatch(rootPath, glob)) {
          for (const plugin of filterItem.plugins) {
            pluginsList = plugins.merge(pluginsList, [plugin]);
          }
          break;
        }
      }
    }
  }
  return pluginsList;
};

const generateFilter = (opts, parentDir, eventsHandler) => {
  const res = {
    glob: [],
    plugins: plugins.satinize(opts.use, eventsHandler)
  };

  const addParent = glob => {
    return (typeof parentDir !== 'undefined' ? `${parentDir}/` : '') + glob;
  };

  const dirStr = path.resolve(addParent(opts.dir || ''));
  if (Array.isArray(opts.glob)) {
    res.glob = opts.glob.map(str => addParent(str));
  } else if (typeof opts.glob === 'string') {
    res.glob = [addParent(opts.glob)];
  } else {
    res.glob = [`${dirStr}/**/*.*`];
  }

  return res;
};

const generate = (dir, filters = [], eventsHandler) => {
  const resList = [];
  for (const item of filters) {
    resList.push(generateFilter(Object.assign({}, item), dir, eventsHandler));
  }
  return resList;
};

module.exports = {
  getPluginsList,
  generate
};

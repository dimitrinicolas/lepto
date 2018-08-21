const minimatch = require('minimatch');
const path = require('path');

const { merge, satinize } = require('./plugins-func.js');

/**
 * Get plugins list for image path
 * @param {array} filters
 * @param {string} rootPath
 */
const getPluginsList = (filters, rootPath) => {
  let pluginsList = [];
  for (const filterItem of filters) {
    if (typeof filterItem !== 'undefined') {
      for (const glob of filterItem.glob) {
        if (minimatch(rootPath, glob)) {
          for (const plugin of filterItem.plugins) {
            pluginsList = merge(pluginsList, [plugin]);
          }
          break;
        }
      }
    }
  }
  return pluginsList;
};

/**
 * Generate a filter
 * @param {object} opts
 * @param {string} parentDir
 * @param {EventsHandler} eventsHandler
 */
const generateFilter = (opts, parentDir, eventsHandler) => {
  const filter = {
    glob: [],
    plugins: satinize(opts.use, eventsHandler)
  };

  const addParentPath = glob => {
    return (typeof parentDir !== 'undefined' ? `${parentDir}/` : '') + glob;
  };

  const dirStr = path.resolve(addParentPath(opts.dir || ''));
  if (Array.isArray(opts.glob)) {
    filter.glob = opts.glob.map(str => addParentPath(str));
  } else if (typeof opts.glob === 'string') {
    filter.glob = [addParentPath(opts.glob)];
  } else {
    filter.glob = [`${dirStr}/**/*.*`];
  }

  return filter;
};

/**
 * Generate a list of filters
 * @param {string} dir
 * @param {array} [filters=[]]
 * @param {EventsHandler} eventsHandler
 */
const generate = (dir, filters = [], eventsHandler) => {
  const list = [];
  for (const opts of filters) {
    list.push(generateFilter(Object.assign({}, opts), dir, eventsHandler));
  }
  return list;
};

module.exports = {
  getPluginsList,
  generate
};

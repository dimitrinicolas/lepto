const path = require('path');

const plugins = require('./plugins');

const generate = (data) => {
  let resList = [];
  let res = {
    glob: [],
    plugins: []
  };

  const addPath = (glob) => {
    return (typeof data.parentDir !== 'undefined' ? data.parentDir + '/' : '') + glob;
  };

  if (!Array.isArray(data.glob)) {
    res.glob = [];
    if (typeof data.glob !== 'undefined') {
      res.glob = [addPath(data.glob)];
    }
  }
  else {
    res.glob = data.glob.map(str => addPath(str));
  }
  const dirStr = addPath(data.dir || '');
  if (!res.glob.length) {
    res.glob = [dirStr + '/**/*.*'];
  }

  res.plugins = plugins.merge(data.parentPlugins, plugins.satinize(data.use));

  resList.push(res);

  if (data.filters) {
    for (let filter of data.filters) {
      resList.push(generate(Object.assign(filter, {
        parentDir: path.resolve(dirStr),
        parentPlugins: res.plugins
      }))[0]);
    }
  }

  if (res.filters) {
    resList.push(res.filters);
  }

  return resList;
}

module.exports = {
  generate
};

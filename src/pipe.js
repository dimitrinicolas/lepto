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
    else if (plugins.length === 1) {
      plugins[0](data, fulfill);
    }
    else {
      fulfill(data);
    }
  });
};

module.exports = pipe;

const log = require('./log.js');

process.on('unhandledRejection', (reason, p) => {
  log.error(['Unhandled error in a promise, reason:']);
  console.log(reason, p);
});


const pipe = (input, plugins) => {
  return new Promise(function(fulfill, reject) {
    if (input === null || typeof input !== 'object' || typeof input.input !== 'string' || !Array.isArray(input.outputs)) {
      fulfill({
        __error: true,
        remainingPlugins: plugins.length
      });
    }
    else {
      let newPlugins = [];
      if (plugins.length > 1) {
        for (let i = 1; i < plugins.length; i++) {
          newPlugins.push(plugins[i]);
        }
        plugins[0](input, function(res) {
          pipe(res, newPlugins).then(fulfill);
        });
      }
      else if (plugins.length === 1) {
        plugins[0](input, fulfill);
      }
      else {
        fulfill(input);
      }
    }
  });
};

module.exports = pipe;

const pluginsUtilsFunc = require('./plugins-utils.js');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled error in a promise, reason:');
  console.log(reason, p);
});

/**
 * Create an image process pipe
 * @param {*} input
 * @param {*} plugins
 */
const pipe = (input, plugins) => {
  return new Promise(resolve => {
    if (
      input === null
      || typeof input !== 'object'
      || typeof input.input !== 'string'
      || !Array.isArray(input.outputs)
    ) {
      /* The input file has been deteriorated by a plugin */
      resolve({
        __error: true,
        remainingPlugins: plugins.length
      });
      return;
    }

    if (plugins.length === 0) {
      /* The file has successfuly passed the plugins */
      resolve(input);
      return;
    }

    plugins[0](
      input,
      plugins.length === 1
        ? resolve
        : nextInput => {
          pipe(
            nextInput,
            plugins.slice(1, plugins.length)
          ).then(resolve);
        },
      pluginsUtilsFunc
    );
  });
};

module.exports = pipe;

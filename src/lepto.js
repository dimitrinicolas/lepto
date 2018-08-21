const plugins = require('./plugins');
const Runner = require('./runner.js');

/**
 * Launch lepto process
 * @param {object} options Lepto options
 * @param {object} params CLI params
 */
const lepto = (options, params) => {
  return new Runner(options, params);
};

module.exports = Object.assign(lepto, plugins);

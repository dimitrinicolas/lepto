const plugins = require('../plugins');
const Runner = require('./runner.js');

const lepto = (options, params) => {
  return new Runner(options, params);
};

module.exports = Object.assign(lepto, plugins);

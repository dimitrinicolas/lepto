const Runner = require('./runner.js');

const lepto = (options, cliConfig) => {
  if (!options.filepath && !options.config) {
    return new Runner({
      filepath: null,
      config: options
    }, cliConfig);
  }
  else {
    return new Runner(options, cliConfig);
  }
};

module.exports = lepto

const Runner = require('./runner.js');

const lepto = (options) => {
  if (!options.filepath && !options.config) {
    return new Runner({
      filepath: null,
      config: options
    });
  }
  else {
    return new Runner(options);
  }
};

module.exports = lepto

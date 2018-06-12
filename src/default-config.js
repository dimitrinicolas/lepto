const cli = {
  input: null,
  output: null,
  watch: true,
  watchConfig: false,
  followUnlink: false,
  logLevel: 'all',
  dataOutput: null,
  processAll: true,
  use: [],
  filters: []
};

const main = {
  input: null,
  output: null,
  watch: false,
  watchConfig: false,
  followUnlink: false,
  logLevel: 'all',
  dataOutput: null,
  processAll: true,
  use: [],
  filters: []
};

module.exports = { main, cli };

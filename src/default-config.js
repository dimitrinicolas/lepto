const cli = {
  input: null,
  output: null,
  watch: true,
  watchConfig: false,
  followUnlink: false,
  logLevel: 'all',
  dataOutput: null,
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
  filters: []
};

module.exports = { main, cli };

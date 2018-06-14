const main = {
  input: null,
  output: null,
  watch: false,
  watchConfig: false,
  followUnlink: false,
  gui: true,
  openGui: false,
  guiPort: '4490',
  logLevel: 'all',
  dataOutput: null,
  dataRootPath: null,
  processAll: true,
  filters: []
};

const cli = Object.assign({}, main, {
  watch: true
});

module.exports = { main, cli };

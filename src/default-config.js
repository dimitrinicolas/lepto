const main = {
  input: null,
  output: null,
  watch: false,
  watchConfig: false,
  followUnlink: false,
  processAll: true,
  gui: true,
  openGui: false,
  guiPort: '4490',
  logLevel: 'all',
  dataOutput: null,
  dataRootPath: null,
  filters: []
};

const cli = Object.assign({}, main, {
  watch: true
});

module.exports = {
  main,
  cli
};

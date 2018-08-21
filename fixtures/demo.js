const path = require('path');
const lepto = require('../');
const config = require('./lepto.config.json');
const beautifier = require('../src/beautifier.js');

lepto(config, {
  cli: true,
  cliConfig: {
    watch: true
  },
  configFile: path.resolve(__dirname, './lepto.config.json')
})
  .on('all', data => {
    if (typeof data.msg !== 'undefined') {
      console.log(data.msg);
    }
  })

  .on('error', msg => {
    console.error(msg);
  })

  .on('success', msg => {
    console.log('success', msg);
  })

  .on('processed-file', data => {
    let maxSave = 0;
    let outputsText = [];
    for (const i in data.output) {
      if (Object.prototype.hasOwnProperty.call(data.output, i)) {
        maxSave = Math.min(
          Math.max(0, maxSave, 1 - data.outputSizes[i] / data.inputSize),
          1
        );
        outputsText.push(
          `${data.output[i]} (${beautifier.bytes(data.outputSizes[i])})`
        );
      }
    }
    const saveText = `saved ${`${Math.floor(maxSave * 100 * 10) / 10} %`}`;
    if (data.output.length > 1) {
      outputsText = `[ ${outputsText.join(', ')} ]`;
    }
    console.log(
      `Processed ${data.adj}${data.input} (${beautifier.bytes(
        data.inputSize
      )}) in ${beautifier.time(data.timeSpent)} → ${outputsText}, ${saveText}`
    );
  });

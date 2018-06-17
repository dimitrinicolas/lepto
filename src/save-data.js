const fs = require('fs');
const fse = require('fs-extra');

let outputingData = null;

const saveData = (output, file, data, eventsHandler) => {
  let dataContent = {};
  if (outputingData) {
    dataContent = outputingData;
  }
  else if (fs.existsSync(output)) {
    const str = fs.readFileSync(output, 'utf-8');
    try {
      dataContent = JSON.parse(str);
    }
    catch(error) {}
  }
  dataContent[file] = data;
  outputingData = Object.assign({}, dataContent);
  if (data === null) {
    delete dataContent[file];
  }
  fse.outputFile(output, JSON.stringify(dataContent, null, 2), err => {
    if (err) {
      eventsHandler.dispatch('error', `Unable to save data json file ${output}`);
    }
  })
};

module.exports = saveData;

const fs = require('fs');
const fse = require('fs-extra');

let outputingData = null;

/**
 * Save data for a given file
 * @param {string} output Output data file path
 * @param {string} file File path
 * @param {*} data Data for file
 * @param {EventsHandler} eventsHandler
 */
const saveData = (output, file, data, eventsHandler) => {
  let dataContent = {};

  if (outputingData) {
    dataContent = outputingData;
  } else if (fs.existsSync(output)) {
    const str = fs.readFileSync(output, 'utf-8');
    try {
      dataContent = JSON.parse(str);
    } catch (error) {
      eventsHandler.dispatch('warn', `Unable to parse JSON from ${output}`);
    }
  }

  dataContent[file] = data;
  if (data === null) {
    delete dataContent[file];
  }

  outputingData = Object.assign({}, dataContent);

  fse.outputFile(output, JSON.stringify(dataContent, null, 2), err => {
    if (err) {
      eventsHandler.dispatch(
        'error',
        `Unable to save data JSON file ${output}`
      );
    }
  });
};

module.exports = saveData;

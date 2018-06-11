const path = require('path');
const sharp = require('../node_modules/sharp');

const webp = (options={}) => {
  return function webp(input, fulfill) {
    let finish = -input.outputs.length + 1;
    const next = () => {
      finish++;
      if (finish > 0) {
        fulfill(input);
      }
    };

    for (let i = 0, l = input.outputs.length; i < l; i++) {
      if (path.extname(input.outputs[i].filename).toLowerCase() !== '.webp') {
        let webpOutput = Object.assign({}, input.outputs[i], {
          filename: path.basename(input.outputs[i].filename, path.extname(input.outputs[i].filename)) + '.webp',
          toConvert: true
        });
        if (options.replaceFile) {
          input.outputs[i] = webpOutput
        }
        else {
          input.outputs.push(webpOutput);
        }
      }
    }

    finish = -input.outputs.length + 1;
    for (let i in input.outputs) {
      if (input.outputs[i].toConvert) {
        sharp(input.outputs[i].buffer)
          .toFormat(sharp.format.webp)
          .toBuffer()
          .then(function(i) {
            return function(buffer) {
              input.outputs[i].buffer = buffer;
              next();
            };
          }(i))
          .catch(next);
      }
      else {
        next();
      }
    }
  };
};

module.exports = webp;

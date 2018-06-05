const sharp = require('../node_modules/sharp');

const resize = (options) => {
  let kernelOption = {};
  if (options.kernel) {
    kernelOption.kernel = sharp.kernel[options.kernel];
  }
  return function(input, fulfill) {
    let finish = -input.outputs.length + 1;
    for (let i in input.outputs) {
      sharp(input.outputs[i].buffer)
        .resize(options.width, options.height, kernelOption)
        .toBuffer()
        .then(function(i) {
          return function(buffer) {
            input.outputs[i].buffer = buffer;
            finish++;
            if (finish) {
              fulfill(input);
            }
          };
        }(i))
        .catch(function(i) {
          return function() {
            finish++;
            if (finish) {
              fulfill(input);
            }
          };
        }());
    }
  };
};

module.exports = resize;

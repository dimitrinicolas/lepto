const sharp = require('sharp');

const png = (opts={}) => {
  const compression = typeof opts.compression !== 'undefined' ? opts.compression : 9;
  const progressive = typeof opts.progressive !== 'undefined' ? opts.progressive : true;

  return function png(input, fulfill, utils) {
    let finish = -input.outputs.length + 1;
    const next = () => {
      finish++;
      if (finish > 0) {
        fulfill(input);
      }
    };

    finish = -input.outputs.length + 1;
    for (let i in input.outputs) {
      if (utils.mime(input.outputs[i].buffer) === 'image/png') {
        sharp(input.outputs[i].buffer)
          .png({
            compressionLevel: compression,
            progressive
          })
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

module.exports = png;

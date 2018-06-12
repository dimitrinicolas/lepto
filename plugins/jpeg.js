const sharp = require('sharp');

const jpeg = (opts={}) => {
  const quality = typeof opts.quality !== 'undefined' ? Math.max(1, Math.min(parseInt(opts.quality), 100)) : 80;
  const progressive = typeof opts.progressive !== 'undefined' ? opts.progressive : true;

  return function jpeg(input, fulfill, utils) {
    let finish = -input.outputs.length + 1;
    const next = () => {
      finish++;
      if (finish > 0) {
        fulfill(input);
      }
    };

    finish = -input.outputs.length + 1;
    for (let i in input.outputs) {
      if (utils.mime(input.outputs[i].buffer) === 'image/jpeg') {
        if (typeof opts.forceExt === 'string') {
          input.outputs[i].filename = utils.base(input.outputs[i].filename) + '.' + opts.forceExt;
        }
        sharp(input.outputs[i].buffer)
          .jpeg({
            quality,
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

module.exports = jpeg;

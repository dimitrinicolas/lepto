const sharp = require('sharp');

const jpegPlugin = (opts = {}) => {
  const quality = typeof opts.quality !== 'undefined'
    ? Math.max(1, Math.min(parseInt(opts.quality, 10), 100))
    : 80;
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
    for (const i in input.outputs) {
      if (utils.mime(input.outputs[i].buffer) === 'image/jpeg') {
        if (typeof opts.forceExt === 'string') {
          input.outputs[i].filename = `${utils.base(
            input.outputs[i].filename
          )}.${opts.forceExt}`;
        }
        sharp(input.outputs[i].buffer)
          .jpeg({
            quality,
            progressive
          })
          .toBuffer()
          .then(
            (j => {
              return buffer => {
                if (buffer.length < input.outputs[j].buffer.length) {
                  input.outputs[j].buffer = buffer;
                }
                next();
              };
            })(i)
          )
          .catch(next);
      } else {
        next();
      }
    }
  };
};

module.exports = jpegPlugin;

const sharp = require('sharp');

const webp = (opts={}) => {
  const quality = typeof opts.quality !== 'undefined' ? opts.quality : 80;
  const alphaQuality = typeof opts.alphaQuality !== 'undefined' ? opts.alphaQuality : 100;
  const lossless = typeof opts.lossless !== 'undefined' ? opts.lossless : false;

  return function webp(input, fulfill, utils) {
    let finish = -input.outputs.length + 1;
    const next = () => {
      finish++;
      if (finish > 0) {
        fulfill(input);
      }
    };

    for (let i = 0, l = input.outputs.length; i < l; i++) {
      let imgType = utils.mime(input.outputs[i].buffer);
      if (imgType !== 'image/webp') {
        let webpOutput = Object.assign({}, input.outputs[i], {
          filename: utils.base(input.outputs[i].filename) + '.webp',
          toConvert: true
        });
        if (opts.replaceFile) {
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
          .webp({
            quality,
            alphaQuality,
            lossless
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

module.exports = webp;

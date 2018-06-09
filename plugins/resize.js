const sharp = require('../node_modules/sharp');

const noExt = (filename) => {
  return filename.substr(0, filename.lastIndexOf('.'))
};
const ext = (filename) => {
  return filename.substr(filename.lastIndexOf('.') + 1, filename.length);
};

const resize = (options={}) => {
  const kernelOption = {};
  if (options.kernel) {
    kernelOption.kernel = sharp.kernel[options.kernel];
  }
  const retinaPrefix = typeof options.prefix !== 'undefined' ? options.prefix : '@';
  const retinaSuffix = typeof options.suffix !== 'undefined' ? options.suffix : 'x';

  return function(input, fulfill) {
    let finish = -input.outputs.length + 1;
    const next = () => {
      finish++;
      if (finish > 0) {
        fulfill(input);
      }
    };

    if (Array.isArray(options.retina)) {
      for (let i = 0, l = input.outputs.length; i < l; i++) {
        for (let multiple of options.retina) {
          if (typeof multiple == 'number') {
            input.outputs.push(Object.assign({}, input.outputs[i], {
              filename: noExt(input.outputs[i].filename) + retinaPrefix + multiple + retinaSuffix + '.' + ext(input.outputs[i].filename),
              retina: multiple
            }));
          }
        }
      }
    }

    finish = -input.outputs.length + 1;
    for (let i in input.outputs) {
      let width = typeof options.width === 'number' ? options.width : null;
      let height = typeof options.height === 'number' ? options.height : null;
      if (typeof input.outputs[i].retina === 'number') {
        width = typeof width === 'number' ? width * input.outputs[i].retina : width;
        height = typeof height === 'number' ? height * input.outputs[i].retina : height;
      }
      sharp(input.outputs[i].buffer)
        .resize(width, height, kernelOption)
        .toBuffer()
        .then(function(i) {
          return function(buffer) {
            input.outputs[i].buffer = buffer;
            next();
          };
        }(i))
        .catch(next);
    }
  };
};

module.exports = resize;

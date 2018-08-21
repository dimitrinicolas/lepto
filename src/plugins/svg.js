const Svgo = require('svgo');

const svgPlugin = (opts = {}) => {
  const svgo = new Svgo(opts);

  return function svg(input, fulfill, utils) {
    let finish = -input.outputs.length + 1;
    const next = () => {
      finish++;
      if (finish > 0) {
        fulfill(input);
      }
    };

    finish = -input.outputs.length + 1;
    for (const i in input.outputs) {
      if (Object.prototype.hasOwnProperty.call(input.outputs, i)) {
        const mime = utils.mime(input.outputs[i].buffer);
        if (mime === 'application/xml' || mime === 'image/svg+xml') {
          svgo.optimize(input.outputs[i].buffer.toString()).then(
            (function svgoThen(j) {
              return function svgoSuccess(res) {
                const buffer = Buffer.from(res.data);
                if (buffer.length < input.outputs[j].buffer.length) {
                  input.outputs[j].buffer = buffer;
                }
                next();
              };
            })(i)
          );
        } else {
          next();
        }
      }
    }
  };
};

module.exports = svgPlugin;

const Svgo = require('svgo');

const svg = (opts={}) => {
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
    for (let i in input.outputs) {
      const mime = utils.mime(input.outputs[i].buffer)
      if (mime === 'application/xml' || mime === 'image/svg+xml') {
        svgo.optimize(input.outputs[i].buffer.toString()).then(function(i) {
          return function(res) {
            const buffer = Buffer.from(res.data);
            if (buffer.length < input.outputs[i].buffer.length) {
              input.outputs[i].buffer = buffer;
            }
            next();
          };
        }(i));
      }
      else {
        next();
      }
    }
  };
};

module.exports = svg;

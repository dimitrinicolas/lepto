const Svgo = require('svgo');

const svg = (opts={}) => {
  const svgo = new Svgo(Object.assign({}, opts));

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
      if (utils.mime(input.outputs[i].buffer) === 'application/xml') {
        svgo.optimize(input.outputs[i].buffer.toString()).then(function(i) {
          return function(res) {
            input.outputs[i].buffer = Buffer.from(res.data);
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

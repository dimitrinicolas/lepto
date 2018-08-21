const execBuffer = require('exec-buffer');
const gifsicle = require('gifsicle');

const gifPlugin = (opts = {}) => {
  const args = [
    '--no-app-extensions',
    '--interlace',
    '--optimize=3',
    '--output',
    execBuffer.output,
    execBuffer.input
  ];
  const colors = typeof opts.colors !== 'undefined'
    ? Math.max(2, Math.min(parseInt(opts.colors, 10), 256))
    : null;
  if (colors) {
    args.push(`--colors=${opts.colors}`);
  }

  return function gif(input, fulfill, utils) {
    let finish = -input.outputs.length + 1;
    const next = () => {
      finish++;
      if (finish > 0) {
        fulfill(input);
      }
    };

    finish = -input.outputs.length + 1;
    for (const i in input.outputs) {
      if (utils.mime(input.outputs[i].buffer) === 'image/gif') {
        execBuffer({
          input: input.outputs[i].buffer,
          bin: gifsicle,
          args
        })
          .catch(next)
          .then(
            (function bufferExecError(j) {
              return function bufferExecErrorCallback(buffer) {
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
  };
};

module.exports = gifPlugin;

const PngQuant = require('pngquant');

const pngPlugin = (opts = {}) => {
  const colors = typeof opts.colors !== 'undefined'
    ? Math.max(2, Math.min(parseInt(opts.colors, 10), 256))
    : 256;
  const quality = typeof opts.quality !== 'undefined' ? opts.quality : '70-80';
  const speed = typeof opts.speed !== 'undefined' ? opts.speed : 3;
  const args = [colors, '--nofs', '--quality', quality, '--speed', speed];

  return function png(input, fulfill, utils) {
    let finish = -input.outputs.length + 1;
    const next = () => {
      finish++;
      if (finish > 0) {
        fulfill(input);
      }
    };

    finish = -input.outputs.length + 1;
    for (const i in input.outputs) {
      if (utils.mime(input.outputs[i].buffer) === 'image/png') {
        const myPngQuanter = new PngQuant(args);

        const chunks = [];
        myPngQuanter
          .on('error', function onPngQuanterError(err) {
            console.log('err', err);
            next();
          })
          .on('data', function onPngQuanterData(chunk) {
            chunks.push(chunk);
          })
          .on('end', function onPngQuanterEnd() {
            const buffer = Buffer.concat(chunks);
            if (buffer.length < input.outputs[i].buffer.length) {
              input.outputs[i].buffer = buffer;
            }
            next();
          });
        myPngQuanter.end(input.outputs[i].buffer);
      } else {
        next();
      }
    }
  };
};

module.exports = pngPlugin;

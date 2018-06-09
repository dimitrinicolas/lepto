const Vibrant = require('../node_modules/node-vibrant');

const vibrantColor = () => {
  return function(input, fulfill) {
    let finish = -input.outputs.length + 1;
    const next = () => {
      finish++;
      if (finish > 0) {
        fulfill(input);
      }
    };

    for (let i in input.outputs) {
      Vibrant.from(input.outputs[i].buffer)
        .quality(1)
        .clearFilters()
        // ...
        .getPalette()
        .then((palette) => {
          input.data.vibrantColor = {
            vibrant: palette.Vibrant.getHex(),
            lightVibrant: palette.LightVibrant.getHex(),
            debugarkVibrant: palette.DarkVibrant.getHex(),
            muted: palette.Muted.getHex(),
            lightMuted: palette.LightMuted.getHex(),
            darkMuted: palette.DarkMuted.getHex()
          };
          next();
        });
    }
  };
};

module.exports = vibrantColor;

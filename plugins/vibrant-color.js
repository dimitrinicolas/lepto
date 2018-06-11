const fileType = require('file-type');
const Vibrant = require('node-vibrant');

const vibrantColor = () => {
  return function vibrantColor(input, fulfill) {
    let finish = -input.outputs.length + 1;
    const next = () => {
      finish++;
      if (finish > 0) {
        fulfill(input);
      }
    };

    input.data.vibrantColor = {
      vibrant: null,
      lightVibrant: null,
      darkVibrant: null,
      muted: null,
      lightMuted: null,
      darkMuted: null
    };

    for (let i in input.outputs) {
      if (['image/png', 'image/jpeg'].indexOf(fileType(input.outputs[i].buffer)) !== -1) {
        Vibrant.from(input.outputs[i].buffer)
          .quality(1)
          .clearFilters()
          .getPalette()
          .then((palette) => {
            input.data.vibrantColor = {
              vibrant: palette.Vibrant ? palette.Vibrant.getHex() : null,
              lightVibrant: palette.LightVibrant ? palette.LightVibrant.getHex() : null,
              darkVibrant: palette.DarkVibrant ? palette.DarkVibrant.getHex() : null,
              muted: palette.Muted ? palette.Muted.getHex() : null,
              lightMuted: palette.LightMuted ? palette.LightMuted.getHex() : null,
              darkMuted: palette.DarkMuted ? palette.DarkMuted.getHex() : null
            };
            next();
          });
      }
      else {
        next();
      }
    }
  };
};

module.exports = vibrantColor;

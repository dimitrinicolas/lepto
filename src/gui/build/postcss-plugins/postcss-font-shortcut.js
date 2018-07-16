const postcss = require('postcss');

const fontWeights = {
  extralight: 100,
  thin: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 800,
  extrabold: 900
};

module.exports = postcss.plugin('font-shortcut', () => {
  return css => {
    css.walkDecls('font', decl => {
      if (decl.prop === 'font') {
        const values = decl.value.split(' ');
        if (values.length > 1) {
          decl.parent.insertBefore(decl, {
            prop: 'font-family',
            value: `$font-family-${values[0]}`
          });

          if (values[1]) {
            let fontWeight = null;
            if (!isNaN(parseInt(values[1], 10))) {
              fontWeight = parseInt(values[1], 10);
            }
            if (typeof fontWeights[values[1]] !== 'undefined') {
              fontWeight = fontWeights[values[1]];
            }
            if (fontWeight) {
              decl.parent.insertBefore(decl, {
                prop: 'font-weight',
                value: fontWeight.toString()
              });
            }
            if (values[2]) {
              decl.parent.insertBefore(decl, {
                prop: 'font-size',
                value: values[2]
              });
            }
          }
          decl.remove();
        }
      }
    });
  };
});

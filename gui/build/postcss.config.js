module.exports = {
  plugins: [
    require('./plugins/postcss-preimport.js'),
    require('postcss-import'),
    require('postcss-nested'),
    require('postcss-inline-media'),
    require('./plugins/postcss-plugin.js'),
    require('postcss-simple-vars'),
    require('postcss-calc'),
    require('postcss-size'),
    require('postcss-axis'),
    require('postcss-position'),
    require('autoprefixer'),
    require('postcss-pxtorem'),
    require('postcss-color-function'),
    require('css-mqpacker')({
      sort: require('sort-css-media-queries').desktopFirst
    })
  ],
  'local-plugins': true,
  'postcss-calc': {
    preserve: false
  },
  autoprefixer: {
    browsers: '>0.1%'
  },
  'postcss-pxtorem': {
    'replace': false
  }
};

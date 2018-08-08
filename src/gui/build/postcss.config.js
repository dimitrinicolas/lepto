module.exports = {
  plugins: [
    require('./postcss-plugins/postcss-preimport.js')({
      glob: 'src/gui/src/components/**/*.css'
    }),
    require('postcss-import'),
    require('postcss-nested'),
    require('postcss-inline-media'),
    require('./postcss-plugins/postcss-font-shortcut.js'),
    require('postcss-simple-vars'),
    require('postcss-calc')({
      preserve: false
    }),
    require('postcss-size'),
    require('postcss-axis'),
    require('postcss-position'),
    require('autoprefixer')({
      browsers: '>0.1%'
    }),
    require('postcss-pxtorem')({
      replace: false
    }),
    require('postcss-color-function'),
    require('css-mqpacker')({
      sort: require('sort-css-media-queries').desktopFirst
    })
  ]
};

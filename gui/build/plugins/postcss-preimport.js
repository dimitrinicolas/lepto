var postcss = require('postcss');
var glob = require('glob');

module.exports = postcss.plugin('preimport', function() {
  return function(css, result) {
    return new Promise(function(resolve, reject) {
      css.walkAtRules('components', function(rule) {
        glob('gui/src/components/**/*.css', function(error, files) {
          if (!error) {
            for (var i = 0, l = files.length; i < l; i++) {
              css.insertBefore(rule, { name: 'import', params: '\"' + files[i] + '\"' });
            }
            rule.remove();
            resolve();
          }
          else { reject(); }
        });
      });
    });
  };
});

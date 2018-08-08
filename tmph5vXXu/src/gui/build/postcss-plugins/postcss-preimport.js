const glob = require('glob');
const postcss = require('postcss');

module.exports = postcss.plugin('preimport', opts => {
  return css => {
    return new Promise((resolve, reject) => {
      css.walkAtRules('importcomponents', rule => {
        glob(opts.glob, (error, files) => {
          if (!error) {
            for (const file of files) {
              css.insertBefore(rule, {
                name: 'import',
                params: `"${file}"`
              });
            }
            rule.remove();
            resolve();
          } else {
            reject();
          }
        });
      });
    });
  };
});

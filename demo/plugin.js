const plugin = (options) => {
  return function(input, fulfill) {
    let res = Object.assign({}, input, {
      data: {
        incr: input.data.incr ? input.data.incr + 1 : 1
      }
    })
    setTimeout(fulfill.bind(null, res), 100);
  };
};

module.exports = plugin;

let handlers = [];
let history = [];

const dispatch = (name='', data={}) => {
  name = name.toLowerCase();
  let found = false;
  for (let handler of handlers) {
    if (handler.name === 'all' || handler.name === name) {
      found = true;
      handler.func(data, name);
    }
  }
  if (!found) {
    history.push({ name, data });
  }
};

const on = (name='', func) => {
  if (typeof func === 'function') {
    name = name.toLowerCase();
    handlers.push({
      name: name,
      func
    });
    for (let item of history) {
      if (name === 'all' || name === item.name) {
        func(item.data, item.name);
      }
    }
  }
};

module.exports = { dispatch, on };

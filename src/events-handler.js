module.exports = class EventsHandler {
  constructor(config={}, params={}) {
    this.handlers = [];
    this.history = [];
  }

  dispatch(name='', data={}) {
    name = name.toLowerCase();
    let found = false;
    for (let handler of this.handlers) {
      if (handler.name === 'all' || handler.name === name) {
        found = true;
        handler.func(data, name);
      }
    }
    if (!found) {
      this.history.push({ name, data });
    }
  }

  on(name='', func) {
    if (typeof func === 'function') {
      name = name.toLowerCase();
      this.handlers.push({
        name: name,
        func
      });
      for (let item of this.history) {
        if (name === 'all' || name === item.name) {
          func(item.data, item.name);
        }
      }
    }
  }
};

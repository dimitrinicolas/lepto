const path = require('path');

const events = require('./events.js');

const nativePlugins = require('../plugins');

const __defaultConfigProps = {
  name: '',
  disabled: false,
  __func: null
};

const resolverPlugin = (name) => {
  const pluginName = name;
  if (name.lastIndexOf('#') !== -1) {
    name = name.substr(0, name.lastIndexOf('#'));
  }
  if (name.indexOf('lepto.') === 0) {
    name = name.substr('lepto.'.length, name.length);
    return nativePlugins[name];
  }
  else if (name.indexOf('/') !== -1) {
    return require(path.resolve(process.cwd(), name));
  }
  else if {
    return require(name);
  }
}

const satinize = (list) => {
  const res = [];

  if (!Array.isArray(list)) {
    return res;
  }

  for (let plugin of list) {
    let pluginRes = null;
    if (typeof plugin === 'function') {
      events.dispatch('warn', {
        msg: 'It is not recommended to use a function as a lepto plugins, functions cannot be overriden by another filter',
        callOnceId: 'plugin-as-a-function'
      });
      pluginRes = Object.assign({}, __defaultConfigProps, {
        name: null,
        __invoked: true,
        __func: plugin
      });
    }
    else if (typeof plugin === 'string') {
      pluginRes = Object.assign({}, __defaultConfigProps, {
        name: plugin,
        __func: resolverPlugin(plugin)
      });
    }
    else {
      if (typeof plugin.name === 'string') {
        pluginRes = Object.assign({}, __defaultConfigProps, plugin, {
          __func: resolverPlugin(plugin.name)
        });
      }
      else {
        events.dispatch('error', `Invalid plugin format:`);
        console.log(plugin);
      }
    }
    if (pluginRes && !pluginRes.disabled) {
      if (!pluginRes.__invoked) {
        if (typeof pluginRes.__func !== 'function') {
          pluginRes.__func = (input, fulfill) => {
            fulfill(input);
          };
        }
        else {
          Object.assign(pluginRes, {
            __func: pluginRes.__func(pluginRes)
          });
        }
      }
      res.push(pluginRes);
    }
  }

  return res;
}

const merge = (mainPlugins, newPlugins) => {
  if (!Array.isArray(mainPlugins)) {
    mainPlugins = [];
  }
  if (!Array.isArray(newPlugins)) {
    newPlugins = [];
  }

  const res = [];
  for (let el of mainPlugins) {
    res.push(el);
  }
  for (let el of newPlugins) {
    let index = -1;
    for (let i in res) {
      if (el.name !== null && res[i].name === el.name) {
        index = i;
        break;
      }
    }
    if (index === -1) {
      res.push(el);
    }
    else {
      res[index] = el;
    }
  }

  return res;
};

module.exports = {
  satinize,
  merge
};

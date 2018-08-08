const path = require('path');

const nativePlugins = require('./plugins');

const DEFAULT_CONFIG_PROPS = {
  name: '',
  disabled: false,
  __func: null
};

const resolverPlugin = (name, eventsHandler) => {
  if (name.lastIndexOf('#') !== -1) {
    name = name.substr(0, name.lastIndexOf('#'));
  }
  if (name.indexOf('lepto.') === 0) {
    const plugin = name.substr('lepto.'.length, name.length);
    if (typeof nativePlugins[plugin] === 'function') {
      return nativePlugins[plugin];
    }
    eventsHandler.dispatch(
      'error',
      `Built-in plugin "${name}" not found, maybe you are looking for "lepto-${plugin}",`
      + ' see https://github.com/leptojs/lepto#built-in-plugins Lepto will run without.'
    );
    return null;
  }
  const pluginPath = name.indexOf('/') !== -1 ? name : `/node_modules/${name}`;
  try {
    const plugin = require(path.join(process.cwd(), pluginPath));
    if (typeof plugin === 'function') {
      return plugin;
    }
    eventsHandler.dispatch(
      'error',
      `Plugin "${name}" is not a function, see https://github.com/leptojs/lepto#built-in-plugins. Lepto will run without.`
    );
    return null;
  } catch (err) {
    eventsHandler.dispatch(
      'error',
      `Plugin "${name}" not found, see https://github.com/leptojs/lepto#built-in-plugins. Lepto will run without.`
    );
    return null;
  }
};

const satinize = (list, eventsHandler) => {
  const res = [];

  if (!Array.isArray(list)) {
    return res;
  }

  for (const plugin of list) {
    let pluginRes = null;
    if (typeof plugin === 'function') {
      eventsHandler.dispatch('warn', {
        msg:
          'It is not recommended to use a function as a lepto plugins, functions cannot be overriden by another filter',
        callOnceId: 'plugin-as-a-function'
      });
      pluginRes = Object.assign({}, DEFAULT_CONFIG_PROPS, {
        name: null,
        __invoked: true,
        __func: plugin
      });
    } else if (typeof plugin === 'string') {
      pluginRes = Object.assign({}, DEFAULT_CONFIG_PROPS, {
        name: plugin,
        __func: resolverPlugin(plugin, eventsHandler)
      });
    } else if (typeof plugin.name === 'string') {
      pluginRes = Object.assign({}, DEFAULT_CONFIG_PROPS, plugin, {
        __func: resolverPlugin(plugin.name, eventsHandler)
      });
    } else {
      eventsHandler.dispatch('error', 'Invalid plugin format:');
      console.log(plugin);
    }
    if (pluginRes && !pluginRes.disabled) {
      if (!pluginRes.__invoked) {
        if (typeof pluginRes.__func !== 'function') {
          pluginRes.__func = (input, fulfill) => {
            fulfill(input);
          };
        } else {
          Object.assign(pluginRes, {
            __func: pluginRes.__func(pluginRes)
          });
        }
      }
      res.push(pluginRes);
    }
  }

  return res;
};

const merge = (mainPlugins, newPlugins) => {
  if (!Array.isArray(mainPlugins)) {
    mainPlugins = [];
  }
  if (!Array.isArray(newPlugins)) {
    newPlugins = [];
  }

  const res = [];
  for (const el of mainPlugins) {
    res.push(el);
  }
  for (const el of newPlugins) {
    let index = -1;
    for (const i in res) {
      if (el.name !== null && res[i].name === el.name) {
        index = i;
        break;
      }
    }
    if (index === -1) {
      res.push(el);
    } else {
      res[index] = el;
    }
  }

  return res;
};

module.exports = {
  satinize,
  merge
};

const path = require('path');

const nativePlugins = require('./plugins');

const DEFAULT_CONFIG_PROPS = {
  name: '',
  disabled: false,
  __func: null
};

const BUILT_IN_PREFIX = 'lepto.';

/**
 * Resolve a plugin func
 * @param {string} name
 * @param {EventsHandler} eventsHandler
 */
const resolverPlugin = (pluginName, eventsHandler) => {
  let name = pluginName.lastIndexOf('#') !== -1
    ? pluginName.substr(0, pluginName.lastIndexOf('#'))
    : pluginName;

  name = name.toLowerCase();

  if (name.indexOf(BUILT_IN_PREFIX) === 0) {
    if (name === `${BUILT_IN_PREFIX}jpg`) {
      eventsHandler.dispatch('warn', {
        msg:
          `The correct name for the built-in plugin "${name}" is`
          + ` "${BUILT_IN_PREFIX}jpeg"`
          + ', see https://github.com/leptojs/lepto#built-in-plugins \n'
          + 'Lepto will run with the correct plugin.',
        callOnceId: 'lepto.jpeg-typo'
      });
      name = `${BUILT_IN_PREFIX}jpeg`;
    }

    const plugin = name.substr(BUILT_IN_PREFIX.length, name.length);
    if (typeof nativePlugins[plugin] === 'function') {
      return nativePlugins[plugin];
    }

    eventsHandler.dispatch(
      'error',
      `Built-in plugin "${name}" not found, maybe you are looking for`
        + ` "lepto-${plugin}"`
        + ', see https://github.com/leptojs/lepto#built-in-plugins \n'
        + 'Lepto will run without.'
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
      `Plugin "${name}" is not a function`
        + ', see https://github.com/leptojs/lepto#built-in-plugins \n'
        + 'Lepto will run without.'
    );
    return null;
  } catch (err) {
    eventsHandler.dispatch(
      'error',
      `Plugin "${name}" not found, try to install it with "npm i -D ${name}"`
        + ', see https://github.com/leptojs/lepto#built-in-plugins \n'
        + 'Lepto will run without.'
    );
    return null;
  }
};

/**
 * Satinize and resolve a plugin
 * @param {objecy} plugin
 * @param {EventsHandler} eventsHandler
 */
const satinizePlugin = (plugin, eventsHandler) => {
  let pluginRes = null;

  if (typeof plugin === 'function') {
    pluginRes = Object.assign({}, DEFAULT_CONFIG_PROPS, {
      name: null,
      __invoked: true,
      __func: plugin
    });

    eventsHandler.dispatch('warn', {
      msg:
        'It is not recommended to use a function as a lepto plugins,'
        + ' functions cannot be overriden by another filter'
        + ', see https://github.com/leptojs/lepto#plugins',
      callOnceId: 'plugin-as-a-function'
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
    eventsHandler.dispatch(
      'error',
      `Invalid plugin format: ${String(plugin)}`
        + ', see https://github.com/leptojs/lepto#plugins'
    );
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
    return pluginRes;
  }

  return null;
};

/**
 * Satinize and resolve a plugins list
 * @param {array} list
 * @param {EventsHandler} eventsHandler
 */
const satinize = (list, eventsHandler) => {
  const res = [];

  for (const plugin of list) {
    const pluginRes = satinizePlugin(plugin, eventsHandler);
    if (pluginRes !== null) {
      res.push(pluginRes);
    }
  }

  return res;
};

/**
 * Merge two plugins options lists
 * @param {array} mainPlugins
 * @param {array} newPlugins
 */
const merge = (mainPlugins, newPlugins) => {
  const res = Array.isArray(mainPlugins)
    ? mainPlugins.slice(0, mainPlugins.length)
    : '';

  for (const el of Array.isArray(newPlugins) ? newPlugins : []) {
    let index = null;
    for (const i in res) {
      if (
        el.name !== null
        && res[i].name.toLowerCase() === el.name.toLowerCase()
      ) {
        index = i;
        break;
      }
    }
    if (index === null) {
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

import test from 'ava';

import lepto from '..';
import beautifier from '../src/beautifier.js';
import EventsHandler from '../src/events-handler.js';
import pluginsUtils from '../src/plugins-utils.js';
import plugins from '../src/plugins-func.js';

const config = {
  input: 'fixtures/input',
  output: 'fixtures/test'
};

/* lepto */

test('Call with no argument', t => {
  lepto().on('error', () => {
    t.pass();
  });
});

test('Same input and output', t => {
  lepto({
    input: config.input,
    output: config.input
  }).on('error', () => {
    t.pass();
  });
});

test('Set invalid config', t => {
  const runner = lepto(config);
  const configSet = runner.setConfig({});
  t.is(configSet.success, false);
});

test('Set normal config', t => {
  const runner = lepto(config);
  const configSet = runner.setConfig(config);
  t.is(configSet.success, true);
});

/* beautifier.js */
test('0.123KB', t => {
  t.is(beautifier.bytes(123), '0.123KB');
});
test('123.5KB', t => {
  t.is(beautifier.bytes(123456), '123.5KB');
});
test('123.5MB', t => {
  t.is(beautifier.bytes(123456789), '123.5MB');
});

test('123ms', t => {
  t.is(beautifier.time(123), '123ms');
});
test('123.5s', t => {
  t.is(beautifier.time(123456), '123.5s');
});

/* events-handler.js */

test('Event handler', t => {
  const handler = new EventsHandler();
  handler.on('type', data => {
    t.is(data.info, 'info');
  });
  handler.dispatch('type', { info: 'info' });
});

test('Event handler all', t => {
  const handler = new EventsHandler();
  handler.on('all', (data, type) => {
    t.is(data.info, 'info');
    t.is(type, 'type');
  });
  handler.dispatch('type', { info: 'info' });
});

test('Event handler history', t => {
  const handler = new EventsHandler();
  handler.dispatch('type', { info: 'info' });
  handler.on('type', data => {
    t.is(data.info, 'info');
  });
});

/* plugins-utils.js */

test('Plugins utils base', t => {
  t.is(pluginsUtils.base('test/IMG_001.JPG'), 'IMG_001');
});

test('Plugins utils ext', t => {
  t.is(pluginsUtils.ext('test/IMG_001.JPG'), 'JPG');
});

/* plugins.js */

test('Plugins merge', t => {
  const result = plugins.merge(
    [
      {
        name: 'demo',
        data: 1,
        disabled: false
      }
    ],
    [
      {
        name: 'demo',
        data: 2,
        disabled: false
      }
    ]
  );
  t.is(result.length, 1);
  t.is(result[0].data, 2);
});

test('Plugins merge disable', t => {
  const result = plugins.merge(
    [
      {
        name: 'demo',
        data: 1,
        disabled: false
      }
    ],
    [
      {
        name: 'demo',
        disabled: true
      }
    ]
  );
  t.is(result.length, 1);
  t.is(result[0].disabled, true);
  t.is(typeof result[0].data, 'undefined');
});

test('Plugins merge hashtags', t => {
  const result = plugins.merge(
    [
      {
        name: 'demo',
        data: 1,
        disabled: false
      }
    ],
    [
      {
        name: 'demo#2',
        data: 2,
        disabled: false
      }
    ]
  );
  t.is(result.length, 2);
  t.is(result[0].data, 1);
  t.is(result[1].data, 2);
});

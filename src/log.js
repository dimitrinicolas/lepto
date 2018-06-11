let logger;

const log = (text='', opts) => {
  if (typeof logger === 'function') {
    logger(text, opts);
  }
};

const setLogger = (newLogger) => {
  if (typeof newLogger === 'function') {
    logger = newLogger;
  }
};

const error = (text, callOnceId=null) => {
  log(text, {
    color: 'red',
    level: 1,
    callOnceId: callOnceId
  });
};
const warn = (text, callOnceId=null) => {
  log(text, {
    color: 'orange',
    level: 2,
    callOnceId: callOnceId
  });
};
const info = (text, callOnceId=null) => {
  log(text, {
    color: 'white',
    level: 3,
    callOnceId: callOnceId
  });
};
const success = (text, callOnceId=null) => {
  log(text, {
    color: 'green',
    level: 3,
    callOnceId: callOnceId
  });
};

module.exports = Object.assign(log, { setLogger, error, warn, info, success });

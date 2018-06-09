const chalk = require('chalk');

const colors = {
  red: chalk.red.bold,
  white: chalk.keyword('lightgrey'),
  green: chalk.keyword('lime')
};

let levels = {
  max: 3,
  all: 3,
  min: 0,
  quiet: 0,
  info: 3,
  warn: 2,
  error: 1
}
let logLevel = 2;

let onces = {};

const getLevel = () => {
  return logLevel;
}

const getLevelCode = (level) => {
  if (typeof level === 'string' && typeof levels[level] !== 'undefined') {
    return levels[level];
  }
  else if (typeof level === 'number') {
    return Math.min(Math.max(level, levels.min), levels.max);
  }
  return levels.max;
}

const setLevel = (level) => {
  logLevel = getLevelCode(level);
};

const log = (txt='', color='green', level=levels.max, callOnce=null) => {
  level = getLevelCode(level);
  if (Array.isArray(txt)) {
    txt = txt.join(' ');
  }
  if (level <= logLevel) {
    if (typeof colors[color] === 'undefined') {
      color = 'green';
    }
    if (!callOnce || (callOnce && typeof onces[callOnce] === 'undefined')) {
      console.log(colors[color](txt));
    }
    if (callOnce && typeof onces[callOnce] === 'undefined') {
      onces[callOnce] = true;
    }
  }
};

module.exports = Object.assign(log, { getLevel, getLevelCode, setLevel });

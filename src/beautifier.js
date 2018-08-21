/**
 * Beautify a file size
 * @param {number} length
 */
const bytes = length => {
  if (length < 1e3) {
    return `${length / 1e3}KB`;
  }
  if (length < 1e6) {
    return `${Math.round(length / 100) / 10}KB`;
  }
  return `${Math.round(length / (1000 * 100)) / 10}MB`;
};

/**
 * Beautify a milisecond amount
 * @param {number} amount
 */
const time = amount => {
  if (amount < 1000) {
    return `${amount}ms`;
  }
  return `${Math.round(amount / 100) / 10}s`;
};

module.exports = {
  bytes,
  time
};

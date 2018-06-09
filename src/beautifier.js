const bytes = (length) => {
  if (length < 1e3) {
    return `${length / 1e3}KB`;
  }
  else if (length < 1e6) {
    return `${Math.round(length / 100) / 10}KB`;
  }
  else {
    return `${Math.round(length / (1000 * 100)) / 10}MB`;
  }
};

const time = (amount) => {
  if (amount < 1000) {
    return `${amount}ms`;
  }
  else {
    return `${Math.round(amount / 100) / 10}s`;
  }
};

module.exports = {
  bytes,
  time
};

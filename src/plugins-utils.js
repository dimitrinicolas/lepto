const fileType = require('file-type');
const imageSize = require('image-size');
const path = require('path');

module.exports = {
  size: imageSize,
  mime: (buffer) => {
    return fileType(buffer).mime;
  },
  base: (filename) => {
    return path.basename(filename, path.extname(filename));
  },
  ext: (filename) => {
    return path.extname(filename).slice(1).toLowerCase();
  }
};

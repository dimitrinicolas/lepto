const fs = require('fs');

const defaultConfig = require('./default-config.js');

const loadConfig = (path='', opts={}) => {
  if (fs.existsSync(path)) {
    const ext = path.substr(path.lastIndexOf('.') + 1, path.length);
    let config = null;
    if (ext === 'json') {
      const str = fs.readFileSync(path, 'utf-8');
      try {
        config = JSON.parse(str);
      }
      catch(error) {
        return {
          success: false,
          filepath: path,
          msg: 'Invalid config file json'
        };
      }
    }
    else if (ext === 'js') {
      config = require(path);
    }
    else {
      return {
        success: false,
        filepath: path,
        msg: 'Unknown config file extension ' + ext
      }
    }
    
    const result = {
      success: true,
      filepath: path,
      config: config,
      msg: ''
    };
    if (opts.cli) {
      return Object.assign({}, result, {
        config: Object.assign({}, defaultConfig.main, defaultConfig.cli, result.config)
      }, {
        ___cli: true
      });
    }
    else {
      return Object.assign({}, result, {
        config: Object.assign({}, defaultConfig.main, result.config)
      });
    }
  }
  else {
    return {
      success: false,
      filepath: path,
      msg: 'Config file not found'
    }
  }
};

module.exports = loadConfig;

const fs = require('fs');
const path = require('path');

let requireCache = {};

const requirePath = (strPath) => {
  if (requireCache[strPath]) {
    return requireCache[strPath];
  }
  else {
    const fullPath = path.resolve(process.cwd(), strPath);
    const fileContent = fs.readFileSync(fullPath, 'UTF-8');
    let loadedModule = new module.constructor();
    loadedModule._compile(fileContent, fullPath);
    loadedModule = loadedModule.exports;
    requireCache[strPath] = loadedModule;
    return loadedModule;
  }
};

module.exports = requirePath;

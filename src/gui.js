const fs = require('fs');
const fileType = require('file-type');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const opn = require('opn');

const beautifier = require('./beautifier.js');
const nativePlugins = require('../plugins');
const pipe = require('./pipe.js');

let io;
let currentConfig = {};
let currentTree = [];

let guiEventListeners = [];

const on = (name, func) => {
  if (typeof name === 'string' && typeof func === 'function') {
    guiEventListeners.push({
      name,
      func
    });
  }
};
const dispatch = (name, data) => {
  for (let listener of guiEventListeners) {
    if (name === listener.name) {
      listener.func(data);
    }
  }
};

const init = (port, opts={}, eventsHandler) => {
  io = socketIO(parseInt(port) + 1);

	io.on('connection', function(socket) {
    io.emit('tree-update', currentTree);
    io.emit('config-update', currentConfig);

		socket.on('update-config', function(data) {
      dispatch('config-update', data);
		});
	});

	http.createServer(function(request, response) {
		if (request.url === '/') {
			const template = fs.readFileSync(path.resolve(__dirname, '../gui/index.html'), 'utf-8');
			response.writeHeader(200, { 'Content-Type': 'text/html' });
			response.write(template);
			response.end();
		}
		else if (request.url === '/dist/style.css') {
      const template = fs.readFileSync(path.resolve(__dirname, '../gui/dist/style.css'), 'utf-8');
			response.writeHeader(200, { 'Content-Type': 'text/css' });
			response.write(template);
			response.end();
		}
    else if (request.url === '/dist/script.js') {
			const template = fs.readFileSync(path.resolve(__dirname, '../gui' + request.url), 'utf-8');
			response.writeHeader(200, { 'Content-Type': 'application/javascript' });
			response.write(template);
			response.end();
		}
    else if (request.url.match(/^\/ressources\/.*/gi)) {
      let filepath = decodeURIComponent(request.url.replace(/^\/ressources\//gi, ''));
      let filename = filepath;
      let q = null;
      if (filepath.lastIndexOf('?q=') !== -1) {
        filename = filepath.substring(0, filepath.lastIndexOf('?q='));
        q = parseInt(filepath.substring(filepath.lastIndexOf('?q=') + 3, filepath.lastIndexOf('&')));
      }
      filepath = path.resolve(process.cwd(), currentConfig.input, filename);
			const template = fs.readFileSync(filepath);
      const type = fileType(template);
      if (typeof q === 'number') {
        const ext = filepath.substring(filepath.lastIndexOf('.') + 1, filepath.length).toLowerCase();
        let plugin = null;
        if (ext === 'jpg' || ext === 'jpeg') {
          plugin = nativePlugins.jpeg({
            quality: q
          });
        }
        else if (ext === 'png') {
          plugin = nativePlugins.png({
            quality: q
          });
        }
        else if (ext === 'gif') {
          plugin = nativePlugins.gif({
            colors: q
          });
        }
        if (plugin) {
          pipe({
            input: filepath,
            outputs: [
              {
                dir: path.dirname(filepath),
                filename: path.basename(filepath),
                buffer: template
              }
            ],
            data: {}
          }, [plugin]).then(function(res={}) {
            if (typeof res === null || typeof res !== 'object' || res.__error) {
              response.writeHeader(200, { 'Content-Type': type.mime || 'image/jpg' });
        			response.write(template);
        			response.end();
            }
            else {
              io.emit('size-diff', beautifier.bytes(template.length) + ' > ' + beautifier.bytes(res.outputs[0].buffer.length));
              response.writeHeader(200, { 'Content-Type': type.mime || 'image/jpg' });
        			response.write(res.outputs[0].buffer);
        			response.end();
            }
          });
        }
        else {
    			response.writeHeader(200, { 'Content-Type': type.mime || 'image/jpg' });
    			response.write(template);
    			response.end();
        }
      }
      else {
        response.writeHeader(200, { 'Content-Type': type.mime || 'image/jpg' });
        response.write(template);
        response.end();
      }
		}
		else {
			response.end();
		}
	}).listen(port);
  if (opts.openGui) {
    eventsHandler.dispatch('info', {
      msg: `GUI at the address http://localhost:${port}`,
      color: 'lightblue'
    });
    opn('http://localhost:' + port);
  }
};

const configUpdate = (newConfig) => {
  currentConfig = newConfig;
  if (io) {
    io.emit('config-update', currentConfig);
  }
};

const treeUpdate = (newTree) => {
  currentTree = newTree;
  if (io) {
    io.emit('tree-update', currentTree);
  }
};

const updateFinish = (newConfig) => {
  if (newConfig) {
    currentConfig = newConfig;
  }
  if (io) {
    io.emit('update-finish');
  }
};

module.exports = {
  init,
  configUpdate,
  treeUpdate,
  updateFinish,
  on
};

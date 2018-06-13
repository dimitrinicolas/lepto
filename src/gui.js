const fs = require('fs');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const port = 4490;

let io;
let currentConfig = {};
let currentTree = [];

const init = () => {
  io = socketIO(port + 1);

	io.on('connection', function(socket) {
    io.emit('tree-update', currentTree);
    io.emit('config-update', currentConfig);

		socket.on('update-config', function(data) {
			console.log(data);
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
		else {
			response.end();
		}
	}).listen(port);

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

module.exports = {
  init,
  configUpdate,
  treeUpdate
};

import focusVisible from 'focus-visible';

let currentConfig;
let currentTree;

let treeEl;
let filtersEl;

let socket;

const generatePluginDiv = (plugin) => {
  const div = document.createElement('div');
  div.className = 'filters__use__item';
  const input = document.createElement('input');
  input.value = plugin.name;
  input.setAttribute('spellcheck', false);
  div.appendChild(input);
  delete plugin.name;
  const pre = document.createElement('pre');
  pre.className = 'filters__use__data';
  pre.setAttribute('contenteditable', true);
  pre.setAttribute('spellcheck', false);
  if (Object.keys(plugin).length) {
    let content = JSON.stringify(plugin, null, 2);
    content = content.substring(2, content.length - 1);
    content = content.split(/\n/).map(row => row.replace(/^  /, '')).join('\n');
    pre.innerHTML = content;
  }
  div.appendChild(pre);
  return div;
}

const updateConfig = () => {
  document.getElementById('config.input').value = currentConfig.input;
  document.getElementById('config.output').value = currentConfig.output;
  filtersEl.innerHTML = '';
  for (let item of currentConfig.filters) {
    const div = document.createElement('div');
    div.className = 'filters__item';

    const globsDiv = document.createElement('div');
    globsDiv.className = 'filters__globs';
    const globsDivTitle = document.createElement('div');
    globsDivTitle.className = 'filters__globs__title';
    globsDivTitle.innerHTML = 'globs:';
    globsDiv.appendChild(globsDivTitle);
    const globsDivContent = document.createElement('pre');
    globsDivContent.className = 'filters__globs__content';
    globsDivContent.setAttribute('contenteditable', true);
    globsDivContent.setAttribute('spellcheck', false);
    if (Array.isArray(item.glob)) {
      globsDivContent.innerHTML = item.glob.join('\n');
    }
    else {
      globsDivContent.innerHTML = item.glob;
    }
    globsDiv.appendChild(globsDivContent);
    div.appendChild(globsDiv);

    const useDiv = document.createElement('div');
    useDiv.className = 'filters__use';
    for (let plugin of item.use) {
      useDiv.appendChild(generatePluginDiv(plugin));
    }
    div.appendChild(useDiv);

    filtersEl.appendChild(div);
  }
}

const treeItem = (tree) => {
  const res = [];
  for (let item of tree) {
    const div = document.createElement('div');
    div.className = 'tree__item';
    if (item.type === 'file') {
      div.tabIndex = 0;
    }
    const title = document.createElement('h3');
    title.className = 'title';
    title.innerHTML = item.name + (item.type === 'directory' ? '/' : '');
    div.appendChild(title);
    if (item.children) {
      let childs = treeItem(item.children);
      for (let child of childs) {
        div.appendChild(child);
      }
    }
    res.push(div);
  }
  return res;
}
const updateTree = () => {
  treeEl.innerHTML = '';
  let childs = treeItem(currentTree);
  for (let child of childs) {
    treeEl.appendChild(child);
  }
}

const onload = () => {
  treeEl = document.querySelector('.tree');
  filtersEl = document.querySelector('.filters');

  const socketScript = document.createElement('script');
	socketScript.onload = function() {
		socket = io.connect(location.protocol + '//' + location.hostname + ':' + (parseInt(location.port) + 1));
    socket.on('config-update', (config) => {
      currentConfig = config;
      updateConfig();
    });
    socket.on('tree-update', (tree) => {
      currentTree = tree;
      updateTree();
    });
	};
  socketScript.src = location.protocol + '//' + location.hostname + ':' + (parseInt(location.port) + 1) + '/socket.io/socket.io.js';
  document.body.appendChild(socketScript);

  const preEls = document.querySelectorAll('pre');
  for (let pre of preEls) {
    pre.addEventListener('paste', function(event) {
      console.log(event);
      event.preventDefault();
      var text = event.clipboardData.getData('text/plain');
      document.execCommand('insertHTML', false, text);
    });
  }
};

(() => {
  let loaded;

  const load = () => {
    if (!loaded) {
      loaded = true;
      onload();
    }
  };

  if (['interactive', 'complete'].indexOf(document.readyState) >= 0) {
    onload();
  } else {
    loaded = false;
    document.addEventListener('DOMContentLoaded', load, false);
    window.addEventListener('load', load, false);
  }
})();

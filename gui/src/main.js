import focusVisible from 'focus-visible';
import Magnifier from 'magnifier';
import smoothScroll from './scripts/smoothscroll.js';

let currentConfig;
let currentTree;

let configInputEl;
let configOutputEl;
let saveConfigBtn;
let treeEl;
let filtersEl;
let selectedFileEl;

let socket;

let selectedFile;
let selectedFilter;

const preventPre = (pre) => {
  pre.addEventListener('paste', function(event) {
    event.preventDefault();
    var text = event.clipboardData.getData('text/plain');
    document.execCommand('insertHTML', false, text);
  });
}

const cleanArray = (array) => {
  var res = [];
  for (let item of array) {
    if (item !== '') {
      res.push(item);
    }
  }
  return res;
}

const pluginNameListener = (globId, pluginId) => {
  return (event) => {
    let plugin = currentConfig.filters[globId].use[pluginId];
    if (typeof plugin === 'string') {
      currentConfig.filters[globId].use[pluginId] = event.target.value;
    }
    else {
      currentConfig.filters[globId].use[pluginId].name = event.target.value;
    }
  }
};

const pluginPropsListener = (globId, pluginId) => {
  return (event) => {
    let plugin = currentConfig.filters[globId].use[pluginId];
    if (typeof plugin === 'string') {
      currentConfig.filters[globId].use[pluginId] = {
        name: currentConfig.filters[globId].use[pluginId]
      };
    }
    let data = null;
    try {
      data = JSON.parse('{' + event.target.innerText + '}');
    }
    catch(e) {
      event.target.classList.add('--error');
    }
    if (data) {
      event.target.classList.remove('--error');
      currentConfig.filters[globId].use[pluginId] = Object.assign({}, {
        name: currentConfig.filters[globId].use[pluginId].name
      }, data);
    }
  }
}

const generatePluginDiv = (data, globId, pluginId) => {
  let plugin;
  if (typeof data === 'function') {
    return;
  }
  else if (typeof data === 'string') {
    plugin = {
      name: data
    };
  }
  else {
    plugin = Object.assign({}, data);
  }
  const div = document.createElement('div');
  div.className = 'filters__use__item';
  const input = document.createElement('input');
  input.value = plugin.name;
  input.setAttribute('spellcheck', false);
  input.addEventListener('keyup', pluginNameListener(globId, pluginId))
  input.addEventListener('keypress', pluginNameListener(globId, pluginId))
  div.appendChild(input);
  delete plugin.name;
  const pre = document.createElement('pre');
  preventPre(pre);
  pre.className = 'filters__use__data';
  pre.setAttribute('contenteditable', true);
  pre.setAttribute('spellcheck', false);
  pre.addEventListener('keyup', pluginPropsListener(globId, pluginId))
  pre.addEventListener('keypress', pluginPropsListener(globId, pluginId))
  if (Object.keys(plugin).length) {
    let content = JSON.stringify(plugin, null, 2);
    content = content.substring(2, content.length - 1);
    content = content.split(/\n/).map(row => row.replace(/^  /, '')).join('\n');
    pre.innerHTML = content;
  }
  div.appendChild(pre);
  return div;
};

const globPreListener = (globId) => {
  return (event) => {
    let value = cleanArray(event.target.innerText.split('\n'));
    if (value.length === 1) {
      value = value[0];
    }
    currentConfig.filters[globId].glob = value;
  }
};

const updateConfigDOM = () => {
  configInputEl.value = currentConfig.input;
  configOutputEl.value = currentConfig.output;
  configInputEl.addEventListener('keyup', (event) => {
    currentConfig.input = event.target.value;
  });
  configOutputEl.addEventListener('keyup', (event) => {
    currentConfig.output = event.target.value;
  });
  filtersEl.innerHTML = '';
  for (let i in currentConfig.filters) {
    let item = currentConfig.filters[i];
    const div = document.createElement('div');
    div.className = 'filters__item';

    const globsDiv = document.createElement('div');
    globsDiv.className = 'filters__globs';
    const globsDivTitle = document.createElement('div');
    globsDivTitle.className = 'filters__globs__title';
    globsDivTitle.innerHTML = 'globs:';
    globsDiv.appendChild(globsDivTitle);
    const globsDivContent = document.createElement('pre');
    preventPre(globsDivContent);
    globsDivContent.className = 'filters__globs__content';
    globsDivContent.setAttribute('contenteditable', true);
    globsDivContent.setAttribute('spellcheck', false);
    globsDivContent.addEventListener('keyup', globPreListener(i))
    globsDivContent.addEventListener('keypress', globPreListener(i))
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
    for (let j in item.use) {
      useDiv.appendChild(generatePluginDiv(item.use[j], i, j));
    }
    div.appendChild(useDiv);

    filtersEl.appendChild(div);
  }
};

const deepTreeDive = (tree, ids) => {
  if (ids.length > 1) {
    return deepTreeDive(tree[ids[0]].children, ids.splice(1, ids.length));
  }
  else {
    return tree[ids[0]];
  }
};

const setQuality = (q, img, src) => {
  img.src = src + '?q=' + q;
};

let currentMagnifier;
const initMagnifier = () => {
  if (currentMagnifier) {
    currentMagnifier.destroy();
  }
  currentMagnifier = new Magnifier('#result-img')
    .width(500)
    .height(500)
    .borderRadius(500 / 2)
    .backgroundColor('#0D0D0D')
    .className('img__magnifier');
};

const addOptimPlugin = () => {
  const file = deepTreeDive(currentTree, selectedFile.split(',').map(i => parseInt(i)));
  const ext = file.path.substring(file.path.lastIndexOf('.') + 1, file.path.length).toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif'].indexOf(ext) !== -1) {
    if (ext === 'jpg' || ext === 'jpeg') {
      currentConfig.filters.push({
        glob: file.path,
        use: [
          {
            name: 'lepto.jpeg',
            quality: parseInt(document.getElementById('q-range').value)
          }
        ]
      });
    }
    else if (ext === 'png') {

    }
    else if (ext === 'gif') {

    }
  }
  updateConfigDOM();
  smoothScroll(0, 300);
}

const handleOptimBtnEvent = (event) => {
  if (event.type === 'keypress') {
    if (event.keyCode === 13) {
      addOptimPlugin();
      event.target.classList.add('btn--disabled');
      setTimeout(() => {
        event.target.classList.remove('btn--disabled');
      }, 1000);
    }
  }
  else {
    addOptimPlugin();
    event.target.classList.add('btn--disabled');
    setTimeout(() => {
      event.target.classList.remove('btn--disabled');
    }, 1000);
  }
};

const handleFileFocus = (id) => {
  selectedFile = id;

  const file = deepTreeDive(currentTree, selectedFile.split(',').map(i => parseInt(i)));
  const ext = file.path.substring(file.path.lastIndexOf('.') + 1, file.path.length).toLowerCase();
  selectedFileEl.innerHTML = '';

  if (['png', 'jpg', 'jpeg', 'gif'].indexOf(ext) !== -1) {
    const title = document.createElement('h2');
    title.className = 'title';
    title.innerHTML = file.name;
    selectedFileEl.appendChild(title);
    const span = document.createElement('span');
    span.innerHTML = 'Quality: ';
    selectedFileEl.appendChild(span);

    const valueEl = document.createElement('span');
    span.appendChild(valueEl);

    let slider = document.createElement('input');
    if (ext === 'jpg' || ext === 'jpeg') {
      slider.type = 'range';
      slider.id = 'q-range';
      slider.className = 'range';
      slider.min = 1;
      slider.max = 100;
      slider.value = 80;
      valueEl.innerHTML = slider.value;
      selectedFileEl.appendChild(slider);
    }
    else if (ext === 'png') {

    }
    else if (ext === 'gif') {

    }

    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.innerHTML = 'Add optimization plugin';
    selectedFileEl.appendChild(btn);
    btn.addEventListener('click', handleOptimBtnEvent);
    btn.addEventListener('keypress', handleOptimBtnEvent);

    const imgWrap = document.createElement('div');
    imgWrap.className = 'img';
    const img = document.createElement('img');
    img.id = 'result-img';
    img.addEventListener('load', initMagnifier);
    img.src = 'ressources/' + file.path;
    imgWrap.appendChild(img);
    selectedFileEl.appendChild(imgWrap);

    slider.addEventListener('change', function(label, img, src) {
      return (event) => {
        label.innerHTML = event.target.value;
        setQuality(event.target.value, img, 'ressources/' + file.path);
      };
    }(valueEl, img, file.path));

    smoothScroll(selectedFileEl.offsetTop, 200);

    let fileEls = document.querySelectorAll('[data-file-id]');
    for (let el of fileEls) {
      if (el.getAttribute('data-file-id') === selectedFile) {
        el.classList.add('tree__item--selected');
      }
      else {
        el.classList.remove('tree__item--selected');
      }
    }
  }
}

const treeItem = (tree, parent='') => {
  const res = [];
  for (let i in tree) {
    let item = tree[i];
    const div = document.createElement('div');
    div.className = 'tree__item';
    div.setAttribute('data-file-id', parent + i);
    if (item.type === 'file') {
      div.tabIndex = 0;
      div.addEventListener('click', handleFileFocus.bind(null, parent + i));
    }
    const title = document.createElement('h3');
    title.className = 'title';
    title.innerHTML = item.name + (item.type === 'directory' ? '/' : '');
    div.appendChild(title);
    if (item.children) {
      let childs = treeItem(item.children, parent + i + ',');
      for (let child of childs) {
        div.appendChild(child);
      }
    }
    res.push(div);
  }
  return res;
};
const updateTreeDOM = () => {
  treeEl.innerHTML = '';
  let childs = treeItem(currentTree);
  for (let child of childs) {
    treeEl.appendChild(child);
  }
};

let disabledTime;
let disabledTimeout;
const saveConfig = () => {
  disabledTime = Date.now();
  saveConfigBtn.classList.add('btn--disabled');
  if (socket) {
    socket.emit('update-config', currentConfig);
  }
};

const handleSaveBtnEvent = (event) => {
  if (event.type === 'keypress') {
    if (event.keyCode === 13) {
      saveConfig();
    }
  }
  else {
    saveConfig();
  }
};

const onload = () => {
  configInputEl = document.getElementById('config.input');
  configOutputEl = document.getElementById('config.output');
  saveConfigBtn = document.getElementById('save-config-btn');
  treeEl = document.querySelector('.tree');
  filtersEl = document.querySelector('.filters');
  selectedFileEl = document.getElementById('selectedFile');

  saveConfigBtn.addEventListener('click', handleSaveBtnEvent);
  saveConfigBtn.addEventListener('keypress', handleSaveBtnEvent);

  const socketScript = document.createElement('script');
	socketScript.onload = function() {
		socket = io.connect(location.protocol + '//' + location.hostname + ':' + (parseInt(location.port) + 1));
    socket.on('config-update', (config) => {
      currentConfig = config;
      selectedFile = null;
      selectedFilter = null;
      updateConfigDOM();
    });
    socket.on('tree-update', (tree) => {
      currentTree = tree;
      updateTreeDOM();
    });
    socket.on('update-finish', () => {
      if (disabledTimeout) {
        clearTimeout(disabledTimeout);
      }
      let timeout = Math.max(0, (100 - Date.now() + disabledTime));
      if (!timeout) {
        saveConfigBtn.classList.remove('btn--disabled');
      }
      else {
        disabledTimeout = setTimeout(() => {
          saveConfigBtn.classList.remove('btn--disabled');
        }, timeout);
      }
    });
	};
  socketScript.src = location.protocol + '//' + location.hostname + ':' + (parseInt(location.port) + 1) + '/socket.io/socket.io.js';
  document.body.appendChild(socketScript);

  window.addEventListener('keydown', function(event) {
    if ((event.which == 115 && event.ctrlKey) || (event.which == 83 && event.metaKey)) {
      event.preventDefault();
      saveConfig();
    }
  });
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

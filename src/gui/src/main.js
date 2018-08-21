/* global io:true */
/* eslint no-use-before-define: 0 */

import 'focus-visible';
import Magnifier from 'magnifier';
import smoothScroll from './scripts/smoothscroll.js';

let currentConfig;
let currentTree;

let configInputEl;
let configOutputEl;
let saveConfigBtn;
let addFilterBtn;
let treeEl;
let filtersEl;
let selectedFileEl;

let socket;

let selectedFile;

/**
 * Prevent user from pasting DOM
 * Elements inside pre elements
 * @param {element} pre
 */
const preventPre = pre => {
  pre.addEventListener('paste', event => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertHTML', false, text);
  });
};

/**
 * Remove empty strings from array
 * @param {array} array
 */
const cleanArray = array => {
  const res = [];
  for (const item of array) {
    if (item !== '') {
      res.push(item);
    }
  }
  return res;
};

/**
 * Handle DOM plugin name change
 * @param {number} globId
 * @param {number} pluginId
 */
const pluginNameListener = (globId, pluginId) => {
  return event => {
    const plugin = currentConfig.filters[globId].use[pluginId];
    if (typeof plugin === 'string') {
      currentConfig.filters[globId].use[pluginId] = event.target.value;
    } else {
      currentConfig.filters[globId].use[pluginId].name = event.target.value;
    }
  };
};

/**
 * Handle DOM plugin props change
 * @param {number} globId
 * @param {number} pluginId
 */
const pluginPropsListener = (globId, pluginId) => {
  return event => {
    const plugin = currentConfig.filters[globId].use[pluginId];
    if (typeof plugin === 'string') {
      currentConfig.filters[globId].use[pluginId] = {
        name: currentConfig.filters[globId].use[pluginId]
      };
    }
    let data = null;
    try {
      data = JSON.parse(`{${event.target.innerText}}`);
    } catch (e) {
      event.target.classList.add('--error');
    }
    if (data) {
      event.target.classList.remove('--error');
      currentConfig.filters[globId].use[pluginId] = Object.assign(
        {},
        {
          name: currentConfig.filters[globId].use[pluginId].name
        },
        data
      );
    }
  };
};

/**
 * Handle DOM plugin glob change
 * @param {number} globId
 */
const globPreListener = globId => {
  return event => {
    let value = cleanArray(event.target.innerText.split('\n'));
    if (value.length === 1) {
      value = value[0];
    }
    currentConfig.filters[globId].glob = value;
  };
};

/**
 * Handle DOM filter remove
 * @param {number} globId
 */
const globRemoveEvent = globId => {
  return event => {
    if (
      event.type !== 'keypress'
      || (event.type === 'keypress' && event.keyCode === 13)
    ) {
      currentConfig.filters.splice(globId, 1);
      updateConfigDOM();
    }
  };
};

/**
 * Handle DOM filter move
 * @param {number} globId
 * @param {-1|1} move
 */
const globMoveEvent = (globId, move) => {
  return event => {
    if (
      event.type !== 'keypress'
      || (event.type === 'keypress' && event.keyCode === 13)
    ) {
      currentConfig.filters.splice(
        globId + move,
        0,
        currentConfig.filters.splice(globId, 1)[0]
      );
      updateConfigDOM();
    }
  };
};

/**
 * Handle add plugin button
 * @param {number} globId
 */
const addPluginEvent = globId => {
  return event => {
    if (
      event.type !== 'keypress'
      || (event.type === 'keypress' && event.keyCode === 13)
    ) {
      currentConfig.filters[globId].use.push({
        name: ''
      });
      updateConfigDOM();
    }
  };
};

/**
 * Handle DOM plugin remove
 * @param {number} globId
 * @param {number} pluginId
 */
const pluginRemoveEvent = (globId, pluginId) => {
  return event => {
    if (
      event.type !== 'keypress'
      || (event.type === 'keypress' && event.keyCode === 13)
    ) {
      currentConfig.filters[globId].use.splice(pluginId, 1);
      updateConfigDOM();
    }
  };
};

/**
 * Handle add optimization filter button
 * @param {event} event
 */
const handleOptimBtnEvent = event => {
  if (
    event.type !== 'keypress'
    || (event.type === 'keypress' && event.keyCode === 13)
  ) {
    addOptimFilter();
    event.target.classList.add('btn--disabled');
    setTimeout(() => {
      event.target.classList.remove('btn--disabled');
    }, 1000);
  }
};

/**
 * Handle add filter event
 * @param {event} event
 */
const addFilterEvent = event => {
  if (
    event.type !== 'keypress'
    || (event.type === 'keypress' && event.keyCode === 13)
  ) {
    currentConfig.filters.push({
      glob: ''
    });
    updateConfigDOM();
  }
};

/**
 * When config change
 */
const updateConfigDOM = () => {
  configInputEl.value = currentConfig.input;
  configOutputEl.value = currentConfig.output;
  configInputEl.addEventListener('keyup', event => {
    currentConfig.input = event.target.value;
  });
  configOutputEl.addEventListener('keyup', event => {
    currentConfig.output = event.target.value;
  });
  filtersEl.innerHTML = '';
  for (const key in currentConfig.filters) {
    if (Object.prototype.hasOwnProperty.call(currentConfig.filters, key)) {
      const i = parseInt(key, 10);
      const item = currentConfig.filters[i];
      const div = document.createElement('div');
      div.className = 'filters__item';

      const moveDiv = document.createElement('div');
      moveDiv.className = 'filters__move';

      if (i !== 0) {
        const moveUp = document.createElement('div');
        moveUp.tabIndex = 0;
        moveUp.className = 'filters__move__up';
        moveUp.addEventListener('click', globMoveEvent(i, -1));
        moveUp.addEventListener('keypress', globMoveEvent(i, -1));
        moveDiv.appendChild(moveUp);
      }

      const moveCross = document.createElement('div');
      moveCross.tabIndex = 0;
      moveCross.className = 'filters__move__cross';
      moveCross.addEventListener('click', globRemoveEvent(i));
      moveCross.addEventListener('keypress', globRemoveEvent(i));
      moveDiv.appendChild(moveCross);

      if (i !== currentConfig.filters[i].length) {
        const moveDown = document.createElement('div');
        moveDown.tabIndex = 0;
        moveDown.className = 'filters__move__down';
        moveDown.addEventListener('click', globMoveEvent(i, 1));
        moveDown.addEventListener('keypress', globMoveEvent(i, 1));
        moveDiv.appendChild(moveDown);
      }

      div.appendChild(moveDiv);

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
      globsDivContent.addEventListener('keyup', globPreListener(i));
      globsDivContent.addEventListener('keypress', globPreListener(i));
      if (Array.isArray(item.glob)) {
        globsDivContent.innerHTML = item.glob.join('\n');
      } else {
        globsDivContent.innerHTML = item.glob;
      }
      globsDiv.appendChild(globsDivContent);

      div.appendChild(globsDiv);

      const useDiv = document.createElement('div');
      useDiv.className = 'filters__use';
      for (const j in item.use) {
        if (Object.prototype.hasOwnProperty.call(currentConfig.filters, j)) {
          useDiv.appendChild(generatePluginDiv(item.use[j], i, j));
        }
      }

      const addPlugin = document.createElement('button', { type: 'button' });
      addPlugin.className = 'btn btn--invisible';
      addPlugin.innerHTML = 'Add a plugin';
      addPlugin.addEventListener('click', addPluginEvent(i));
      addPlugin.addEventListener('keypress', addPluginEvent(i));
      useDiv.appendChild(addPlugin);

      div.appendChild(useDiv);

      filtersEl.appendChild(div);
    }
  }
};

/**
 * Generate a plugin DOM
 * @param {string} data Plugin name
 * @param {number} globId
 * @param {number} pluginId
 */
const generatePluginDiv = (data, globId, pluginId) => {
  if (typeof data === 'function') {
    return;
  }
  let plugin;
  if (typeof data === 'string') {
    plugin = {
      name: data
    };
  } else {
    plugin = Object.assign({}, data);
  }
  const div = document.createElement('div');
  div.className = 'filters__use__item';

  const useCross = document.createElement('span');
  useCross.tabIndex = 0;
  useCross.className = 'filters__use__cross';
  useCross.addEventListener('click', pluginRemoveEvent(globId, pluginId));
  useCross.addEventListener('keypress', pluginRemoveEvent(globId, pluginId));
  div.appendChild(useCross);

  const input = document.createElement('input');
  input.value = plugin.name;
  input.setAttribute('spellcheck', false);
  input.addEventListener('keyup', pluginNameListener(globId, pluginId));
  input.addEventListener('keypress', pluginNameListener(globId, pluginId));
  div.appendChild(input);

  delete plugin.name;
  const pre = document.createElement('pre');
  preventPre(pre);
  pre.className = 'filters__use__data';
  pre.setAttribute('contenteditable', true);
  pre.setAttribute('spellcheck', false);
  pre.addEventListener('keyup', pluginPropsListener(globId, pluginId));
  pre.addEventListener('keypress', pluginPropsListener(globId, pluginId));
  if (Object.keys(plugin).length) {
    let content = JSON.stringify(plugin, null, 2);
    content = content.substring(2, content.length - 1);
    content = content
      .split(/\n/)
      .map(row => row.replace(/^ {2}/, ''))
      .join('\n');
    pre.innerHTML = content;
  }
  div.appendChild(pre);

  return div;
};

/**
 * Flatten tree
 * @param {object} tree
 * @param {array} ids
 */
const deepTreeDive = (tree, ids) => {
  if (ids.length > 1) {
    return deepTreeDive(tree[ids[0]].children, ids.splice(1, ids.length));
  }
  return tree[ids[0]];
};

/**
 * Set optimizer image source
 * @param {number} q quality
 * @param {element} img img DOM Element
 * @param {string} src img path
 */
const setQuality = (q, img, src) => {
  const sizeDiffEl = document.getElementById('sizeDiff');
  if (sizeDiffEl) {
    sizeDiffEl.innerHTML = '';
    const gif = document.createElement('img');
    gif.className = 'loader';
    /** Spinner gif */
    // eslint-disable-next-line max-len
    gif.src = 'data:image/gif;base64,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';
    sizeDiffEl.appendChild(gif);
  }
  img.src = `${src}?q=${q}&${Math.random()}`;
};

let currentMagnifier;
/**
 * Init optimizer magnifier
 */
const initMagnifier = () => {
  if (currentMagnifier) {
    currentMagnifier.destroy();
  }
  currentMagnifier = new Magnifier('#result-img')
    .width(500)
    .height(500)
    .borderRadius(500 / 2)
    .backgroundColor('#616560')
    .className('img__magnifier');
};

/**
 * Add the optimization filter
 */
const addOptimFilter = () => {
  const file = deepTreeDive(
    currentTree,
    selectedFile.split(',').map(i => parseInt(i, 10))
  );
  const ext = file.path
    .substring(file.path.lastIndexOf('.') + 1, file.path.length)
    .toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif'].indexOf(ext) !== -1) {
    if (ext === 'jpg' || ext === 'jpeg') {
      currentConfig.filters.push({
        glob: file.path,
        use: [
          {
            name: 'lepto.jpeg',
            quality: parseInt(document.getElementById('q-range').value, 10)
          }
        ]
      });
    } else if (ext === 'png') {
      currentConfig.filters.push({
        glob: file.path,
        use: [
          {
            name: 'lepto.png',
            quality: parseInt(document.getElementById('q-range').value, 10)
          }
        ]
      });
    } else if (ext === 'gif') {
      currentConfig.filters.push({
        glob: file.path,
        use: [
          {
            name: 'lepto.gif',
            colors: parseInt(document.getElementById('q-range').value, 10)
          }
        ]
      });
    }
  }
  updateConfigDOM();
  smoothScroll(Math.max(0, window.scrollY - 300), 300);
};

/**
 * Focus a file
 * @param {string} id file identifier
 */
const handleFileFocus = id => {
  selectedFile = id;

  const file = deepTreeDive(
    currentTree,
    selectedFile.split(',').map(i => parseInt(i, 10))
  );
  const ext = file.path
    .substring(file.path.lastIndexOf('.') + 1, file.path.length)
    .toLowerCase();
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

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'range';
    slider.id = 'q-range';
    if (ext === 'jpg' || ext === 'jpeg') {
      slider.min = 1;
      slider.max = 100;
      slider.value = 80;
      valueEl.innerHTML = slider.value;
      selectedFileEl.appendChild(slider);
    } else if (ext === 'png') {
      slider.min = 0;
      slider.max = 100;
      slider.value = 80;
      valueEl.innerHTML = slider.value;
      selectedFileEl.appendChild(slider);
    } else if (ext === 'gif') {
      span.innerHTML = 'Colors: ';
      slider.min = 2;
      slider.max = 256;
      slider.value = 256;
      valueEl.innerHTML = slider.value;
      selectedFileEl.appendChild(slider);
    }

    span.appendChild(valueEl);

    const sizeDiffEl = document.createElement('span');
    sizeDiffEl.id = 'sizeDiff';
    sizeDiffEl.className = 'size-diff';
    selectedFileEl.appendChild(sizeDiffEl);

    const btn = document.createElement('button', { type: 'button' });
    btn.className = 'btn';
    btn.innerHTML = 'Add optimization filter';
    selectedFileEl.appendChild(btn);
    btn.addEventListener('click', handleOptimBtnEvent);
    btn.addEventListener('keypress', handleOptimBtnEvent);

    const imgWrap = document.createElement('div');
    imgWrap.className = 'img';
    const img = document.createElement('img');
    img.id = 'result-img';
    img.addEventListener('load', initMagnifier);
    imgWrap.appendChild(img);
    selectedFileEl.appendChild(imgWrap);

    setQuality(slider.value, img, `ressources/${file.path}`);
    slider.addEventListener(
      'change',
      ((label, imgEl, src) => {
        return event => {
          label.innerHTML = event.target.value;
          setQuality(event.target.value, imgEl, `ressources/${src}`);
        };
      })(valueEl, img, file.path)
    );

    smoothScroll(selectedFileEl.offsetTop, 200);

    const fileEls = document.querySelectorAll('[data-file-id]');
    for (const el of fileEls) {
      if (el.getAttribute('data-file-id') === selectedFile) {
        el.classList.add('tree__item--selected');
      } else {
        el.classList.remove('tree__item--selected');
      }
    }
  }
};

/**
 * Handle file element event
 * @param {string} id file identifier
 */
const handleFileEvent = id => {
  return event => {
    if (
      event.type !== 'keypress'
      || (event.type === 'keypress' && event.keyCode === 13)
    ) {
      handleFileFocus(id);
    }
  };
};

/**
 * Create tree element
 * @param {object} tree
 * @param {string} [parent=]
 */
const treeItem = (tree, parent = '') => {
  const res = [];
  for (const i in tree) {
    if (Object.prototype.hasOwnProperty.call(tree, i)) {
      const item = tree[i];
      const div = document.createElement('div');
      div.className = 'tree__item';
      div.setAttribute('data-file-id', parent + i);
      if (item.type === 'file') {
        div.tabIndex = 0;
        div.addEventListener('click', handleFileEvent(parent + i));
        div.addEventListener('keypress', handleFileEvent(parent + i));
      }
      const title = document.createElement('h3');
      title.className = 'title';
      title.innerHTML = item.name + (item.type === 'directory' ? '/' : '');
      div.appendChild(title);
      if (item.children) {
        const childs = treeItem(item.children, `${parent}${i},`);
        for (const child of childs) {
          div.appendChild(child);
        }
      }
      res.push(div);
    }
  }
  return res;
};

/**
 * Update the tree DOM
 */
const updateTreeDOM = () => {
  treeEl.innerHTML = '';
  const childs = treeItem(currentTree);
  for (const child of childs) {
    treeEl.appendChild(child);
  }
};

let disabledTime;
let disabledTimeout;
/**
 * Save current config
 */
const saveConfig = () => {
  disabledTime = Date.now();
  saveConfigBtn.classList.add('btn--disabled');
  if (socket) {
    socket.emit('update-config', currentConfig);
  }
};

/**
 * Handle save button event
 * @param {event} event
 */
const handleSaveBtnEvent = event => {
  if (
    event.type !== 'keypress'
    || (event.type === 'keypress' && event.keyCode === 13)
  ) {
    saveConfig();
  }
};

/**
 * On window load
 */
const onload = () => {
  configInputEl = document.getElementById('config.input');
  configOutputEl = document.getElementById('config.output');
  saveConfigBtn = document.getElementById('saveConfigBtn');
  addFilterBtn = document.getElementById('addFilterBtn');
  treeEl = document.querySelector('.tree');
  filtersEl = document.querySelector('.filters');
  selectedFileEl = document.getElementById('selectedFile');

  if (navigator.platform.indexOf('Win') > -1) {
    saveConfigBtn.innerHTML = 'Save config Ctrl+S';
  }
  saveConfigBtn.addEventListener('click', handleSaveBtnEvent);
  saveConfigBtn.addEventListener('keypress', handleSaveBtnEvent);

  addFilterBtn.addEventListener('click', addFilterEvent);
  addFilterBtn.addEventListener('keypress', addFilterEvent);

  const socketScript = document.createElement('script');
  socketScript.onload = () => {
    socket = io.connect(
      `${location.protocol}//${location.hostname}:${parseInt(
        location.port,
        10
      ) + 1}`
    );
    socket.on('config-update', config => {
      currentConfig = config;
      selectedFile = null;
      updateConfigDOM();
    });
    socket.on('tree-update', tree => {
      currentTree = tree;
      updateTreeDOM();
    });
    socket.on('size-diff', str => {
      const el = document.getElementById('sizeDiff');
      if (el) {
        el.innerHTML = str;
      }
    });
    socket.on('update-finish', () => {
      if (disabledTimeout) {
        clearTimeout(disabledTimeout);
      }
      const timeout = Math.max(0, 100 - Date.now() + disabledTime);
      if (!timeout) {
        saveConfigBtn.classList.remove('btn--disabled');
      } else {
        disabledTimeout = setTimeout(() => {
          saveConfigBtn.classList.remove('btn--disabled');
        }, timeout);
      }
    });
  };
  socketScript.src = `${location.protocol}//${location.hostname}:${parseInt(
    location.port,
    10
  ) + 1}/socket.io/socket.io.js`;
  document.body.appendChild(socketScript);

  window.addEventListener('keydown', event => {
    if (
      (event.which === 115 && event.ctrlKey)
      || (event.which === 83 && event.metaKey)
    ) {
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

'use strict';

var topColor = void 0;
var bottomColor = void 0;
var currentColor = void 0;

var styleTag = void 0;

var setBgColor = function setBgColor(color) {

  if (currentColor !== color) {
    currentColor = color;

    var css = 'html{background:' + color + ';}';

    if (!styleTag) {
      styleTag = document.createElement('style');
      var head = document.head || document.getElementsByTagName('head')[0];
      head.appendChild(styleTag);
    }

    if (styleTag.styleSheet) {
      styleTag.styleSheet.cssText = css;
    } else {
      styleTag.innerHTML = css;
    }
  }
};

var checkScroll = function checkScroll() {

  if (document.body.scrollHeight === window.innerHeight) {
    setBgColor(bottomColor);
  } else {
    var scrollFromMiddle = window.innerHeight - document.body.scrollHeight + 2 * Math.max(document.body.scrollTop, document.documentElement.scrollTop);
    setBgColor(scrollFromMiddle < 0 ? topColor : bottomColor);
  }
};

var initOverflowColor = function initOverflowColor() {

  var shortcutEl = document.querySelector('[data-oc]');
  if (shortcutEl) {
    var split = shortcutEl.getAttribute('data-oc').split(',');
    if (split.length > 1) {
      topColor = split[0];
      bottomColor = split[1];
    } else if (split.length === 1) {
      topColor = bottomColor = split[0];
    }
  } else {
    var topEl = document.querySelector('[data-oc-top]');
    var bottomEl = document.querySelector('[data-oc-bottom]');
    if (topEl) {
      topColor = topEl.getAttribute('data-oc-top');
    }
    if (bottomEl) {
      bottomColor = bottomEl.getAttribute('data-oc-bottom');
    }
  }

  if (topColor || bottomColor) {

    if (!topColor && bottomColor) {
      topColor = bottomColor;
    } else if (topColor && !bottomColor) {
      bottomColor = topColor;
    }

    var bodyComputedStyle = window.getComputedStyle(document.body, null);
    var bodyBackground = bodyComputedStyle.getPropertyValue('background');
    if (bodyBackground === '' || bodyComputedStyle.getPropertyValue('background-color') === 'rgba(0, 0, 0, 0)' && bodyBackground.substring(21, 17) === 'none') {
      bodyBackground = 'white';
    }
    document.body.style.background = 'transparent';
    var bodyWrap = document.createElement('div');
    bodyWrap.setAttribute('data-oc-wrap', '');
    bodyWrap.style.background = bodyBackground;
    for (var i = 0, l = document.body.childNodes.length; i < l; i++) {
      bodyWrap.appendChild(document.body.childNodes[0]);
    }
    document.body.appendChild(bodyWrap);

    checkScroll();
    if (typeof window.addEventListener !== 'undefined') {
      window.addEventListener('scroll', checkScroll, false);
      window.addEventListener('resize', checkScroll, false);
    } else {
      window.attachEvent('scroll', checkScroll);
      window.attachEvent('resize', checkScroll);
    }
  }
};

if (['interactive', 'complete', 'loaded'].indexOf(document.readyState) >= 0) {
  initOverflowColor();
} else if (typeof document.addEventListener !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initOverflowColor, false);
} else {
  document.attachEvent('onreadystatechange', initOverflowColor);
}

module.exports = initOverflowColor;

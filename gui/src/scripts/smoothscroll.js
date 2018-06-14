window.requestAnimationFrame = window.requestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.msRequestAnimationFrame
    || function(f){return setTimeout(f, 1000/60)};
 
window.cancelAnimationFrame = window.cancelAnimationFrame
    || window.mozCancelAnimationFrame
    || function(requestID){clearTimeout(requestID)};

const easingFunctions = {
  linear: function (t) { return t },
  easeInQuad: function (t) { return t*t },
  easeOutQuad: function (t) { return t*(2-t) },
  easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
  easeInCubic: function (t) { return t*t*t },
  easeOutCubic: function (t) { return (--t)*t*t+1 },
  easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
  easeInQuart: function (t) { return t*t*t*t },
  easeOutQuart: function (t) { return 1-(--t)*t*t*t },
  easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
  easeInQuint: function (t) { return t*t*t*t*t },
  easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
  easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
}

const smoothScroll = (target, duration, easing='easeInOutQuad') => {
  target = Math.round(target);
  duration = Math.round(duration);

  let startTime = Date.now();
  let endTime = startTime + duration;

  let start_top = (document.documentElement.scrollTop || window.scrollY);
  let distance = target - start_top;

  let smooth_step = function(start, end, point) {
    return easingFunctions[easing]((point - start) / (end - start));
  }

  let previous_top = (document.documentElement.scrollTop || window.scrollY);

  let scroll_frame = function() {
    let now = Date.now();
    let point = smooth_step(startTime, endTime, now);
    let frameTop = Math.round(start_top + (distance * point));
    window.scrollTo(window.scrollX, frameTop);

    if (now >= endTime) {
      return;
    }

    if((document.documentElement.scrollTop || window.scrollY) === previous_top
      && (document.documentElement.scrollTop || window.scrollY) !== frameTop) {
      return;
    }
    previous_top = (document.documentElement.scrollTop || window.scrollY);

    window.requestAnimationFrame(scroll_frame);
  }

  window.requestAnimationFrame(scroll_frame);
}

export default smoothScroll;

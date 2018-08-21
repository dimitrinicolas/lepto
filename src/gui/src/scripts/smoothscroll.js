window.requestAnimationFrame = window.requestAnimationFrame
  || window.mozRequestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.msRequestAnimationFrame
  || function requestAnimationFrame(f) {
    return setTimeout(f, 1000 / 60);
  };

window.cancelAnimationFrame = window.cancelAnimationFrame
  || window.mozCancelAnimationFrame
  || function cancelAnimationFrame(requestID) {
    clearTimeout(requestID);
  };

const easingFunctions = {
  linear(t) {
    return t;
  },
  easeInQuad(t) {
    return t * t;
  },
  easeOutQuad(t) {
    return t * (2 - t);
  },
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
  easeInCubic(t) {
    return t * t * t;
  },
  easeOutCubic(t) {
    return --t * t * t + 1;
  },
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  },
  easeInQuart(t) {
    return t * t * t * t;
  },
  easeOutQuart(t) {
    return 1 - --t * t * t * t;
  },
  easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
  },
  easeInQuint(t) {
    return t * t * t * t * t;
  },
  easeOutQuint(t) {
    return 1 + --t * t * t * t * t;
  },
  easeInOutQuint(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
  }
};

const smoothScroll = (target, duration, easing = 'easeInOutQuad') => {
  target = Math.round(target);
  duration = Math.round(duration);

  const startTime = Date.now();
  const endTime = startTime + duration;

  const startTop = document.documentElement.scrollTop || window.scrollY;
  const distance = target - startTop;

  const smoothStep = (start, end, point) => {
    return easingFunctions[easing]((point - start) / (end - start));
  };

  let previousTop = document.documentElement.scrollTop || window.scrollY;

  const scrollFrame = () => {
    const now = Date.now();
    const point = smoothStep(startTime, endTime, now);
    const frameTop = Math.round(startTop + distance * point);
    window.scrollTo(window.scrollX, frameTop);

    if (now >= endTime) {
      return;
    }

    if (
      (document.documentElement.scrollTop || window.scrollY) === previousTop
      && (document.documentElement.scrollTop || window.scrollY) !== frameTop
    ) {
      return;
    }
    previousTop = document.documentElement.scrollTop || window.scrollY;

    window.requestAnimationFrame(scrollFrame);
  };

  window.requestAnimationFrame(scrollFrame);
};

export default smoothScroll;

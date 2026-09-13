/**
 * Headless host for the game, driven from Node.
 *
 * Mirrors tests/harness.mjs, but loads src/main.ts instead of the built bundle:
 * same stubbed WeChat surface, same manual frame clock, same touch injection.
 * No `window` is defined, so input.ts takes the wx touch path a phone takes.
 */
const noop = () => {};
const GRADIENT = { addColorStop: noop };
const TEXT_METRICS = { width: 10 };

export async function createGame() {
  const handlers = {};
  const storage = new Map();
  let pendingFrame = null;

/**
 * A plain object rather than a Proxy. The Proxy version was correct but cost a
 * trap on every one of the tens of thousands of canvas calls a frame makes,
 * which dominated the profile: a batch that took minutes takes seconds without
 * it. Any method the renderer starts using has to be added here, and the
 * failure is loud (TypeError) rather than silent.
 */
const CTX_METHODS = [
  'save', 'restore', 'scale', 'rotate', 'translate', 'transform', 'setTransform', 'resetTransform',
  'beginPath', 'closePath', 'moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'arc', 'arcTo',
  'ellipse', 'rect', 'roundRect', 'fill', 'stroke', 'clip', 'isPointInPath',
  'fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText',
  'drawImage', 'createPattern', 'setLineDash', 'getLineDash',
  'putImageData', 'getImageData', 'createImageData', 'globalCompositeOperation'
];

  const makeCtxStub = (owner) => {
    const stub = { canvas: owner };
    for (const name of CTX_METHODS) stub[name] = noop;
    stub.createLinearGradient = () => GRADIENT;
    stub.createRadialGradient = () => GRADIENT;
    stub.measureText = () => TEXT_METRICS;
    return stub;
  };

  const makeCanvas = () => {
    const stub = { width: 0, height: 0 };
    stub.getContext = () => makeCtxStub(stub);
    return stub;
  };

  globalThis.wx = {
    createCanvas: makeCanvas,
    getWindowInfo: () => ({ windowWidth: 390, windowHeight: 844, pixelRatio: 2 }),
    vibrateShort: noop,
    onTouchStart: (fn) => { handlers.start = fn; },
    onTouchMove: (fn) => { handlers.move = fn; },
    onTouchEnd: (fn) => { handlers.end = fn; },
    onTouchCancel: (fn) => { handlers.cancel = fn; },
    onHide: noop,
    onShow: noop,
    getStorageSync: (key) => storage.get(key) ?? '',
    setStorageSync: (key, value) => { storage.set(key, value); }
  };
  globalThis.requestAnimationFrame = (cb) => { pendingFrame = cb; return 1; };

  const game = await import('../../src/main.ts');

  let clock = 0;
  /** Advances the game by `seconds` at a fixed 60Hz, like the real frame loop. */
  function step(seconds) {
    const count = Math.max(1, Math.round(seconds / 0.016));
    for (let i = 0; i < count; i++) {
      clock += 16;
      const cb = pendingFrame;
      pendingFrame = null;
      if (cb) cb(clock);
    }
  }

  const fire = (name, touches) => {
    if (handlers[name]) handlers[name]({ changedTouches: touches, touches });
  };

  return { game, step, fire, storage };
}

export const touch = (id, x, y) => ({ identifier: id, clientX: x, clientY: y });

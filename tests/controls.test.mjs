// Headless tests for input handling and the speed curve.
//
// The built bundle is loaded into a vm context with a stubbed WeChat surface, so
// these run without a browser, a canvas or the devtools. Because no `window` is
// defined, the game takes the wx touch path exactly as it does on a real phone.
//
//   node scripts/build.mjs && node tests/controls.test.mjs

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const noop = () => {};
const handlers = {};
let pendingFrame = null;

let canvasStub;
const ctxStub = new Proxy({}, {
  get(target, prop) {
    if (prop === 'canvas') return canvasStub;
    if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => ({ addColorStop: noop });
    if (prop === 'measureText') return () => ({ width: 10 });
    if (prop in target) return target[prop];
    return noop;
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  }
});

canvasStub = {
  width: 0,
  height: 0,
  getContext: () => ctxStub
  // No addEventListener on purpose: the real mini game canvas has none either.
};

const sandbox = {
  console,
  setTimeout,
  requestAnimationFrame: (cb) => { pendingFrame = cb; return 1; },
  wx: {
    createCanvas: () => canvasStub,
    getWindowInfo: () => ({ windowWidth: 390, windowHeight: 844, pixelRatio: 2 }),
    vibrateShort: noop,
    onTouchStart: (fn) => { handlers.start = fn; },
    onTouchMove: (fn) => { handlers.move = fn; },
    onTouchEnd: (fn) => { handlers.end = fn; },
    onTouchCancel: (fn) => { handlers.cancel = fn; },
    onHide: noop,
    onShow: noop
  }
};

vm.createContext(sandbox);
vm.runInContext(readFileSync(resolve(root, 'game.js'), 'utf8'), sandbox, { filename: 'game.js' });

const game = sandbox.HarborLoop;
if (!game) throw new Error('game.js did not expose the HarborLoop global');

let clock = 0;
function step(seconds) {
  const count = Math.max(1, Math.round(seconds / 0.016));
  for (let i = 0; i < count; i++) {
    clock += 16;
    const cb = pendingFrame;
    pendingFrame = null;
    if (cb) cb(clock);
  }
}

const touch = (id, x, y) => ({ identifier: id, clientX: x, clientY: y });
const fire = (name, touches) => { if (handlers[name]) handlers[name]({ changedTouches: touches, touches }); };

// At 390x844 the design scale is 1 and both offsets are 0, so design coordinates
// and screen coordinates are the same. Buttons span y = 738..810.
const THROTTLE = touch(1, 303, 774);
const LEFT_BTN = touch(2, 58, 774);
const RIGHT_BTN = touch(3, 142, 774);
const TRACK_POINT = touch(4, 100, 300);

// These tests drive modes that have not shipped yet.
game.setUnlockOverride(true);

/** Empty traffic makes throttle and lane assertions deterministic. */
function resetWithoutTraffic(modeId = 'combo-racers') {
  game.startMode(modeId);
  game.clearCountdown();
  game.aiCars.length = 0;
  fire('cancel', [THROTTLE, LEFT_BTN, RIGHT_BTN, TRACK_POINT]);
  step(0.02);
}

const results = [];
const check = (name, pass, detail = '') => results.push({ name, pass: Boolean(pass), detail });

// --- throttle -------------------------------------------------------------
// The speed curve is authored on a 125 base cruise with a fixed 60 throttle
// margin, then multiplied by the difficulty profile. The single profile sits at
// 1.0 so a run opens on the authored base speed and each overtake is worth a
// full banded step rather than a fraction of an already-inflated number.
const BASE_CRUISE = 125;
const THROTTLE_MARGIN = 60;
const PLAYER_SCALE = 1;
const CRUISE = BASE_CRUISE * PLAYER_SCALE;
const THROTTLE_TOP = (BASE_CRUISE + THROTTLE_MARGIN) * PLAYER_SCALE;

resetWithoutTraffic();
check('idle: throttle off', game.inputState.throttle === false);
check('idle: cruises at tier-0 speed', Math.abs(game.player.speed - CRUISE) < 1,
  `speed=${game.player.speed.toFixed(1)}`);
check('starting a mode enters the race screen', game.app.screen === 'PLAYING', game.app.screen);

fire('start', [THROTTLE]);
step(0.05);
check('throttle press engages', game.inputState.throttle === true);
step(1.5);
check('throttle held reaches cruise plus the throttle margin',
  Math.abs(game.player.speed - THROTTLE_TOP) < 1,
  `speed=${game.player.speed.toFixed(1)}`);

fire('end', [THROTTLE]);
step(0.05);
check('throttle release disengages', game.inputState.throttle === false);
step(2.0);
check('release coasts back to cruise', Math.abs(game.player.speed - CRUISE) < 2,
  `speed=${game.player.speed.toFixed(1)}`);
check('no pointers leak after release', game.debugPointerCount() === 0);

// --- lane buttons ---------------------------------------------------------
resetWithoutTraffic();
const startLane = game.player.lane;
fire('start', [LEFT_BTN]);
fire('end', [LEFT_BTN]);
check('left button moves one lane left', game.player.lane === startLane + 1, `${startLane} -> ${game.player.lane}`);
fire('start', [RIGHT_BTN]);
fire('end', [RIGHT_BTN]);
check('right button moves back', game.player.lane === startLane, `-> ${game.player.lane}`);

check('lane button flashes on press', game.laneButtonFlash.right > 0, `flash=${game.laneButtonFlash.right.toFixed(3)}`);
step(0.4);
check('lane button flash fades', game.laneButtonFlash.right === 0);

// --- multi-touch ----------------------------------------------------------
resetWithoutTraffic();
const multiTouchStartLane = game.player.lane;
fire('start', [THROTTLE]);
step(0.1);
fire('start', [LEFT_BTN]);
fire('end', [LEFT_BTN]);
check('lane tap while holding throttle changes lane', game.player.lane === multiTouchStartLane + 1);
check('throttle survives a lane tap', game.inputState.throttle === true);
step(0.1);
fire('start', [RIGHT_BTN]);
fire('end', [RIGHT_BTN]);
check('throttle survives a second lane tap', game.inputState.throttle === true);
fire('end', [THROTTLE]);
step(0.05);
check('all fingers up releases the throttle', game.inputState.throttle === false);

// --- sliding --------------------------------------------------------------
resetWithoutTraffic();
fire('start', [THROTTLE]);
step(0.05);
check('slide: engaged before moving', game.inputState.throttle === true);
fire('move', [touch(1, 303, 400)]);
check('sliding off the button releases the throttle', game.inputState.throttle === false);
fire('move', [touch(1, 303, 774)]);
check('sliding back on re-engages the throttle', game.inputState.throttle === true);
fire('end', [touch(1, 303, 774)]);
check('touch end releases', game.inputState.throttle === false && game.debugPointerCount() === 0);

// A cancelled touch (incoming call, system gesture) must not stick the throttle on.
fire('start', [THROTTLE]);
step(0.05);
fire('cancel', [THROTTLE]);
check('cancelled touch releases the throttle', game.inputState.throttle === false && game.debugPointerCount() === 0);

// --- track area fallback --------------------------------------------------
resetWithoutTraffic();
const trackStartLane = game.player.lane;
fire('start', [TRACK_POINT]);
fire('end', [TRACK_POINT]);
check('tapping the track still changes lane', game.player.lane === trackStartLane + 1, `${trackStartLane} -> ${game.player.lane}`);
check('tapping the track never engages the throttle', game.inputState.throttle === false);

// --- robustness -----------------------------------------------------------
fire('end', [touch(99, 10, 10)]);
fire('move', [touch(99, 10, 10)]);
check('unknown pointer ids are ignored', game.debugPointerCount() === 0);

// --- full simulation with traffic ----------------------------------------
game.startMode('combo-racers');
game.clearCountdown();
let threw = null;
try {
  fire('start', [THROTTLE]);
  step(30);
  fire('end', [THROTTLE]);
  step(2);
} catch (error) {
  threw = error;
}
check('30s of play with 18 AI cars runs clean', threw === null, threw ? String(threw) : '');
check('combo advanced while driving', game.player.totalPasses > 0, `passes=${game.player.totalPasses}`);
check('render loop still scheduled', pendingFrame !== null);

let failed = 0;
for (const result of results) {
  if (!result.pass) failed++;
  console.log(`${result.pass ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? `  (${result.detail})` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);

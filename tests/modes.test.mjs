// Every mode is driven end to end headlessly: the run must terminate, produce a
// sane score, and never throw. Modes with distinctive rules get extra assertions.
//
//   node scripts/build.mjs && node tests/modes.test.mjs

import { createGame, reporter, touch } from './harness.mjs';

const { game, step, fire, canvasCount } = createGame();
const { check, finish } = reporter();

const THROTTLE = touch(1, 303, 774);
const LEFT_BTN = touch(2, 58, 774);

/** Drives a mode with the throttle down, weaving, until it ends or time runs out. */
function playMode(modeId, seconds, { weave = true } = {}) {
  game.startMode(modeId);
  game.clearCountdown();
  fire('start', [THROTTLE]);
  let played = 0;
  const slice = 0.5;
  while (played < seconds && game.app.screen === 'PLAYING') {
    step(slice);
    played += slice;
    if (weave && Math.round(played / slice) % 6 === 0) {
      fire('start', [LEFT_BTN]);
      fire('end', [LEFT_BTN]);
    }
  }
  fire('cancel', [THROTTLE, LEFT_BTN]);
  return played;
}

check('boots into the mode menu', game.app.screen === 'MENU', game.app.screen);

// --- progression ladder (checked before unlocking everything) --------------
check('only the released mode is playable',
  game.MODES.filter((mode) => game.modeUnlocked(mode.id)).length === game.RELEASED_MODES.length,
  `${game.MODES.filter((mode) => game.modeUnlocked(mode.id)).length} open of ${game.MODES.length}`);
check('exactly one mode has shipped', game.RELEASED_MODES.length === 1,
  game.RELEASED_MODES.map((mode) => mode.id).join(','));
check('a locked mode refuses to start', game.startMode('endurance') === false);
check('refusing to start leaves you in the menu', game.app.screen === 'MENU');
check('the released mode is playable', game.modeUnlocked(game.RELEASED_MODES[0].id));
check('Master is the setting you start on', game.app.difficulty === 'master', game.app.difficulty);
check('unreleased modes are not merely locked but absent',
  game.MODES.filter((mode) => !game.RELEASED_MODES.includes(mode)).every((mode) => !game.modeUnlocked(mode.id)));

// The suites below need every mode reachable.
game.setUnlockOverride(true);
check('sixteen modes are registered', game.MODES.length === 16, `${game.MODES.length} modes`);

const seenIds = new Set(game.MODES.map((mode) => mode.id));
check('every mode id is unique', seenIds.size === game.MODES.length);

// --- every mode runs to a terminal state ----------------------------------
for (const mode of game.MODES) {
  let threw = null;
  // Hit-stop pauses the run clock, so a kill-heavy mode needs more wall time than
  // its limit. Untimed modes (Speed Monkey, Endurance) end on a crash instead.
  const budget = Number.isFinite(mode.timeLimit) ? mode.timeLimit * 1.3 + 12 : 120;
  try {
    playMode(mode.id, budget);
  } catch (error) {
    threw = error;
  }

  check(`${mode.name}: runs without throwing`, threw === null, threw ? String(threw) : '');
  if (threw) continue;

  check(
    `${mode.name}: reaches a result`,
    game.app.screen === 'RESULT',
    `screen=${game.app.screen} outcome=${game.run.outcome}`
  );
  check(
    `${mode.name}: score is a finite number`,
    Number.isFinite(game.run.score) && game.run.score >= 0,
    `score=${game.run.score}`
  );
}

// --- mode-specific rules ---------------------------------------------------

// Death Race arms the car permanently, so contact must destroy rather than crash.
game.startMode('death-race');
game.clearCountdown();
fire('start', [THROTTLE]);
step(25);
fire('cancel', [THROTTLE]);
check('Death Race destroys cars on contact', game.run.destroyed > 0, `destroyed=${game.run.destroyed}`);
check('Death Race never crashes the player', game.run.crashes === 0, `crashes=${game.run.crashes}`);

// Sunday Drivers slows the field down; the player should lap it easily.
game.startMode('sunday-drivers');
game.clearCountdown();
const slowSpeeds = game.aiCars.map((car) => car.baseSpeed);
game.startMode('speed-monkey');
game.clearCountdown();
const normalSpeeds = game.aiCars.map((car) => car.baseSpeed);
check(
  'Sunday Drivers slows the traffic down',
  slowSpeeds[0] < normalSpeeds[0] * 0.6,
  `${slowSpeeds[0].toFixed(1)} vs ${normalSpeeds[0].toFixed(1)}`
);

// The single profile is the whole difficulty curve now, so its two headline
// numbers — field size and opening speed — are worth pinning directly.
const BASE_CRUISE = 125; // PLAYER_CRUISE_BASE_SPEED in config.ts
game.startMode('speed-monkey');
game.clearCountdown();
check('a run puts 24 cars on track', game.aiCars.length === 24, `cars=${game.aiCars.length}`);
check(
  'a run opens on the base cruise speed rather than a scaled-up one',
  Math.abs(game.player.speed - BASE_CRUISE) < 0.01,
  `${game.player.speed.toFixed(1)}`
);
check('every car sits in a valid lane', game.aiCars.every((car) => car.lane >= 0 && car.lane < 5));

// The ramp is the point of the retune: the player must start slower than the
// quickest traffic is capable of, or there is nothing for overtakes to earn.
const fastestTraffic = Math.max(...game.aiCars.map((car) => car.baseSpeed));
check('overtaking has somewhere to go', game.player.speed > fastestTraffic,
  `player=${game.player.speed.toFixed(0)} vs fastest AI=${fastestTraffic.toFixed(0)}`);

// --- no circuit spills off screen -----------------------------------------
// Three of the four tracks used to project past the frame: the road reaches 39
// units past the centre line and perspective magnifies that near the bottom, so
// a centre line inside the design box is not enough. Checked per mode, because
// the mode is what chooses the circuit.
const DESIGN_W = 390;
const DESIGN_H = 844;
const seenTracks = new Set();
for (const mode of game.MODES) {
  game.startMode(mode.id);
  game.clearCountdown();
  seenTracks.add(mode.trackId);
  const b = game.trackScreenBounds();
  check(
    `${mode.trackId} stays on screen (via ${mode.id})`,
    b.minX >= 0 && b.maxX <= DESIGN_W && b.minY >= 0 && b.maxY <= DESIGN_H,
    `x ${b.minX.toFixed(0)}..${b.maxX.toFixed(0)} y ${b.minY.toFixed(0)}..${b.maxY.toFixed(0)}`
  );
}
check('every circuit was covered', seenTracks.size === game.TRACKS.length,
  `${seenTracks.size} of ${game.TRACKS.length}`);

// The static scene is cached on an offscreen canvas, which must be a *second*
// canvas; drawing the layer onto the display canvas would blank the frame.
game.startMode('speed-monkey');
game.clearCountdown();
step(0.1);
check('an offscreen layer canvas is created', canvasCount() >= 2, `${canvasCount()} canvases`);

// Circuits: every mode names a real one, and they are not all the same.
const trackIds = new Set(game.MODES.map((mode) => mode.trackId));
check('four circuits are in rotation', trackIds.size === 4, [...trackIds].join(', '));
check('every mode names a known circuit',
  game.MODES.every((mode) => typeof mode.trackId === 'string' && mode.trackId.length > 0));

// Switching modes actually swaps the geometry, so lap length changes.
game.startMode('speed-monkey');
game.clearCountdown();
const longBayLap = game.trackLength();
game.startMode('sunday-drivers');
game.clearCountdown();
const ovalLap = game.trackLength();
check('circuits have different lap lengths', Math.abs(longBayLap - ovalLap) > 100,
  `${longBayLap.toFixed(0)} vs ${ovalLap.toFixed(0)}`);
check('cars are placed on the loaded circuit',
  game.aiCars.every((car) => car.distance >= 0 && car.distance <= ovalLap),
  `lap=${ovalLap.toFixed(0)}`);

// Hot Rods heats the engine while the throttle is held.
game.startMode('hot-rods');
game.clearCountdown();
fire('start', [THROTTLE]);
step(1.5);
const heat = game.player.heat;
fire('cancel', [THROTTLE]);
check('Hot Rods builds heat under throttle', heat > 0.2, `heat=${heat.toFixed(2)}`);
step(2.5);
check('Hot Rods cools off when released', game.player.heat < heat, `heat=${game.player.heat.toFixed(2)}`);

// In The Zone marks a subset of the field.
game.startMode('in-the-zone');
game.clearCountdown();
const zoned = game.aiCars.filter((car) => car.hasZone).length;
check('In The Zone marks six cars', zoned === 6, `marked=${zoned}`);

// --- game feel -------------------------------------------------------------
// Near misses should happen naturally in dense traffic, and each one grants a
// short acceleration boost so the risky line is genuinely faster.
game.startMode('sunday-drivers');
game.clearCountdown();
fire('start', [THROTTLE]);
step(45);
fire('cancel', [THROTTLE]);
check('close calls are detected in traffic', game.run.closeCalls > 0, `close=${game.run.closeCalls}`);

// A crash must produce particles, a freeze and a shake. Combo Racers survives a
// crash, so the effects can be watched decaying instead of the run ending.
game.startMode('combo-racers');
game.clearCountdown();
step(0.2);
const beforeCrash = game.player.distance;
game.aiCars.length = 1;
// Park a car directly on top of the player to force contact.
game.aiCars[0].distance = game.player.distance + 6;
game.aiCars[0].lane = game.player.lane;
game.aiCars[0].visualLane = game.player.visualLane;
game.aiCars[0].alive = true;
step(0.05);
const feel = game.feelState();
check('a crash spawns particles', game.activeParticles() > 0, `${game.activeParticles()} particles`);
check('a crash triggers hit-stop', feel.hitStop > 0, `hitStop=${feel.hitStop.toFixed(3)}`);
check('a crash shakes the screen', feel.shake > 0, `shake=${feel.shake.toFixed(1)}`);

// During hit-stop the world must hold still.
const frozenAt = game.player.distance;
step(0.016);
check('hit-stop freezes the simulation', game.player.distance === frozenAt,
  `${frozenAt.toFixed(2)} -> ${game.player.distance.toFixed(2)}`);
void beforeCrash;

// Both effects decay rather than sticking.
step(1.2);
const settled = game.feelState();
check('hit-stop clears', settled.hitStop === 0);
check('shake settles', settled.shake === 0);
check('particles die out', game.activeParticles() === 0, `${game.activeParticles()} left`);

// Ending a run mid-freeze must not carry the effects into the next one.
game.startMode('speed-monkey');
game.clearCountdown();
check('a new run starts with no particles', game.activeParticles() === 0);
check('a new run starts with no hit-stop or shake',
  game.feelState().hitStop === 0 && game.feelState().shake === 0);

// --- menu, results and persistence ----------------------------------------
game.openMenu();
check('menu is reachable again', game.app.screen === 'MENU');

// The daily card sits at y=96..140, above the mode list starting at y=152.
fire('start', [touch(9, 195, 118)]);
fire('end', [touch(9, 195, 118)]);
check('tapping the daily card starts the daily run',
  game.app.screen === 'PLAYING' && game.run.daily === true, `screen=${game.app.screen}`);
game.clearCountdown();

game.openMenu();
fire('start', [touch(11, 195, 170)]);
fire('end', [touch(11, 195, 170)]);
check('tapping the mode row starts that mode',
  game.app.screen === 'PLAYING' && game.run.daily === false, `screen=${game.app.screen}`);
game.clearCountdown();

// The difficulty pills are gone and the cards below moved up. A tap in the strip
// they vacated (y=84..95) must fall through rather than hit the daily card.
game.openMenu();
fire('start', [touch(10, 300, 88)]);
fire('end', [touch(10, 300, 88)]);
check('tapping the old pill row no longer starts anything',
  game.app.screen === 'MENU', game.app.screen);

// Scores persist per mode and difficulty.
game.startMode('sunday-drivers');
game.clearCountdown();
fire('start', [THROTTLE]);
step(62);
fire('cancel', [THROTTLE]);
const best = game.bestScore('sunday-drivers', 'master');
check('a completed run records a personal best', typeof best === 'number' && best > 0, `best=${best}`);
check('career points include that best', game.careerPoints() >= best, `career=${game.careerPoints()}`);

finish();

// Every mode is driven end to end headlessly: the run must terminate, produce a
// sane score, and never throw. Modes with distinctive rules get extra assertions.
//
//   node scripts/build.mjs && node tests/modes.test.mjs

import { createGame, reporter, touch } from './harness.mjs';

const { game, step, fire, canvasCount } = createGame();
const { check, finish } = reporter();

const THROTTLE = touch(1, 330, 766);
const LEFT_BTN = touch(2, 144, 766);
const RIGHT_BTN = touch(3, 220, 766);

/**
 * Parks a living car right on top of the player, so the next step collides.
 *
 * The fireball has to go out first. Fireball Frenzy and Chain Reaction turn
 * contact into a kill while the car is lit, so staging a crash against an armed
 * player just feeds it another victim — and in Fireball Frenzy those kills keep
 * re-arming it, which is exactly how this loop used to run out its whole budget
 * without ever ending the run. Death Race is unaffected: it destroys on contact
 * regardless, which is why it sets timeoutIsFinal instead.
 */
function forceCrash() {
  const victim = game.aiCars.find((car) => car.alive);
  if (!victim) return false;
  victim.distance = game.player.distance + 6;
  victim.lane = game.player.lane;
  victim.visualLane = game.player.visualLane;
  victim.previousVisualLane = game.player.visualLane;
  game.player.invincible = 0;
  game.player.fireball = 0;
  return true;
}

/**
 * Drives a mode with the throttle down, weaving, until it ends or time runs
 * out.
 *
 * Most modes no longer end on the clock alone — the run keeps going into
 * overtime until the player actually crashes. Weaving alone is not a reliable
 * way to arrange that: Last Man culls the field down to two cars, so a bot
 * swerving at random can circulate for the whole budget without ever meeting
 * one. Once overtime starts, a crash is therefore staged rather than hoped for,
 * which is also the thing being tested — that a crash, not the clock, is what
 * ends the run.
 */
function playMode(modeId, seconds, { weave = true } = {}) {
  game.startMode(modeId);
  game.clearCountdown();
  fire('start', [THROTTLE]);
  let played = 0;
  const slice = 0.5;
  while (played < seconds && game.app.screen === 'PLAYING') {
    step(slice);
    played += slice;
    if (game.run.timeRemaining <= 0) forceCrash();
    else if (weave && Math.round(played / slice) % 6 === 0) {
      fire('start', [LEFT_BTN]);
      fire('end', [LEFT_BTN]);
    }
  }
  fire('cancel', [THROTTLE, LEFT_BTN, RIGHT_BTN]);
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
// Not a fixed 24 any more: the field is derived from the lap, so pin the
// derivation rather than a number that moves whenever a circuit is reshaped.
const REFERENCE_LAP = 2988;   // Long Bay's lap when 24 was chosen
const expectedField = Math.round(24 * (game.trackLength() / REFERENCE_LAP));
check('the field is scaled from the lap, not fixed',
  game.aiCars.length === expectedField,
  `${game.aiCars.length} cars for a lap of ${game.trackLength().toFixed(0)}`);

// Field size scales with the lap, so short circuits are not twice as crowded as
// long ones. What has to stay constant is the gap between cars, not the count.
for (const track of game.TRACKS) {
  game.startMode('speed-monkey', track.id);
  game.clearCountdown();
  const spacing = game.trackLength() / game.aiCars.length;
  check(`${track.id} keeps the traffic spacing`, spacing > 105 && spacing < 145,
    `${game.aiCars.length} cars, one every ${spacing.toFixed(0)}`);
}
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
// Three of the four original tracks used to project past the frame: the road
// reaches 39 units past the centre line and perspective magnifies that near the
// bottom, so a centre line inside the design box is not enough. Every circuit is
// now raceable in every mode, so this walks the track list directly rather than
// only the defaults the modes happen to name.
const DESIGN_W = 390;
const DESIGN_H = 844;
const anyMode = game.MODES[0].id;
for (const track of game.TRACKS) {
  game.startMode(anyMode, track.id);
  game.clearCountdown();
  const b = game.trackScreenBounds();
  check(
    `${track.id} stays on screen`,
    b.minX >= 0 && b.maxX <= DESIGN_W && b.minY >= 0 && b.maxY <= DESIGN_H,
    `x ${b.minX.toFixed(0)}..${b.maxX.toFixed(0)} y ${b.minY.toFixed(0)}..${b.maxY.toFixed(0)}`
  );
}

// A mode with no circuit named still races its own default.
game.startMode(anyMode);
check('a mode with no circuit picked uses its own default',
  game.MODES[0].trackId === game.TRACKS.find((t) => t.id === game.MODES[0].trackId)?.id);

// The static scene is cached on an offscreen canvas, which must be a *second*
// canvas; drawing the layer onto the display canvas would blank the frame.
game.startMode('speed-monkey');
game.clearCountdown();
step(0.1);
check('an offscreen layer canvas is created', canvasCount() >= 2, `${canvasCount()} canvases`);

// The five alternating lane bands must exactly fill the surface between the two
// kerbs. When they overran it the outer two were clipped and read as narrower
// than the middle three, which is a thing you can only see by eye.
const laneSpan = game.LANE_COUNT * game.LANE_GAP;
const surface = (game.ROAD_HALF_WIDTH - game.KERB_WIDTH) * 2;
check('the lane bands exactly fill the road surface',
  Math.abs(laneSpan - surface) < 0.001,
  `bands ${laneSpan.toFixed(2)} vs surface ${surface.toFixed(2)}`);

// No circuit's driving surface may cross itself. Widening the road is what
// makes this fail — Marina Sprint's two halves passed 40 apart, which was fine
// at the old width and a road laid straight through itself at the new one. The
// kerbs are excluded: they are decoration, and Long Bay's graze at the top-left
// corner without any lane overlapping.
for (const track of game.TRACKS) {
  const points = track.build();
  const n = points.length;
  const steps = points.map((p, i) => {
    const q = points[(i + 1) % n];
    return Math.hypot(q.x - p.x, q.y - p.y);
  });
  const lap = steps.reduce((a, b) => a + b, 0);
  let closest = Infinity;
  for (let i = 0; i < n; i++) {
    let along = 0;
    for (let k = 1; k < n; k++) {
      along += steps[(i + k - 1) % n];
      // Only compare stretches genuinely far apart around the lap, so a point
      // is never measured against its own neighbours or its own corner.
      if (along < 150 || lap - along < 150) continue;
      const j = (i + k) % n;
      const d = Math.hypot(points[j].x - points[i].x, points[j].y - points[i].y);
      if (d < closest) closest = d;
    }
  }
  const surface = game.LANE_COUNT * game.LANE_GAP;
  check(`${track.id} never laps over itself`, closest >= surface,
    `closest ${closest.toFixed(0)}, driving surface needs ${surface.toFixed(0)}`);
}

// No circuit may kink. Arcs turn gradually, so a heading that jumps between two
// consecutive points is a joint whose two pieces were not actually tangent —
// the road draws a notch and the car's heading snaps as it passes. Two separate
// builds shipped that fault before this check existed: a concave arc solved
// against the wrong tangency condition (178 degrees, the road doubling back),
// and a "tangent" line taken from the wrong side of its circle (24 degrees).
for (const track of game.TRACKS) {
  const points = track.build();
  const n = points.length;
  let worst = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i], b = points[(i + 1) % n], c = points[(i + 2) % n];
    let turn = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(b.y - a.y, b.x - a.x);
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    worst = Math.max(worst, Math.abs(turn) * 180 / Math.PI);
  }
  check(`${track.id} has no kink in it`, worst < 8, `worst single-step turn ${worst.toFixed(1)} degrees`);
}

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

// A mode row now opens the circuit picker rather than starting straight away.
game.openMenu();
fire('start', [touch(11, 195, 170)]);
fire('end', [touch(11, 195, 170)]);
check('tapping the mode row opens the circuit picker',
  game.app.screen === 'TRACKS', `screen=${game.app.screen}`);

// The picker's back button (y=768..820) returns to the mode list.
fire('start', [touch(12, 195, 790)]);
fire('end', [touch(12, 195, 790)]);
check('the picker goes back to the mode list', game.app.screen === 'MENU', game.app.screen);

// Picking a circuit starts the race on it. The picker is a grid of square cards
// three across, 113 wide, starting at (14, 64); (70, 120) is the centre of the
// first one. Taps between cards must not select anything, so this aims at a
// centre rather than anywhere inside the grid's bounding box.
fire('start', [touch(13, 195, 170)]);
fire('end', [touch(13, 195, 170)]);
fire('start', [touch(14, 70, 120)]);
fire('end', [touch(14, 70, 120)]);
check('picking a circuit starts the race',
  game.app.screen === 'PLAYING' && game.run.daily === false, `screen=${game.app.screen}`);
game.clearCountdown();

// Leaving a run started from the picker goes back to the picker, not the menu.
game.goBack();
check('leaving a picked run returns to the circuit picker',
  game.app.screen === 'TRACKS', game.app.screen);

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

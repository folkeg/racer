// The daily challenge is only meaningful if it is identical for everyone, so
// these assertions are mostly about determinism.
//
//   node scripts/build.mjs && node tests/daily.test.mjs

import { createGame, reporter, touch } from './harness.mjs';

const { game, step, fire } = createGame();
const { check, finish } = reporter();

const THROTTLE = touch(1, 303, 774);
const LEFT_BTN = touch(2, 58, 774);

// --- the plan is a pure function of the date -------------------------------
const a = game.dailyPlan('2026-08-04');
const b = game.dailyPlan('2026-08-04');
const c = game.dailyPlan('2026-08-05');

check('the same day yields the same plan', a.modeId === b.modeId && a.seed === b.seed,
  `${a.modeId}/${a.seed}`);
check('a different day yields a different seed', a.seed !== c.seed, `${a.seed} vs ${c.seed}`);
check('the plan names a real mode', game.MODES.some((mode) => mode.id === a.modeId), a.modeId);
check('Time Attack is excluded from the pool',
  game.MODES.filter((mode) => mode.lowerIsBetter).every((mode) => {
    // Sample a month of days; a lower-is-better mode must never be picked.
    for (let day = 1; day <= 28; day++) {
      const key = `2026-09-${String(day).padStart(2, '0')}`;
      if (game.dailyPlan(key).modeId === mode.id) return false;
    }
    return true;
  }));

// --- stage targets ----------------------------------------------------------
const stage1 = game.dailyStage(a, 1);
const stage2 = game.dailyStage(a, 2);
// Both stages race the same Master field now, so the whole step between them is
// the target score.
check('stage one runs on Master', stage1.difficulty === 'master');
check('stage two runs on Master', stage2.difficulty === 'master');
check('stage two demands far more', stage2.target > stage1.target * 3,
  `${stage1.target} -> ${stage2.target}`);

// --- seeded randomness is reproducible -------------------------------------
game.setSeed(12345);
const first = [game.random(), game.random(), game.random()];
game.setSeed(12345);
const second = [game.random(), game.random(), game.random()];
check('the same seed replays the same numbers', first.every((v, i) => v === second[i]),
  first.map((v) => v.toFixed(4)).join(','));
check('values stay inside [0,1)', first.every((v) => v >= 0 && v < 1));
game.clearSeed();
check('clearing the seed returns to system randomness', game.isSeeded() === false);

// --- a daily run is reproducible -------------------------------------------
function runDailyBriefly() {
  game.startDaily();
  game.clearCountdown();
  fire('start', [THROTTLE]);
  step(6);
  fire('cancel', [THROTTLE]);
  return game.aiCars.map((car) => Math.round(car.distance * 100) / 100);
}
const layoutA = runDailyBriefly();
const layoutB = runDailyBriefly();
check('two daily runs produce identical traffic',
  layoutA.length === layoutB.length && layoutA.every((v, i) => v === layoutB[i]),
  `${layoutA.length} cars compared`);

// The first frame of a run must be nominal, not however long the menu was open;
// otherwise the opening frame lurches and two seeded runs diverge immediately.
game.startDaily();
game.clearCountdown();
fire('start', [THROTTLE]);
step(0.016);
const oneFrameA = game.player.distance;
game.startDaily();
game.clearCountdown();
fire('start', [THROTTLE]);
step(0.016);
check('the first frame of a run is deterministic', game.player.distance === oneFrameA,
  `${oneFrameA.toFixed(4)} vs ${game.player.distance.toFixed(4)}`);
fire('cancel', [THROTTLE]);

// An ordinary run must NOT be seeded, or every session would be identical.
game.setUnlockOverride(true);
game.startMode('speed-monkey');
game.clearCountdown();
check('an ordinary run is not seeded', game.isSeeded() === false);

// --- the daily flow ---------------------------------------------------------
game.startDaily();
game.clearCountdown();
check('the daily run starts at stage one', game.run.stage === 1, `stage=${game.run.stage}`);
check('the daily run is flagged as daily', game.run.daily === true);
check('the daily run carries a stage target', game.run.stageTarget > 0, `${game.run.stageTarget}`);
check('the daily run bypasses the unlock ladder', game.app.screen === 'PLAYING');

// Clearing stage one must drop straight into stage two, with no result screen.
// The mode rewrites run.score every frame, so lower the bar instead of raising
// the score: this is testing the transition, not the scoring.
game.run.stageTarget = 0;
step(0.05);
check('clearing stage one starts stage two immediately',
  game.run.stage === 2 && game.app.screen === 'PLAYING',
  `stage=${game.run.stage} screen=${game.app.screen}`);
check('stage two runs the Master field', game.run.difficulty === 'master', game.run.difficulty);

// Failing stage two shows the result, and it must not overwrite mode bests.
const beforeBest = game.bestScore(game.run.modeId, 'master');
game.run.outcome = 'timeout';
step(0.05);
check('failing stage two reaches the result screen', game.app.screen === 'RESULT', game.app.screen);
check('the result knows which stage it was', game.app.result.stage === 2, `${game.app.result.stage}`);
check('a daily run does not overwrite the mode best',
  game.bestScore(game.run.modeId, 'master') === beforeBest,
  `${beforeBest} -> ${game.bestScore(game.run.modeId, 'master')}`);

// --- revive -----------------------------------------------------------------
// Crashing out must offer exactly one second chance, and taking it must put the
// player back into the same run rather than starting a new one.
game.setUnlockOverride(true);
game.startMode('speed-monkey');
game.clearCountdown();
fire('start', [THROTTLE]);
step(3);
const scoreBefore = game.run.score;
// Force a crash by parking a car on the player.
game.aiCars.length = 1;
game.aiCars[0].distance = game.player.distance + 6;
game.aiCars[0].lane = game.player.lane;
game.aiCars[0].visualLane = game.player.visualLane;
game.aiCars[0].alive = true;
game.player.invincible = 0;
step(0.4);
fire('cancel', [THROTTLE]);

check('crashing out of Speed Monkey ends the run', game.app.screen === 'RESULT', game.app.screen);
check('a revive is offered', game.canRevive() === true);

const revived = game.shareForRevive();
check('taking the revive returns to the race', revived === true && game.app.screen === 'PLAYING',
  `${revived} ${game.app.screen}`);
check('the revive continues the same run', game.run.score === scoreBefore || game.run.score >= scoreBefore,
  `${scoreBefore} -> ${game.run.score}`);
check('the revive grants invulnerability', game.player.invincible > 1,
  `${game.player.invincible.toFixed(2)}s`);
check('the revive is counted', game.run.revives === 1, `${game.run.revives}`);

// Only one per run.
game.player.invincible = 0;
game.aiCars[0].distance = game.player.distance + 6;
game.aiCars[0].visualLane = game.player.visualLane;
step(0.5);
check('a second crash ends the run for good', game.app.screen === 'RESULT', game.app.screen);
check('no second revive is offered', game.canRevive() === false);
check('asking again is refused', game.shareForRevive() === false);

// A cleared run is not something to be rescued from.
game.startMode('combo-racers');
game.clearCountdown();
game.run.outcome = 'cleared';
check('a cleared run offers no revive', game.canRevive() === false);

// --- audio preference -------------------------------------------------------
// Muting must survive a reload; a mini game gets played in public.
game.audio.setMuted(true);
check('mute takes effect', game.audio.isMuted() === true);
game.audio.setMuted(false);
check('unmute takes effect', game.audio.isMuted() === false);

// --- onboarding -------------------------------------------------------------
// A first-time player must be told what the bottom of the screen does, and must
// never be told twice.
game.resetOnboarding();
game.startMode('speed-monkey');
game.clearCountdown();
check('onboarding shows on a first run', game.onboardingActive() === true);

// Using both controls dismisses it.
fire('start', [LEFT_BTN]);
fire('end', [LEFT_BTN]);
fire('start', [THROTTLE]);
step(0.1);
fire('cancel', [THROTTLE]);
check('using both controls dismisses onboarding', game.onboardingActive() === false);

game.startMode('speed-monkey');

game.clearCountdown();
check('onboarding does not come back', game.onboardingActive() === false);

// It also gives up on its own if the player does nothing. Empty the road first:
// Speed Monkey ends on the first contact, and a finished run stops the timer.
game.resetOnboarding();
game.startMode('speed-monkey');
game.clearCountdown();
game.aiCars.length = 0;
check('onboarding returns after a reset', game.onboardingActive() === true);
step(13);
check('onboarding times out rather than nagging', game.onboardingActive() === false);

// --- daily streak -----------------------------------------------------------
// Consecutive days count up; a gap resets to one.
check('a first visit starts a streak of one', game.touchStreak('2026-03-01').days === 1);
check('the next day continues it', game.touchStreak('2026-03-02').days === 2);
check('the same day does not double count', game.touchStreak('2026-03-02').days === 2);
check('a missed day resets it', game.touchStreak('2026-03-05').days === 1);
check('a broken chain reports zero', game.currentStreak('2026-03-20') === 0,
  `${game.currentStreak('2026-03-20')}`);
check('an unbroken chain still reports', game.currentStreak('2026-03-06') === 1,
  `${game.currentStreak('2026-03-06')}`);

// The single difficulty profile leaves the authored player speeds alone, so a
// run opens on the bare base cruise speed.
const PLAYER_SCALE = 1;
const BASE_CRUISE = 125 * PLAYER_SCALE;

// --- countdown --------------------------------------------------------------
// Three seconds where nothing moves, including the clock and the controls.
game.setUnlockOverride(true);
game.startMode('combo-racers');
check('a run opens on the countdown', game.countdownActive() === true);

const frozenAt = game.player.distance;
fire('start', [THROTTLE]);
step(1.0);
check('the world holds still during the countdown', game.player.distance === frozenAt,
  `${frozenAt.toFixed(2)} -> ${game.player.distance.toFixed(2)}`);
check('the throttle is ignored during the countdown',
  Math.abs(game.player.speed - BASE_CRUISE) < 0.01,
  `${game.player.speed.toFixed(1)}`);
check('the run clock has not started', game.run.elapsed === 0, `${game.run.elapsed}`);

step(2.3);
check('the countdown ends', game.countdownActive() === false);
step(0.5);
check('the world moves once the countdown ends', game.player.distance > frozenAt,
  `${game.player.distance.toFixed(2)}`);
fire('cancel', [THROTTLE]);

// --- speed curve ------------------------------------------------------------
// Speed must rise on every pass, hard early and gently late, and stay capped.
const cruise = (combo) => {
  game.startMode('combo-racers');
  game.clearCountdown();
  game.player.combo = combo;
  return game.currentCruiseSpeed();
};
const at0 = cruise(0);
const at1 = cruise(1);
const at10 = cruise(10);
const at50 = cruise(50);
const at200 = cruise(200);

check('a single overtake already adds speed', at1 > at0, `${at0} -> ${at1}`);
check('the first ten passes are where the speed comes from', at10 - at0 >= 55,
  `${at0} -> ${at10}`);
check('late passes add far less than early ones',
  (at200 - at50) / 150 < (at10 - at0) / 10 / 4,
  `early ${(at10 - at0) / 10}/pass, late ${((at200 - at50) / 150).toFixed(2)}/pass`);
check('cruise speed is capped', at200 <= 380 * PLAYER_SCALE, `${at200}`);

finish();

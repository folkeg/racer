/** Run lifecycle: starting a mode, ticking its rules, deciding when it ends. */

import { applyTuning, DEFAULT_DIFFICULTY } from './difficulty';
import { resetEffects } from './effects';
import { MODES, modeById } from './modes';
import { clearSeed, setSeed } from './rng';
import type { Difficulty, ModeDefinition, ModeId, RunState } from './modes/types';
import { resetClock } from './clock';
import { beginCountdown } from './countdown';
import { beginOnboarding } from './onboarding';
import { touchStreak } from './streak';
import { clearFloaters, clearParticles } from './render/particles';
import { resetFeel } from './feel';
import { resetLivingWater } from './render/livingWater';
import { aiCars, player, resetGame } from './state';
import { setTrack } from './track';
import type { TrackId } from './tracks';

export const run: RunState = {
  modeId: MODES[0].id,
  difficulty: DEFAULT_DIFFICULTY,
  elapsed: 0,
  timeRemaining: Infinity,
  score: 0,
  destroyed: 0,
  crashes: 0,
  closeCalls: 0,
  daily: false,
  revives: 0,
  outcome: 'running',
  progress: -1,
  banner: '',
  bannerTimer: 0
};

export let activeMode: ModeDefinition = MODES[0];

export interface DailyRunOptions {
  seed: number;
}

export function startRun(
  modeId: ModeId,
  difficulty: Difficulty,
  daily?: DailyRunOptions,
  trackId?: TrackId
): void {
  activeMode = modeById(modeId);

  // Seed before anything that draws randomness, so the whole run is reproducible.
  if (daily) setSeed(daily.seed);
  else clearSeed();

  // Order matters: the circuit defines the lap length that car placement uses,
  // and tuning defines the speeds they are built with.
  setTrack(trackId ?? activeMode.trackId);
  applyTuning(difficulty, activeMode.trafficScale);
  resetGame();
  resetEffects();
  resetFeel();
  // Scenery phase is part of what a seeded daily run has to reproduce.
  resetLivingWater();
  clearParticles();
  clearFloaters();
  // However long the menu was open must not land on the first frame of the run.
  resetClock();
  beginCountdown();
  beginOnboarding();
  touchStreak();

  run.modeId = modeId;
  run.difficulty = difficulty;
  run.elapsed = 0;
  run.timeRemaining = activeMode.timeLimit;
  run.score = 0;
  run.destroyed = 0;
  run.crashes = 0;
  run.closeCalls = 0;
  run.daily = Boolean(daily);
  run.revives = 0;
  run.outcome = 'running';
  run.progress = -1;
  run.banner = '';
  run.bannerTimer = 0;

  activeMode.setup?.(run, aiCars);
}

export function updateRun(dt: number): void {
  if (run.outcome !== 'running') return;

  run.elapsed += dt;
  if (Number.isFinite(run.timeRemaining)) {
    run.timeRemaining = Math.max(0, run.timeRemaining - dt);
  }

  run.bannerTimer = Math.max(0, run.bannerTimer - dt);
  if (run.bannerTimer <= 0) run.banner = '';

  activeMode.update?.(dt, run, aiCars);

  // A mode's own update may already have ended the run (Speed Monkey on contact).
  if (run.outcome !== 'running') return;

  if (activeMode.cleared?.(run, aiCars)) run.outcome = 'cleared';
  if (run.outcome !== 'running') return;
  if (activeMode.failed?.(run, aiCars)) run.outcome = 'wrecked';
  else if (run.timeRemaining <= 0) {
    // The clock alone doesn't end the run — most modes treat a crash as a
    // setback, not a stop, so running the clock out mid-drive used to end
    // things arbitrarily. Overtime keeps going until the player actually
    // crashes, unless the mode has no crash to wait for.
    if (activeMode.timeoutIsFinal || player.state === 'CRASHED') run.outcome = 'timeout';
  }
}

export function runIsOver(): boolean {
  return run.outcome !== 'running';
}

/** Score is only worth recording when the player actually got going. */
export function runProducedScore(): boolean {
  return run.elapsed > 1 && (run.score > 0 || player.totalPasses > 0);
}


/** One revive per run: enough to matter, not enough to make the score meaningless. */
export const MAX_REVIVES = 1;

export function reviveAvailable(): boolean {
  if (run.revives >= MAX_REVIVES) return false;
  // Clearing the objective is not something to be rescued from.
  return run.outcome === 'wrecked' || run.outcome === 'timeout';
}

/**
 * Puts the player back on track mid-run. Timed modes also get time back, or a
 * revive on a expired clock would be worth nothing.
 */
export function revive(): void {
  if (!reviveAvailable()) return;

  run.revives += 1;
  run.outcome = 'running';
  run.banner = 'REVIVED';
  run.bannerTimer = 1.4;

  if (Number.isFinite(run.timeRemaining) && run.timeRemaining <= 0.01) {
    run.timeRemaining = REVIVE_SECONDS;
  }

  player.state = 'RECOVERING';
  player.stateElapsed = 0;
  player.speed = 0;
  // Long enough to get out of whatever killed you.
  player.invincible = 2.5;

  resetClock();
}

const REVIVE_SECONDS = 15;

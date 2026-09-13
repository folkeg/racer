/**
 * Runs the game headlessly with a bot at the controls and reports what happened.
 *
 * Every trial is reproducible: Math.random is replaced by a seeded generator
 * before the run starts, which covers both the game's own rng.ts (it falls
 * through to Math.random when unseeded) and the bot's decision noise. Same seed,
 * same run, so a balance change can be compared against the identical traffic.
 */

import { createBot } from './bot.mjs';
import { touch } from './env.mjs';

const FRAME = 1 / 60;

/** mulberry32, the same generator rng.ts uses, so the streams look alike. */
export function makeRng(seed) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Plays one run to its natural end.
 *
 * `maxSeconds` is a runaway guard, not a rule: an untimed mode that never ends
 * would otherwise spin forever. A trial that hits it is reported as 'stalled'
 * rather than folded into the results, because it means the config is broken.
 */
export function playRun(api, { modeId, persona, seed, maxSeconds = 240 }) {
  const { game, step, fire } = api;

  const systemRandom = Math.random;
  const rng = makeRng(seed);
  Math.random = rng;

  try {
    game.setUnlockOverride(true);
    game.startMode(modeId);
    game.clearCountdown();

    const bot = createBot({ game, fire, touch }, persona, makeRng(seed ^ 0x9e3779b9));
    const startDistance = game.player.distance;
    const lapLength = game.trackLength();

    let elapsedWall = 0;
    while (game.run.outcome === 'running' && elapsedWall < maxSeconds) {
      step(FRAME);
      elapsedWall += FRAME;
      bot.tick(FRAME);
    }
    bot.release();

    const stalled = game.run.outcome === 'running';
    return {
      modeId,
      persona,
      seed,
      outcome: stalled ? 'stalled' : game.run.outcome,
      score: game.run.score,
      elapsed: game.run.elapsed,
      timeRemaining: game.run.timeRemaining,
      crashes: game.player.collisionCount,
      passes: game.player.totalPasses,
      bestCombo: game.player.bestCombo,
      laps: (game.player.distance - startDistance) / lapLength
    };
  } finally {
    Math.random = systemRandom;
    // Leaving the run on screen would let the next trial's first taps land on
    // the result screen's buttons instead of the control bar.
    game.openMenu();
  }
}

/** Runs one persona over `trials` seeds and summarises the spread. */
export function playBatch(api, { modeId, persona, trials = 40, seed0 = 1, maxSeconds }) {
  const runs = [];
  for (let i = 0; i < trials; i++) {
    runs.push(playRun(api, { modeId, persona, seed: seed0 + i * 7919, maxSeconds }));
  }
  return summarise(runs);
}

const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

function quantile(values, q) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function summarise(runs) {
  const cleared = runs.filter((run) => run.outcome === 'cleared');
  const scores = runs.map((run) => run.score);
  return {
    trials: runs.length,
    clearRate: cleared.length / runs.length,
    stalled: runs.filter((run) => run.outcome === 'stalled').length,
    score: {
      mean: mean(scores),
      p25: quantile(scores, 0.25),
      median: quantile(scores, 0.5),
      p75: quantile(scores, 0.75),
      max: Math.max(...scores),
      min: Math.min(...scores)
    },
    // Only cleared runs have a meaningful margin; a failed run's margin is zero
    // by construction and would drag the average towards a false "it was close".
    marginWhenCleared: mean(cleared.map((run) => run.timeRemaining)),
    crashes: mean(runs.map((run) => run.crashes)),
    passes: mean(runs.map((run) => run.passes)),
    bestCombo: mean(runs.map((run) => run.bestCombo)),
    laps: mean(runs.map((run) => run.laps)),
    runs
  };
}

export const PERSONA_ORDER = ['novice', 'casual', 'average', 'good', 'expert', 'perfect'];

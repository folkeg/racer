import { effects } from '../effects';
import { player } from '../state';
import type { ModeDefinition } from './types';

const CYCLE = 7.0;
const DARK_SECONDS = 2.0;
const FADE = 0.45;

/**
 * Blackout (original, not from PixelJunk Racers).
 *
 * The lights go out on a fixed cycle. Traffic keeps moving, so the mode is about
 * reading the road a second ahead and committing to a lane before it goes dark.
 */
export const blackout: ModeDefinition = {
  id: 'blackout',
  name: 'BLACKOUT',
  rule: '每 7 秒熄灯 2 秒 · 靠记忆穿过车流',
  timeLimit: 60,
  scoreUnit: 'PASSES',
  trafficScale: 0.9,
  trackId: 'half-moon',
  stars: [15, 28, 43],

  setup() {
    effects.dim = 0;
  },

  update(_dt, run) {
    const phase = run.elapsed % CYCLE;
    let dim = 0;
    if (phase < DARK_SECONDS) {
      // Ease in and out so the transition reads as lights rather than a cut.
      const t = phase / DARK_SECONDS;
      const edge = Math.min(t, 1 - t) / (FADE / DARK_SECONDS);
      dim = Math.min(1, Math.max(0, edge)) * 0.94;
    }
    effects.dim = dim;

    run.score = player.totalPasses;
    run.progress = 1 - dim / 0.94;
  }
};

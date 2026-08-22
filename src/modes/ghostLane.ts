import { LANE_COUNT } from '../config';
import { effects } from '../effects';
import { beginCollision } from '../player';
import { player } from '../state';
import type { ModeDefinition } from './types';
import { random } from '../rng';

const SWITCH_SECONDS = 4.5;
const WARNING_SECONDS = 1.2;

let timer = 0;
let nextLane = 0;

/**
 * Ghost Lane (original, not from PixelJunk Racers).
 *
 * One lane goes live every few seconds, announced a beat early. Traffic still
 * behaves normally, so the mode forces lane choices under two pressures at once.
 */
export const ghostLane: ModeDefinition = {
  id: 'ghost-lane',
  name: 'GHOST LANE',
  rule: '每隔几秒一条车道带电 · 提前 1.2 秒预警',
  timeLimit: 60,
  scoreUnit: 'PASSES',
  trafficScale: 1,
  trackId: 'delta-run',
  stars: [10, 20, 33],

  setup() {
    timer = SWITCH_SECONDS;
    nextLane = Math.floor(random() * LANE_COUNT);
    effects.hazardLane = -1;
  },

  update(dt, run) {
    timer -= dt;
    if (timer <= 0) {
      effects.hazardLane = nextLane;
      // Never pick the same lane twice in a row: a static hazard stops being a decision.
      let candidate = Math.floor(random() * LANE_COUNT);
      if (candidate === nextLane) candidate = (candidate + 1) % LANE_COUNT;
      nextLane = candidate;
      timer = SWITCH_SECONDS;
    } else if (timer <= WARNING_SECONDS) {
      effects.hazardLane = nextLane;
    }

    const live = timer > WARNING_SECONDS;
    if (live && effects.hazardLane >= 0 &&
        Math.abs(player.visualLane - effects.hazardLane) < 0.45 &&
        player.state !== 'CRASHED' && player.invincible <= 0) {
      run.banner = 'ZAPPED';
      run.bannerTimer = 1.0;
      beginCollision();
    }

    run.score = player.totalPasses;
    run.progress = Math.max(0, Math.min(1, timer / SWITCH_SECONDS));
  }
};

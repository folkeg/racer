import { beginCollision } from '../player';
import { inputState, player } from '../state';
import type { ModeDefinition } from './types';

const HEAT_RISE_SECONDS = 3.2;
const HEAT_FALL_SECONDS = 2.0;

/**
 * Hot Rods: the throttle cooks the engine. Holding it is the only way to cover
 * ground, but hitting maximum heat blows the engine and costs a crash, so the
 * mode is about rationing rather than reflexes.
 */
export const hotRods: ModeDefinition = {
  id: 'hot-rods',
  name: 'HOT RODS',
  rule: '油门会过热 · 限时 60 秒跑出最远距离',
  timeLimit: 60,
  scoreUnit: 'METRES',
  trafficScale: 1,
  trackId: 'delta-run',
  stars: [4000, 8200, 12500],

  setup() {
    player.heat = 0;
  },

  update(dt, run) {
    if (player.state === 'CRASHED') {
      player.heat = Math.max(0, player.heat - dt / HEAT_FALL_SECONDS);
    } else if (inputState.throttle) {
      player.heat = Math.min(1, player.heat + dt / HEAT_RISE_SECONDS);
      if (player.heat >= 1) {
        player.heat = 0;
        run.banner = 'ENGINE BLOWN';
        run.bannerTimer = 1.2;
        beginCollision();
      }
    } else {
      player.heat = Math.max(0, player.heat - dt / HEAT_FALL_SECONDS);
    }

    run.score = Math.floor(player.travelled);
    run.progress = player.heat;
  }
};

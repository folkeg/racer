import { player } from '../state';
import type { ModeDefinition } from './types';

/**
 * Death Race: the car is permanently armed and every remaining rival has to go
 * before the clock does. Clearing early freezes the remaining time into the
 * score, so the mode rewards a clean hunting line rather than luck.
 */
export const deathRace: ModeDefinition = {
  id: 'death-race',
  name: 'DEATH RACE',
  rule: '限时 90 秒 · 撞毁场上全部车辆',
  timeLimit: 90,
  scoreUnit: 'POINTS',
  trafficScale: 0.85,
  trackId: 'half-moon',
  stars: [800, 2000, 3600],
  // Contact always destroys here, never crashes, so there's no crash to wait
  // for — the clock has to be what ends the run.
  timeoutIsFinal: true,

  setup() {
    // Armed for the whole run rather than in bursts.
    player.fireball = Number.POSITIVE_INFINITY;
  },

  update(_dt, run, cars) {
    const remaining = cars.filter((car) => car.alive).length;
    run.progress = cars.length === 0 ? 1 : run.destroyed / cars.length;
    run.score = run.destroyed * 100 + Math.max(0, Math.floor(run.timeRemaining)) * 20;
    if (remaining === 0) run.banner = 'ALL CLEAR';
  },

  onContact() {
    return 'destroy';
  },

  cleared(_run, cars) {
    return cars.length > 0 && cars.every((car) => !car.alive);
  }
};

import { player } from '../state';
import type { ModeDefinition } from './types';
import { random } from '../rng';

const CULL_INTERVAL = 4.0;

let timer = 0;

/**
 * Last Man (original, not from PixelJunk Racers).
 *
 * The field destroys itself one car at a time. Fewer rivals means fewer
 * overtakes available, so the score curve flattens the longer you survive and
 * banking passes early matters.
 */
export const lastMan: ModeDefinition = {
  id: 'last-man',
  name: 'LAST MAN',
  rule: '对手每 4 秒自爆一辆 · 车越少分越难拿',
  timeLimit: 75,
  scoreUnit: 'PASSES',
  trafficScale: 0.95,
  trackId: 'tide-drop',
  stars: [12, 24, 38],

  setup() {
    timer = CULL_INTERVAL;
  },

  update(dt, run, cars) {
    timer -= dt;
    if (timer <= 0) {
      timer = CULL_INTERVAL;
      const alive = cars.filter((car) => car.alive);
      // Keep two cars on track so there is always something left to pass.
      if (alive.length > 2) {
        const victim = alive[Math.floor(random() * alive.length)];
        victim.alive = false;
        victim.wreck = 1.0;
        run.banner = `${alive.length - 1} LEFT`;
        run.bannerTimer = 0.8;
      }
    }

    run.score = player.totalPasses;
    const alive = cars.filter((car) => car.alive).length;
    run.progress = cars.length === 0 ? 0 : alive / cars.length;
  }
};

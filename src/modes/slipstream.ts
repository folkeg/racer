import { player } from '../state';
import { forwardPathDistance } from '../track';
import type { ModeDefinition } from './types';

const TUCK_NEAR = 11;
const TUCK_FAR = 30;
const CHARGE_SECONDS = 1.6;

let charge = 0;

/**
 * Slipstream (original, not from PixelJunk Racers).
 *
 * Tucking in close behind a car charges a boost; overtaking while charged scores
 * double. It rewards the opposite instinct to every other mode here, where the
 * safe play is to stay away from traffic.
 */
export const slipstream: ModeDefinition = {
  id: 'slipstream',
  name: 'SLIPSTREAM',
  rule: '贴住前车尾流蓄力 · 满蓄时超车得双倍分',
  timeLimit: 60,
  scoreUnit: 'POINTS',
  trafficScale: 0.95,
  trackId: 'long-bay',
  stars: [1400, 3000, 5000],

  setup() {
    charge = 0;
  },

  update(dt, run, cars) {
    let tucked = false;
    for (const car of cars) {
      if (!car.alive) continue;
      const gap = forwardPathDistance(player.distance, car.distance);
      if (gap > TUCK_NEAR && gap < TUCK_FAR && Math.abs(player.visualLane - car.visualLane) < 0.6) {
        tucked = true;
        break;
      }
    }

    charge = tucked
      ? Math.min(1, charge + dt / CHARGE_SECONDS)
      : Math.max(0, charge - dt * 0.35);
    run.progress = charge;
  },

  onOvertake(count, run) {
    const multiplier = charge >= 1 ? 2 : 1;
    if (multiplier === 2) {
      run.banner = 'SLIPSTREAM x2';
      run.bannerTimer = 0.8;
      charge = 0;
    }
    run.score += count * 100 * multiplier;
  },

  onCrash(run) {
    charge = 0;
    run.banner = 'SPUN OUT';
    run.bannerTimer = 0.9;
  }
};

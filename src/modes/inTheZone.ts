import { player } from '../state';
import { forwardPathDistance } from '../track';
import type { ModeDefinition } from './types';

const ZONE_COUNT = 6;
const ZONE_NEAR = 13;
const ZONE_FAR = 66;
const ZONE_LANE_TOLERANCE = 0.7;
const ZONE_FILL_SECONDS = 2.0;

/**
 * In The Zone: marked cars trail a slipstream box. Sitting inside one fills it;
 * drifting out or changing lane stalls it. Clearing every zone ends the run.
 */
export const inTheZone: ModeDefinition = {
  id: 'in-the-zone',
  name: 'IN THE ZONE',
  rule: `跟住 ${ZONE_COUNT} 辆标记车尾流 · 待满即清除`,
  timeLimit: 75,
  scoreUnit: 'POINTS',
  trafficScale: 0.9,
  trackId: 'grand-oval',
  stars: [1000, 2100, 3300],

  setup(_run, cars) {
    // Spread the marks around the lap so the route is a tour, not a huddle.
    const stride = Math.max(1, Math.floor(cars.length / ZONE_COUNT));
    cars.forEach((car) => {
      car.hasZone = false;
      car.zoneFill = 0;
    });
    for (let i = 0; i < ZONE_COUNT; i++) {
      const car = cars[(i * stride) % cars.length];
      if (car) car.hasZone = true;
    }
  },

  update(dt, run, cars) {
    let cleared = 0;
    let marked = 0;
    for (const car of cars) {
      if (!car.alive) continue;
      if (!car.hasZone) {
        if (car.zoneFill >= 1) cleared += 1;
        continue;
      }
      marked += 1;

      const gap = forwardPathDistance(player.distance, car.distance);
      const inBand = gap > ZONE_NEAR && gap < ZONE_FAR;
      const inLane = Math.abs(player.visualLane - car.visualLane) < ZONE_LANE_TOLERANCE;

      if (inBand && inLane && player.state !== 'CRASHED') {
        car.zoneFill = Math.min(1, car.zoneFill + dt / ZONE_FILL_SECONDS);
        if (car.zoneFill >= 1) {
          car.hasZone = false;
          run.banner = 'ZONE CLEAR';
          run.bannerTimer = 0.9;
        }
      } else {
        // Leaving the box bleeds progress instead of wiping it.
        car.zoneFill = Math.max(0, car.zoneFill - dt * 0.55);
      }
    }

    run.score = cleared * 500 + Math.max(0, Math.floor(run.timeRemaining)) * 5;
    // Marked cars can be destroyed by other means, so clear against what remains.
    run.progress = Math.min(1, cleared / Math.max(1, cleared + marked));
  },

  cleared(_run, cars) {
    return cars.every((car) => !car.hasZone);
  }
};

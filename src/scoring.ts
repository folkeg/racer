/**
 * Contact and overtake detection.
 *
 * The geometry is fixed, but what a contact *means* is the mode's decision:
 * a crash, a kill, or nothing at all.
 */

import { audio } from './audio';
import {
  COLLISION_LANE_DISTANCE,
  COLLISION_PATH_DISTANCE,
  OVERTAKE_KICK_EVERY,
  PLAYER_TIER_BOOST_DURATION
} from './config';
import { addHitStop, addShake } from './feel';
import { vibrate } from './platform';
import { beginCollision } from './player';
import { project } from './render/camera';
import { burst, floatText } from './render/particles';
import { activeMode, run } from './run';
import { aiCars, currentSpeedTier, player } from './state';
import { arc, circularDistance, sampleAtDistance } from './track';
import type { AiCar } from './types';

const WRECK_SECONDS = 0.9;

/** A pass this close to another car counts as a near miss. */
const CLOSE_CALL_LANE_DISTANCE = 1.25;
/** In plane units, so it scales with the car; the lane figure above does not. */
const CLOSE_CALL_PATH_DISTANCE = 42;
/** Seconds of boosted acceleration awarded for threading a gap. */
const CLOSE_CALL_BOOST = 0.55;

function destroyCar(car: AiCar): void {
  car.alive = false;
  car.wreck = WRECK_SECONDS;
  car.hasZone = false;
  run.destroyed += 1;

  const point = sampleAtDistance(car.distance, car.visualLane);
  burst(point.x, point.y, {
    count: 14,
    speed: 95,
    life: 0.42,
    size: 2.6,
    colors: ['#FFD48A', '#FF8A3C', '#FFF2CE'],
    streak: true
  });
  addShake(4.5);
  addHitStop(0.045);

  audio.playSpeedTierUp(Math.min(7, 2 + run.destroyed));
  vibrate('medium');
  activeMode.onDestroy?.(car, run);
}

function crash(): void {
  const point = sampleAtDistance(player.distance, player.visualLane);
  burst(point.x, point.y, {
    count: 22,
    speed: 130,
    life: 0.55,
    size: 3.1,
    colors: ['#FF6B5E', '#FFB43C', '#FFF2CE', '#9AA7AE'],
    streak: true
  });
  // A longer freeze and a harder shake than a kill: this one ends things.
  addHitStop(0.075);
  addShake(9);
  audio.playCrash();

  beginCollision();
  run.crashes += 1;
  activeMode.onCrash?.(run);
}

/** A pass threaded within touching distance. Rewards the greedy line. */
function registerCloseCall(): void {
  run.closeCalls += 1;
  // A short acceleration boost is the reward, which makes the risky line
  // genuinely faster rather than just decorative.
  player.tierBoostElapsed = Math.max(player.tierBoostElapsed, CLOSE_CALL_BOOST);

  const point = sampleAtDistance(player.distance, player.visualLane);
  burst(point.x, point.y, {
    count: 7,
    speed: 70,
    life: 0.3,
    size: 1.8,
    colors: ['#C5FFF7', '#57D5CB'],
    streak: true
  });
  audio.playCloseCall();

  activeMode.onCloseCall?.(run);
}

export function detectCollisions(): boolean {
  if (player.invincible > 0 || player.state === 'CRASHED') return false;

  for (const car of aiCars) {
    if (!car.alive) continue;

    const laneDistanceNow = Math.abs(player.visualLane - car.visualLane);
    const laneDistanceBefore = Math.abs(player.previousVisualLane - car.previousVisualLane);
    const laneDistance = Math.min(laneDistanceNow, laneDistanceBefore);
    const pathDistance = circularDistance(player.distance, car.distance);

    // At 600+ road-speed units the red car can cross an AI car between frames.
    // Detect the unwrapped pass-index crossing as well as current-position overlap.
    const previousGap = player.previousDistance - car.previousDistance;
    const currentGap = player.distance - car.distance;
    const previousPassIndex = Math.floor(previousGap / arc.total);
    const currentPassIndex = Math.floor(currentGap / arc.total);
    const sweptThroughCar = currentPassIndex > previousPassIndex;

    const touching = laneDistance <= COLLISION_LANE_DISTANCE &&
      (pathDistance <= COLLISION_PATH_DISTANCE || sweptThroughCar);
    if (!touching) continue;

    const response = activeMode.onContact?.(car, run) ?? 'crash';
    if (response === 'ignore') continue;
    if (response === 'destroy') {
      destroyCar(car);
      // Ramming does not end anything, so keep scanning for further contacts.
      continue;
    }

    crash();
    return true;
  }
  return false;
}

export function detectOvertakes(): void {
  for (const car of aiCars) {
    if (!car.alive) continue;

    const currentPassIndex = Math.floor((player.distance - car.distance) / arc.total);
    if (currentPassIndex > car.passIndex) {
      const overtakes = currentPassIndex - car.passIndex;
      const previousCombo = player.combo;
      const previousTier = currentSpeedTier(previousCombo);
      player.combo += overtakes;
      const newTier = currentSpeedTier(player.combo);
      player.totalPasses += overtakes;
      player.bestCombo = Math.max(player.bestCombo, player.combo);
      player.passPopElapsed = 0;
      car.passIndex = currentPassIndex;
      audio.playOvertake(player.combo, overtakes);

      // The running count pops on the car itself; the HUD only ever shows the best.
      const passPlane = sampleAtDistance(player.distance, player.visualLane);
      const passPoint = project(passPlane.x, passPlane.y);
      floatText(passPoint.x, passPoint.y - 14 * passPoint.scale, `${player.combo}`, '#C5FFF7', 26 * passPoint.scale);

      // Every fifth car is a felt kick: the cruise target already jumped in
      // state.ts, so ramp into it fast instead of crawling up at the normal
      // rate — that ramp is what makes the jump actually land.
      const kicked = Math.floor(player.combo / OVERTAKE_KICK_EVERY) >
        Math.floor(previousCombo / OVERTAKE_KICK_EVERY);
      if (kicked) player.tierBoostElapsed = PLAYER_TIER_BOOST_DURATION;

      if (newTier > previousTier) audio.playSpeedTierUp(newTier);

      if (kicked) {
        const point = sampleAtDistance(player.distance, player.visualLane);
        burst(point.x, point.y, {
          count: 18,
          speed: 120,
          life: 0.5,
          size: 2.4,
          colors: ['#C5FFF7', '#57D5CB', '#FFF4D8'],
          streak: true
        });
      }

      vibrate(kicked ? 'medium' : 'light');
      activeMode.onOvertake?.(overtakes, run);

      // Judged at the moment of the pass, while the cars are still alongside.
      const laneGap = Math.abs(player.visualLane - car.visualLane);
      const pathGap = circularDistance(player.distance, car.distance);
      if (laneGap <= CLOSE_CALL_LANE_DISTANCE && pathGap <= CLOSE_CALL_PATH_DISTANCE) {
        registerCloseCall();
      }
    } else if (currentPassIndex < car.passIndex) {
      // This can happen after a crash lets the AI move back in front.
      // Lowering the index allows the same car to be legitimately passed again.
      car.passIndex = currentPassIndex;
    }
  }
}

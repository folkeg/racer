/** Red car behaviour: lane changes, throttle and the speed-tier curve. */

import { audio } from './audio';
import {
  CHANGE_DURATION,
  LANE_COUNT,
  PLAYER_ACCELERATION,
  PLAYER_COAST_DECELERATION,
  PLAYER_TIER_ACCELERATION
} from './config';
import { tuning } from './difficulty';
import { moveToward } from './mathUtil';
import { countdownActive } from './countdown';
import { noteLaneChange, noteThrottle } from './onboarding';
import { vibrate } from './platform';
import { baseCruiseSpeed, currentTargetSpeed, inputState, player } from './state';
import { advanceDistanceAtRoadSpeed, sampleAtDistance } from './track';

function laneInputStateAllows(): boolean {
  return player.state !== 'CRASHED' && !countdownActive();
}

export function requestLaneChange(direction: number): void {
  if (!laneInputStateAllows()) return;

  audio.ensureStarted();
  const target = Math.max(0, Math.min(LANE_COUNT - 1, player.lane + direction));
  if (target === player.lane) return;

  noteLaneChange();
  audio.playLaneChange(direction);
  player.laneFrom = player.visualLane;
  player.laneTo = target;
  player.lane = target;
  player.laneChangeElapsed = 0.0001;
  if (player.state === 'NORMAL' || player.state === 'CHANGING_LANE') {
    player.state = 'CHANGING_LANE';
  }
}

export function setThrottle(active: boolean): void {
  inputState.throttle = Boolean(active) && !countdownActive();
  if (inputState.throttle) {
    noteThrottle();
    audio.ensureStarted();
  }
}

export function beginCollision(): void {
  if (player.invincible > 0 || player.state === 'CRASHED') return;

  player.state = 'CRASHED';
  player.stateElapsed = 0;
  player.speed = 0;
  player.invincible = tuning.profile.invincibleSeconds;
  player.combo = 0;
  player.tierBoostElapsed = 0;
  player.collisionCount += 1;

  vibrate('medium');
}

export function updatePlayer(dt: number): void {
  player.previousDistance = player.distance;
  player.previousVisualLane = player.visualLane;
  player.invincible = Math.max(0, player.invincible - dt);
  player.tierBoostElapsed = Math.max(0, player.tierBoostElapsed - dt);
  player.passPopElapsed += dt;
  // Death Race arms the car with an infinite timer, which must stay infinite.
  if (Number.isFinite(player.fireball)) player.fireball = Math.max(0, player.fireball - dt);

  if (player.laneChangeElapsed > 0) {
    player.laneChangeElapsed += dt;
    const t = Math.min(1, player.laneChangeElapsed / CHANGE_DURATION);
    const eased = 1 - Math.pow(1 - t, 3);
    player.visualLane = player.laneFrom + (player.laneTo - player.laneFrom) * eased;
    if (t >= 1) {
      player.visualLane = player.laneTo;
      player.laneChangeElapsed = 0;
      if (player.state === 'CHANGING_LANE') player.state = 'NORMAL';
    }
  }

  if (player.state === 'CRASHED') {
    player.stateElapsed += dt;
    player.speed = 0;
    if (player.stateElapsed >= 0.35) {
      player.state = 'RECOVERING';
      player.stateElapsed = 0;
    }
  } else if (player.state === 'RECOVERING') {
    player.stateElapsed += dt;
    const t = Math.min(1, player.stateElapsed / 0.70);
    player.speed = baseCruiseSpeed() * t;
    if (t >= 1) {
      player.speed = baseCruiseSpeed();
      player.state = 'NORMAL';
      player.stateElapsed = 0;
    }
  } else {
    const targetSpeed = currentTargetSpeed();
    const acceleration = player.tierBoostElapsed > 0 ? PLAYER_TIER_ACCELERATION : PLAYER_ACCELERATION;
    const rate = targetSpeed >= player.speed ? acceleration : PLAYER_COAST_DECELERATION;
    player.speed = moveToward(player.speed, targetSpeed, rate * dt);
  }

  // Keep an unwrapped distance for reliable lap/overtake detection.
  const before = player.distance;
  player.distance = advanceDistanceAtRoadSpeed(player.distance, player.speed, dt, player.visualLane);
  player.travelled += Math.max(0, player.distance - before);
  recordTrail();
  updateCornering(dt);
}

/**
 * Cornering load from how fast the track heading is turning under the car.
 * Fed to the audio as tyre scrub: the tighter the corner and the higher the
 * speed, the more the tyres complain.
 */
function updateCornering(dt: number): void {
  const heading = sampleAtDistance(player.distance, player.visualLane).angle;
  let delta = heading - player.previousHeading;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  player.previousHeading = heading;

  const rate = Math.abs(delta) / Math.max(dt, 0.0001);
  const load = Math.min(1, (rate * player.speed) / 900);
  // Asymmetric smoothing: bites quickly, releases slowly, like a real slide.
  const response = load > player.cornering ? 9 : 3.2;
  player.cornering += (load - player.cornering) * (1 - Math.exp(-dt * response));
}

/**
 * Fixed-length history; the afterimage reads it back at a stride that widens
 * with speed, so the buffer has to be long enough for the longest smear.
 *
 * It was 26, which the trail could exhaust at full speed — 9 segments at a
 * stride of 3 reaches 27 — so the smear hit the end of its own history and
 * stopped growing exactly when the car was going fast enough to want it most.
 * Sized here for the longest trail render/vehicles.ts can ask for.
 */
const TRAIL_LENGTH = 56;

function recordTrail(): void {
  player.trail.push({ distance: player.distance, lane: player.visualLane });
  if (player.trail.length > TRAIL_LENGTH) player.trail.shift();
}

/** Fireball state is what turns a contact into a kill. */
export function playerIsArmed(): boolean {
  return player.fireball > 0;
}

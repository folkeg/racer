/** Black car behaviour: readable, predictable lane changes and traffic following. */

import {
  AI_CHANGE_DURATION,
  AI_LANE_CLEAR_DISTANCE,
  AI_MAX_DECISION_DELAY,
  AI_MIN_DECISION_DELAY,
  AI_PLAYER_BASE_SAFETY_DISTANCE,
  AI_PLAYER_MAX_SAFETY_DISTANCE,
  AI_PLAYER_REAR_SAFETY_DISTANCE,
  AI_PLAYER_SAFETY_PER_SPEED,
  AI_WARNING_DURATION,
  LANE_COUNT,
} from './config';
import { tuning } from './difficulty';
import { aiCars, baseCruiseSpeed, player } from './state';
import { advanceDistanceAtRoadSpeed, circularDistance, forwardPathDistance } from './track';
import type { AiCar } from './types';
import { random } from './rng';

// At cruise speed, AI cars keep a modest no-lane-change zone in front of the player.
// As the red car accelerates, this zone grows so high-speed runs remain readable and fair.
export function currentAiPlayerSafetyDistance(): number {
  const speedExtra = Math.max(0, player.speed - baseCruiseSpeed()) * AI_PLAYER_SAFETY_PER_SPEED;
  const zone = Math.min(AI_PLAYER_MAX_SAFETY_DISTANCE, AI_PLAYER_BASE_SAFETY_DISTANCE + speedExtra);
  // Harder settings shrink the courtesy zone, so traffic cuts in much closer.
  return zone * tuning.profile.aiSafetyScale;
}

function playerIsApproachingAi(car: AiCar): boolean {
  const playerToCar = forwardPathDistance(player.distance, car.distance);
  if (playerToCar > 0.1 && playerToCar < currentAiPlayerSafetyDistance()) return true;

  // Also avoid starting a lane change immediately behind a player who has just passed.
  const carToPlayer = forwardPathDistance(car.distance, player.distance);
  return carToPlayer > 0.1 && carToPlayer < AI_PLAYER_REAR_SAFETY_DISTANCE;
}

function countActiveAiLaneChanges(): number {
  let count = 0;
  for (const car of aiCars) {
    if (car.alive && (car.state === 'WARNING' || car.state === 'CHANGING')) count += 1;
  }
  return count;
}

function nearestAiAhead(car: AiCar, lane: number, maxDistance = 90): { car: AiCar; distance: number } | null {
  let nearest: AiCar | null = null;
  let nearestDistance = maxDistance;
  for (const other of aiCars) {
    if (other === car || !other.alive || Math.abs(other.visualLane - lane) > 0.55) continue;
    const distance = forwardPathDistance(car.distance, other.distance);
    if (distance > 0.1 && distance < nearestDistance) {
      nearest = other;
      nearestDistance = distance;
    }
  }
  return nearest ? { car: nearest, distance: nearestDistance } : null;
}

function isAiTargetLaneClear(car: AiCar, targetLane: number): boolean {
  for (const other of aiCars) {
    if (other === car || !other.alive || Math.abs(other.visualLane - targetLane) > 0.62) continue;
    if (circularDistance(car.distance, other.distance) < AI_LANE_CLEAR_DISTANCE) return false;
  }

  if (Math.abs(player.visualLane - targetLane) < 0.72 &&
      circularDistance(car.distance, player.distance) < currentAiPlayerSafetyDistance()) {
    return false;
  }
  return true;
}

function shuffledDirections(): number[] {
  return random() < 0.5 ? [-1, 1] : [1, -1];
}

function tryBeginAiLaneChange(car: AiCar): boolean {
  if (countActiveAiLaneChanges() >= tuning.profile.maxSimultaneousAi) return false;
  if (playerIsApproachingAi(car)) return false;

  // Traffic used to weave for its own sake too, which read as busy rather than
  // alive. Now a lane change only happens when a car is genuinely stuck behind
  // a slower one — the rest of the variety comes from cars just running at
  // different speeds.
  const ahead = nearestAiAhead(car, car.visualLane, 62);
  const needsToPass = Boolean(ahead && ahead.car.speed + 2 < car.baseSpeed && ahead.distance < 46);
  if (!needsToPass) return false;

  const directions = shuffledDirections();
  for (const direction of directions) {
    const targetLane = car.lane + direction;
    if (targetLane < 0 || targetLane >= LANE_COUNT) continue;
    if (!isAiTargetLaneClear(car, targetLane)) continue;

    car.state = 'WARNING';
    car.stateElapsed = 0;
    car.direction = direction;
    car.laneFrom = car.visualLane;
    car.laneTo = targetLane;
    return true;
  }
  return false;
}

export function updateAi(dt: number): void {
  for (const car of aiCars) {
    if (!car.alive) {
      // Wrecks linger for a moment as debris, then stop being drawn entirely.
      car.wreck = Math.max(0, car.wreck - dt);
      continue;
    }
    car.previousDistance = car.distance;
    car.previousVisualLane = car.visualLane;
    car.decisionTimer -= dt;

    if (car.state === 'IDLE' && car.decisionTimer <= 0) {
      car.decisionTimer = (AI_MIN_DECISION_DELAY + random() * (AI_MAX_DECISION_DELAY - AI_MIN_DECISION_DELAY)) *
        tuning.profile.aiDecisionScale;
      tryBeginAiLaneChange(car);
    } else if (car.state === 'WARNING') {
      car.stateElapsed += dt;
      if (playerIsApproachingAi(car) || !isAiTargetLaneClear(car, car.laneTo)) {
        car.state = 'IDLE';
        car.stateElapsed = 0;
        car.direction = 0;
        car.decisionTimer = 0.55 + random() * 0.75;
      } else if (car.stateElapsed >= AI_WARNING_DURATION) {
        car.state = 'CHANGING';
        car.stateElapsed = 0;
        car.laneFrom = car.visualLane;
        car.lane = car.laneTo;
      }
    } else if (car.state === 'CHANGING') {
      car.stateElapsed += dt;
      const t = Math.min(1, car.stateElapsed / AI_CHANGE_DURATION);
      const eased = t * t * (3 - 2 * t);
      car.visualLane = car.laneFrom + (car.laneTo - car.laneFrom) * eased;
      if (t >= 1) {
        car.visualLane = car.laneTo;
        car.lane = car.laneTo;
        car.state = 'IDLE';
        car.stateElapsed = 0;
        car.direction = 0;
        car.decisionTimer = 0.9 + random() * 1.5;
      }
    }

    // Simple traffic following prevents faster AI cars from visually stacking.
    const ahead = nearestAiAhead(car, car.visualLane, 34);
    let desiredSpeed = car.baseSpeed;
    if (ahead && ahead.distance < 24) desiredSpeed = Math.min(desiredSpeed, ahead.car.speed * 0.96);
    const response = Math.min(1, dt * 4.5);
    car.speed += (desiredSpeed - car.speed) * response;
    car.distance = advanceDistanceAtRoadSpeed(car.distance, car.speed, dt, car.visualLane);
  }
}

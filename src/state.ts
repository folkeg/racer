/**
 * Mutable game state and the queries that read it. Behaviour lives in player.ts,
 * ai.ts and scoring.ts; this module only owns the data.
 */

import {
  AI_MAX_DECISION_DELAY,
  AI_MIN_DECISION_DELAY,
  CRUISE_SPEED_CAP,
  OVERTAKE_KICK_EVERY,
  OVERTAKE_KICK_SPEED,
  OVERTAKE_KICK_SPEED_LATE,
  OVERTAKE_KICK_TAPER_AFTER,
  PLAYER_CRUISE_BASE_SPEED,
  PLAYER_MAX_SPEED,
  SPEED_BANDS,
  THROTTLE_MARGIN,
  buildBlueprints
} from './config';
import { tuning } from './difficulty';
import { arc } from './track';
import type { AiCar, EngineSnapshot, Player } from './types';
import { random } from './rng';

const STARTING_LANE = 2;

export const inputState = {
  throttle: false
};

export const player: Player = {
  distance: 0,
  lane: STARTING_LANE,
  visualLane: STARTING_LANE,
  laneFrom: STARTING_LANE,
  laneTo: STARTING_LANE,
  laneChangeElapsed: 0,
  speed: PLAYER_CRUISE_BASE_SPEED,
  state: 'NORMAL',
  stateElapsed: 0,
  invincible: 0,
  combo: 0,
  bestCombo: 0,
  totalPasses: 0,
  passPopElapsed: 10,
  tierBoostElapsed: 0,
  previousDistance: 0,
  previousVisualLane: STARTING_LANE,
  collisionCount: 0,
  fireball: 0,
  heat: 0,
  travelled: 0,
  trail: [],
  previousHeading: 0,
  cornering: 0
};

export let aiCars: AiCar[] = [];

/**
 * Lap length of Long Bay, the circuit the field size was tuned against.
 * `carCount` in the difficulty profile means "this many cars on a lap this
 * long", not a flat number for every track.
 */
const REFERENCE_LAP = 2988;
/** Below this the road stops feeling like traffic and starts feeling empty. */
const MIN_FIELD = 8;

/**
 * How many cars this circuit gets.
 *
 * A flat count made short tracks twice as crowded as long ones: Grand Oval and
 * Delta Run are under half of Long Bay's lap, so the same 24 cars sat one every
 * 58 units instead of one every 124, and the road was a wall. Scaling with lap
 * length keeps the *spacing* constant instead, which is the thing that actually
 * reads as busy or open.
 */
function fieldSize(): number {
  const scaled = Math.round(tuning.profile.carCount * (arc.total / REFERENCE_LAP));
  return Math.max(MIN_FIELD, scaled);
}

export function resetGame(): void {
  player.distance = arc.total * 0.03;
  player.lane = STARTING_LANE;
  player.visualLane = STARTING_LANE;
  player.laneFrom = STARTING_LANE;
  player.laneTo = STARTING_LANE;
  player.laneChangeElapsed = 0;
  player.speed = baseCruiseSpeed();
  inputState.throttle = false;
  player.state = 'NORMAL';
  player.stateElapsed = 0;
  player.invincible = 0;
  player.combo = 0;
  player.bestCombo = 0;
  player.totalPasses = 0;
  player.passPopElapsed = 10;
  player.tierBoostElapsed = 0;
  player.previousDistance = player.distance;
  player.previousVisualLane = player.visualLane;
  player.collisionCount = 0;
  player.fireball = 0;
  player.heat = 0;
  player.travelled = 0;
  player.trail.length = 0;
  player.previousHeading = 0;
  player.cornering = 0;

  aiCars = buildBlueprints(fieldSize()).map((blueprint, index) => {
    const distance = arc.total * blueprint.fraction;
    const baseSpeed = blueprint.speed * tuning.traffic;
    return {
      id: index,
      distance,
      lane: blueprint.lane,
      visualLane: blueprint.lane,
      laneFrom: blueprint.lane,
      laneTo: blueprint.lane,
      baseSpeed,
      speed: baseSpeed,
      previousDistance: distance,
      previousVisualLane: blueprint.lane,
      state: 'IDLE',
      stateElapsed: 0,
      direction: 0,
      decisionTimer: (AI_MIN_DECISION_DELAY + random() * (AI_MAX_DECISION_DELAY - AI_MIN_DECISION_DELAY)) *
        tuning.profile.aiDecisionScale,
      passIndex: Math.floor((player.distance - distance) / arc.total),
      alive: true,
      wreck: 0,
      hasZone: false,
      zoneFill: 0
    };
  });
}

export function livingCars(): AiCar[] {
  return aiCars.filter((car) => car.alive);
}

/** Tier-0 cruise speed for the active difficulty. */
export function baseCruiseSpeed(): number {
  return PLAYER_CRUISE_BASE_SPEED * tuning.player;
}

/**
 * Still ten-per-tier, but only as a milestone for the audio and the celebration.
 * Speed itself is continuous now.
 */
export function currentSpeedTier(combo: number = player.combo): number {
  return Math.min(10, Math.floor(Math.max(0, combo) / 10));
}

/** Cruise speed for a combo, walking the diminishing-return bands. */
export function cruiseSpeedForCombo(combo: number): number {
  let speed = PLAYER_CRUISE_BASE_SPEED;
  let remaining = Math.max(0, combo);
  for (const [count, step] of SPEED_BANDS) {
    const taken = Math.min(remaining, count);
    speed += taken * step;
    remaining -= taken;
    if (remaining <= 0) break;
  }
  const kicksTotal = Math.floor(Math.max(0, combo) / OVERTAKE_KICK_EVERY);
  const kicksBeforeTaper = Math.floor(OVERTAKE_KICK_TAPER_AFTER / OVERTAKE_KICK_EVERY);
  const fullKicks = Math.min(kicksTotal, kicksBeforeTaper);
  const lateKicks = kicksTotal - fullKicks;
  speed += fullKicks * OVERTAKE_KICK_SPEED + lateKicks * OVERTAKE_KICK_SPEED_LATE;
  return Math.min(CRUISE_SPEED_CAP, speed);
}

export function currentCruiseSpeed(): number {
  return cruiseSpeedForCombo(player.combo) * tuning.player;
}

export function currentThrottleMaxSpeed(): number {
  return (cruiseSpeedForCombo(player.combo) + THROTTLE_MARGIN) * tuning.player;
}

export function currentTargetSpeed(): number {
  return inputState.throttle ? currentThrottleMaxSpeed() : currentCruiseSpeed();
}

/** One frame's worth of state, handed to the audio engine so it stays decoupled. */
export function engineSnapshot(): EngineSnapshot {
  return {
    tier: currentSpeedTier(),
    cornering: player.cornering,
    throttle: inputState.throttle,
    speed: player.speed,
    cruiseSpeed: currentCruiseSpeed(),
    throttleMaxSpeed: currentThrottleMaxSpeed(),
    maxSpeed: PLAYER_MAX_SPEED * tuning.player,
    state: player.state
  };
}

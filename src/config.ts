/** Gameplay tuning. Every magic number that shapes how the game feels lives here. */

import type { AiBlueprint } from './types';

export const LANE_COUNT = 5;

/**
 * The road cross-section, widened by a quarter so the cars on it read bigger.
 *
 * Car size and lane width are locked together — a car is 87% of a lane either
 * way — so widening the road alone would have made cars *smaller*: the circuit
 * gets wider, the camera's shrink-to-fit compensates, and a fixed-size car ends
 * up covering less of the screen. What makes a car bigger is scaling the whole
 * cross-section against the loop it sits on, cars and collision distances
 * included; see CAR_LENGTH in render/sprites.ts.
 *
 * A quarter is the practical ceiling. Long Bay's hairpins turn on a radius of
 * 45, so at this width the inner edge of the road is already down to a radius
 * of 11; much past that and it folds through itself. Switchback used to bind
 * this far harder at radius 30 — it was cut for being a near-copy of Long Bay,
 * which is what made the widening possible at all.
 */
export const LANE_GAP = 12.4;
/** The tan edge line down each side, inside the road's outer edge. */
export const KERB_WIDTH = 3.2;
/**
 * Derived, not chosen: the five lane bands must exactly fill the surface
 * between the two kerbs. The bands span LANE_COUNT * LANE_GAP, and a kerb eats
 * KERB_WIDTH off each side. At the old hand-picked 33.8 the outer two bands
 * overran the kerb and were clipped, which is half of why they looked narrower
 * than the middle three — see drawEdgeGrime in render/road.ts for the other half.
 */
export const ROAD_HALF_WIDTH = (LANE_COUNT * LANE_GAP) / 2 + KERB_WIDTH;
export const PLAYER_CRUISE_BASE_SPEED = 125;

/**
 * Speed grows on *every* overtake, in bands with diminishing returns.
 *
 * The stepped every-tenth-car curve made the early game feel inert and then
 * lurched: a single pass could add sixty units. Now the first ten passes are
 * where the acceleration is felt, and the late game creeps rather than sprints,
 * with a much lower ceiling so high combos stay readable.
 *
 * Each entry is [how many overtakes this band covers, units added per overtake].
 */
export const SPEED_BANDS: Array<[number, number]> = [
  [10, 6.0],
  [15, 3.0],
  [25, 1.5],
  [Infinity, 0.55]
];

/**
 * On top of the steady per-overtake creep above, every fifth car adds a lump
 * sum to the cruise-speed target. The creep alone read as barely-there; this
 * is the part a player actually feels as a kick.
 *
 * Past 30 cars the kicks shrink: by then the player is already fast enough
 * that a full-size jump does not leave time to react, so the lump sum tapers
 * down instead of continuing to grow.
 */
export const OVERTAKE_KICK_EVERY = 5;
export const OVERTAKE_KICK_SPEED = 18;
export const OVERTAKE_KICK_TAPER_AFTER = 30;
export const OVERTAKE_KICK_SPEED_LATE = 6;

/** Cruise speed never exceeds this, however long the combo runs. */
export const CRUISE_SPEED_CAP = 380;
/** Holding the throttle adds this much on top of the cruise speed. */
export const THROTTLE_MARGIN = 60;
export const PLAYER_MAX_SPEED = CRUISE_SPEED_CAP + THROTTLE_MARGIN;
export const PLAYER_ACCELERATION = 112;
export const PLAYER_TIER_ACCELERATION = 165;
export const PLAYER_COAST_DECELERATION = 42;
export const PLAYER_TIER_BOOST_DURATION = 0.72;
export const CHANGE_DURATION = 0.05;
export const AI_WARNING_DURATION = 0.16;
export const AI_CHANGE_DURATION = 0.20;
export const AI_MIN_DECISION_DELAY = 0.85;
export const AI_MAX_DECISION_DELAY = 2.35;
export const MAX_SIMULTANEOUS_AI_ACTIONS = 2;
export const AI_LANE_CLEAR_DISTANCE = 32;
export const AI_PLAYER_BASE_SAFETY_DISTANCE = 50;
export const AI_PLAYER_MAX_SAFETY_DISTANCE = 265;
export const AI_PLAYER_SAFETY_PER_SPEED = 0.39;
export const AI_PLAYER_REAR_SAFETY_DISTANCE = 30;
// Scaled with the car: a longer car has to register its hit further out, or it
// visibly overlaps the one it is hitting before anything happens. The lane
// figure is in lane units, which are dimensionless, so it does not move.
export const COLLISION_PATH_DISTANCE = 14.4;
export const COLLISION_LANE_DISTANCE = 0.48;

/**
 * Traffic is generated per run so the car count can be a difficulty knob.
 *
 * Lanes cycle so every lane stays occupied, speed rises with lane index (the
 * outside lane is the slow lane), and the golden ratio spaces cars around the
 * lap without clumping at any count. Cars now change lanes only when truly
 * stuck behind a slower one, so the `(i % 3)` term carries more of the traffic
 * variety than it used to — spread wider so two cars in the same lane still
 * end up passable rather than glued together for the whole race.
 */
export function buildBlueprints(count: number): AiBlueprint[] {
  const blueprints: AiBlueprint[] = [];
  for (let i = 0; i < count; i++) {
    const lane = i % LANE_COUNT;
    blueprints.push({
      fraction: (i * 0.6180339887498949) % 1,
      lane,
      speed: 84 + lane * 7 + (i % 3) * 5
    });
  }
  return blueprints;
}

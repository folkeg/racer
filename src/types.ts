/** Shared data shapes. Keeping them in one place stops each module inventing its own. */

export interface Vec2 {
  x: number;
  y: number;
}

/** A point on a lane path, plus the heading used to rotate a car sprite. */
export interface TrackSample extends Vec2 {
  angle: number;
}

export type PlayerLifecycle = 'NORMAL' | 'CHANGING_LANE' | 'CRASHED' | 'RECOVERING';
export type AiLifecycle = 'IDLE' | 'WARNING' | 'CHANGING';

export interface Player {
  distance: number;
  lane: number;
  visualLane: number;
  laneFrom: number;
  laneTo: number;
  laneChangeElapsed: number;
  speed: number;
  state: PlayerLifecycle;
  stateElapsed: number;
  invincible: number;
  combo: number;
  bestCombo: number;
  totalPasses: number;
  passPopElapsed: number;
  tierBoostElapsed: number;
  previousDistance: number;
  previousVisualLane: number;
  collisionCount: number;
  /** Seconds of fireball left. While positive, contact destroys cars instead of crashing. */
  fireball: number;
  /** Throttle heat, 0..1. Only Hot Rods lets it reach 1, which forces a blowout. */
  heat: number;
  /** Road distance covered this run, used by the distance-scored modes. */
  travelled: number;
  /** Recent positions, newest last, for the afterimage. */
  trail: Array<{ distance: number; lane: number }>;
  /** Track heading last frame, used to derive cornering load. */
  previousHeading: number;
  /** How hard the car is cornering, 0..1. Drives the tyre sound. */
  cornering: number;
}

export interface AiCar {
  id: number;
  distance: number;
  lane: number;
  visualLane: number;
  laneFrom: number;
  laneTo: number;
  baseSpeed: number;
  speed: number;
  previousDistance: number;
  previousVisualLane: number;
  state: AiLifecycle;
  stateElapsed: number;
  direction: number;
  decisionTimer: number;
  passIndex: number;
  /** Destroyed cars stop updating and stop being drawn. */
  alive: boolean;
  /** Seconds of wreck animation left after being destroyed. */
  wreck: number;
  /** In The Zone: this car carries a slipstream zone the player must sit inside. */
  hasZone: boolean;
  /** In The Zone: 0..1 progress filling this car's zone. */
  zoneFill: number;
}

export interface AiBlueprint {
  fraction: number;
  lane: number;
  speed: number;
}

export interface VehicleStyle {
  body: string;
  cabin: string;
  window: string;
  lights: string;
  stripe: string | null;
  /** Extruded side face, drawn offset down-light under the top face. */
  side: string;
  /** Rim light along the lit edge. */
  rim: string;
}

export type ControlKind = 'steer' | 'lane' | 'throttle';
export type ControlId = 'steer' | 'left' | 'right' | 'throttle';

export interface Control {
  id: ControlId;
  kind: ControlKind;
  /** Hit-tested as a circle inscribed in the box, not as the box itself. */
  round?: boolean;
  /**
   * Lane-index delta. +1 is the car's own RIGHT, not its left: lane offsets are
   * taken along the normal (-dy, dx), and with screen y pointing down that
   * normal is the right-hand side of the direction of travel. Measured at eight
   * stations on all four circuits, 8/8 agreeing. The controls asserted the
   * opposite for a long time, which is why pressing left drove the car right.
   */
  direction: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Everything the audio engine needs to voice one frame. Passing a snapshot keeps
 * audio.ts free of any dependency on game state, so neither module imports the other.
 */
export interface EngineSnapshot {
  tier: number;
  /** 0..1 cornering load, for the tyre scrub layer. */
  cornering: number;
  throttle: boolean;
  speed: number;
  cruiseSpeed: number;
  throttleMaxSpeed: number;
  maxSpeed: number;
  state: PlayerLifecycle;
}

export interface PointerEventLike {
  clientX: number;
  clientY: number;
  pointerId: number;
  preventDefault?(): void;
}

export interface KeyboardEventLike {
  key?: string;
  code?: string;
  keyCode?: number;
  which?: number;
  preventDefault?(): void;
}

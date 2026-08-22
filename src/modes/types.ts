/** The contract every race mode implements. */

import type { TrackId } from '../tracks';
import type { AiCar } from '../types';

export type ModeId =
  // Modes documented for the original PixelJunk Racers.
  | 'speed-monkey'
  | 'combo-racers'
  | 'sunday-drivers'
  | 'fireball-frenzy'
  | 'death-race'
  | 'in-the-zone'
  | 'hot-rods'
  // Original modes, built in the same slot-car vocabulary to fill out the roster.
  | 'slipstream'
  | 'ghost-lane'
  | 'rush-hour'
  | 'pace-setter'
  | 'last-man'
  | 'chain-reaction'
  | 'blackout'
  | 'time-attack'
  | 'endurance';

/**
 * One setting, the hardest one. Normal and Turbo were cut: the game is about
 * the Master field, and offering two softer versions of it only let players
 * choose the one that taught them less.
 *
 * Kept as a type rather than deleted outright so scores stay partitioned by
 * `mode:difficulty` in storage and on the leaderboard, which is what lets a
 * second setting come back later without a migration.
 */
export type Difficulty = 'master';

export type RunOutcome = 'running' | 'cleared' | 'timeout' | 'wrecked';

/** What a body-to-body contact does. Modes decide; scoring.ts carries it out. */
export type ContactResponse = 'crash' | 'destroy' | 'ignore';

export interface RunState {
  modeId: ModeId;
  difficulty: Difficulty;
  elapsed: number;
  /** Seconds left, or Infinity for the untimed modes. */
  timeRemaining: number;
  score: number;
  destroyed: number;
  crashes: number;
  /** Passes made close enough to an AI car to count as a near miss. */
  closeCalls: number;
  /** True while running the daily challenge. */
  daily: boolean;
  /** Revives already spent this run. */
  revives: number;
  outcome: RunOutcome;
  /** Objective progress in 0..1, drawn as a bar. Negative means "no bar". */
  progress: number;
  /** Short transient message shown centre-screen. */
  banner: string;
  bannerTimer: number;
}

export interface ModeDefinition {
  id: ModeId;
  /** Original PixelJunk Racers mode name. */
  name: string;
  /** Objective, one line, shown in the menu and during the run. */
  rule: string;
  /** Seconds, or Infinity when the mode ends some other way. */
  timeLimit: number;
  /** Suffix for the score readout, e.g. 'COMBO' or 'CARS'. */
  scoreUnit: string;
  /** Traffic speed multiplier applied on top of the difficulty scale. */
  trafficScale: number;
  /** Which circuit this mode is raced on. */
  trackId: TrackId;
  /**
   * Score needed for one, two and three stars, in this mode's own unit.
   * Stars are the game's single progression currency: they gate every mode and
   * difficulty past the starting three.
   */
  stars: [number, number, number];
  /** Higher score is better for every mode except those that set this false. */
  lowerIsBetter?: boolean;
  /**
   * Most modes treat a crash as a setback, not a stop, so the clock running out
   * no longer ends the run by itself — it only does once the player actually
   * crashes. Set this for a mode where contact never resolves as a crash (Death
   * Race always destroys), so the clock stays the only way to end it.
   */
  timeoutIsFinal?: boolean;

  setup?(run: RunState, cars: AiCar[]): void;
  update?(dt: number, run: RunState, cars: AiCar[]): void;
  onOvertake?(count: number, run: RunState): void;
  onContact?(car: AiCar, run: RunState): ContactResponse;
  /** Called after a contact resolved as 'crash'. */
  onCrash?(run: RunState): void;
  /** Called after a contact resolved as 'destroy'. */
  onDestroy?(car: AiCar, run: RunState): void;
  /** Called for each near miss, so a mode can reward them. */
  onCloseCall?(run: RunState): void;
  /** Objective met — the run ends as 'cleared'. */
  cleared?(run: RunState, cars: AiCar[]): boolean;
  /** Run ends as 'wrecked' before the clock runs out. */
  failed?(run: RunState, cars: AiCar[]): boolean;
}

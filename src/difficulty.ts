/**
 * The difficulty profile for the active run.
 *
 * There is exactly one now: shipping softer settings alongside the real one
 * just let players opt out of the thing worth playing, and picking a difficulty
 * before you have driven a lap is a choice nobody can make well anyway.
 *
 * The `master` key is a storage detail, not a claim about how hard this is —
 * see `Difficulty` in modes/types.ts for why the key outlived the setting.
 *
 * The profile is still a record keyed by difficulty rather than a bare object,
 * so a second setting is a data change here plus a menu control, not a refactor
 * of everything that reads `tuning`.
 *
 * Kept in its own tiny module so player.ts and ai.ts can read it without
 * importing the run or mode machinery, which would create an import cycle.
 */

import type { Difficulty } from './modes/types';

export interface DifficultyProfile {
  label: string;
  /** Menu subtitle: what actually changes at this setting. */
  blurb: string;
  /** Multiplies every player speed target. */
  playerSpeed: number;
  /** Multiplies every AI base speed, before the mode's own traffic scale. */
  trafficSpeed: number;
  /** How many black cars are on track. */
  carCount: number;
  /** Scales the no-lane-change zone AI keeps around the player. Lower = ruder. */
  aiSafetyScale: number;
  /** Scales the delay between AI lane-change decisions. Lower = busier traffic. */
  aiDecisionScale: number;
  /** How many AI cars may be signalling or changing lane at once. */
  maxSimultaneousAi: number;
  /** Post-crash invulnerability, in seconds. */
  invincibleSeconds: number;
}

/**
 * Retuned so the speed ramp is the thing you feel.
 *
 * The profile used to start you at 1.45x on a 36-car field, which meant the
 * game opened at its own ceiling: you spent the first laps surviving rather
 * than overtaking, never strung a combo together, and so never saw the one
 * mechanic the scoring is built on. Starting at the authored base speed with a
 * lighter field costs nothing at the top end — ten overtakes still take you to
 * 185 — but it makes those ten overtakes reachable.
 *
 * `playerSpeed` multiplies the banded combo gains as well as the base, so
 * holding it at 1.0 is also what keeps each pass worth a legible +6 rather than
 * an invisible fraction of an already-high number.
 */
export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  master: {
    label: 'STANDARD',
    // The field is no longer a flat number: it scales with the circuit's lap so
    // the spacing between cars stays the same everywhere.
    blurb: '车流按赛道长度铺开 · 起步平缓 · 每超一辆车提速',
    playerSpeed: 1,
    trafficSpeed: 1,
    carCount: 24,
    aiSafetyScale: 0.75,
    aiDecisionScale: 0.75,
    maxSimultaneousAi: 3,
    invincibleSeconds: 1.15
  }
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  master: DIFFICULTY_PROFILES.master.label
};

/** The only setting, and the one every run starts on. */
export const DEFAULT_DIFFICULTY: Difficulty = 'master';

export const DIFFICULTIES: Difficulty[] = ['master'];

/** The profile in force, plus the mode's traffic scale folded into `traffic`. */
export const tuning = {
  profile: DIFFICULTY_PROFILES.master,
  player: DIFFICULTY_PROFILES.master.playerSpeed,
  traffic: DIFFICULTY_PROFILES.master.trafficSpeed
};

export function applyTuning(difficulty: Difficulty, trafficScale: number): void {
  const profile = DIFFICULTY_PROFILES[difficulty];
  tuning.profile = profile;
  tuning.player = profile.playerSpeed;
  tuning.traffic = profile.trafficSpeed * trafficScale;
}

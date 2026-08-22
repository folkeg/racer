/**
 * Daily challenge.
 *
 * One fixed mode and one fixed traffic seed per calendar day, identical for
 * everyone, so scores are directly comparable and there is a shared thing to
 * talk about. That is what turns a leaderboard from a list into a conversation.
 *
 * It runs exactly like an ordinary attempt at that mode — same rules, same
 * ending — the only differences are the pinned traffic and that its best combo
 * is tracked separately from normal play, since the daily seed is not a fair
 * comparison to a free run.
 */

import { RELEASED_MODES } from './modes';
import type { ModeId } from './modes/types';
import { hashSeed } from './rng';

/** Time Attack scores in seconds where lower wins, which breaks a shared leaderboard. */
const DAILY_POOL: ModeId[] = RELEASED_MODES.filter((mode) => !mode.lowerIsBetter).map((mode) => mode.id);

export interface DailyPlan {
  /** YYYY-MM-DD, the leaderboard partition key. */
  day: string;
  modeId: ModeId;
  seed: number;
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function todayKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function dailyPlan(day: string = todayKey()): DailyPlan {
  const seed = hashSeed(`harbor-loop:${day}`);
  // Derive the mode from a second hash so it is not correlated with the seed.
  const modeIndex = hashSeed(`mode:${day}`) % DAILY_POOL.length;
  return { day, modeId: DAILY_POOL[modeIndex], seed };
}

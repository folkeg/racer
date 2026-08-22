/**
 * Personal best scores, kept per (mode, difficulty).
 *
 * WeChat storage is synchronous and tiny; the browser falls back to localStorage
 * so the preview build behaves the same. Any failure degrades to in-memory only,
 * because losing a best score must never break a run.
 */

import type { Difficulty, ModeId } from './modes/types';

const STORAGE_KEY = 'harbor-loop-bests-v1';

type BestTable = Record<string, number>;

let cache: BestTable | null = null;

function readRaw(): string | null {
  try {
    const anyWx = wx as unknown as { getStorageSync?(key: string): unknown };
    if (typeof anyWx.getStorageSync === 'function') {
      const value = anyWx.getStorageSync(STORAGE_KEY);
      return typeof value === 'string' && value ? value : null;
    }
  } catch (error) {
    /* fall through to localStorage */
  }
  try {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    /* storage unavailable */
  }
  return null;
}

function writeRaw(value: string): void {
  try {
    const anyWx = wx as unknown as { setStorageSync?(key: string, data: unknown): void };
    if (typeof anyWx.setStorageSync === 'function') {
      anyWx.setStorageSync(STORAGE_KEY, value);
      return;
    }
  } catch (error) {
    /* fall through to localStorage */
  }
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, value);
  } catch (error) {
    /* best scores stay in memory for this session */
  }
}

function table(): BestTable {
  if (cache) return cache;
  const raw = readRaw();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object') {
        cache = parsed as BestTable;
        return cache;
      }
    } catch (error) {
      /* corrupt payload: start clean rather than crash on launch */
    }
  }
  cache = {};
  return cache;
}

function key(modeId: ModeId, difficulty: Difficulty): string {
  return `${modeId}:${difficulty}`;
}

export function bestScore(modeId: ModeId, difficulty: Difficulty): number | null {
  const value = table()[key(modeId, difficulty)];
  return typeof value === 'number' ? value : null;
}

/** Records a score if it beats the stored one. Returns true when it is a new best. */
export function submitScore(
  modeId: ModeId,
  difficulty: Difficulty,
  score: number,
  lowerIsBetter: boolean
): boolean {
  const current = bestScore(modeId, difficulty);
  const improved = current === null || (lowerIsBetter ? score < current : score > current);
  if (!improved) return false;

  table()[key(modeId, difficulty)] = score;
  writeRaw(JSON.stringify(table()));
  return true;
}

const MUTE_KEY = 'harbor-loop-muted-v1';

export function loadMuted(): boolean {
  try {
    const anyWx = wx as unknown as { getStorageSync?(key: string): unknown };
    if (typeof anyWx.getStorageSync === 'function') return anyWx.getStorageSync(MUTE_KEY) === '1';
  } catch (error) {
    /* fall through */
  }
  try {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(MUTE_KEY) === '1';
  } catch (error) {
    /* unavailable */
  }
  return false;
}

export function saveMuted(muted: boolean): void {
  const value = muted ? '1' : '0';
  try {
    const anyWx = wx as unknown as { setStorageSync?(key: string, data: unknown): void };
    if (typeof anyWx.setStorageSync === 'function') {
      anyWx.setStorageSync(MUTE_KEY, value);
      return;
    }
  } catch (error) {
    /* fall through */
  }
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(MUTE_KEY, value);
  } catch (error) {
    /* preference stays in memory for this session */
  }
}

const ONBOARDED_KEY = 'harbor-loop-onboarded-v1';
const STREAK_KEY = 'harbor-loop-streak-v1';

function readFlag(key: string): string | null {
  try {
    const anyWx = wx as unknown as { getStorageSync?(key: string): unknown };
    if (typeof anyWx.getStorageSync === 'function') {
      const value = anyWx.getStorageSync(key);
      return typeof value === 'string' && value ? value : null;
    }
  } catch (error) {
    /* fall through */
  }
  try {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  } catch (error) {
    /* unavailable */
  }
  return null;
}

function writeFlag(key: string, value: string): void {
  try {
    const anyWx = wx as unknown as { setStorageSync?(key: string, data: unknown): void };
    if (typeof anyWx.setStorageSync === 'function') {
      anyWx.setStorageSync(key, value);
      return;
    }
  } catch (error) {
    /* fall through */
  }
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  } catch (error) {
    /* stays in memory for this session */
  }
}

export function loadOnboarded(): boolean {
  return readFlag(ONBOARDED_KEY) === '1';
}

export function saveOnboarded(done: boolean): void {
  writeFlag(ONBOARDED_KEY, done ? '1' : '0');
}

export interface Streak {
  /** Consecutive days with at least one run. */
  days: number;
  /** Last day counted, as YYYY-MM-DD. */
  lastDay: string;
}

export function loadStreak(): Streak {
  const raw = readFlag(STREAK_KEY);
  if (!raw) return { days: 0, lastDay: '' };
  try {
    const parsed = JSON.parse(raw) as Partial<Streak>;
    return {
      days: typeof parsed.days === 'number' ? parsed.days : 0,
      lastDay: typeof parsed.lastDay === 'string' ? parsed.lastDay : ''
    };
  } catch (error) {
    return { days: 0, lastDay: '' };
  }
}

export function saveStreak(streak: Streak): void {
  writeFlag(STREAK_KEY, JSON.stringify(streak));
}

const DAILY_BEST_KEY = 'harbor-loop-daily-best-v1';

type DailyBestTable = Record<string, number>;

let dailyBestCache: DailyBestTable | null = null;

function dailyBestTable(): DailyBestTable {
  if (dailyBestCache) return dailyBestCache;
  const raw = readFlag(DAILY_BEST_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object') {
        dailyBestCache = parsed as DailyBestTable;
        return dailyBestCache;
      }
    } catch (error) {
      /* corrupt payload: start clean rather than crash on launch */
    }
  }
  dailyBestCache = {};
  return dailyBestCache;
}

/**
 * Best combo ever reached on the daily challenge, kept separate from the mode's
 * ordinary-play best since the pinned daily traffic is not a fair comparison.
 */
export function dailyBestScore(modeId: ModeId): number | null {
  const value = dailyBestTable()[modeId];
  return typeof value === 'number' ? value : null;
}

/** Records a daily score if it beats the stored one. Returns true on a new best. */
export function submitDailyBest(modeId: ModeId, score: number): boolean {
  const current = dailyBestScore(modeId);
  if (current !== null && score <= current) return false;

  dailyBestTable()[modeId] = score;
  writeFlag(DAILY_BEST_KEY, JSON.stringify(dailyBestTable()));
  return true;
}

/** Total of every personal best, used as the single number for the friend ranking. */
export function careerPoints(): number {
  return Object.entries(table()).reduce((total, [entryKey, value]) => {
    // Time Attack stores seconds, where lower is better, so it must not inflate
    // the career total. Every other mode contributes its score directly.
    if (entryKey.startsWith('time-attack:')) return total;
    return total + (typeof value === 'number' ? value : 0);
  }, 0);
}

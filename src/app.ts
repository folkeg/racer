/** Screen state machine and the navigation between menu, race and results. */

import { audio } from './audio';
import { dailyPlan, todayKey } from './daily';
import { DEFAULT_DIFFICULTY } from './difficulty';
import { setShareContext, shareRun } from './share';
import { submitFriendScore, submitGlobalScore } from './leaderboard';
import { MODES } from './modes';
import type { Difficulty, ModeId, RunOutcome } from './modes/types';
import { modeById } from './modes';
import { modeUnlocked, starsFor } from './progress';
import { reviveAvailable, revive, run, startRun } from './run';
import { bestScore, careerPoints, dailyBestScore, submitDailyBest, submitScore } from './storage';
import type { TrackId } from './tracks';

export type Screen = 'MENU' | 'TRACKS' | 'PLAYING' | 'RESULT';

export interface ResultSummary {
  modeId: ModeId;
  difficulty: Difficulty;
  outcome: RunOutcome;
  score: number;
  best: number | null;
  newBest: boolean;
  scoreUnit: string;
  /** True for the daily challenge, tracked on its own best rather than a stage ladder. */
  daily: boolean;
  day: string;
}

export const app = {
  screen: 'MENU' as Screen,
  difficulty: DEFAULT_DIFFICULTY as Difficulty,
  /** Pixels the mode list is scrolled by; only used when the list overflows. */
  menuScroll: 0,
  /** Mode the track picker is choosing a circuit for. */
  trackPickerMode: null as ModeId | null,
  /** Circuit the current run is on, so a finished run can go back to the picker. */
  trackId: null as TrackId | null,
  result: null as ResultSummary | null
};

export function openMenu(): void {
  app.screen = 'MENU';
  app.trackPickerMode = null;
  app.trackId = null;
}

/** Opens the circuit picker for a mode rather than starting it straight away. */
export function openTrackPicker(modeId: ModeId): boolean {
  if (!modeUnlocked(modeId)) return false;
  app.trackPickerMode = modeId;
  app.screen = 'TRACKS';
  return true;
}

export function startMode(modeId: ModeId, trackId?: TrackId): boolean {
  // The menu already checks this; the guard keeps a deep link or a console call
  // from skipping the ladder.
  if (!modeUnlocked(modeId)) return false;
  app.trackId = trackId ?? null;
  startRun(modeId, app.difficulty, undefined, trackId);
  app.screen = 'PLAYING';
  return true;
}

/** Starts today's challenge: the released mode, raced on its pinned traffic. */
export function startDaily(): void {
  const plan = dailyPlan();
  app.trackPickerMode = null;
  app.trackId = null;
  startRun(plan.modeId, DEFAULT_DIFFICULTY, { seed: plan.seed });
  app.screen = 'PLAYING';
}

/**
 * Trades a share for a second chance.
 *
 * The mini game share API opens the picker but does not tell us whether the
 * player actually sent anything, and verifying it properly needs shareTicket
 * plus a server round trip. So the share fires and the revive is granted either
 * way; the point is to put sharing on the path of self-interest rather than to
 * police it.
 */
export function shareForRevive(): boolean {
  if (!reviveAvailable()) return false;
  if (run.outcome === 'cleared') audio.playFanfare();

  setShareContext({
    modeId: run.modeId,
    difficulty: run.difficulty,
    score: run.score,
    scoreUnit: modeById(run.modeId).scoreUnit,
    daily: run.daily,
    stars: starsFor(run.modeId, run.difficulty)
  });
  shareRun();
  revive();
  audio.playRevive();
  app.screen = 'PLAYING';
  return true;
}

export function canRevive(): boolean {
  return reviveAvailable();
}

export function retryRun(): void {
  const summary = app.result;
  if (!summary) {
    startMode(MODES[0].id);
    return;
  }
  // Retrying the daily challenge restarts it on the same seed, not a fresh one.
  if (summary.daily) startDaily();
  else {
    // Stay on whichever circuit was picked, rather than the mode's default.
    startRun(summary.modeId, summary.difficulty, undefined, app.trackId ?? undefined);
    app.screen = 'PLAYING';
  }
}

/**
 * One step back out of a run: to the circuit picker when the run was started
 * from it, otherwise all the way to the mode list.
 */
export function goBack(): void {
  if (app.trackPickerMode) app.screen = 'TRACKS';
  else openMenu();
}

/** Called once when a run stops, to bank the score and show the result screen. */
export function finishRun(): void {
  const mode = modeById(run.modeId);
  const lowerIsBetter = Boolean(mode.lowerIsBetter);

  // A timed-out Time Attack never finished the laps, so its clock is not a result,
  // and a zero is never worth recording as a personal best.
  const scoreCounts = run.score > 0 && !(lowerIsBetter && run.outcome !== 'cleared');
  // Daily runs keep their own best, separate from the mode's ordinary-play best,
  // since the pinned daily traffic is not a fair comparison to a free run.
  const newBest = scoreCounts && (run.daily
    ? submitDailyBest(run.modeId, run.score)
    : submitScore(run.modeId, run.difficulty, run.score, lowerIsBetter));

  app.result = {
    modeId: run.modeId,
    difficulty: run.difficulty,
    outcome: run.outcome,
    score: run.score,
    best: run.daily ? dailyBestScore(run.modeId) : bestScore(run.modeId, run.difficulty),
    newBest,
    scoreUnit: mode.scoreUnit,
    daily: run.daily,
    day: run.daily ? todayKey() : ''
  };

  setShareContext({
    modeId: run.modeId,
    difficulty: run.difficulty,
    score: run.score,
    scoreUnit: mode.scoreUnit,
    daily: run.daily,
    stars: starsFor(run.modeId, run.difficulty)
  });

  if (run.daily) {
    // Daily scores go to their own board, partitioned by date.
    submitGlobalScore('daily' as ModeId, run.difficulty, run.score, false, todayKey());
    submitFriendScore(careerPoints());
  } else if (newBest) {
    submitFriendScore(careerPoints());
    submitGlobalScore(run.modeId, run.difficulty, run.score, lowerIsBetter);
  }
  app.screen = 'RESULT';
}

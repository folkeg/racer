/**
 * Share hooks.
 *
 * WeChat shares a card into a chat; the title carries the score so the pull is
 * "beat this", not "try this game". Outside WeChat this is a no-op.
 */

import { DIFFICULTY_LABEL } from './difficulty';
import { modeById } from './modes';
import type { Difficulty, ModeId } from './modes/types';
import { renderShareCard } from './shareCard';

type ShareOptions = {
  title: string;
  query?: string;
  imageUrl?: string;
};

/**
 * What the next share should say. app.ts keeps this current rather than share.ts
 * importing app, which would make the two modules import each other.
 */
export interface ShareContext {
  modeId: ModeId;
  difficulty: Difficulty;
  score: number;
  scoreUnit: string;
  daily: boolean;
  stars: number;
}

let context: ShareContext | null = null;

export function setShareContext(next: ShareContext | null): void {
  context = next;
}

function shareTitle(): string {
  if (!context) return '心跳加速-冲刺 — 16 种模式的像素赛车';
  if (context.daily) {
    return `每日挑战我拿了 ${context.score}，你能过吗`;
  }
  const mode = modeById(context.modeId);
  return `我在 ${mode.name}(${DIFFICULTY_LABEL[context.difficulty]}) 拿了 ${context.score} ${context.scoreUnit}，来超我`;
}

function shareQuery(): string {
  if (!context) return '';
  // Lets a tapped card open straight into the mode that was shared.
  return `mode=${context.modeId}&difficulty=${context.difficulty}`;
}

/** Draws the score card, if the platform can turn a canvas into a file. */
function shareImage(): string | undefined {
  if (!context) return undefined;
  const path = renderShareCard({
    modeId: context.modeId,
    difficulty: context.difficulty,
    difficultyLabel: DIFFICULTY_LABEL[context.difficulty],
    score: context.score,
    scoreUnit: context.scoreUnit,
    stars: context.stars,
    daily: context.daily
  });
  return path ?? undefined;
}

export function shareRun(): void {
  const api = wx as unknown as { shareAppMessage?(options: ShareOptions): void };
  if (typeof api.shareAppMessage !== 'function') return;
  try {
    api.shareAppMessage({ title: shareTitle(), query: shareQuery(), imageUrl: shareImage() });
  } catch (error) {
    /* sharing is optional */
  }
}

/** Registers the pull-down / menu share entry so every share carries a score. */
export function installShareMenu(): void {
  const api = wx as unknown as {
    showShareMenu?(options: { withShareTicket?: boolean }): void;
    onShareAppMessage?(handler: () => ShareOptions): void;
  };
  try {
    api.showShareMenu?.({ withShareTicket: true });
    api.onShareAppMessage?.(() => ({ title: shareTitle(), query: shareQuery(), imageUrl: shareImage() }));
  } catch (error) {
    /* sharing is optional */
  }
}

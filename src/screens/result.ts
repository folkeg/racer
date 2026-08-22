/** Result screen: score card, friend ranking and the three actions. */

import { app, canRevive, goBack, retryRun, shareForRevive } from '../app';
import { audio } from '../audio';
import { DIFFICULTY_PROFILES } from '../difficulty';
import {
  globalBoard,
  globalBoardAvailable,
  leaderboardAvailable,
  requestFriendRanking,
  sharedCanvas
} from '../leaderboard';
import { modeById } from '../modes';
import { nextStarTarget, starsFor } from '../progress';
import { drawStar } from '../render/icons';
import { ctx, DESIGN_H, DESIGN_W, DPR } from '../platform';
import {
  chip,
  chunkyButton,
  headline,
  hits,
  panel,
  screenBackground,
  type Rect
} from '../render/ui';
import { shareRun } from '../share';
import { UI } from '../theme';

const MARGIN = 20;
const CONTENT_W = DESIGN_W - MARGIN * 2;

const SCORE_CARD: Rect = { x: MARGIN, y: 96, w: CONTENT_W, h: 214 };
const RANK_CARD: Rect = { x: MARGIN, y: 328, w: CONTENT_W, h: 300 };

const RETRY: Rect = { x: MARGIN, y: 648, w: CONTENT_W, h: 56 };
const SHARE: Rect = { x: MARGIN, y: 716, w: CONTENT_W / 2 - 5, h: 50 };
const MENU: Rect = { x: MARGIN + CONTENT_W / 2 + 5, y: 716, w: CONTENT_W / 2 - 5, h: 50 };

const OUTCOME: Record<string, { text: string; fill: string }> = {
  cleared: { text: '目标达成', fill: UI.good },
  timeout: { text: '时间到', fill: UI.primary },
  wrecked: { text: '撞毁', fill: UI.bad },
  running: { text: '', fill: UI.primary }
};

let rankingRequested = false;
/** Which board the rank card is showing. Friends first: it loads instantly. */
let boardTab: 'friends' | 'global' = 'friends';

const TAB_FRIENDS: Rect = { x: 0, y: 0, w: 0, h: 0 };
const TAB_GLOBAL: Rect = { x: 0, y: 0, w: 0, h: 0 };

function layoutTabs(): void {
  const w = 66;
  const h = 22;
  TAB_GLOBAL.x = RANK_CARD.x + RANK_CARD.w - 14 - w;
  TAB_GLOBAL.y = RANK_CARD.y + 12;
  TAB_GLOBAL.w = w;
  TAB_GLOBAL.h = h;

  TAB_FRIENDS.x = TAB_GLOBAL.x - w - 6;
  TAB_FRIENDS.y = TAB_GLOBAL.y;
  TAB_FRIENDS.w = w;
  TAB_FRIENDS.h = h;
}

export function enterResultScreen(): void {
  rankingRequested = false;
  boardTab = 'friends';
}

export function drawResult(): void {
  const summary = app.result;
  if (!summary) return;
  const mode = modeById(summary.modeId);
  const outcome = OUTCOME[summary.outcome] ?? OUTCOME.running;

  screenBackground(DESIGN_W, DESIGN_H);

  const title = summary.daily ? '每日挑战' : mode.name;
  headline(title, DESIGN_W / 2, 56, summary.daily ? 21 : 24, UI.card, 'center');

  ctx.font = '900 11px sans-serif';
  const diffLabel = DIFFICULTY_PROFILES[summary.difficulty].label;
  const diffWidth = Math.max(72, ctx.measureText(diffLabel).width + 32);
  chip(
    { x: (DESIGN_W - diffWidth) / 2, y: 66, w: diffWidth, h: 22 },
    diffLabel,
    UI.chip,
    UI.primary
  );

  // --- score card ---
  panel(SCORE_CARD, { fill: UI.card, radius: 18, lift: 6 });

  ctx.textAlign = 'center';
  ctx.fillStyle = outcome.fill;
  ctx.font = '900 17px sans-serif';
  ctx.fillText(outcome.text, DESIGN_W / 2, SCORE_CARD.y + 34);

  ctx.fillStyle = UI.ink;
  ctx.font = '900 70px monospace';
  ctx.fillText(String(summary.score), DESIGN_W / 2, SCORE_CARD.y + 116);

  ctx.fillStyle = UI.inkSoft;
  ctx.font = '900 11px sans-serif';
  ctx.fillText(summary.scoreUnit, DESIGN_W / 2, SCORE_CARD.y + 138);

  // Stars are the progression currency, earned through ordinary play only.
  const earned = summary.daily ? 0 : starsFor(summary.modeId, summary.difficulty);
  for (let i = 0; i < 3 && !summary.daily; i++) {
    drawStar(DESIGN_W / 2 - 34 + i * 34, SCORE_CARD.y + 162, 14, i < earned ? UI.primary : 'rgba(34,50,63,0.16)', i < earned);
  }

  const target = summary.daily ? null : nextStarTarget(summary.modeId, summary.difficulty);
  ctx.textAlign = 'center';
  ctx.fillStyle = UI.inkSoft;
  ctx.font = '700 10px sans-serif';
  if (summary.newBest) {
    ctx.fillStyle = UI.primaryDeep;
    ctx.font = '900 11px sans-serif';
    ctx.fillText('NEW BEST!', DESIGN_W / 2, SCORE_CARD.y + 192);
  } else if (target !== null) {
    ctx.fillText(`下一颗星：${target} ${summary.scoreUnit}`, DESIGN_W / 2, SCORE_CARD.y + 192);
  } else if (summary.best !== null) {
    ctx.fillText(`BEST ${summary.best}`, DESIGN_W / 2, SCORE_CARD.y + 192);
  }

  drawRankingPanel();

  // A revive is worth more than a restart, so it takes the primary slot.
  if (canRevive()) {
    chunkyButton(RETRY, '分享复活 · 继续这一局', 'good', 16);
  } else {
    chunkyButton(RETRY, '再来一次', 'primary', 18);
  }
  chunkyButton(SHARE, '分享成绩', 'good', 15);
  chunkyButton(MENU, app.trackPickerMode ? '选择赛道' : '选择模式', 'plain', 15);
}

function drawRankingPanel(): void {
  panel(RANK_CARD, { fill: UI.chip, radius: 16, lift: 5 });
  layoutTabs();

  ctx.textAlign = 'left';
  ctx.fillStyle = UI.card;
  ctx.font = '900 12px sans-serif';
  ctx.fillText('排行榜', RANK_CARD.x + 14, RANK_CARD.y + 28);

  drawTab(TAB_FRIENDS, '好友', boardTab === 'friends');
  drawTab(TAB_GLOBAL, '全服', boardTab === 'global');

  const listY = RANK_CARD.y + 42;
  const listH = RANK_CARD.h - 52;

  if (boardTab === 'friends') drawFriendBoard(listY, listH);
  else drawGlobalBoard(listY, listH);
}

function drawTab(rect: Rect, label: string, active: boolean): void {
  chip(rect, label, active ? UI.primary : 'rgba(255,246,228,0.12)', active ? UI.ink : UI.card, 10);
}

function drawFriendBoard(listY: number, listH: number): void {
  ctx.textAlign = 'center';
  if (!leaderboardAvailable()) {
    ctx.fillStyle = 'rgba(255,246,228,0.38)';
    ctx.font = '600 11px sans-serif';
    ctx.fillText('好友榜仅在微信小游戏内可用', DESIGN_W / 2, RANK_CARD.y + RANK_CARD.h / 2);
    return;
  }

  if (!rankingRequested) {
    requestFriendRanking(RANK_CARD.w - 20, listH, DPR);
    rankingRequested = true;
  }

  const shared = sharedCanvas();
  if (shared) {
    try {
      // The open data context renders at device resolution; scale it back down.
      ctx.drawImage(shared as unknown as CanvasImageSource, RANK_CARD.x + 10, listY, RANK_CARD.w - 20, listH);
    } catch (error) {
      /* the sub-context may not have painted yet */
    }
  }
}

function drawGlobalBoard(listY: number, listH: number): void {
  const summary = app.result;
  ctx.textAlign = 'center';

  if (!summary || !globalBoardAvailable()) {
    ctx.fillStyle = 'rgba(255,246,228,0.38)';
    ctx.font = '600 11px sans-serif';
    ctx.fillText('全服榜需要配置云开发环境', DESIGN_W / 2, RANK_CARD.y + RANK_CARD.h / 2 - 8);
    ctx.font = '600 9px sans-serif';
    ctx.fillText('见 README 的云开发部署说明', DESIGN_W / 2, RANK_CARD.y + RANK_CARD.h / 2 + 10);
    return;
  }

  const board = summary.daily
    ? globalBoard('daily' as typeof summary.modeId, summary.difficulty, summary.day)
    : globalBoard(summary.modeId, summary.difficulty);
  if (board.state === 'loading') {
    ctx.fillStyle = 'rgba(255,246,228,0.38)';
    ctx.font = '600 11px sans-serif';
    ctx.fillText('加载中…', DESIGN_W / 2, RANK_CARD.y + RANK_CARD.h / 2);
    return;
  }
  if (board.state === 'failed' || board.rows.length === 0) {
    ctx.fillStyle = 'rgba(255,246,228,0.38)';
    ctx.font = '600 11px sans-serif';
    ctx.fillText(board.state === 'failed' ? '加载失败' : '还没有人上榜，你可以是第一个', DESIGN_W / 2, RANK_CARD.y + RANK_CARD.h / 2);
    return;
  }

  const rowH = 22;
  const visible = Math.min(board.rows.length, Math.floor((listH - 16) / rowH));
  for (let i = 0; i < visible; i++) {
    const row = board.rows[i];
    const y = listY + i * rowH;

    if (row.self) {
      ctx.fillStyle = 'rgba(87,213,203,0.16)';
      ctx.fillRect(RANK_CARD.x + 8, y - 2, RANK_CARD.w - 16, rowH - 2);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = i < 3 ? UI.primary : 'rgba(255,246,228,0.5)';
    ctx.font = '900 11px monospace';
    ctx.fillText(String(row.rank), RANK_CARD.x + 14, y + 12);

    ctx.fillStyle = UI.card;
    ctx.font = '600 11px sans-serif';
    ctx.fillText(row.nickname.slice(0, 8), RANK_CARD.x + 40, y + 12);

    ctx.textAlign = 'right';
    ctx.fillStyle = row.self ? UI.primary : 'rgba(255,246,228,0.75)';
    ctx.font = '900 11px monospace';
    ctx.fillText(String(row.score), RANK_CARD.x + RANK_CARD.w - 14, y + 12);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,246,228,0.5)';
  ctx.font = '700 9px sans-serif';
  const rankText = board.selfRank ? `你排第 ${board.selfRank} / ${board.total}` : `共 ${board.total} 人上榜`;
  ctx.fillText(rankText, DESIGN_W / 2, RANK_CARD.y + RANK_CARD.h - 10);
}

/** Returns true when the tap was consumed. */
export function handleResultTap(x: number, y: number): boolean {
  layoutTabs();
  if (hits(TAB_FRIENDS, x, y)) {
    audio.playUiTap();
    boardTab = 'friends';
    return true;
  }
  if (hits(TAB_GLOBAL, x, y)) {
    audio.playUiTap();
    boardTab = 'global';
    return true;
  }
  if (hits(RETRY, x, y)) {
    audio.playUiConfirm();
    // Same button, different promise depending on whether a revive is left.
    if (!shareForRevive()) retryRun();
    return true;
  }
  if (hits(MENU, x, y)) {
    audio.playUiTap();
    goBack();
    return true;
  }
  if (hits(SHARE, x, y)) {
    audio.playUiConfirm();
    shareRun();
    return true;
  }
  return false;
}

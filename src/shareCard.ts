/**
 * Share image.
 *
 * A chat card with a picture gets opened; a line of text does not. WeChat crops
 * share images to 5:4, so the card is drawn at that ratio into an offscreen
 * canvas and handed to shareAppMessage as a temp file.
 *
 * Everything degrades: without toTempFilePathSync (browser preview, or an old
 * base library) the share simply falls back to its title.
 */

import { createOffscreenCanvas, withRenderTarget } from './platform';
import { modeById } from './modes';
import type { Difficulty, ModeId } from './modes/types';
import { drawStar } from './render/icons';
import { centerPath } from './track';
import { UI } from './theme';

const CARD_W = 500;
const CARD_H = 400;

export interface ShareCardData {
  modeId: ModeId;
  difficulty: Difficulty;
  difficultyLabel: string;
  score: number;
  scoreUnit: string;
  stars: number;
  daily: boolean;
}

type FileCanvas = WxCanvas & {
  toTempFilePathSync?(options: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    destWidth?: number;
    destHeight?: number;
    fileType?: string;
    quality?: number;
  }): string;
};

let cardCanvas: FileCanvas | null = null;
let cardCtx: CanvasRenderingContext2D | null = null;

function ensureCanvas(): boolean {
  if (cardCanvas && cardCtx) return true;
  cardCanvas = createOffscreenCanvas(CARD_W, CARD_H) as FileCanvas | null;
  cardCtx = cardCanvas ? cardCanvas.getContext('2d') : null;
  return Boolean(cardCanvas && cardCtx);
}

/** A small outline of the circuit, so the picture says "racing" at a glance. */
function drawTrackSketch(target: CanvasRenderingContext2D, cx: number, cy: number, height: number): void {
  if (centerPath.length < 2) return;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of centerPath) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }

  const scale = height / Math.max(1, maxY - minY);
  const originX = cx - ((minX + maxX) / 2) * scale;
  const originY = cy - ((minY + maxY) / 2) * scale;

  target.save();
  target.beginPath();
  for (let i = 0; i < centerPath.length; i++) {
    const x = originX + centerPath[i].x * scale;
    const y = originY + centerPath[i].y * scale;
    if (i === 0) target.moveTo(x, y);
    else target.lineTo(x, y);
  }
  target.closePath();
  target.strokeStyle = 'rgba(255,246,228,0.16)';
  target.lineWidth = 9;
  target.lineJoin = 'round';
  target.stroke();
  target.restore();
}

/** Renders the card and returns a temp file path, or null if unavailable. */
export function renderShareCard(data: ShareCardData): string | null {
  if (!ensureCanvas() || !cardCanvas || !cardCtx) return null;
  const target = cardCtx;

  target.setTransform(1, 0, 0, 1, 0, 0);
  target.fillStyle = UI.ground;
  target.fillRect(0, 0, CARD_W, CARD_H);

  // Diagonal banding, the same texture the menus use.
  target.save();
  target.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = -CARD_H; i < CARD_W + CARD_H; i += 46) {
    target.beginPath();
    target.moveTo(i, 0);
    target.lineTo(i + 20, 0);
    target.lineTo(i + 20 + CARD_H, CARD_H);
    target.lineTo(i + CARD_H, CARD_H);
    target.closePath();
    target.fill();
  }
  target.restore();

  drawTrackSketch(target, CARD_W - 108, CARD_H / 2, CARD_H * 0.78);

  withRenderTarget(target, () => {
    const mode = modeById(data.modeId);

    target.textAlign = 'left';
    target.fillStyle = UI.primary;
    target.font = '900 20px sans-serif';
    target.fillText('心跳加速-冲刺', 40, 56);

    target.fillStyle = UI.card;
    target.font = '900 34px sans-serif';
    target.fillText(data.daily ? '每日挑战' : mode.name, 40, 108);

    target.fillStyle = 'rgba(255,246,228,0.6)';
    target.font = '700 15px sans-serif';
    target.fillText(data.difficultyLabel, 40, 134);

    target.fillStyle = UI.card;
    target.font = '900 92px monospace';
    target.fillText(String(data.score), 38, 236);

    target.fillStyle = 'rgba(255,246,228,0.6)';
    target.font = '900 16px sans-serif';
    target.fillText(data.scoreUnit, 42, 264);

    for (let i = 0; i < 3; i++) {
      drawStar(56 + i * 40, 310, 16, i < data.stars ? UI.primary : 'rgba(255,246,228,0.18)', i < data.stars);
    }

    target.fillStyle = 'rgba(255,246,228,0.45)';
    target.font = '700 14px sans-serif';
    target.fillText('来超我', 40, 364);
  });

  const canvas = cardCanvas;
  if (typeof canvas.toTempFilePathSync !== 'function') return null;
  try {
    return canvas.toTempFilePathSync({
      x: 0,
      y: 0,
      width: CARD_W,
      height: CARD_H,
      destWidth: CARD_W,
      destHeight: CARD_H,
      fileType: 'png'
    });
  } catch (error) {
    return null;
  }
}

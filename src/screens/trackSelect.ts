/**
 * Circuit picker: a square thumbnail per track and nothing else.
 *
 * Sits between the mode list and the race. A mode still names a default
 * circuit, but every mode can be raced on any of them, and the shape is the
 * whole pitch — the names never meant anything until you had seen the lap, so
 * the cards carry no text at all.
 */

import { app, openMenu, startMode } from '../app';
import { audio } from '../audio';
import { ctx, DESIGN_H, DESIGN_W } from '../platform';
import { chunkyButton, hits, panel, screenBackground, type Rect } from '../render/ui';
import { TRACKS } from '../tracks';
import { UI } from '../theme';
import type { Vec2 } from '../types';

const MARGIN = 14;
const GAP = 12;
/**
 * Three across rather than two. The cards only ever hold a shape, so they read
 * fine small, and this list is expected to grow — a denser grid keeps more
 * circuits reachable without scrolling, and looks less blunt while it is short.
 */
const COLUMNS = 3;
/** Square, so the lap is never stretched to fit its own card. */
const CELL = (DESIGN_W - MARGIN * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
/** No heading above it, so the grid starts near the top of the screen. */
const GRID_TOP = 64;
/** Breathing room between the card edge and the lap drawn inside it. */
const INSET = CELL * 0.13;

const BACK: Rect = { x: MARGIN, y: DESIGN_H - 84, w: DESIGN_W - MARGIN * 2, h: 54 };

interface TrackBounds {
  points: Vec2[];
  minX: number;
  minY: number;
  width: number;
  height: number;
}

/** Lap outlines never change, so measure each one only once. */
const boundsCache = new Map<string, TrackBounds>();

function trackBounds(trackId: string): TrackBounds {
  const cached = boundsCache.get(trackId);
  if (cached) return cached;

  const points = TRACKS.find((track) => track.id === trackId)!.build();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }

  const measured = { points, minX, minY, width: maxX - minX, height: maxY - minY };
  boundsCache.set(trackId, measured);
  return measured;
}

function cardRect(index: number): Rect {
  const column = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);
  return {
    x: MARGIN + column * (CELL + GAP),
    y: GRID_TOP + row * (CELL + GAP),
    w: CELL,
    h: CELL
  };
}

/** The lap, scaled to fit a box and centred in it. */
function drawThumbnail(trackId: string, box: Rect): void {
  const bounds = trackBounds(trackId);
  const scale = Math.min(box.w / bounds.width, box.h / bounds.height);
  const originX = box.x + (box.w - bounds.width * scale) / 2;
  const originY = box.y + (box.h - bounds.height * scale) / 2;

  ctx.beginPath();
  bounds.points.forEach((point, index) => {
    const x = originX + (point.x - bounds.minX) * scale;
    const y = originY + (point.y - bounds.minY) * scale;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();

  // Drawn twice: a fat dark stroke for the road, a thin light one down the
  // middle for the lane divider, which is what makes it read as a circuit
  // rather than an outline. Both are set off the card size so the shapes keep
  // the same weight if the grid ever changes density again.
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = CELL * 0.075;
  ctx.strokeStyle = 'rgba(34,50,63,0.35)';
  ctx.stroke();
  ctx.lineWidth = CELL * 0.011;
  ctx.strokeStyle = 'rgba(255,246,228,0.5)';
  ctx.stroke();
}

export function drawTrackSelect(): void {
  screenBackground(DESIGN_W, DESIGN_H);

  TRACKS.forEach((track, index) => {
    const rect = cardRect(index);
    panel(rect, { fill: UI.card, radius: 12, lift: 3, outlineWidth: 2 });
    drawThumbnail(track.id, {
      x: rect.x + INSET,
      y: rect.y + INSET,
      w: rect.w - INSET * 2,
      h: rect.h - INSET * 2
    });
  });

  chunkyButton(BACK, '返回', 'plain', 16);
  ctx.textAlign = 'center';
}

/** Returns true when the tap was consumed. */
export function handleTrackSelectTap(x: number, y: number): boolean {
  if (hits(BACK, x, y)) {
    audio.playUiTap();
    openMenu();
    return true;
  }

  const modeId = app.trackPickerMode;
  if (!modeId) return false;

  for (let i = 0; i < TRACKS.length; i++) {
    if (!hits(cardRect(i), x, y)) continue;
    audio.playUiConfirm();
    startMode(modeId, TRACKS[i].id);
    return true;
  }
  return false;
}

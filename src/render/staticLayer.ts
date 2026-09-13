/**
 * Cached track layer.
 *
 * The water, the road, the curbs and the decor never move, but redrawing them
 * cost about a millisecond a frame — the curb pass alone issues one stroke per
 * road segment, roughly two thousand calls per frame on the longer circuits.
 * Rendering them once per circuit into an offscreen canvas and blitting turns
 * that into a single drawImage.
 *
 * The layer is invalidated whenever the circuit changes, which is once per run.
 */

import {
  createOffscreenCanvas,
  ctx,
  DPR,
  offsetX,
  offsetY,
  scale,
  VIEW_H,
  VIEW_W,
  withRenderTarget
} from '../platform';
import { activeTrackId } from '../track';
import type { TrackId } from '../tracks';
import { drawTrack } from './road';
import { drawBackground } from './scenery';

let layer: WxCanvas | null = null;
let layerCtx: CanvasRenderingContext2D | null = null;
let renderedTrack: TrackId | null = null;
/** Set when the platform gives us no offscreen canvas, so we stop retrying. */
let unavailable = false;

function ensureLayer(): boolean {
  if (unavailable) return false;
  if (layer && layerCtx) return true;

  layer = createOffscreenCanvas(Math.floor(VIEW_W * DPR), Math.floor(VIEW_H * DPR));
  layerCtx = layer ? layer.getContext('2d') : null;
  if (!layer || !layerCtx) {
    unavailable = true;
    return false;
  }
  return true;
}

function renderLayer(target: CanvasRenderingContext2D): void {
  target.setTransform(DPR, 0, 0, DPR, 0, 0);
  target.clearRect(0, 0, VIEW_W, VIEW_H);
  target.save();
  target.translate(offsetX, offsetY);
  target.scale(scale, scale);
  withRenderTarget(target, () => {
    drawBackground();
    drawTrack();
  });
  target.restore();
}

/** Drops the cache so the next frame re-renders it. Call when the circuit changes. */
export function invalidateStaticLayer(): void {
  renderedTrack = null;
}

/**
 * Paints the static scene. Expects the main context to be at the device
 * transform, before the design-space translate/scale.
 */
export function drawStaticScene(): void {
  if (!ensureLayer() || !layer || !layerCtx) {
    // No offscreen canvas: fall back to drawing the scene live every frame.
    // No offscreen canvas: the whole scene is drawn live anyway, and the sea
    // has already been laid down by drawRace.
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    drawBackground();
    drawTrack();
    ctx.restore();
    return;
  }

  if (renderedTrack !== activeTrackId) {
    renderLayer(layerCtx);
    renderedTrack = activeTrackId;
  }

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(layer as unknown as CanvasImageSource, 0, 0);
  ctx.restore();
}

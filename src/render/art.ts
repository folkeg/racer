/**
 * Drawing the sprite sheet.
 *
 * One helper, because every drawn object wants the same three things: a shadow
 * on the ground, the image centred on its own footprint at a size given in plane
 * units, and the aspect ratio of the artwork respected. Getting any of those
 * wrong is how a sprite ends up looking pasted on — and the shadow is the one
 * that matters most, since without it the object floats however good the drawing
 * is.
 *
 * Returns false when the art has not loaded, so every caller can keep its
 * hand-drawn fallback and nothing breaks while the images are in flight or on a
 * platform that cannot fetch them.
 */

import { ctx } from '../platform';
import { propArt } from '../assets';
import { SHADOW_X, SHADOW_Y } from './light';

export interface ArtOptions {
  /** Radians, for things that face a direction. */
  angle?: number;
  /** Ground shadow, as a fraction of the sprite's width. 0 for no shadow. */
  shadow?: number;
  alpha?: number;
}

export function drawArt(
  name: string,
  x: number,
  y: number,
  width: number,
  options: ArtOptions = {}
): boolean {
  const image = propArt(name);
  if (!image || !image.width) return false;

  const height = width * (image.height / image.width);
  const shadow = options.shadow ?? 0.34;

  if (shadow > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(12,18,24,0.26)';
    ctx.beginPath();
    ctx.ellipse(
      x + SHADOW_X * width * 0.14,
      y + SHADOW_Y * width * 0.14,
      width * shadow,
      height * shadow * 0.62,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
  ctx.translate(x, y);
  if (options.angle) ctx.rotate(options.angle);
  ctx.drawImage(
    image as unknown as CanvasImageSource,
    -width / 2,
    -height / 2,
    width,
    height
  );
  ctx.restore();
  return true;
}

/** Whether a named sprite is ready, for callers that need to decide layout. */
export function artReady(name: string): boolean {
  const image = propArt(name);
  return Boolean(image && image.width);
}

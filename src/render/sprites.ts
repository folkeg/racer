/**
 * Pre-rendered vehicle art.
 *
 * The cars used to be assembled from a handful of rounded rectangles every
 * frame, which caps how much detail they can carry: anything more elaborate
 * costs frame time on every car, every frame. Drawing them once at ten times
 * their on-screen size and blitting the result inverts that — the illustration
 * can be as layered as it likes, and playback is a single drawImage per car,
 * which is also faster than the path work it replaces.
 *
 * Rendering large and scaling down is what gives the edges their smoothness; no
 * external image files are involved, so the mini game package does not grow.
 */

import { createOffscreenCanvas } from '../platform';
import type { VehicleStyle } from '../types';

/**
 * Design-space footprint of a car. Sprites are drawn to this shape.
 *
 * Scaled in step with LANE_GAP in config.ts — a car stays 87% of a lane's
 * width, which is what keeps five of them side by side without touching.
 */
export const CAR_LENGTH = 20.5;
export const CAR_WIDTH = 10.8;

/** How many device pixels per design unit the artwork is drawn at. */
const SUPERSAMPLE = 10;

const SPRITE_W = Math.round(CAR_LENGTH * SUPERSAMPLE);
const SPRITE_H = Math.round(CAR_WIDTH * SUPERSAMPLE);

export interface VehicleSprite {
  image: WxCanvas;
  shadow: WxCanvas;
}

function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Draws one car, nose pointing right, filling the sprite. Coordinates are in
 * supersampled pixels so the numbers read as a drawing rather than as maths.
 */
function paintCar(ctx: CanvasRenderingContext2D, style: VehicleStyle): void {
  const w = SPRITE_W;
  const h = SPRITE_H;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // --- wheels, sitting proud of the body on both sides ---------------------
  ctx.fillStyle = '#14181B';
  const wheelW = w * 0.155;
  const wheelH = h * 0.15;
  for (const wx of [w * 0.16, w * 0.66]) {
    roundedPath(ctx, wx, h * 0.02, wheelW, wheelH, wheelH * 0.45);
    ctx.fill();
    roundedPath(ctx, wx, h * 0.83, wheelW, wheelH, wheelH * 0.45);
    ctx.fill();
  }

  // --- contact shadow under the body ---------------------------------------
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = '#05090C';
  roundedPath(ctx, w * 0.03, h * 0.16, w * 0.94, h * 0.74, h * 0.3);
  ctx.fill();
  ctx.restore();

  // --- body, lit from the top-left -----------------------------------------
  const bodyGradient = ctx.createLinearGradient(0, h * 0.1, w * 0.35, h);
  bodyGradient.addColorStop(0, style.rim);
  bodyGradient.addColorStop(0.28, style.body);
  bodyGradient.addColorStop(1, style.side);
  ctx.fillStyle = bodyGradient;
  roundedPath(ctx, w * 0.02, h * 0.12, w * 0.96, h * 0.76, h * 0.28);
  ctx.fill();

  // Nose taper: a slightly darker wedge reads as a sloped bonnet.
  const noseGradient = ctx.createLinearGradient(w * 0.72, 0, w, 0);
  noseGradient.addColorStop(0, 'rgba(0,0,0,0)');
  noseGradient.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = noseGradient;
  roundedPath(ctx, w * 0.02, h * 0.12, w * 0.96, h * 0.76, h * 0.28);
  ctx.fill();

  // --- cabin ---------------------------------------------------------------
  const cabinGradient = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.8);
  cabinGradient.addColorStop(0, style.cabin);
  cabinGradient.addColorStop(1, style.side);
  ctx.fillStyle = cabinGradient;
  roundedPath(ctx, w * 0.3, h * 0.2, w * 0.34, h * 0.6, h * 0.2);
  ctx.fill();

  // --- glass ---------------------------------------------------------------
  const glassGradient = ctx.createLinearGradient(w * 0.34, h * 0.26, w * 0.6, h * 0.74);
  glassGradient.addColorStop(0, '#EAFBFF');
  glassGradient.addColorStop(0.45, style.window);
  glassGradient.addColorStop(1, '#40626E');
  ctx.fillStyle = glassGradient;
  roundedPath(ctx, w * 0.345, h * 0.27, w * 0.25, h * 0.46, h * 0.14);
  ctx.fill();

  // Reflection streak across the glass.
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(w * 0.37, h * 0.3);
  ctx.lineTo(w * 0.45, h * 0.3);
  ctx.lineTo(w * 0.4, h * 0.7);
  ctx.lineTo(w * 0.35, h * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // --- racing stripe -------------------------------------------------------
  if (style.stripe) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = style.stripe;
    ctx.fillRect(w * 0.06, cy - h * 0.055, w * 0.88, h * 0.11);
    ctx.restore();
  }

  // --- panel line ----------------------------------------------------------
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = '#05090C';
  ctx.lineWidth = Math.max(1, h * 0.02);
  ctx.beginPath();
  ctx.moveTo(w * 0.66, h * 0.18);
  ctx.lineTo(w * 0.66, h * 0.82);
  ctx.stroke();
  ctx.restore();

  // --- lights --------------------------------------------------------------
  ctx.fillStyle = style.lights;
  roundedPath(ctx, w * 0.9, h * 0.2, w * 0.07, h * 0.2, h * 0.06);
  ctx.fill();
  roundedPath(ctx, w * 0.9, h * 0.6, w * 0.07, h * 0.2, h * 0.06);
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#C4413A';
  roundedPath(ctx, w * 0.035, h * 0.26, w * 0.05, h * 0.16, h * 0.05);
  ctx.fill();
  roundedPath(ctx, w * 0.035, h * 0.58, w * 0.05, h * 0.16, h * 0.05);
  ctx.fill();
  ctx.restore();

  // --- rim light along the lit edge ---------------------------------------
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = style.rim;
  ctx.lineWidth = Math.max(1.4, h * 0.035);
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.145);
  ctx.lineTo(w * 0.86, h * 0.145);
  ctx.stroke();
  ctx.restore();
}

/** A soft dark silhouette, used as the car's cast shadow on the road. */
function paintShadow(ctx: CanvasRenderingContext2D): void {
  const w = SPRITE_W;
  const h = SPRITE_H;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#040A0E';
  roundedPath(ctx, w * 0.02, h * 0.12, w * 0.96, h * 0.76, h * 0.28);
  ctx.fill();
}

function build(paint: (ctx: CanvasRenderingContext2D) => void): WxCanvas | null {
  const canvas = createOffscreenCanvas(SPRITE_W, SPRITE_H);
  const ctx = canvas ? canvas.getContext('2d') : null;
  if (!canvas || !ctx) return null;
  paint(ctx);
  return canvas;
}

const cache = new Map<string, VehicleSprite | null>();

/**
 * Builds (once) and returns the sprite pair for a style. Returns null when the
 * platform gives us no offscreen canvas, and vehicles.ts falls back to drawing
 * the old primitive car.
 */
export function vehicleSprite(key: string, style: VehicleStyle): VehicleSprite | null {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const image = build((ctx) => paintCar(ctx, style));
  const shadow = build(paintShadow);
  const sprite = image && shadow ? { image, shadow } : null;
  cache.set(key, sprite);
  return sprite;
}


// ---------------------------------------------------------------------------
// Surface textures
// ---------------------------------------------------------------------------

const ASPHALT_TILE = 96;

let asphaltPattern: CanvasPattern | null = null;
let asphaltTried = false;

/**
 * A tileable asphalt grain, built once. Flat colour is what makes a drawn road
 * look like a diagram; a little noise is what makes it look like a surface.
 *
 * Drawn as a pattern stroked along the circuit, so the grain only ever lands on
 * the road itself.
 */
export function asphaltTexture(target: CanvasRenderingContext2D): CanvasPattern | null {
  if (asphaltTried) return asphaltPattern;
  asphaltTried = true;

  const canvas = createOffscreenCanvas(ASPHALT_TILE, ASPHALT_TILE);
  const ctx = canvas ? canvas.getContext('2d') : null;
  if (!canvas || !ctx) return null;

  ctx.clearRect(0, 0, ASPHALT_TILE, ASPHALT_TILE);
  // Two densities of speckle: coarse aggregate over a fine grain.
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * ASPHALT_TILE;
    const y = Math.random() * ASPHALT_TILE;
    const light = Math.random() < 0.5;
    ctx.fillStyle = light ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 1, 1);
  }
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * ASPHALT_TILE;
    const y = Math.random() * ASPHALT_TILE;
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
    ctx.fillRect(x, y, 2, 2);
  }

  try {
    asphaltPattern = target.createPattern(canvas as unknown as CanvasImageSource, 'repeat');
  } catch (error) {
    asphaltPattern = null;
  }
  return asphaltPattern;
}


const WATER_TILE = 128;

let waterPattern: CanvasPattern | null = null;
let waterTried = false;

/**
 * Tileable water ripple.
 *
 * The old water was a gradient with evenly spaced horizontal lines, which reads
 * as ruled paper. Real water has ripples at several scales with no repeating
 * rhythm, so this lays down three bands of soft wave crests at different
 * frequencies and offsets, wrapped so the tile is seamless.
 */
export function waterTexture(target: CanvasRenderingContext2D): CanvasPattern | null {
  if (waterTried) return waterPattern;
  waterTried = true;

  const canvas = createOffscreenCanvas(WATER_TILE, WATER_TILE);
  const ctx = canvas ? canvas.getContext('2d') : null;
  if (!canvas || !ctx) return null;

  ctx.clearRect(0, 0, WATER_TILE, WATER_TILE);
  ctx.lineCap = 'round';

  // Whole numbers of cycles across the tile keep the seams invisible.
  const bands = [
    { cycles: 3, amplitude: 3.2, spacing: 9, alpha: 0.10, width: 1.5, phase: 0 },
    { cycles: 5, amplitude: 2.0, spacing: 14, alpha: 0.07, width: 1.1, phase: 1.7 },
    { cycles: 2, amplitude: 4.4, spacing: 21, alpha: 0.06, width: 2.4, phase: 3.1 }
  ];

  for (const band of bands) {
    ctx.strokeStyle = `rgba(255,255,255,${band.alpha})`;
    ctx.lineWidth = band.width;
    for (let y = 0; y < WATER_TILE; y += band.spacing) {
      ctx.beginPath();
      for (let x = 0; x <= WATER_TILE; x += 4) {
        const wave = Math.sin((x / WATER_TILE) * Math.PI * 2 * band.cycles + band.phase + y * 0.11);
        const yy = y + wave * band.amplitude;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }

  // A sparse scatter of brighter glints, for the sense of a moving surface.
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * WATER_TILE;
    const y = Math.random() * WATER_TILE;
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.ellipse(x, y, 2.6, 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  try {
    waterPattern = target.createPattern(canvas as unknown as CanvasImageSource, 'repeat');
  } catch (error) {
    waterPattern = null;
  }
  return waterPattern;
}


const GRASS_TILE = 72;

let grassPattern: CanvasPattern | null = null;
let grassTried = false;

/**
 * Tileable grass. Short strokes at mixed angles and tones: flat green reads as
 * a shape cut out of paper, and the banks are a large enough share of the frame
 * for that to matter.
 */
export function grassTexture(target: CanvasRenderingContext2D): CanvasPattern | null {
  if (grassTried) return grassPattern;
  grassTried = true;

  const canvas = createOffscreenCanvas(GRASS_TILE, GRASS_TILE);
  const ctx = canvas ? canvas.getContext('2d') : null;
  if (!canvas || !ctx) return null;

  ctx.clearRect(0, 0, GRASS_TILE, GRASS_TILE);
  ctx.lineCap = 'round';
  ctx.lineWidth = 1;

  for (let i = 0; i < 520; i++) {
    const x = Math.random() * GRASS_TILE;
    const y = Math.random() * GRASS_TILE;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
    const length = 1.6 + Math.random() * 2.4;
    const light = Math.random() < 0.5;
    ctx.strokeStyle = light ? 'rgba(255,255,235,0.13)' : 'rgba(80,96,50,0.16)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }

  try {
    grassPattern = target.createPattern(canvas as unknown as CanvasImageSource, 'repeat');
  } catch (error) {
    grassPattern = null;
  }
  return grassPattern;
}

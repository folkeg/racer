/** Water, park medians and buoys — everything behind the road. */

import { ctx, DESIGN_H, DESIGN_W } from '../platform';
import { CONTROL_BAR_TOP } from '../controls';
import { COLORS } from '../theme';
import { activeTrackId } from '../track';
import { grassTexture, groundTexture, groundTileSize } from './sprites';
import { surfaceFor } from './surface';
import { drawProps } from './props';
import { drawInfield } from './infield';
import { activeTrackId as currentTrack } from '../track';
import { trackById } from '../tracks';
import { project } from './camera';
import { ISLAND_DEPTH, ISLAND_WALL_HEIGHT, SHADOW_X, SHADOW_Y } from './light';
import { fillNearFaces, fillRibbon } from './primitives';
import type { Vec2 } from '../types';

export function drawTree(x: number, y: number, size = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(13,35,30,0.22)';
  ctx.beginPath(); ctx.ellipse(2, 4, 9 * size, 5 * size, 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5C7E48';
  ctx.beginPath(); ctx.arc(-3 * size, 0, 6.5 * size, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#739556';
  ctx.beginPath(); ctx.arc(3 * size, -2 * size, 7 * size, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#94AD69';
  ctx.beginPath(); ctx.arc(0, -6 * size, 5.5 * size, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/**
 * A moored boat: hull, deck and cabin, pointing along `angle`. These are what
 * make the water read as a marina rather than as empty background.
 */
export function drawBoat(x: number, y: number, size: number, angle: number): void {
  const length = 26 * size;
  const beam = 8.5 * size;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Shadow on the water.
  ctx.fillStyle = 'rgba(60,80,92,0.28)';
  ctx.beginPath();
  ctx.ellipse(1.5 * size, 1.8 * size, length * 0.5, beam * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hull: a pointed bow at +x tapering to a square transom at -x.
  ctx.fillStyle = '#F4F3EE';
  ctx.beginPath();
  ctx.moveTo(length * 0.5, 0);
  ctx.quadraticCurveTo(length * 0.12, -beam * 0.5, -length * 0.42, -beam * 0.42);
  ctx.lineTo(-length * 0.5, -beam * 0.3);
  ctx.lineTo(-length * 0.5, beam * 0.3);
  ctx.lineTo(-length * 0.42, beam * 0.42);
  ctx.quadraticCurveTo(length * 0.12, beam * 0.5, length * 0.5, 0);
  ctx.closePath();
  ctx.fill();

  // Deck and cabin.
  ctx.fillStyle = '#D8DCDA';
  ctx.beginPath();
  ctx.moveTo(length * 0.32, 0);
  ctx.quadraticCurveTo(length * 0.05, -beam * 0.3, -length * 0.34, -beam * 0.26);
  ctx.lineTo(-length * 0.34, beam * 0.26);
  ctx.quadraticCurveTo(length * 0.05, beam * 0.3, length * 0.32, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#9FB0B8';
  ctx.fillRect(-length * 0.2, -beam * 0.2, length * 0.26, beam * 0.4);
  ctx.fillStyle = '#5E7480';
  ctx.fillRect(-length * 0.14, -beam * 0.12, length * 0.14, beam * 0.24);
  ctx.restore();
}

export function drawUmbrella(x: number, y: number, size = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(7,21,28,0.20)';
  ctx.beginPath(); ctx.ellipse(2, 5, 9 * size, 4 * size, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#6B5140'; ctx.lineWidth = 1.3 * size;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 8 * size); ctx.stroke();
  const colors = ['#F2E7C9', '#E9864F', '#F2E7C9', '#E9864F'];
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 9 * size, i * Math.PI / 2, (i + 1) * Math.PI / 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Rocky shoreline. Built from an irregular ring of points around an ellipse so
 * no two outcrops repeat, with a lighter cap on the lit side.
 */
function drawRocks(x: number, y: number, w: number, h: number, seed: number): void {
  const points: Array<{ x: number; y: number }> = [];
  const steps = 14;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    // A cheap deterministic wobble: same rock every time, different per seed.
    const wobble = 0.78 + 0.34 * Math.abs(Math.sin(seed * 2.7 + i * 1.9));
    const px = x + w / 2 + Math.cos(angle) * (w / 2) * wobble;
    const py = y + h / 2 + Math.sin(angle) * (h / 2) * wobble;
    points.push(project(px, py));
  }

  const trace = (): void => {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
  };

  ctx.save();
  ctx.translate(SHADOW_X * 3, SHADOW_Y * 3);
  trace();
  ctx.fillStyle = 'rgba(48,58,64,0.35)';
  ctx.fill();
  ctx.restore();

  trace();
  ctx.fillStyle = COLORS.rock;
  ctx.fill();

  // Lit cap, offset against the light.
  ctx.save();
  trace();
  ctx.clip();
  ctx.fillStyle = 'rgba(214,214,204,0.30)';
  const cap = project(x + w * 0.5 - SHADOW_X * 12, y + h * 0.5 - SHADOW_Y * 12);
  ctx.beginPath();
  ctx.ellipse(cap.x, cap.y, (w * 0.42) * cap.scale, (h * 0.4) * cap.scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A harbour building: footprint, a raised roof and a lit face. */
function drawBuilding(x: number, y: number, w: number, h: number, angle: number): void {
  const corners = (dx: number, dy: number, inset: number): Array<{ x: number; y: number }> => {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const hw = w / 2 - inset;
    const hh = h / 2 - inset;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([ox, oy]) =>
      project(cx + ox * cos - oy * sin + dx, cy + ox * sin + oy * cos + dy)
    );
  };

  const fillQuad = (pts: Array<{ x: number; y: number }>, color: string): void => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  fillQuad(corners(SHADOW_X * 7, SHADOW_Y * 7, 0), 'rgba(52,62,70,0.32)');
  fillQuad(corners(SHADOW_X * 3.5, SHADOW_Y * 3.5, 0), '#8E938F');
  fillQuad(corners(0, 0, 0), '#C9CCC5');
  fillQuad(corners(0, 0, w * 0.16), '#AFB4AE');
}

/** A footbridge: two rails and a run of slats between them. */
function drawBridge(x1: number, y1: number, x2: number, y2: number, width: number): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const nx = (-dy / length) * (width / 2);
  const ny = (dx / length) * (width / 2);

  const railA: Array<{ x: number; y: number }> = [];
  const railB: Array<{ x: number; y: number }> = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    railA.push(project(x1 + dx * t + nx, y1 + dy * t + ny));
    railB.push(project(x1 + dx * t - nx, y1 + dy * t - ny));
  }

  // Shadow on the water, then the deck.
  ctx.save();
  ctx.translate(SHADOW_X * 5, SHADOW_Y * 5);
  fillRibbon(railA, railB, 'rgba(52,62,70,0.3)');
  ctx.restore();
  fillRibbon(railA, railB, '#E0BE63');

  // Slats.
  ctx.strokeStyle = 'rgba(140,110,44,0.55)';
  for (let i = 1; i < steps; i++) {
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(railA[i].x, railA[i].y);
    ctx.lineTo(railB[i].x, railB[i].y);
    ctx.stroke();
  }

  // Rails, drawn thicker than the slats so the edges read.
  ctx.strokeStyle = '#C9A84D';
  ctx.lineWidth = 2.4;
  for (const rail of [railA, railB]) {
    ctx.beginPath();
    ctx.moveTo(rail[0].x, rail[0].y);
    for (let i = 1; i < rail.length; i++) ctx.lineTo(rail[i].x, rail[i].y);
    ctx.stroke();
  }
}

/** Chequered ground by the pits. */
function drawChequer(x: number, y: number, w: number, h: number, angle: number): void {
  const cols = 8;
  const rows = 4;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cellW = w / cols;
  const cellH = h / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ox = -w / 2 + c * cellW;
      const oy = -h / 2 + r * cellH;
      const pts = [[ox, oy], [ox + cellW, oy], [ox + cellW, oy + cellH], [ox, oy + cellH]].map(([px, py]) =>
        project(x + w / 2 + px * cos - py * sin, y + h / 2 + px * sin + py * cos)
      );
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fillStyle = (r + c) % 2 === 0 ? '#F2F0E8' : '#3B4249';
      ctx.fill();
    }
  }
}

/**
 * The sea itself, drawn live rather than baked into the cached layer.
 *
 * It is the one surface that covers the whole screen, so it is also the only
 * one where movement is felt everywhere at once. Two copies of the same ripple
 * tile are scrolled at different speeds and angles: a single scrolling layer
 * reads as a texture being dragged, while two crossing at different rates read
 * as a surface with a swell on it.
 *
 * The cost is a gradient and two pattern fills a frame. The reason the scene
 * was cached in the first place was the kerb pass — two thousand strokes a
 * frame — not these, which is why the water can be peeled back out of the cache
 * while the road stays in it.
 */
/**
 * The board: the part of the screen the harbour occupies.
 *
 * The sea used to run the full height, under the HUD pills at the top and under
 * the joystick and buttons at the bottom. That is the more immersive layout and
 * it is the wrong one here, for a reason that only shows up once the water has
 * real texture on it: a control you are holding down at speed should not be
 * sitting on a moving surface. The controls now stand on their own ground.
 *
 * It costs no track size at all. The circuit is fitted between SAFE_TOP and
 * SAFE_BOTTOM either way; what the board excludes is only the ring of open water
 * above and below it, which is also the part that was most of "one material
 * filling the screen".
 */
export const BOARD_TOP = 50;
export const BOARD_BOTTOM = CONTROL_BAR_TOP - 8;

/** The ground the interface stands on, outside the board. */
const UI_GROUND = '#0E1720';

/** Confines drawing to the board. Callers must have saved the context. */
export function clipToBoard(): void {
  ctx.beginPath();
  ctx.rect(0, BOARD_TOP, DESIGN_W, BOARD_BOTTOM - BOARD_TOP);
  ctx.clip();
}

/** The interface's ground, and the two edges that define the board on it. */
export function drawBoardGround(): void {
  ctx.fillStyle = UI_GROUND;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, BOARD_TOP - 2, DESIGN_W, 2);
  ctx.fillRect(0, BOARD_BOTTOM, DESIGN_W, 2);
}

/**
 * The ground the circuit stands on, whatever that is on this track.
 *
 * This was drawWaterSurface, and the harbour was the only thing it could draw.
 * Everything that made it a sea — the blues, the two crossing scroll layers, the
 * boats — now comes from the surface table, so the same code renders still sand
 * or a concrete yard without knowing anything about them.
 */
export function drawGroundSurface(elapsed: number): void {
  const surface = surfaceFor(currentTrack);

  const gradient = ctx.createLinearGradient(0, 0, 0, DESIGN_H);
  gradient.addColorStop(0, surface.far);
  gradient.addColorStop(0.55, surface.mid);
  gradient.addColorStop(1, surface.near);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

  // Broad fixed patches. A pure vertical ramp is the flattest thing a screen can
  // show; these are what keep a big open ground from being one field of colour.
  if (surface.mottle > 0) {
    for (const [cx, cy, r, tint, alpha] of GROUND_PATCHES) {
      const patch = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      patch.addColorStop(0, `rgba(${tint},${(alpha * surface.mottle).toFixed(3)})`);
      patch.addColorStop(1, `rgba(${tint},0)`);
      ctx.fillStyle = patch;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  }

  const ripple = groundTexture(ctx, surface.tile);
  if (!ripple) return;
  const tile = groundTileSize(surface.tile);

  // Each layer is filled a whole tile past every edge so a scroll always has
  // somewhere to come from. The caller's board clip is what keeps that overhang
  // from painting past the end of the gradient — and from costing 3.72x the fill
  // for pixels nobody can see.
  for (const [speedX, speedY, alpha] of surface.drift) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(((elapsed * speedX) % tile) - tile, ((elapsed * speedY) % tile) - tile);
    ctx.fillStyle = ripple;
    ctx.fillRect(0, 0, DESIGN_W + tile * 2, DESIGN_H + tile * 2);
    ctx.restore();
  }
}

/** Fixed high and low ground: [x, y, radius, "r,g,b", alpha]. */
const GROUND_PATCHES: Array<[number, number, number, string, number]> = [
  [40, 120, 190, '16,42,66', 0.30],
  [352, 250, 210, '16,42,66', 0.22],
  [24, 470, 170, '150,186,198', 0.16],
  [372, 560, 200, '150,186,198', 0.13],
  [196, 812, 240, '150,186,198', 0.18],
  [200, 30, 260, '10,30,52', 0.26]
];

/**
 * Deterministic per-island randomness.
 *
 * The islands have to look the same on every run — they are part of the circuit,
 * not weather — so nothing here may touch Math.random. Small integer hash,
 * seeded from the island's own index and rectangle, so moving an island changes
 * its planting and leaving it alone does not.
 */
function seededRandom(seed: number): () => number {
  let state = (seed * 2654435761) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * An island outline as a plane-space polygon.
 *
 * The islands used to be the rectangles they are declared as, and five
 * rectangles of the same size down the middle of the board read as placeholder
 * art however good the texture on them was. The declaration stays a rectangle
 * because that is what the clearance search can reason about; this turns it into
 * a shape.
 *
 * Two things vary. `squareness` is a superellipse exponent: at 2 the island is a
 * plain ellipse, at 5 it is nearly the rectangle it was, and every island picks
 * its own. On top of that the radius carries three sine harmonics at random
 * phase, which is what stops the outline from being any recognisable primitive —
 * it bulges and narrows the way a real spit of land does.
 */
function islandOutline(
  x: number,
  y: number,
  w: number,
  h: number,
  rand: () => number,
  swell = 1
): Vec2[] {
  const cx = x + w / 2;
  const cy = y + h / 2;
  // The declared rectangle is the hard envelope: it came out of a search for
  // space that clears the road, so nothing drawn may exceed it. The widest thing
  // drawn is the soil rim at 1.16 carrying a wobble of up to 1.07, and this
  // divides that back out.
  const ENVELOPE = 0.806;
  const a = (w / 2) * swell * ENVELOPE;
  const b = (h / 2) * swell * ENVELOPE;
  const squareness = 2.4 + rand() * 2.4;
  const exponent = 2 / squareness;
  const p1 = rand() * Math.PI * 2;
  const p2 = rand() * Math.PI * 2;
  const p3 = rand() * Math.PI * 2;

  const points: Vec2[] = [];
  const STEPS = 48;
  for (let i = 0; i < STEPS; i++) {
    const t = (i / STEPS) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const wobble =
      1 + 0.070 * Math.sin(t * 3 + p1) + 0.048 * Math.sin(t * 5 + p2) + 0.030 * Math.sin(t * 7 + p3);
    points.push({
      x: cx + Math.sign(c) * Math.pow(Math.abs(c), exponent) * a * wobble,
      y: cy + Math.sign(s) * Math.pow(Math.abs(s), exponent) * b * wobble
    });
  }
  return points;
}

/** Fills a plane-space polygon through the camera. */
function fillPlanePolygon(points: Vec2[], fill: string | CanvasPattern, dx = 0, dy = 0): void {
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const p = project(points[i].x + dx, points[i].y + dy);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Grass tones, so neighbouring islands are not the same green. */
const ISLAND_GREENS = ['#6E8B4A', '#7C9553', '#637F43', '#849B58', '#728E4C'];

/**
 * One island: water shadow, soil rim, sand beach, grass, then whatever grows on
 * it. The planting is scattered from the same seed as the outline, so it always
 * lands on the island rather than in the sea beside it — which is the failure
 * the old hand-placed tree coordinates had every time an island moved.
 */
function drawIsland(x: number, y: number, w: number, h: number, index: number): void {
  const rand = seededRandom(index * 7919 + Math.round(x) * 31 + Math.round(y));
  const outline = islandOutline(x, y, w, h, rand);
  const beach = islandOutline(x, y, w, h, seededRandom(index * 7919 + Math.round(x) * 31 + Math.round(y)), 1.10);
  const soil = islandOutline(x, y, w, h, seededRandom(index * 7919 + Math.round(x) * 31 + Math.round(y)), 1.16);

  fillPlanePolygon(soil, 'rgba(4,12,18,0.34)', SHADOW_X * ISLAND_DEPTH, SHADOW_Y * ISLAND_DEPTH);

  // The cliff under the island, on whichever side of it faces the camera. The
  // rim polygon a hair inside it is only there to tell each point which way it
  // is pointing.
  const projected = soil.map((point) => project(point.x, point.y));
  const inward = soil.map((point) => project(x + w / 2 + (point.x - x - w / 2) * 0.94,
                                             y + h / 2 + (point.y - y - h / 2) * 0.94));
  // Two courses: rock under a sandy shelf, because a single flat band reads as
  // an outline rather than as the side of something.
  fillNearFaces(projected, inward, ISLAND_WALL_HEIGHT, '#333B2C');
  fillNearFaces(projected, inward, ISLAND_WALL_HEIGHT, '#9C8F62', 'rgba(232,244,248,0.75)',
    ISLAND_WALL_HEIGHT * 0.55);

  fillPlanePolygon(soil, COLORS.landDark);
  fillPlanePolygon(beach, '#C6B993');
  fillPlanePolygon(outline, ISLAND_GREENS[index % ISLAND_GREENS.length]);

  const grass = grassTexture(ctx);
  if (grass) fillPlanePolygon(outline, grass);

  // Planting. Rejection-free: a point is drawn in the outline's own parameter
  // space, so it is inside by construction.
  const cx = x + w / 2;
  const cy = y + h / 2;
  const count = Math.max(3, Math.round((w * h) / 620));
  const items: Array<{ x: number; y: number; kind: number; size: number }> = [];
  for (let i = 0; i < count; i++) {
    const t = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand()) * 0.74;
    items.push({
      x: cx + Math.cos(t) * (w / 2) * radius,
      y: cy + Math.sin(t) * (h / 2) * radius,
      kind: rand(),
      size: 0.30 + rand() * 0.22
    });
  }
  // Far things first, so the near ones overlap them.
  items.sort((a, b) => a.y - b.y);
  for (const item of items) {
    const p = project(item.x, item.y);
    if (item.kind > 0.82) drawUmbrella(p.x, p.y, item.size * p.scale * 1.05);
    else if (item.kind > 0.62) drawBush(p.x, p.y, item.size * p.scale);
    else drawTree(p.x, p.y, item.size * p.scale);
  }
}

/** A low shrub. Cheaper than a tree and breaks up a field of them. */
export function drawBush(x: number, y: number, size = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(13,35,30,0.20)';
  ctx.beginPath();
  ctx.ellipse(1.5 * size, 3 * size, 7 * size, 3.4 * size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4F6B3E';
  ctx.beginPath();
  ctx.ellipse(0, 0, 6 * size, 4 * size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6C8A4C';
  ctx.beginPath();
  ctx.ellipse(-1 * size, -1.6 * size, 4 * size, 2.6 * size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBackground(): void {
  // Decor follows the circuit: each track declares where its dry land is, so
  // islands never end up drawn across the road.
  const decor = trackById(activeTrackId).decor;

  decor.medians.forEach(([x, y, w, h], i) => drawIsland(x, y, w, h, i));

  for (const [x, y, size] of decor.trees) {
    const p = project(x, y);
    drawTree(p.x, p.y, size * p.scale);
  }
  for (const [x, y, size] of decor.umbrellas) {
    const p = project(x, y);
    drawUmbrella(p.x, p.y, size * p.scale);
  }
  for (const [x, y, w, h, seed] of decor.rocks) drawRocks(x, y, w, h, seed);
  for (const [x1, y1, x2, y2, width] of decor.bridges) drawBridge(x1, y1, x2, y2, width);
  for (const [x, y, w, h, angle] of decor.chequers) drawChequer(x, y, w, h, angle);

  // The complex inside the circuit, then whatever stands about outside it.
  drawInfield();
  drawProps();
  for (const [x, y, w, h, angle] of decor.buildings) drawBuilding(x, y, w, h, angle);
  // Boats and buoys are deliberately absent here. They are the only decor that
  // ought to move, so they are drawn per frame by life.ts instead of
  // being baked into a layer that is rendered once and never touched again.

  drawVignette();
}

/**
 * A soft darkening at the edges. Costs one gradient in the cached layer and
 * does more for the sense of a lit scene than any single other change.
 */
function drawVignette(): void {
  const gradient = ctx.createRadialGradient(
    DESIGN_W * 0.42, DESIGN_H * 0.38, DESIGN_H * 0.18,
    DESIGN_W * 0.5, DESIGN_H * 0.5, DESIGN_H * 0.72
  );
  gradient.addColorStop(0, 'rgba(255,255,245,0.10)');
  gradient.addColorStop(0.55, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(40,60,72,0.32)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
}


/**
 * The light on the scene as a whole.
 *
 * Everything up to here is lit object by object — a car knows where its own
 * shadow falls, an island knows which of its faces the camera can see — and the
 * board still came out looking evenly bright from corner to corner, because
 * nothing was lighting the *scene*. A real photograph of this harbour would be
 * brighter where the sun is and would fall off towards the edges of the frame,
 * and that fall-off is what the eye reads as a lit volume rather than as a
 * printed page.
 *
 * Two gradients over the finished world, under the HUD: a warm pool up and to
 * the left, matching the direction every shadow already agrees on, and a cool
 * vignette pulling the corners down. They cost two fills a frame and they are
 * deliberately weak — at these alphas neither is visible as an effect, only as
 * the scene no longer being flat.
 */
export function drawSceneLight(): void {
  const sun = ctx.createRadialGradient(
    DESIGN_W * 0.26, DESIGN_H * 0.20, 0,
    DESIGN_W * 0.26, DESIGN_H * 0.20, DESIGN_H * 0.72
  );
  sun.addColorStop(0, 'rgba(255,241,209,0.15)');
  sun.addColorStop(0.55, 'rgba(255,240,205,0.05)');
  sun.addColorStop(1, 'rgba(255,240,205,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

  const vignette = ctx.createRadialGradient(
    DESIGN_W * 0.5, DESIGN_H * 0.46, DESIGN_H * 0.30,
    DESIGN_W * 0.5, DESIGN_H * 0.46, DESIGN_H * 0.78
  );
  vignette.addColorStop(0, 'rgba(6,16,26,0)');
  vignette.addColorStop(1, 'rgba(6,16,26,0.34)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
}

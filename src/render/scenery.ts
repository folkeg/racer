/** Water, park medians and buoys — everything behind the road. */

import { ctx, DESIGN_H, DESIGN_W } from '../platform';
import { COLORS } from '../theme';
import { activeTrackId } from '../track';
import { grassTexture, waterTexture } from './sprites';
import { trackById } from '../tracks';
import { project } from './camera';
import { ISLAND_DEPTH, SHADOW_X, SHADOW_Y } from './light';
import { fillRibbon } from './primitives';

function drawTree(x: number, y: number, size = 1): void {
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

function drawUmbrella(x: number, y: number, size = 1): void {
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

export function drawBackground(): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, DESIGN_H);
  gradient.addColorStop(0, COLORS.waterDeep);
  gradient.addColorStop(0.55, COLORS.water);
  gradient.addColorStop(1, '#94AEBA');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

  const ripple = waterTexture(ctx);
  if (ripple) {
    ctx.fillStyle = ripple;
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
  }

  // Decor follows the circuit: each track declares where its dry land is, so
  // islands never end up drawn across the road.
  const decor = trackById(activeTrackId).decor;

  // Islands are projected quads: their far edge is narrower than their near one,
  // which is most of what sells the plane as a plane.
  const quad = (x: number, y: number, w: number, h: number, dx = 0, dy = 0): void => {
    const top = [project(x + dx, y + dy), project(x + w + dx, y + dy)];
    const bottom = [project(x + dx, y + h + dy), project(x + w + dx, y + h + dy)];
    fillRibbon(top, bottom, ctx.fillStyle as string);
  };

  decor.medians.forEach(([x, y, w, h], i) => {
    ctx.fillStyle = 'rgba(4,12,18,0.42)';
    quad(x - 4, y - 4, w + 8, h + 8, SHADOW_X * ISLAND_DEPTH, SHADOW_Y * ISLAND_DEPTH);
    ctx.fillStyle = '#5A7043';
    quad(x - 4, y - 4, w + 8, h + 8, SHADOW_X * ISLAND_DEPTH * 0.5, SHADOW_Y * ISLAND_DEPTH * 0.5);
    ctx.fillStyle = COLORS.landDark;
    quad(x - 4, y - 4, w + 8, h + 8);
    ctx.fillStyle = i % 2 === 0 ? COLORS.land : COLORS.landLight;
    quad(x, y, w, h);

    const grass = grassTexture(ctx);
    if (grass) {
      ctx.fillStyle = grass;
      quad(x, y, w, h);
    }
  });

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
  for (const [x, y, w, h, angle] of decor.buildings) drawBuilding(x, y, w, h, angle);
  // Boats and buoys are deliberately absent here. They are the only decor that
  // ought to move, so they are drawn per frame by livingWater.ts instead of
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

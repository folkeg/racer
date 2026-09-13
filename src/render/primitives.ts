import { ctx } from '../platform';
import type { Vec2 } from '../types';

export function strokeClosedPath(
  points: Vec2[],
  width: number,
  color: string | CanvasPattern,
  dash: number[] = []
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.stroke();
  ctx.restore();
}

export function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + w, y, x + w, y + h, radius);
  context.arcTo(x + w, y + h, x, y + h, radius);
  context.arcTo(x, y + h, x, y, radius);
  context.arcTo(x, y, x + w, y, radius);
  context.closePath();
}


/** A copy of a path translated by (dx, dy), for cast shadows and bevels. */
export function offsetPath(points: Vec2[], dx: number, dy: number): Vec2[] {
  return points.map((point) => ({ x: point.x + dx, y: point.y + dy }));
}


/**
 * Fills the band between two paths. Once the plane is in perspective a stroke of
 * constant width is wrong — the road has to narrow with distance — so surfaces
 * are built from their two edges instead.
 */
export function fillRibbon(outer: Vec2[], inner: Vec2[], fill: string | CanvasPattern): void {
  if (outer.length < 2 || inner.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(outer[0].x, outer[0].y);
  for (let i = 1; i < outer.length; i++) ctx.lineTo(outer[i].x, outer[i].y);
  for (let i = inner.length - 1; i >= 0; i--) ctx.lineTo(inner[i].x, inner[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Alternating blocks between two edges, for kerbs and dashed lane lines. */
export function fillBands(
  outer: Vec2[],
  inner: Vec2[],
  colors: string[],
  blockLength: number,
  skipEmpty = false
): void {
  const count = Math.min(outer.length, inner.length);
  for (let i = 0; i < count; i++) {
    const next = (i + 1) % count;
    const band = Math.floor(i / blockLength) % colors.length;
    if (skipEmpty && band % 2 === 1) continue;
    ctx.beginPath();
    ctx.moveTo(outer[i].x, outer[i].y);
    ctx.lineTo(outer[next].x, outer[next].y);
    ctx.lineTo(inner[next].x, inner[next].y);
    ctx.lineTo(inner[i].x, inner[i].y);
    ctx.closePath();
    ctx.fillStyle = colors[band];
    ctx.fill();
  }
}


/**
 * The visible side faces of a raised surface.
 *
 * `edge` is the surface's boundary and `inward` the same boundary a short step
 * towards its interior, which is all that is needed to know which way each
 * point faces. A point whose outward normal points down the screen is facing
 * the camera, and gets a wall; one pointing up the screen is on the far side,
 * where the wall is hidden behind the surface itself. In between the wall is
 * foreshortened rather than cut off, so it tapers away instead of ending on a
 * seam.
 *
 * Drawn before the top surface, so the top always laps over the wall it stands
 * on. `from` starts the face part way down, which is how a wall gets courses —
 * a wet strip and a line of foam at its foot, rock above.
 */
export function fillNearFaces(
  edge: Array<Vec2 & { scale: number }>,
  inward: Array<Vec2 & { scale: number }>,
  height: number,
  fill: string,
  waterline?: string,
  from = 0
): void {
  const count = Math.min(edge.length, inward.length);
  let run: Array<{ top: Vec2; base: Vec2 }> = [];

  const flush = (): void => {
    if (run.length >= 2) {
      fillRibbon(run.map((p) => p.top), run.map((p) => p.base), fill);
      if (waterline) {
        ctx.beginPath();
        ctx.moveTo(run[0].base.x, run[0].base.y);
        for (let i = 1; i < run.length; i++) ctx.lineTo(run[i].base.x, run[i].base.y);
        ctx.strokeStyle = waterline;
        ctx.lineWidth = 1.3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }
    run = [];
  };

  for (let i = 0; i < count; i++) {
    const dx = edge[i].x - inward[i].x;
    const dy = edge[i].y - inward[i].y;
    const length = Math.hypot(dx, dy);
    const facing = length > 0 ? dy / length : 0;
    if (facing <= 0.03) {
      flush();
      continue;
    }
    const unit = facing * edge[i].scale;
    run.push({
      top: { x: edge[i].x, y: edge[i].y + from * unit },
      base: { x: edge[i].x, y: edge[i].y + height * unit }
    });
  }
  flush();
}

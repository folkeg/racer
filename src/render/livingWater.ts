/**
 * The parts of the harbour that move.
 *
 * Everything else in the scene — water, road, kerbs, islands — is rendered once
 * per circuit into the cached layer and blitted unchanged every frame. That is
 * the right call for a camera that never moves, but it left the board with
 * nothing on it in motion except the cars and the player's own trail, which is
 * most of why a big, clean, readable picture still read as a still life.
 *
 * So the two bits of decor that have any business moving were taken out of that
 * layer and are drawn here instead: boats drift and drag a wake, buoys rock in
 * the swell, and gulls cross the frame now and then. The cost is a few dozen
 * draw calls a frame and no cache invalidation at all.
 *
 * Motion, not clutter. The static rocks and buildings that used to fill this
 * space were removed for crowding the edges; the difference is that a thing
 * which moves reads as the harbour being alive rather than as decoration
 * competing with the road for attention.
 */

import { DESIGN_H, DESIGN_W, ctx } from '../platform';
import { activeTrackId } from '../track';
import { trackById } from '../tracks';
import { project } from './camera';
import { drawBoat } from './scenery';

/** Seconds since the circuit loaded. Drives every phase below. */
let elapsed = 0;

/**
 * Deterministic per-item jitter, so two boats never bob in lockstep. Seeded off
 * the item's own index rather than a random number, which keeps a circuit
 * looking identical every time it is loaded.
 */
function phase(index: number): number {
  const raw = Math.sin(index * 12.9898) * 43758.5453;
  return (raw - Math.floor(raw)) * Math.PI * 2;
}

export function resetLivingWater(): void {
  elapsed = 0;
}

export function updateLivingWater(dt: number): void {
  elapsed += dt;
}

/**
 * How far a boat has slipped along its own heading, in design units.
 *
 * A slow figure-of-eight rather than a straight line: a boat that tracks off in
 * one direction either leaves the frame or needs wrapping logic, and a moored
 * boat that only rocks reads as a stuck sprite. Drifting a few units each way
 * on two different periods keeps it plausibly at anchor and never repeats
 * visibly inside a single run.
 */
function boatDrift(index: number): { along: number; across: number; heel: number } {
  const p = phase(index);
  return {
    along: Math.sin(elapsed * 0.23 + p) * 7,
    across: Math.sin(elapsed * 0.17 + p * 1.7) * 3.5,
    heel: Math.sin(elapsed * 0.41 + p) * 0.045
  };
}

/** The wake: a short tapered streak off the transom, strongest when moving. */
function drawWake(x: number, y: number, size: number, angle: number, speed: number): void {
  const strength = Math.min(1, Math.abs(speed) * 1.4);
  if (strength < 0.05) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.3 * strength;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  // A wedge behind the transom, widening as it falls away astern.
  ctx.moveTo(-13 * size, -3.4 * size);
  ctx.lineTo(-13 * size - 34 * size * strength, -7 * size);
  ctx.lineTo(-13 * size - 34 * size * strength, 7 * size);
  ctx.lineTo(-13 * size, 3.4 * size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Gulls.
 *
 * Two of them, crossing on long independent periods. They are the only thing
 * here that travels the whole width of the board, which is what makes the water
 * read as open space rather than as a backdrop — and being above the plane,
 * they are drawn without projection so they pass in front of everything.
 */
const GULLS = 2;

function drawGulls(): void {
  for (let i = 0; i < GULLS; i++) {
    const period = 19 + i * 7;
    const t = ((elapsed + i * 11) % period) / period;
    // Offscreen for most of the cycle, so a gull is an event rather than a loop.
    if (t > 0.55) continue;

    const travel = t / 0.55;
    const x = -30 + travel * (DESIGN_W + 60);
    const y = DESIGN_H * (0.16 + i * 0.42) + Math.sin(elapsed * 0.9 + i) * 14;
    const flap = Math.sin(elapsed * 7 + i * 2) * 0.5 + 0.5;

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#F2EFE6';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    // Two strokes meeting at the body: a gull at this size is a pair of wings.
    ctx.beginPath();
    ctx.moveTo(x - 6, y + flap * 3.2);
    ctx.quadraticCurveTo(x - 2.5, y - 1.4, x, y);
    ctx.quadraticCurveTo(x + 2.5, y - 1.4, x + 6, y + flap * 3.2);
    ctx.stroke();
    ctx.restore();
  }
}

export function drawLivingWater(): void {
  const decor = trackById(activeTrackId).decor;

  decor.boats.forEach(([x, y, size, angle], index) => {
    const drift = boatDrift(index);
    const point = project(
      x + Math.cos(angle) * drift.along - Math.sin(angle) * drift.across,
      y + Math.sin(angle) * drift.along + Math.cos(angle) * drift.across
    );
    // Rate of change of the drift is what the wake should follow, not position.
    const speed = Math.cos(elapsed * 0.23 + phase(index)) * 0.23 * 7;
    drawWake(point.x, point.y, size * point.scale, angle + drift.heel, speed);
    drawBoat(point.x, point.y, size * point.scale, angle + drift.heel);
  });

  decor.buoys.forEach(([x, y], index) => {
    const p = phase(index + 97);
    const bob = Math.sin(elapsed * 1.3 + p) * 1.6;
    const point = project(x, y + bob * 0.4);
    const lean = Math.sin(elapsed * 1.1 + p) * 0.22;

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(lean);
    ctx.fillStyle = 'rgba(240,231,204,0.75)';
    ctx.beginPath();
    ctx.arc(0, 0, 2.2 * point.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(232,112,79,0.85)';
    ctx.beginPath();
    ctx.arc(0, -2.8 * point.scale, 1.2 * point.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  drawGulls();
}

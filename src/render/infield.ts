/**
 * The complex inside the circuit.
 *
 * The reference's simplest track is a single closed loop, structurally the same
 * as three of ours, and the difference is entirely what is inside it: a domed
 * hall, two big rotundas, a cluster of tents, a row of pit sheds — and a service
 * road threading through and joining them up. Ours was bare ground with a few
 * objects sprinkled on it.
 *
 * The service road turned out to be the part that matters most. It is what says
 * these buildings can be *reached*, that they belong to one facility and were
 * put there on purpose. Without it even good buildings read as models placed on
 * a board; with it, three crude ones read as a place.
 *
 * The infield is found, not declared: the points of open ground that fall inside
 * the centre line, which is a question a ray cast can answer and a level designer
 * should not have to. Circuits whose interior is a set of narrow slots rather
 * than one room — Long Bay's folds — simply yield nothing here, which is the
 * right answer for them.
 */

import { ctx } from '../platform';
import { activeTrackId, pathAtOffset } from '../track';
import type { TrackId } from '../tracks';
import { lateralUnit, project } from './camera';
import { SHADOW_X, SHADOW_Y } from './light';
import { freeGround } from './props';
import { surfaceFor } from './surface';

export type StructureKind = 'hall' | 'dome' | 'tank' | 'pavilion';

interface Structure {
  x: number;
  y: number;
  kind: StructureKind;
  /** Half-width in plane units. Sized by the room actually available. */
  reach: number;
}

/** A structure needs this much clearance before it is worth placing one. */
const MIN_REACH = 26;
/** And the infield needs this many free points to be a room rather than a slot. */
const MIN_ROOM = 10;

let cachedTrack: TrackId | null = null;
let cached: Structure[] = [];

/** Ray cast against the centre line. */
function inside(x: number, y: number, path: ReturnType<typeof pathAtOffset>): boolean {
  let hit = false;
  for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
    const a = path[i];
    const b = path[j];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

function buildInfield(track: TrackId): Structure[] {
  const path = pathAtOffset(0);
  const room = freeGround().filter((spot) => inside(spot.x, spot.y, path));
  if (room.length < MIN_ROOM) return [];

  const kinds = surfaceFor(track).structures;
  if (kinds.length === 0) return [];

  // Deepest ground first: a big thing belongs where there is room for it.
  const ranked = [...room].sort((a, b) => b.clearance - a.clearance);
  const placed: Structure[] = [];

  for (const spot of ranked) {
    if (placed.length >= 3) break;
    if (spot.clearance < MIN_REACH) break;
    // Keep them apart, or the complex becomes one blob.
    const clash = placed.some((other) => {
      const dx = other.x - spot.x;
      const dy = other.y - spot.y;
      return Math.hypot(dx, dy) < other.reach + spot.clearance * 0.9 + 18;
    });
    if (clash) continue;
    placed.push({
      x: spot.x,
      y: spot.y,
      kind: kinds[placed.length % kinds.length],
      reach: Math.min(spot.clearance * 0.72, 46)
    });
  }
  return placed;
}

function structures(): Structure[] {
  if (cachedTrack !== activeTrackId) {
    cached = buildInfield(activeTrackId);
    cachedTrack = activeTrackId;
  }
  return cached;
}

/** Where the service road runs, and the pads the buildings stand on. */
function drawServiceRoad(placed: Structure[]): void {
  if (placed.length < 2) return;
  const paint = surfaceFor(activeTrackId).road;
  const order = [...placed].sort((a, b) => a.y - b.y);

  const stroke = (width: number, colour: string): void => {
    ctx.save();
    ctx.beginPath();
    const first = project(order[0].x, order[0].y);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < order.length; i++) {
      const p = project(order[i].x, order[i].y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = colour;
    ctx.lineWidth = width * lateralUnit();
    ctx.stroke();
    ctx.restore();
  };

  stroke(19, 'rgba(8,14,20,0.16)');
  stroke(16, paint.apronEdge);
  stroke(13, paint.apron);
}

function shade(x: number, y: number, w: number, h: number, alpha: number): void {
  ctx.fillStyle = `rgba(10,16,22,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x + SHADOW_X * w * 0.42, y + SHADOW_Y * w * 0.42, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawStructure(structure: Structure): void {
  const p = project(structure.x, structure.y);
  const r = structure.reach * lateralUnit();
  const x = p.x;
  const y = p.y;

  switch (structure.kind) {
    case 'dome': {
      shade(x, y, r * 1.05, r * 0.62, 0.34);
      const sphere = ctx.createRadialGradient(x - r * 0.34, y - r * 0.34, r * 0.1, x, y, r);
      sphere.addColorStop(0, '#F4F1E8');
      sphere.addColorStop(0.65, '#CFCCC2');
      sphere.addColorStop(1, '#96948C');
      ctx.fillStyle = sphere;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      // The ring it stands in, which is what makes it a building and not a ball.
      ctx.strokeStyle = 'rgba(58,72,86,0.55)';
      ctx.lineWidth = r * 0.13;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.06, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'hall': {
      const w = r * 1.85;
      const h = r * 1.05;
      shade(x, y + h * 0.2, w * 0.6, h * 0.5, 0.32);
      ctx.fillStyle = '#4E5660';
      ctx.fillRect(x - w / 2, y - h / 2, w, h);
      // A ridged roof: three bays, lit along their tops.
      for (let i = 0; i < 3; i++) {
        const bay = h / 3;
        ctx.fillStyle = i % 2 === 0 ? '#5E6872' : '#545E68';
        ctx.fillRect(x - w / 2, y - h / 2 + i * bay, w, bay);
        ctx.fillStyle = 'rgba(238,244,250,0.16)';
        ctx.fillRect(x - w / 2, y - h / 2 + i * bay, w, bay * 0.22);
      }
      ctx.strokeStyle = 'rgba(14,20,26,0.5)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x - w / 2, y - h / 2, w, h);
      break;
    }
    case 'tank': {
      shade(x, y, r * 0.9, r * 0.5, 0.34);
      const barrel = ctx.createLinearGradient(x - r * 0.7, y, x + r * 0.7, y);
      barrel.addColorStop(0, '#6E6A5E');
      barrel.addColorStop(0.35, '#A8A296');
      barrel.addColorStop(1, '#5E5A50');
      ctx.fillStyle = barrel;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(220,214,200,0.5)';
      ctx.lineWidth = r * 0.06;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.44, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'pavilion': {
      // A cluster, not one object: tents read as a group or not at all.
      const tents = 5;
      for (let i = 0; i < tents; i++) {
        const angle = (i / tents) * Math.PI * 2 + 0.6;
        const tx = x + Math.cos(angle) * r * 0.62;
        const ty = y + Math.sin(angle) * r * 0.38;
        const size = r * 0.36;
        shade(tx, ty + size * 0.4, size * 0.7, size * 0.34, 0.28);
        ctx.fillStyle = '#E8E4DA';
        ctx.beginPath();
        ctx.moveTo(tx, ty - size);
        ctx.lineTo(tx + size * 0.8, ty + size * 0.5);
        ctx.lineTo(tx - size * 0.8, ty + size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(120,126,132,0.45)';
        ctx.beginPath();
        ctx.moveTo(tx, ty - size);
        ctx.lineTo(tx + size * 0.8, ty + size * 0.5);
        ctx.lineTo(tx, ty + size * 0.5);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
  }
}

export function drawInfield(): void {
  const placed = structures();
  if (placed.length === 0) return;
  drawServiceRoad(placed);
  for (const structure of [...placed].sort((a, b) => a.y - b.y)) drawStructure(structure);
}

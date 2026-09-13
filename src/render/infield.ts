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

import { ctx, DESIGN_W } from '../platform';
import { activeTrackId, pathAtOffset } from '../track';
import type { TrackId } from '../tracks';
import { lateralUnit, project } from './camera';
import { SHADOW_X, SHADOW_Y } from './light';
import { freeGround } from './props';
import { BOARD_BOTTOM, BOARD_TOP } from './scenery';
import { groundTexture } from './sprites';
import { surfaceFor } from './surface';

export type StructureKind = 'hall' | 'dome' | 'tank' | 'pavilion' | 'lagoon' | 'containers' | 'lawn';

/**
 * The ones that are ground rather than building, and so get no hardstanding
 * under them. A lagoon on a concrete pad would be a swimming pool.
 */
const GROUND_KINDS: StructureKind[] = ['lagoon', 'lawn'];

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
let cachedOutfield: Structure[] = [];

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

/**
 * Places large structures in whichever half of the board is asked for.
 *
 * The same search serves inside and outside the circuit. Outside is thinner —
 * the fit leaves 26 units to the frame — so it gets a lower bar for what counts
 * as room and a shorter list, but the failure mode is the same and correct: a
 * side with nowhere to stand yields nothing rather than something jammed in.
 */
function buildStructures(
  wantInside: boolean,
  kinds: StructureKind[],
  minReach: number,
  limit: number
): Structure[] {
  const path = pathAtOffset(0);
  const room = freeGround().filter((spot) => inside(spot.x, spot.y, path) === wantInside);
  if (room.length < MIN_ROOM) return [];
  if (kinds.length === 0) return [];

  // Deepest ground first: a big thing belongs where there is room for it.
  const ranked = [...room].sort((a, b) => b.clearance - a.clearance);
  const placed: Structure[] = [];

  for (const spot of ranked) {
    if (placed.length >= limit) break;
    if (spot.clearance < minReach) break;
    // Keep them apart, or the complex becomes one blob.
    const clash = placed.some((other) => {
      const dx = other.x - spot.x;
      const dy = other.y - spot.y;
      return Math.hypot(dx, dy) < other.reach + spot.clearance * 0.9 + 18;
    });
    if (clash) continue;

    // Room to the frame counts as much as room to the track.
    //
    // Sizing on clearance alone put a dome and a lawn half off the board: the
    // deepest open ground outside a circuit is usually in the corners of the
    // frame, where there is plenty of distance to the tarmac and almost none to
    // the edge. A structure that is cut in half by the screen is worse than no
    // structure.
    const edgeRoom = Math.min(
      spot.x,
      DESIGN_W - spot.x,
      spot.y - BOARD_TOP,
      BOARD_BOTTOM - spot.y
    );
    const reach = Math.min(spot.clearance * 0.72, edgeRoom * 0.78, 46);
    if (reach < minReach * 0.62) continue;

    placed.push({
      x: spot.x,
      y: spot.y,
      kind: kinds[placed.length % kinds.length],
      reach
    });
  }
  return placed;
}

function ensure(): void {
  if (cachedTrack === activeTrackId) return;
  const surface = surfaceFor(activeTrackId);
  cached = buildStructures(true, surface.structures, MIN_REACH, 3);
  cachedOutfield = buildStructures(false, surface.outfield, 21, 2);
  cachedTrack = activeTrackId;
}

function structures(): Structure[] {
  ensure();
  return cached;
}

function outfieldStructures(): Structure[] {
  ensure();
  return cachedOutfield;
}

/** Where the service road runs, and the pads the buildings stand on. */
function drawServiceRoad(placed: Structure[]): void {
  if (placed.length < 2) return;
  const paint = surfaceFor(activeTrackId).road;
  const order = [...placed].sort((a, b) => a.y - b.y);

  const stroke = (width: number, colour: string | CanvasPattern): void => {
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

  // Narrower than it was, with an edge and a material.
  //
  // It went in as three plain strokes and came out as a grey stick laid across
  // the infield — the same failure the run-off had before it was given a grain:
  // a flat fill between two textured surfaces does not read as a surface at all.
  // For the thing whose entire job is to say "these buildings can be reached",
  // that was worth catching.
  stroke(15, 'rgba(8,14,20,0.16)');
  stroke(12.5, paint.apronEdge);
  stroke(10, paint.apron);

  const grain = groundTexture(ctx, paint.tile);
  if (grain) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    stroke(10, grain);
    ctx.restore();
  }

  // Pads where it arrives, so the buildings stand on it rather than beside it.
  //
  // Tight, and with an edge. The first version drew them at 1.32 by 0.86 of the
  // structure's reach and they overlapped into one lumpy grey smear across the
  // middle of the works yard — a pad with no edge is not a pad. They are also
  // square where the world is: a yard is set out with a rule, and round
  // hardstanding in an industrial site looks as wrong as a rectangular dune.
  const squared = !surfaceFor(activeTrackId).island.planted;
  for (const structure of placed) {
    if (GROUND_KINDS.includes(structure.kind)) continue;
    const p = project(structure.x, structure.y);
    const r = structure.reach * lateralUnit();
    const w = r * 1.12;
    const h = r * 0.72;

    const shape = (): void => {
      ctx.beginPath();
      if (squared) ctx.rect(p.x - w, p.y - h, w * 2, h * 2);
      else ctx.ellipse(p.x, p.y, w, h, 0, 0, Math.PI * 2);
    };

    ctx.fillStyle = paint.apronEdge;
    shape();
    ctx.fill();
    ctx.fillStyle = paint.apron;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(0.93, 0.9);
    ctx.translate(-p.x, -p.y);
    shape();
    ctx.fill();
    if (grain) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = grain;
      shape();
      ctx.fill();
    }
    ctx.restore();
  }
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
      shade(x, y + r * 0.3, r * 1.05, r * 0.5, 0.34);
      const sphere = ctx.createRadialGradient(x - r * 0.34, y - r * 0.34, r * 0.1, x, y, r);
      sphere.addColorStop(0, '#F4F1E8');
      sphere.addColorStop(0.65, '#CFCCC2');
      sphere.addColorStop(1, '#96948C');
      ctx.fillStyle = sphere;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      // A skirt below it and a ring around it: the two things that stop a lit
      // sphere from reading as a ball dropped on the ground.
      ctx.strokeStyle = 'rgba(58,72,86,0.55)';
      ctx.lineWidth = r * 0.13;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.06, 0, Math.PI * 2);
      ctx.stroke();
      // A shallow plinth, not a bowl. At 0.3 of the radius and 55% black it
      // swallowed the bottom of the sphere and the whole thing read as a ball
      // half sunk in mud; a building's base is a course you can see the top of.
      ctx.fillStyle = 'rgba(108,114,120,0.9)';
      ctx.beginPath();
      ctx.moveTo(x - r * 0.94, y + r * 0.34);
      ctx.lineTo(x - r * 0.94, y + r * 0.46);
      ctx.arc(x, y + r * 0.46, r * 0.94, Math.PI, 0, true);
      ctx.lineTo(x + r * 0.94, y + r * 0.34);
      ctx.closePath();
      ctx.fill();
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
      // A cylinder, not a disc.
      //
      // Drawn as a top face with a wall below it rather than as one circle: from
      // this angle a tall tank shows its side, and without that side it reads as
      // a grey coin lying on the ground. The wall is the same trick the deck and
      // the islands use — extrude towards the camera, shade away from the light.
      const rr = r * 0.66;
      const wall = rr * 0.62;
      shade(x, y + wall, rr * 0.95, rr * 0.42, 0.34);

      const side = ctx.createLinearGradient(x - rr, y, x + rr, y);
      side.addColorStop(0, '#4E4A42');
      side.addColorStop(0.4, '#7A7468');
      side.addColorStop(1, '#3E3A34');
      ctx.fillStyle = side;
      ctx.beginPath();
      ctx.moveTo(x - rr, y);
      ctx.lineTo(x - rr, y + wall);
      ctx.arc(x, y + wall, rr, Math.PI, 0, true);
      ctx.lineTo(x + rr, y);
      ctx.closePath();
      ctx.fill();

      const top = ctx.createLinearGradient(x - rr, y - rr, x + rr, y + rr);
      top.addColorStop(0, '#C2BCAE');
      top.addColorStop(0.55, '#9A9488');
      top.addColorStop(1, '#6E685E');
      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.ellipse(x, y, rr, rr * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(228,222,208,0.45)';
      ctx.lineWidth = rr * 0.08;
      ctx.beginPath();
      ctx.ellipse(x, y, rr * 0.62, rr * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'lagoon': {
      // The saturated anchor.
      //
      // Every world came out monochrome — the beach was eleven shades of sand
      // and the works yard eleven of grey — and the reference's boards are held
      // together by one big high-chroma shape, the acid-green infield grass. One
      // strongly coloured area does more for a picture than any amount of
      // additional grey detail, and it has to be large: a small bright thing is
      // an accent, a large one is the thing the eye hangs the scene on.
      const pool = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r * 1.15);
      pool.addColorStop(0, '#4FC3C8');
      pool.addColorStop(0.6, '#2E9AA6');
      pool.addColorStop(1, '#1E6E80');
      ctx.fillStyle = '#E6D6A8';
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.3, r * 0.92, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.12, r * 0.76, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.12, r * 0.76, 0.2, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'lawn': {
      // Rim, fill, grain — the same three steps every other piece of ground on
      // this board gets. It went in as a flat green ellipse and read as a blob
      // of paint, which is the third time a plain fill has been laid between two
      // textured surfaces and failed the same way. Any piece of ground needs an
      // edge and a material; there is no exception for a small one.
      const lawn = (scale: number): void => {
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.25 * scale, r * 0.88 * scale, -0.15, 0, Math.PI * 2);
      };
      ctx.fillStyle = '#4E6B2C';
      lawn(1);
      ctx.fill();
      ctx.fillStyle = '#7FB23F';
      lawn(0.93);
      ctx.fill();
      const blades = groundTexture(ctx, 'grass');
      if (blades) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = blades;
        lawn(0.93);
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'containers': {
      // Rows, because a works yard is set out with a rule — and because the
      // colours are the point, four saturated ones against all that grey.
      const hues = ['#B4573A', '#2F7E86', '#B8912F', '#4E6E3A'];
      const cols = 4;
      const rows = 3;
      const cw = (r * 1.9) / cols;
      const ch = (r * 1.0) / rows;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = x - r * 0.95 + col * cw;
          const cy = y - r * 0.5 + row * ch;
          ctx.fillStyle = 'rgba(10,14,18,0.30)';
          ctx.fillRect(cx + 1.5, cy + 2, cw * 0.86, ch * 0.76);
          ctx.fillStyle = hues[(row * cols + col) % hues.length];
          ctx.fillRect(cx, cy, cw * 0.86, ch * 0.76);
          ctx.fillStyle = 'rgba(255,250,238,0.22)';
          ctx.fillRect(cx, cy, cw * 0.86, ch * 0.2);
        }
      }
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
  if (placed.length > 0) {
    drawServiceRoad(placed);
    for (const structure of [...placed].sort((a, b) => a.y - b.y)) drawStructure(structure);
  }

  // And whatever stands outside the circuit. No service road out here: these are
  // across the track from the facility, not part of it, and a road that ran to
  // them would have to cross the racing line.
  const outside = outfieldStructures();
  for (const structure of [...outside].sort((a, b) => a.y - b.y)) drawStructure(structure);
}

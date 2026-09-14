/**
 * The things standing about on a world's open ground.
 *
 * A ground with nothing on it reads as a blank, however good the material on it
 * is — the sand looked right and still looked empty. Props are what turn a
 * surface into a place.
 *
 * They are placed by search rather than by hand. Every circuit leaves a
 * different shape of ground free, and hand-written coordinates have been wrong
 * every single time the geometry moved — the trees that used to sit on Long
 * Bay's islands ended up in the water twice. So the free ground is measured:
 * candidates on a coarse grid, keep the ones that clear the tarmac and the
 * islands, then pick from them with a seeded hash so a circuit looks the same
 * every run.
 *
 * Everything here is static and goes in the layer that renders once per
 * circuit. What moves lives in life.ts.
 */

import { ROAD_HALF_WIDTH } from '../config';
import { ctx } from '../platform';
import { activeTrackId, pathAtOffset } from '../track';
import { trackById } from '../tracks';
import type { TrackId } from '../tracks';
import { project } from './camera';
import { drawArt } from './art';
import { SHADOW_X, SHADOW_Y } from './light';
import { BOARD_BOTTOM, BOARD_TOP, drawBush, drawTree, drawUmbrella } from './scenery';
import { surfaceFor } from './surface';
import type { PropKind } from './surface';

export interface Prop {
  x: number;
  y: number;
  kind: PropKind;
  size: number;
}

/** And the frame, so nothing is half off the board. */
const EDGE_MARGIN = 14;
/** How far apart two props must stand. */
const SPACING = 34;

export interface FreeSpot {
  x: number;
  y: number;
  /** Distance to the nearest tarmac. Deeper is further from the racing. */
  clearance: number;
}

/**
 * Ground already taken by something built.
 *
 * The free-ground scan only knows about tarmac and islands, so a crab picked a
 * home on top of the dome and sat there — and the props scatter could just as
 * easily have put a rock on a tent roof. Whatever places a structure claims the
 * ground under it here, and everything scattered afterwards asks first.
 */
const claimed: Array<{ x: number; y: number; r: number }> = [];

export function claimGround(x: number, y: number, r: number): void {
  claimed.push({ x, y, r });
}

export function releaseGround(): void {
  claimed.length = 0;
}

export function groundIsFree(x: number, y: number, margin = 0): boolean {
  for (const spot of claimed) {
    const dx = spot.x - x;
    const dy = spot.y - y;
    const reach = spot.r + margin;
    if (dx * dx + dy * dy < reach * reach) return false;
  }
  return true;
}

let cachedTrack: TrackId | null = null;
let cached: Prop[] = [];
let cachedFree: FreeSpot[] = [];
let freeTrack: TrackId | null = null;

function hash(n: number): number {
  const raw = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return raw - Math.floor(raw);
}

/**
 * Every point of open ground, with how far it is from the racing.
 *
 * Measured rather than declared, because every circuit leaves a different shape
 * of ground free and hand-written coordinates have been wrong every single time
 * the geometry moved. The clearance goes out with each point: it is what lets a
 * big structure be put where there is actually room for one, and what keeps the
 * crabs off the tarmac.
 */
export function freeGround(): FreeSpot[] {
  if (freeTrack === activeTrackId) return cachedFree;

  const centre = pathAtOffset(0);
  const medians = trackById(activeTrackId).decor.medians;
  const free: FreeSpot[] = [];

  // A coarse grid is plenty: these are scattered objects, not a tiling.
  for (let y = BOARD_TOP + EDGE_MARGIN; y < BOARD_BOTTOM - EDGE_MARGIN; y += 15) {
    for (let x = EDGE_MARGIN; x < 390 - EDGE_MARGIN; x += 15) {
      let nearest = Infinity;
      // Every 6th point of the centre line is close enough for a clearance this
      // coarse, and keeps the whole scan well under a millisecond.
      for (let i = 0; i < centre.length; i += 6) {
        const dx = centre[i].x - x;
        const dy = centre[i].y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < nearest) nearest = d2;
      }
      const clearance = Math.sqrt(nearest) - ROAD_HALF_WIDTH;
      if (clearance < 16) continue;
      let ok = true;
      for (const [mx, my, mw, mh] of medians) {
        if (x > mx - 10 && x < mx + mw + 10 && y > my - 10 && y < my + mh + 10) ok = false;
      }
      if (ok) free.push({ x, y, clearance });
    }
  }
  cachedFree = free;
  freeTrack = activeTrackId;
  return free;
}

function buildProps(track: TrackId): Prop[] {
  const surface = surfaceFor(track);
  if (surface.props.length === 0) return [];

  const free = freeGround();
  if (free.length === 0) return [];

  // Sparse, and clustered rather than evenly spaced.
  //
  // The first pass took a sixth of every free grid point with no spacing rule at
  // all and the beach came out a jumble sale. The fix was a minimum separation,
  // which solved that and introduced a subtler problem: everything ended up the
  // same distance from everything else, and even spacing is the signature of a
  // machine. Nothing in a natural landscape is evenly spaced — rocks come in
  // drifts with bare ground between them.
  //
  // So most props keep their distance and some deliberately do not: roughly one
  // in three is allowed to sit close to the one before it, which produces
  // clumps and gaps instead of a lattice.
  const wanted = Math.min(free.length, Math.round(free.length * 0.045 * surface.propDensity));
  const props: Prop[] = [];
  const taken = new Set<number>();
  for (let n = 0; props.length < wanted && n < wanted * 40; n++) {
    const index = Math.floor(hash(n * 3.7 + 1) * free.length);
    if (taken.has(index)) continue;
    taken.add(index);
    const spot = free[index];
    const huddles = hash(n * 11.3 + 5) < 0.34;
    const keepOut = huddles ? SPACING * 0.34 : SPACING;
    let crowded = false;
    for (const other of props) {
      const dx = other.x - spot.x;
      const dy = other.y - spot.y;
      if (dx * dx + dy * dy < keepOut * keepOut) { crowded = true; break; }
    }
    if (crowded) continue;
    if (!groundIsFree(spot.x, spot.y, 8)) continue;
    const roll = hash(index * 5.3 + 2);
    props.push({
      // Jittered off the grid, or the scatter reads as a lattice.
      x: spot.x + (hash(index) - 0.5) * 11,
      y: spot.y + (hash(index * 2.1) - 0.5) * 11,
      kind: surface.props[Math.floor(roll * surface.props.length) % surface.props.length],
      // A wide spread of sizes, because a stand of identically sized rocks is
      // as obviously generated as an evenly spaced one.
      size: 0.55 + Math.pow(hash(index * 7.9), 1.8) * 1.25
    });
  }
  // Far things first, so near ones overlap them.
  props.sort((a, b) => a.y - b.y);
  return props;
}

export function propsForTrack(): Prop[] {
  if (cachedTrack !== activeTrackId) {
    cached = buildProps(activeTrackId);
    cachedTrack = activeTrackId;
  }
  return cached;
}

/** Chimneys, for whatever wants to put smoke above them. */
export function chimneys(): Prop[] {
  return propsForTrack().filter((prop) => prop.kind === 'chimney');
}

function shadow(x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(12,18,24,0.30)';
  ctx.beginPath();
  ctx.ellipse(x + SHADOW_X * 2.5, y + SHADOW_Y * 2.5, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Which drawing stands in for which prop, and how wide it is in plane units.
 *
 * Sizes are in the same units as the road, so a tyre stack is a bit over a car's
 * width and a tree is twice that — which is the first time anything here has had
 * a stated scale rather than one tuned by eye until it looked about right.
 */
const ART: Partial<Record<PropKind, { name: string; width: number; group?: number }>> = {
  rock: { name: 'rock', width: 11 },
  // The small ones come in groups.
  //
  // A drum is half a metre across and a car is four, so at its true relative
  // size it lands at five or six units — and anything under about half a car
  // stops reading as an object at this resolution and becomes a dot. That was
  // the answer to "what are those circles with a black dot in them": tyre
  // stacks, correctly sized and completely illegible.
  //
  // Making one drum bigger would be a lie about how big a drum is. A pallet of
  // them is not: the group reaches car scale, and a group is what is actually
  // lying around a yard anyway.
  tyres: { name: 'tyres', width: 9, group: 3 },
  drum: { name: 'drum-red', width: 7, group: 4 },
  cone: { name: 'cone', width: 6, group: 3 },
  barrier: { name: 'barrier', width: 17 },
  tree: { name: 'tree', width: 17 },
  bush: { name: 'tree-small', width: 11 },
  parasol: { name: 'tree-small', width: 8 }
};

/** Every prop is a solid with a lit top and a darker side, like everything else. */
function drawProp(prop: Prop): void {
  const p = project(prop.x, prop.y);
  const s = prop.size * p.scale;
  const x = p.x;
  const y = p.y;

  // A drawing if there is one, and the hand-coded shape otherwise — which is
  // what keeps this working while the images are in flight and on any platform
  // that cannot fetch them.
  const art = ART[prop.kind];
  const surface = surfaceFor(activeTrackId);
  if (art) {
    const width = art.width * prop.size * p.scale;
    const options = { tint: surface.artTint, tintStrength: surface.artTintStrength };
    if (!art.group) {
      if (drawArt(art.name, x, y, width, options)) return;
    } else {
      // Huddled, with the far ones drawn first so the near ones overlap them.
      const spread = width * 0.62;
      const offsets: Array<[number, number]> = [];
      for (let i = 0; i < art.group; i++) {
        const angle = (i / art.group) * Math.PI * 2 + prop.size * 3;
        offsets.push([Math.cos(angle) * spread, Math.sin(angle) * spread * 0.6]);
      }
      offsets.sort((a, b) => a[1] - b[1]);
      let drawn = false;
      for (const [dx, dy] of offsets) {
        drawn = drawArt(art.name, x + dx, y + dy, width, options) || drawn;
      }
      if (drawn) return;
    }
  }

  switch (prop.kind) {
    case 'rock': {
      shadow(x, y + 1.5 * s, 5.5 * s, 3 * s);
      ctx.fillStyle = '#6E6A60';
      ctx.beginPath();
      ctx.ellipse(x, y, 5 * s, 3.6 * s, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#918C7E';
      ctx.beginPath();
      ctx.ellipse(x - 1.1 * s, y - 1.1 * s, 3 * s, 2 * s, 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'tuft': {
      ctx.strokeStyle = '#9C8F63';
      ctx.lineWidth = 1 * s;
      ctx.lineCap = 'round';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 1.3 * s, y + 1.5 * s);
        ctx.lineTo(x + i * 2.4 * s, y - 3.4 * s);
        ctx.stroke();
      }
      break;
    }
    case 'parasol':
      drawUmbrella(x, y, 0.42 * s);
      break;
    case 'tree':
      drawTree(x, y, 0.42 * s);
      break;
    case 'bush':
      drawBush(x, y, 0.42 * s);
      break;
    case 'cone': {
      shadow(x, y + 1.5 * s, 3.6 * s, 1.8 * s);
      ctx.fillStyle = '#D9622B';
      ctx.beginPath();
      ctx.moveTo(x, y - 6 * s);
      ctx.lineTo(x + 3.2 * s, y + 1.6 * s);
      ctx.lineTo(x - 3.2 * s, y + 1.6 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(x - 2.1 * s, y - 2.4 * s, 4.2 * s, 1.5 * s);
      break;
    }
    case 'tyres': {
      shadow(x, y + 1.5 * s, 4.6 * s, 2.4 * s);
      for (let i = 2; i >= 0; i--) {
        ctx.fillStyle = i === 0 ? '#3A3A3C' : '#2A2A2C';
        ctx.beginPath();
        ctx.ellipse(x, y - i * 2.2 * s, 4.2 * s, 2.6 * s, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#4E4E52';
      ctx.beginPath();
      ctx.ellipse(x, y - 4.4 * s, 1.8 * s, 1.1 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'drum': {
      shadow(x, y + 1.5 * s, 3.4 * s, 1.8 * s);
      ctx.fillStyle = '#7C5230';
      ctx.fillRect(x - 3 * s, y - 6 * s, 6 * s, 7.5 * s);
      ctx.fillStyle = '#A8703F';
      ctx.fillRect(x - 3 * s, y - 6 * s, 2.4 * s, 7.5 * s);
      ctx.fillStyle = '#C89A5E';
      ctx.beginPath();
      ctx.ellipse(x, y - 6 * s, 3 * s, 1.5 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'barrier': {
      shadow(x, y + 1.2 * s, 6 * s, 2 * s);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#C6362E' : '#E8E4DA';
        ctx.fillRect(x - 6 * s + i * 3 * s, y - 3.4 * s, 3 * s, 4.6 * s);
      }
      ctx.fillStyle = 'rgba(255,252,244,0.30)';
      ctx.fillRect(x - 6 * s, y - 3.4 * s, 12 * s, 1 * s);
      break;
    }
    case 'lamp': {
      shadow(x, y + 1 * s, 2 * s, 1.2 * s);
      ctx.fillStyle = '#3C444C';
      ctx.fillRect(x - 0.9 * s, y - 13 * s, 1.8 * s, 14 * s);
      ctx.fillStyle = '#5A646E';
      ctx.fillRect(x - 3.4 * s, y - 14.4 * s, 6.8 * s, 2 * s);
      // The pool of light it throws, which is the only warm thing in the city.
      const pool = ctx.createRadialGradient(x, y + 2 * s, 0, x, y + 2 * s, 15 * s);
      pool.addColorStop(0, 'rgba(255,226,158,0.22)');
      pool.addColorStop(1, 'rgba(255,226,158,0)');
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.ellipse(x, y + 2 * s, 15 * s, 9 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'chimney': {
      shadow(x, y + 2 * s, 8 * s, 3.4 * s);
      // The shed it stands on.
      ctx.fillStyle = '#4E4A42';
      ctx.fillRect(x - 8 * s, y - 7 * s, 16 * s, 8.5 * s);
      ctx.fillStyle = '#5E5A50';
      ctx.fillRect(x - 8 * s, y - 7 * s, 16 * s, 2.4 * s);
      // The stack.
      ctx.fillStyle = '#6A6258';
      ctx.fillRect(x + 2 * s, y - 21 * s, 4.4 * s, 15 * s);
      ctx.fillStyle = '#8A8074';
      ctx.fillRect(x + 2 * s, y - 21 * s, 1.6 * s, 15 * s);
      ctx.fillStyle = '#B4553C';
      ctx.fillRect(x + 2 * s, y - 21 * s, 4.4 * s, 1.8 * s);
      break;
    }
  }
}

export function drawProps(): void {
  for (const prop of propsForTrack()) drawProp(prop);
}

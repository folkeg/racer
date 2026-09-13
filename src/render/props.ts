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

/** How far a prop must clear the tarmac. Enough that none looks like debris. */
const ROAD_CLEARANCE = ROAD_HALF_WIDTH + 16;
/** And the frame, so nothing is half off the board. */
const EDGE_MARGIN = 14;
/** How far apart two props must stand. */
const SPACING = 34;

let cachedTrack: TrackId | null = null;
let cached: Prop[] = [];

function hash(n: number): number {
  const raw = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return raw - Math.floor(raw);
}

function buildProps(track: TrackId): Prop[] {
  const surface = surfaceFor(track);
  if (surface.props.length === 0) return [];

  const centre = pathAtOffset(0);
  const medians = trackById(track).decor.medians;
  const free: Array<{ x: number; y: number }> = [];

  // A coarse grid is plenty: these are scattered objects, not a tiling.
  for (let y = BOARD_TOP + EDGE_MARGIN; y < BOARD_BOTTOM - EDGE_MARGIN; y += 15) {
    for (let x = EDGE_MARGIN; x < 390 - EDGE_MARGIN; x += 15) {
      let ok = true;
      // Every 6th point of the centre line is close enough for a clearance this
      // coarse, and keeps the whole scan well under a millisecond.
      for (let i = 0; i < centre.length && ok; i += 6) {
        const dx = centre[i].x - x;
        const dy = centre[i].y - y;
        if (dx * dx + dy * dy < ROAD_CLEARANCE * ROAD_CLEARANCE) ok = false;
      }
      if (!ok) continue;
      for (const [mx, my, mw, mh] of medians) {
        if (x > mx - 10 && x < mx + mw + 10 && y > my - 10 && y < my + mh + 10) ok = false;
      }
      if (ok) free.push({ x, y });
    }
  }
  if (free.length === 0) return [];

  // Sparse, and spaced.
  //
  // The first pass took a sixth of every free grid point with no spacing rule
  // and the beach came out looking like a jumble sale — scattered objects need
  // to be scattered, and a clump of five reads as debris rather than as scenery.
  // Two rules fix it: take few, and never take one within SPACING of one already
  // taken.
  const wanted = Math.min(free.length, Math.round(free.length * 0.045 * surface.propDensity));
  const props: Prop[] = [];
  const taken = new Set<number>();
  for (let n = 0; props.length < wanted && n < wanted * 40; n++) {
    const index = Math.floor(hash(n * 3.7 + 1) * free.length);
    if (taken.has(index)) continue;
    taken.add(index);
    const spot = free[index];
    let crowded = false;
    for (const other of props) {
      const dx = other.x - spot.x;
      const dy = other.y - spot.y;
      if (dx * dx + dy * dy < SPACING * SPACING) { crowded = true; break; }
    }
    if (crowded) continue;
    const roll = hash(index * 5.3 + 2);
    props.push({
      // Jittered off the grid, or the scatter reads as a lattice.
      x: spot.x + (hash(index) - 0.5) * 11,
      y: spot.y + (hash(index * 2.1) - 0.5) * 11,
      kind: surface.props[Math.floor(roll * surface.props.length) % surface.props.length],
      size: 0.8 + hash(index * 7.9) * 0.5
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

/** Every prop is a solid with a lit top and a darker side, like everything else. */
function drawProp(prop: Prop): void {
  const p = project(prop.x, prop.y);
  const s = prop.size * p.scale;
  const x = p.x;
  const y = p.y;

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

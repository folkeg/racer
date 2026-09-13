/**
 * The wall around the world.
 *
 * In the reference the outfield is not landscape, it is architecture: an
 * unbroken ring of grandstands with white tensile roofs, right the way round, so
 * no part of the frame is empty and the circuit is plainly *inside* something.
 * Ours faded out into open ground, which is why the board had no edge and
 * therefore no interior.
 *
 * What makes it read is repetition. A previous attempt at this drew a
 * naturalistic coastline with hand-placed warehouses and a crane, and it came
 * out as an unidentifiable grey band with blocks in it — a picture of a place
 * rather than a structure. A row of identical units does not have that problem:
 * the eye reads rhythm as built, and it needs no artistry to hold up at this
 * size.
 *
 * Drawn in design space rather than through the camera. This is the edge of the
 * frame, not part of the circuit, so it stays put at whatever size the fit
 * gives the track.
 */

import { ctx, DESIGN_W } from '../platform';
import { activeTrackId } from '../track';
import { BOARD_BOTTOM, BOARD_TOP } from './scenery';
import { surfaceFor } from './surface';

export type BoundaryKind = 'stand' | 'shed' | 'quay' | 'dune' | 'none';

/** How deep the ring is. The side margins are all the room there is. */
const DEPTH = 23;
/** Along-edge pitch of one unit. */
const PITCH = 32;

interface Palette {
  base: string;
  roof: string;
  lit: string;
  dark: string;
}

const PALETTES: Record<string, Palette> = {
  stand: { base: '#2A3038', roof: '#D8DCE0', lit: 'rgba(255,255,255,0.16)', dark: 'rgba(8,12,16,0.45)' },
  shed: { base: '#4A463E', roof: '#8E8778', lit: 'rgba(255,250,236,0.14)', dark: 'rgba(10,12,14,0.45)' },
  quay: { base: '#3E4A52', roof: '#8E9AA0', lit: 'rgba(230,242,248,0.16)', dark: 'rgba(6,14,20,0.45)' },
  dune: { base: '#B9A275', roof: '#D8C79A', lit: 'rgba(255,246,222,0.2)', dark: 'rgba(90,70,40,0.32)' }
};

/**
 * One unit, drawn as though seen from above and slightly in front: a deep body,
 * a roof over it, a lit strip along the roof's near edge and a dark one where it
 * meets the ground.
 *
 * `inward` is the screen direction the unit faces, so the same code serves all
 * four edges of the frame.
 */
function unit(
  x: number,
  y: number,
  along: number,
  depth: number,
  horizontal: boolean,
  palette: Palette,
  kind: BoundaryKind
): void {
  const w = horizontal ? along : depth;
  const h = horizontal ? depth : along;

  if (kind === 'dune') {
    // Sand has no architecture; it has mounds.
    ctx.fillStyle = palette.base;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w * 0.62, h * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.lit;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.42, y + h * 0.4, w * 0.36, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.fillStyle = palette.base;
  ctx.fillRect(x, y, w, h);

  // The roof covers the outer two thirds; the inner third is the face you see.
  const roofDepth = depth * 0.62;
  if (horizontal) {
    const top = y < BOARD_TOP + depth ? y : y + h - roofDepth;
    ctx.fillStyle = palette.roof;
    ctx.fillRect(x + 1, top, w - 2, roofDepth);
    ctx.fillStyle = palette.lit;
    ctx.fillRect(x + 1, top, w - 2, 2);
  } else {
    const left = x < DESIGN_W / 2 ? x : x + w - roofDepth;
    ctx.fillStyle = palette.roof;
    ctx.fillRect(left, y + 1, roofDepth, h - 2);
    ctx.fillStyle = palette.lit;
    ctx.fillRect(left, y + 1, 2, h - 2);
  }

  // The joint between units, which is what turns a band into a row.
  ctx.fillStyle = palette.dark;
  if (horizontal) ctx.fillRect(x, y, 1.4, h);
  else ctx.fillRect(x, y, w, 1.4);
}

export function drawBoundary(): void {
  const kind = surfaceFor(activeTrackId).boundary;
  if (kind === 'none') return;
  const palette = PALETTES[kind];
  if (!palette) return;

  const top = BOARD_TOP;
  const bottom = BOARD_BOTTOM;

  for (let x = 0; x < DESIGN_W; x += PITCH) {
    const w = Math.min(PITCH, DESIGN_W - x);
    unit(x, top, w, DEPTH * 0.8, true, palette, kind);
    unit(x, bottom - DEPTH * 0.8, w, DEPTH * 0.8, true, palette, kind);
  }
  for (let y = top; y < bottom; y += PITCH) {
    const h = Math.min(PITCH, bottom - y);
    unit(0, y, h, DEPTH, false, palette, kind);
    unit(DESIGN_W - DEPTH, y, h, DEPTH, false, palette, kind);
  }
}

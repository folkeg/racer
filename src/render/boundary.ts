/**
 * The wall around the world. Three attempts, three failures, and the idea is
 * retired rather than varied a fourth time.
 *
 * The reference bounds its board with an unbroken ring of grandstands, and every
 * attempt to do the same here has come out as a picture frame. The first was
 * built from rectangles and ellipses and gave the beach scalloped edging and the
 * works yard bathroom tiling. The second was the same with different numbers.
 * The third used a proper drawn grandstand with a crowd in it — and came out as
 * a row of boxes with crowds inside them, because the art was never the problem.
 *
 * What the three share is the structure, and it is the structure that fails: a
 * line of identical bordered units, butted together, following the edge of a
 * rectangle, all the way round. That is the definition of a border pattern. The
 * reference's stands work because they follow the *circuit* — curving with it,
 * at varying distance, broken by other buildings, some of them occluded — and
 * because they are deep enough to have an inside.
 *
 * There is no room for that here without making the track smaller, which is a
 * trade the code cannot make on its own. The renderer stays; nothing calls it.
 */

import { DESIGN_W } from '../platform';
import { activeTrackId } from '../track';
import { drawArt } from './art';
import { BOARD_BOTTOM, BOARD_TOP } from './scenery';
import { surfaceFor } from './surface';

export type BoundaryKind = 'stand' | 'shed' | 'quay' | 'dune' | 'none';

/**
 * Grandstands along the frame, drawn rather than built.
 *
 * Third attempt. The first two failed the same way — a belt of repeated units
 * lining the edge of a rectangle is a pattern, and a pattern at the edge of a
 * picture is a frame, so the beach got scalloped edging and the works yard got
 * bathroom tiling. Both were drawn out of rectangles and ellipses by me.
 *
 * What changes now is not the placement, it is the unit. A grandstand with a
 * crowd in it cannot be mistaken for trim, because a crowd is not a pattern —
 * and it is exactly the thing I could not draw. The stands also run off the edge
 * of the board rather than stopping at it, which is what says the world
 * continues past the frame instead of being bounded by a border.
 */
export function drawBoundary(): void {
  const kind = surfaceFor(activeTrackId).boundary;
  if (kind === 'none') return;
  if (kind !== 'stand') return;

  const top = BOARD_TOP;
  const bottom = BOARD_BOTTOM;
  const SPAN = 74;
  const DEEP = 30;

  // Down each side, turned to face the circuit, and hanging off the edge.
  // Far enough in to be seen. Centred on the frame edge itself, only a sliver
  // of each stand was on the board and the sides came out as a coloured strip;
  // about two thirds of the depth needs to be inside to read as seating.
  const inset = DEEP * 0.22;
  for (let y = top + SPAN * 0.3; y < bottom; y += SPAN) {
    drawArt('tribune', inset, y, SPAN, { angle: Math.PI / 2, shadow: 0 });
    drawArt('tribune', DESIGN_W - inset, y, SPAN, { angle: Math.PI / 2, shadow: 0 });
  }
  // And across the top and bottom.
  for (let x = SPAN * 0.35; x < DESIGN_W; x += SPAN) {
    drawArt('tribune', x, top + inset * 0.6, SPAN, { shadow: 0 });
    drawArt('tribune', x, bottom - inset * 0.6, SPAN, { shadow: 0 });
  }
}

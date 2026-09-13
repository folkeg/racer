/**
 * The world a circuit is laid in: what it stands on and what it is paved with.
 *
 * Every track used to be the same harbour, because the ground and the road were
 * both hard-coded — one gradient, one set of road colours, one set of things
 * floating alongside. A second world meant a second renderer, which is why there
 * was never a second world.
 *
 * The reference is PixelJunk Racers, which is not a place at all: it is a toy
 * slot-car set, and a set can be laid on anything and moulded in any colour. So
 * the circuit geometry, the traffic and the rules stay exactly as they are, and
 * what varies is a tile, a palette and whether anything floats. A new theme is a
 * row in this table.
 *
 * The reason the palette alone carries so much: the baked tiles store *lighting*
 * over transparency, not colour. The same concrete tile is a pale harbour deck
 * or black city asphalt depending only on what is underneath it — so a new road
 * style costs nothing at all, and a new ground costs one bake.
 */

import type { TrackId } from '../tracks';

export type GroundTile = 'water' | 'sand' | 'concrete';

export interface Surface {
  /** The baked tile covering the ground the circuit stands on. */
  tile: GroundTile;
  /** Ground colour: far edge, middle, near edge. */
  far: string;
  mid: string;
  near: string;
  /** Broad fixed patches of light and dark, as a fraction of the default. */
  mottle: number;
  /**
   * Scrolling ground layers, each [unitsPerSecondX, unitsPerSecondY, alpha].
   *
   * A sea moves and sand does not, and that difference is most of what tells
   * them apart at a glance. An empty list is a ground that holds still.
   */
  drift: Array<[number, number, number]>;
  /** Whether boats, buoys and gulls belong here. Only a sea has them. */
  afloat: boolean;
  /** The paving. */
  road: {
    surface: string;
    /** Every other lane, so five lanes read as five. */
    alt: string;
    kerb: string;
    kerbFace: string;
    edge: string;
    /** The deck's side wall and the line where it meets the ground. */
    wall: string;
    waterline: string;
  };
}

export const SURFACES: Record<string, Surface> = {
  harbour: {
    tile: 'water',
    far: '#16324A',
    mid: '#6E8C9C',
    near: '#94AEBA',
    mottle: 1,
    drift: [[4.2, 2.2, 0.34], [-2.6, 3.6, 0.18]],
    afloat: true,
    road: {
      surface: '#D9D9D2',
      alt: '#C4C4BC',
      kerb: '#CFCABC',
      kerbFace: '#8A8478',
      edge: '#B9B9B1',
      wall: '#161F28',
      waterline: 'rgba(232,244,248,0.8)'
    }
  },

  beach: {
    // Wind ripples fall out of the same wave field as water with different
    // numbers, so this ground cost a parameter change rather than a new
    // pipeline. It holds still, which is the other half of reading as sand.
    tile: 'sand',
    far: '#8A7147',
    mid: '#C4A971',
    near: '#E4CE9A',
    mottle: 0.55,
    drift: [[0, 0, 0.42]],
    afloat: false,
    road: {
      // Sun-bleached concrete, warmer than the harbour's and lighter against
      // the sand it sits on.
      surface: '#EFE7D2',
      alt: '#DED4BC',
      kerb: '#E7DCC2',
      kerbFace: '#A3957A',
      edge: '#CFC3A6',
      wall: '#3A3226',
      waterline: 'rgba(255,248,228,0.7)'
    }
  }
};

/** Which world each circuit is laid in. */
const TRACK_SURFACE: Record<TrackId, string> = {
  'long-bay': 'harbour',
  'grand-oval': 'harbour',
  'tide-drop': 'harbour',
  'half-moon': 'beach'
};

export function surfaceFor(track: TrackId): Surface {
  return SURFACES[TRACK_SURFACE[track]] ?? SURFACES.harbour;
}

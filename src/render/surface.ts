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

export type GroundTile = 'water' | 'sand' | 'concrete' | 'asphalt' | 'grass';

/** What kind of thing stands about on this world's open ground. */
export type PropKind =
  | 'rock' | 'tuft' | 'parasol' | 'cone' | 'tyres' | 'drum'
  | 'barrier' | 'lamp' | 'tree' | 'bush' | 'chimney';

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
  /**
   * What moves about on this world besides the traffic.
   *
   * Every world needs something alive in it or it reads as a diagram, and what
   * that something is says more about the place than any amount of texture: the
   * harbour has boats and gulls, the beach has crabs bolting across the sand,
   * the works yard has chimneys going. Same job, different animal.
   */
  life: 'harbour' | 'crabs' | 'smoke' | 'none';
  /** The paving. */
  road: {
    /** Which baked tile the surface grain comes from. */
    tile: GroundTile;
    surface: string;
    /** Every other lane, so five lanes read as five. */
    alt: string;
    kerb: string;
    kerbFace: string;
    edge: string;
    /** The deck's side wall and the line where it meets the ground. */
    wall: string;
    waterline: string;
    /**
     * The apron: the band of made ground the circuit sits in.
     *
     * It has to *contrast* with the ground, which the first attempt did not —
     * the industrial apron was '#6A6459' against a ground of '#5E5A51', a
     * difference of four values, and an edge nobody can see is not an edge. In
     * the reference the run-off is plainly lighter than the concrete around it,
     * and that visible boundary is the whole point: it is what says the ground
     * was made for the circuit rather than the circuit dropped on the ground.
     *
     * The single biggest structural difference from the reference. There, every
     * corner has a run-off area whose material boundary follows the track, so
     * the ground reads as having been *built around* the circuit. Here the
     * ground was one field with a road floating on it, and no amount of scatter
     * fixes that — it is the difference between a place with a track in it and
     * a track with things near it.
     */
    apron: string;
    apronEdge: string;
    /**
     * Transverse joints across the paving.
     *
     * Concrete is cast in slabs and has them; asphalt is laid in a continuous
     * mat and does not. Drawing them on asphalt was the thing that made a
     * recoloured road still read as the same road.
     */
    seams: boolean;
  };
  /**
   * The islands a circuit declares, in this world's materials.
   *
   * They were green whatever the world was, because they were written when
   * every track was a harbour — so the city circuit had a strip of meadow down
   * the middle of a tarmac yard and the works yard had one too. An island is a
   * piece of the ground it stands in, not a piece of scenery that travels.
   */
  island: {
    rim: string;
    beach: string;
    tops: string[];
    cliff: string;
    shelf: string;
    /** Whether anything grows on it. A yard island is not a park. */
    planted: boolean;
  };
  /**
   * The ring of structure around the frame.
   *
   * Nothing uses this. Two attempts have now been made at walling the board in
   * and both failed the same way, which is worth recording rather than trying a
   * third time blind: the circuit is fitted to within 26 units of the frame, so
   * anything drawn outside it is forced to be a thin belt, and a thin repetitive
   * belt at the exact edge of a rectangle reads as decorative trim — scalloped
   * edging on the beach, tiling in the works yard — not as architecture. The
   * reference's grandstands work because they are deep, and because they ring
   * the *circuit*, curving with it, rather than lining the frame.
   *
   * There is no room for that here without making the track smaller. That is a
   * trade, not a bug, and not one to make silently.
   */
  boundary: import('./boundary').BoundaryKind;
  /** What stands about on the open ground, and how densely. */
  props: PropKind[];
  propDensity: number;
  /**
   * The large structures inside the circuit.
   *
   * Empty for a world that should stay bare, and ignored by any circuit whose
   * interior is a set of narrow slots rather than one room.
   */
  structures: import('./infield').StructureKind[];
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
    life: 'harbour',
    road: {
      tile: 'concrete',
      surface: '#D9D9D2',
      alt: '#C4C4BC',
      kerb: '#CFCABC',
      kerbFace: '#8A8478',
      edge: '#B9B9B1',
      wall: '#161F28',
      waterline: 'rgba(232,244,248,0.8)',
      apron: '#AFAFA2',
      apronEdge: '#8E8E82',
      seams: true
    },
    island: {
      rim: '#3E4636',
      beach: '#C6B993',
      tops: ['#6E8B4A', '#7C9553', '#637F43', '#849B58', '#728E4C'],
      cliff: '#333B2C',
      shelf: '#9C8F62',
      planted: true
    },
    boundary: 'quay',
    props: [],
    propDensity: 0,
    structures: []
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
    life: 'crabs',
    road: {
      // Sun-bleached concrete, warmer than the harbour's and lighter against
      // the sand it sits on.
      tile: 'concrete',
      surface: '#EFE7D2',
      alt: '#DED4BC',
      kerb: '#E7DCC2',
      kerbFace: '#A3957A',
      edge: '#CFC3A6',
      wall: '#3A3226',
      waterline: 'rgba(255,248,228,0.7)',
      apron: '#A8997C',
      apronEdge: '#8C7F65',
      seams: true
    },
    island: {
      rim: '#8A7A56',
      beach: '#E2D0A2',
      tops: ['#C3AE79', '#B7A16C', '#CBB684', '#AF9962', '#C0AB76'],
      cliff: '#7E6F4E',
      shelf: '#D8C79A',
      planted: true
    },
    boundary: 'dune',
    props: ['rock', 'tuft', 'parasol'],
    propDensity: 1,
    structures: ['lagoon', 'pavilion', 'dome']
  },

  city: {
    // Night-ish tarmac yard. The ground is the same asphalt as the road, one
    // shade darker, which is what a road running across a car park looks like.
    tile: 'asphalt',
    // Lifted from 1B/2C/3A. The vignette takes another quarter out of the
    // corners, and on top of a ground that dark the whole board went muddy —
    // the props and the traffic were all reading against near-black.
    far: '#2A3138',
    mid: '#3C444C',
    near: '#4C555E',
    mottle: 0.7,
    drift: [],
    afloat: false,
    life: 'none',
    road: {
      tile: 'asphalt',
      surface: '#5A636C',
      alt: '#505962',
      kerb: '#C8C2B2',
      kerbFace: '#6E6A5E',
      edge: '#2A3138',
      wall: '#10151A',
      waterline: 'rgba(150,170,186,0.35)',
      apron: '#59626C',
      apronEdge: '#414A53',
      seams: false
    },
    island: {
      rim: '#252B31',
      beach: '#6E7680',
      tops: ['#4E565E', '#565E66', '#464E56', '#5C646C', '#4A525A'],
      cliff: '#1E242A',
      shelf: '#5E666E',
      planted: false
    },
    boundary: 'stand',
    props: ['barrier', 'lamp', 'cone'],
    propDensity: 1.1,
    structures: ['lawn', 'hall', 'dome']
  },

  industrial: {
    // A works yard: stained concrete, rust, and nothing growing.
    tile: 'concrete',
    far: '#3E3B36',
    mid: '#5E5A51',
    near: '#767162',
    mottle: 1.2,
    drift: [],
    afloat: false,
    life: 'smoke',
    road: {
      tile: 'asphalt',
      surface: '#6B6459',
      alt: '#5F5950',
      kerb: '#C2B58E',
      kerbFace: '#7A6A4C',
      edge: '#4A453D',
      wall: '#221F1A',
      waterline: 'rgba(196,186,160,0.4)',
      apron: '#8E8472',
      apronEdge: '#6E6657',
      seams: false
    },
    island: {
      rim: '#3A362F',
      beach: '#8A8272',
      tops: ['#6E6658', '#766E60', '#665E52', '#7E7668', '#6A6254'],
      cliff: '#332F29',
      shelf: '#7A7264',
      planted: false
    },
    boundary: 'shed',
    props: ['drum', 'tyres', 'cone', 'chimney'],
    propDensity: 1.3,
    structures: ['containers', 'hall', 'tank']
  },

  meadow: {
    tile: 'grass',
    far: '#3E5A33',
    mid: '#5E7F45',
    near: '#79995A',
    mottle: 0.8,
    drift: [],
    afloat: false,
    life: 'none',
    road: {
      tile: 'concrete',
      surface: '#CFCBBE',
      alt: '#BCB8AB',
      kerb: '#D6D2C4',
      kerbFace: '#83806F',
      edge: '#9E9B8C',
      wall: '#22281C',
      waterline: 'rgba(214,226,196,0.4)',
      apron: '#AAA184',
      apronEdge: '#8A8268',
      seams: true
    },
    island: {
      rim: '#2E3A24',
      beach: '#C2BC94',
      tops: ['#6E8B4A', '#7C9553', '#637F43', '#849B58', '#728E4C'],
      cliff: '#2A3420',
      shelf: '#A29A72',
      planted: true
    },
    boundary: 'stand',
    props: ['tree', 'bush', 'rock'],
    propDensity: 1,
    structures: ['lagoon', 'pavilion']
  }
};

/** Which world each circuit is laid in. */
const TRACK_SURFACE: Record<TrackId, string> = {
  'long-bay': 'harbour',
  'grand-oval': 'city',
  'tide-drop': 'industrial',
  'half-moon': 'beach'
};

export function surfaceFor(track: TrackId): Surface {
  return SURFACES[TRACK_SURFACE[track]] ?? SURFACES.harbour;
}

/**
 * The land the circuit is cut into.
 *
 * Everything before this placed objects *on* the ground: find the open spot
 * furthest from the tarmac, stand a building in it, draw a pad under the
 * building so it has something to stand on. Three of those and a road joining
 * them up, and the board still read as models set out on a table — which is the
 * complaint, in the player's words: "要么比例不协调 要么位置 数量不匹配 …
 * 一个个的割裂开来".
 *
 * Two things were wrong and neither was fixable by drawing anything better.
 *
 * The search maximised distance to the track. It ranked open ground by
 * clearance and took the deepest, which is a rule for putting things as far from
 * the circuit as the board allows — so every structure was, by construction,
 * isolated from the only thing on the board it could have belonged to. In the
 * reference the buildings are *against* the circuit: the paddock runs along the
 * straight, the stands lean over the barrier. Proximity is the relationship.
 *
 * And each object carried its own ground. A pad sized to its building is a frame
 * around that building, and a row of framed objects is a row of objects however
 * carefully each one is drawn. This is the third time a bordered unit repeated
 * around the board has failed — the grandstand ring twice, the hardstanding now
 * — and the lesson is the same every time: the ground has to be bigger than the
 * thing standing on it, and shared.
 *
 * So the ground comes first and it is derived from the track. A yard is a band
 * of the centre line: a stretch of the lap, offset sideways, running the whole
 * length of that stretch and curving with it. It cannot fail to relate to the
 * circuit, because it is made out of it. The buildings are then laid along it in
 * a row, sharing it, facing the way it runs — no pads, because the yard is the
 * pad, and it is fifteen times the area of any building on it.
 */

import { ctx } from '../platform';
import { ROAD_HALF_WIDTH } from '../config';
import { centerPath, activeTrackId } from '../track';
import type { TrackId } from '../tracks';
import { lateralUnit, project } from './camera';
import { drawModel, yawFor, yawSprite } from './art';
import { MODEL_SCALE, modelWidth } from '../assets';
import { MODELS } from '../models.generated';
import { BOARD_BOTTOM, BOARD_TOP } from './scenery';
import { CAR_LENGTH, CAR_WIDTH, groundTexture, vehicleSprite } from './sprites';
import { CAR_SHADOW_DISTANCE, SHADOW_X, SHADOW_Y } from './light';
import type { VehicleStyle } from '../types';
import { surfaceFor } from './surface';
import type { GroundTile } from './surface';
import type { Vec2 } from '../types';

/**
 * Where the made ground starts, measured from the centre line.
 *
 * Deliberately *inside* the outer edge of the run-off, so the yard is tucked
 * under the apron rather than laid beside it. The two are the same material and
 * the apron is drawn afterwards, so what the eye gets is one continuous made
 * surface running from the edge of the racing to the back of the yard — instead
 * of a strip of raw ground between them, which is a seam, and a seam is the
 * thing that says "two pictures" every time.
 */
const NEAR_GAP = ROAD_HALF_WIDTH + 10;

/**
 * What a stretch of land beside the circuit is made of.
 *
 * `bare` is not a material and is the most important one in the list: it is
 * where the skirt narrows to nothing and the board's own ground runs right up
 * to the run-off. Without it every circuit gets a continuous made belt on both
 * sides, which is the picture frame this board has already been given twice.
 */
export type ZoneKind = 'yard' | 'gravel' | 'grass' | 'scrub' | 'water' | 'bare';

export interface Zone {
  /** Sample range on the centre line, [i0, i1). */
  i0: number;
  i1: number;
  /** Which way the zone lies off the centre line. */
  side: 1 | -1;
  kind: ZoneKind;
  /** What the zone would like to be, before its neighbours are taken into account. */
  want: number;
}

/** The deepest a skirt is allowed to get, and the ladder tried below it. */
const DEPTHS = [96, 80, 66, 54, 44, 36, 28];

/** How far the offset may collapse before the band has folded over itself. */
const FOLD_TOLERANCE = 0.88;

/** Zones are this long, give or take. Long enough that each reads as somewhere. */
const ZONE_LENGTH = 66;

/**
 * And a yard is this long, which is a lot longer than the rest.
 *
 * A facility is not a zone, it is a run of them. At plain zone length the works
 * yard on Tide Drop came out 66 samples — about 150 units of frontage — which
 * takes exactly one building and then runs out, so the deepest yard on the board
 * held a single shed. The buildings set the scale of the ground they need, not
 * the other way round.
 */
const YARD_SAMPLES = 190;

/** And it is not worth calling a facility unless the ground is this deep. */
const YARD_MIN_DEPTH = 38;

/** A zone shallower than this is not a surface, it is a verge. */
const MIN_DEPTH = 22;

let cachedTrack: TrackId | null = null;
let cachedZones: Zone[] = [];
let cachedDepth: Map<number, number[]> = new Map();

function offsetPoint(i: number, offset: number): Vec2 {
  const path = centerPath;
  const n = path.length;
  const a = path[(i - 1 + n) % n];
  const b = path[(i + 1) % n];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  // (-dy, dx) is the car's right, with screen y running downwards.
  return { x: path[i].x + (-dy / length) * offset, y: path[i].y + (dx / length) * offset };
}

/**
 * How far a point is from the circuit.
 *
 * Every third sample is close enough at this scale and keeps a full-board scan
 * inside a millisecond — this runs once per circuit, but it runs over every
 * sample at every candidate depth.
 */
function distanceToTrack(point: Vec2): number {
  let nearest = Infinity;
  for (let i = 0; i < centerPath.length; i += 3) {
    const dx = centerPath[i].x - point.x;
    const dy = centerPath[i].y - point.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < nearest) nearest = d2;
  }
  return Math.sqrt(nearest);
}

/**
 * Whether a skirt of this depth stands up at this sample.
 *
 * Two ways it does not. The offset can fold: inside a corner tighter than the
 * offset, the offset line crosses itself and the "band" is a bow tie. And the
 * band can reach across the circuit into another part of it — Long Bay's folds
 * are 90 units apart, so a 96-deep skirt on one of them lands on the next. Both
 * are caught by the same measurement: the far edge has to be as far from the
 * circuit as it was asked to be.
 */
function holds(i: number, side: 1 | -1, depth: number): boolean {
  const far = side * (NEAR_GAP + depth);
  const point = offsetPoint(i, far);
  if (point.x < 8 || point.x > 382) return false;
  if (point.y < BOARD_TOP + 6 || point.y > BOARD_BOTTOM - 6) return false;
  return distanceToTrack(point) >= Math.abs(far) * FOLD_TOLERANCE;
}

/** The deepest skirt this sample will take, or zero. */
function headroom(i: number, side: 1 | -1): number {
  for (const depth of DEPTHS) if (holds(i, side, depth)) return depth;
  return 0;
}

/** Deterministic per-circuit randomness: the same board every run, not weather. */
function seeded(seed: number): () => number {
  let state = (seed * 2654435761) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * Where on this side of the lap a facility would fit best.
 *
 * Chosen, not rolled. Letting the yard fall wherever a random walk happened to
 * put it gave Tide Drop a works yard 109 samples long on ground 60 units deep,
 * which takes two buildings and then runs out — the deepest, longest piece of
 * open ground on that circuit had a hut on it and the yard was somewhere else.
 * A facility goes where the board has room for one. That is not a compromise
 * with the geometry, it is the same rule a real site is chosen by.
 *
 * Returns the window and how deep it averages, or null if this side has no
 * stretch worth building on.
 */
function bestSite(room: number[]): { at: number; length: number; depth: number } | null {
  const n = room.length;
  const length = Math.min(YARD_SAMPLES, Math.floor(n * 0.42));
  if (length < 60) return null;

  let best = -1;
  let bestDepth = 0;
  for (let start = 0; start < n; start += 3) {
    let sum = 0;
    let floor = Infinity;
    for (let i = start; i < start + length; i++) {
      sum += room[i % n];
      floor = Math.min(floor, room[i % n]);
    }
    const mean = sum / length;
    // Deep on average and never pinched to nothing: a yard with a waist in it is
    // two yards.
    if (floor < MIN_DEPTH) continue;
    if (mean > bestDepth) {
      bestDepth = mean;
      best = start;
    }
  }
  return best < 0 || bestDepth < YARD_MIN_DEPTH ? null : { at: best, length, depth: bestDepth };
}

/**
 * Cuts one side of the lap into zones.
 *
 * The board is not big enough for a landscape. Measured, the ground beside the
 * circuit is a belt 36 to 96 units deep on the widest circuit and nothing at all
 * on the narrowest — there is no room out there for fields and lanes and a town,
 * however much the reference has them. What there is room for is the reference's
 * *other* structure, which is the one that actually does the work: bands of
 * different surface running parallel to the racing, changing as the lap goes
 * round. A yard along one straight, gravel through the corner after it, grass
 * out to the frame, then nothing at all for a while.
 *
 * So every part of the lap belongs to some zone, and the zones differ. That is
 * what stops the board being one field of grey with a road on it — which is what
 * it has been, on every circuit, since the day it was built.
 */
function zonesForSide(
  side: 1 | -1,
  kinds: ZoneKind[],
  seed: number,
  site: { at: number; length: number } | null
): Zone[] {
  const n = centerPath.length;
  const room = centerPath.map((_, i) => headroom(i, side));
  if (room.every((value) => value === 0)) return [];

  const random = seeded(seed);
  const zones: Zone[] = [];
  const natural = kinds.filter((kind) => kind !== 'yard');

  if (site) {
    let depth = Infinity;
    for (let i = site.at; i < site.at + site.length; i++) depth = Math.min(depth, room[i % n]);
    zones.push({
      i0: site.at,
      i1: site.at + site.length,
      side,
      kind: 'yard',
      want: Math.round(depth)
    });
  }

  // Whatever is left of the lap, in stretches.
  const from = site ? site.at + site.length : 0;
  const until = site ? site.at + n : n;
  let at = from;
  let previous: ZoneKind | null = site ? 'yard' : null;

  while (at < until - 24) {
    const length = Math.min(
      Math.round(ZONE_LENGTH * (0.62 + random() * 0.9)),
      until - at
    );
    if (length < 24) break;
    const end = at + length;

    const available = [];
    for (let i = at; i < end; i++) available.push(room[i % n]);
    available.sort((a, b) => a - b);
    // What the zone can have where it is roomiest, not where it is tightest.
    //
    // Taking the minimum over the whole zone was the obvious rule and it is
    // wrong: a zone that passes one pinch point gets the pinch point's answer
    // for its entire length, and on Tide Drop that turned a sixty-unit belt into
    // nothing at all down a whole side. The wish is set by the roomy part; every
    // sample is then clamped to what that sample will take, which is what makes
    // the boundary breathe rather than step.
    let depth = available[Math.floor(available.length * 0.65)];

    let kind: ZoneKind;
    if (depth < MIN_DEPTH) {
      kind = 'bare';
      depth = 0;
    } else {
      // Not the same thing twice running: a boundary between two identical
      // surfaces is not a boundary, it is a seam in one surface.
      const choices = natural.filter((value) => value !== previous);
      kind = choices[Math.floor(random() * choices.length) % choices.length];
      // And not always as deep as it could be. A skirt that takes every unit the
      // board will give it is the same width everywhere the board is, which is a
      // machine's answer and looks like one.
      depth *= 0.45 + random() * 0.55;
    }

    previous = kind;
    zones.push({ i0: at, i1: end, side, kind, want: Math.round(depth) });
    at = end;
    if (zones.length > 20) break;
  }

  return zones;
}

/**
 * What a world's skirt can be made of.
 *
 * Short lists, and `bare` twice. Five kinds were tried and on the works circuit
 * three of them came out as grey quadrilaterals within fifteen values of each
 * other, which is not three surfaces, it is one surface with stains on it. What
 * separates ground is material — pale gravel, a concrete yard, green, water —
 * and a world that only owns two of those should only use two of those.
 *
 * `bare` is weighted because a skirt that is made ground all the way round is a
 * belt, and a belt round a rectangle is the picture frame this board has already
 * been given twice.
 */
function paletteFor(): ZoneKind[] {
  const world = surfaceFor(activeTrackId);
  const kinds: ZoneKind[] = ['yard', 'gravel', 'bare', 'bare'];
  if (world.island.planted) kinds.push('grass', 'scrub');
  if (world.afloat) kinds.push('water');
  return kinds;
}

function build(): void {
  cachedZones = [];
  cachedDepth = new Map();
  const n = centerPath.length;

  // One yard on the whole circuit, on whichever side has the better ground for
  // it. Two facilities on a board this size is a suburb.
  const sites = new Map<number, ReturnType<typeof bestSite>>();
  for (const side of [-1, 1] as const) {
    sites.set(side, bestSite(centerPath.map((_, i) => headroom(i, side))));
  }
  const inside = sites.get(-1);
  const outside = sites.get(1);
  const built = (inside?.depth ?? 0) >= (outside?.depth ?? 0) ? -1 : 1;

  for (const side of [-1, 1] as const) {
    const zones = zonesForSide(
      side,
      paletteFor(),
      side === 1 ? 8191 : 5077,
      side === built ? sites.get(side) ?? null : null
    );
    cachedZones.push(...zones);
    const room = centerPath.map((_, i) => headroom(i, side));

    // One continuous outer boundary per side, whose depth varies.
    //
    // Giving each zone a constant depth and tapering its ends produces a row of
    // separate lozenges with gaps between them — objects again, at the scale of
    // the ground this time. Smoothing one depth profile across the whole lap
    // instead gives a single unbroken edge that breathes in and out, and the
    // zone boundaries become changes of *material* along it rather than changes
    // of shape. That difference is most of what "浑然一体" means here.
    const target = new Array<number>(n).fill(0);
    for (const zone of zones) {
      for (let i = zone.i0; i < zone.i1; i++) {
        // The wish, clamped to what this particular sample will take.
        target[i % n] = Math.min(zone.want, room[i % n]);
      }
    }
    const SMOOTH = 7;
    const smoothed = target.map((_, i) => {
      let sum = 0;
      for (let k = -SMOOTH; k <= SMOOTH; k++) sum += target[(i + k + n) % n];
      return sum / (SMOOTH * 2 + 1);
    });
    cachedDepth.set(side, smoothed);
  }
}

function ensure(): void {
  if (cachedTrack === activeTrackId) return;
  build();
  cachedTrack = activeTrackId;
}

export function zones(): Zone[] {
  ensure();
  return cachedZones;
}

/** The smoothed depth of the skirt at a sample. */
function depthAt(side: 1 | -1, i: number): number {
  ensure();
  const profile = cachedDepth.get(side);
  return profile ? profile[i % centerPath.length] : 0;
}

/**
 * A zone as a closed polygon, optionally shrunk on all four sides.
 *
 * `inset` is what makes a soft edge possible without a blur: the same zone drawn
 * four times, each a little smaller and a little more opaque, is a gradient. It
 * shrinks in arc as well as in depth, so the ends fade too — a field that stops
 * dead across the lap is a rectangle, and a rectangle is the thing this board
 * has been accused of three times.
 *
 * At inset zero it reaches one sample into each neighbour instead, so two
 * hard-edged zones meet without a hairline of bare ground between them.
 */
export function zoneOutline(zone: Zone, inset = 0): Vec2[] {
  const n = centerPath.length;
  const bite = inset > 0 ? Math.round(inset * 0.9) : -1;
  const from = zone.i0 + bite;
  const to = zone.i1 - bite;
  if (to - from < 4) return [];

  const points: Vec2[] = [];
  for (let i = from; i < to; i++) {
    const depth = depthAt(zone.side, i) - inset;
    if (depth <= 0) continue;
    points.push(offsetPoint(((i % n) + n) % n, zone.side * (NEAR_GAP + depth)));
  }
  for (let i = to - 1; i >= from; i--) {
    points.push(offsetPoint(((i % n) + n) % n, zone.side * (NEAR_GAP + inset * 0.35)));
  }
  return points;
}

/** The line things stand on inside a zone, and the way the zone runs there. */
export function buildLine(zone: Zone, fraction: number): Array<Vec2 & { angle: number }> {
  const n = centerPath.length;
  const out: Array<Vec2 & { angle: number }> = [];
  for (let i = zone.i0; i < zone.i1; i++) {
    const index = ((i % n) + n) % n;
    const point = offsetPoint(index, zone.side * (NEAR_GAP + depthAt(zone.side, i) * fraction));
    const a = centerPath[(index - 1 + n) % n];
    const b = centerPath[(index + 1) % n];
    out.push({ x: point.x, y: point.y, angle: Math.atan2(b.y - a.y, b.x - a.x) });
  }
  return out;
}

function trace(points: Vec2[]): void {
  ctx.beginPath();
  const first = project(points[0].x, points[0].y);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < points.length; i++) {
    const p = project(points[i].x, points[i].y);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
}

interface Material {
  fill: string;
  edge: string;
  tile: GroundTile;
  grain: number;
  /**
   * Whether this ground was laid by someone.
   *
   * It decides how the zone ends, and it is the distinction the first version
   * missed entirely: made ground has a hard edge because somebody poured it to a
   * line, and grown ground does not because nothing drew that line. Giving a
   * patch of scrub the same crisp kerb as a concrete yard is what turned it into
   * a dark quadrilateral lying on the board — a stain, not a surface.
   */
  made: boolean;
}

/**
 * What each kind of ground is made of in this world.
 *
 * Drawn from the world's own palette rather than from a second table, so a new
 * world still costs one row: its gravel is its run-off, its scrub is the colour
 * its islands are planted in, and its yard is the one colour a works yard needs
 * that nothing else on the board already has.
 */
function materialFor(kind: ZoneKind): Material | null {
  const world = surfaceFor(activeTrackId);
  switch (kind) {
    case 'yard':
      return {
        fill: world.yard.fill,
        edge: world.yard.edge,
        tile: world.yard.tile,
        grain: 0.5,
        made: true
      };
    case 'gravel':
      return {
        fill: world.road.apron,
        edge: world.road.apronEdge,
        tile: world.road.tile,
        grain: 0.55,
        made: true
      };
    case 'grass':
      return {
        fill: world.island.tops[0],
        edge: world.island.rim,
        tile: 'grass',
        grain: 0.6,
        made: false
      };
    case 'scrub':
      return {
        fill: world.island.shelf,
        edge: world.island.rim,
        tile: 'sand',
        grain: 0.46,
        made: false
      };
    case 'water':
      return { fill: '#4E6C7E', edge: '#32485A', tile: 'water', grain: 0.6, made: false };
    default:
      return null;
  }
}

/** The depth a zone actually ends up with, once its neighbours have smoothed it. */
export function depthOf(zone: Zone): number {
  let sum = 0;
  for (let i = zone.i0; i < zone.i1; i++) sum += depthAt(zone.side, i);
  return sum / Math.max(1, zone.i1 - zone.i0);
}

/** Where the outer edge of the skirt runs, all the way round one side. */
function boundary(side: 1 | -1): Array<Vec2 & { depth: number }> {
  const n = centerPath.length;
  const out: Array<Vec2 & { depth: number }> = [];
  for (let i = 0; i < n; i++) {
    const depth = depthAt(side, i);
    const point = offsetPoint(i, side * (NEAR_GAP + depth));
    out.push({ x: point.x, y: point.y, depth });
  }
  return out;
}

/** Below this the skirt has closed up and there is nothing to draw an edge on. */
const EDGE_FLOOR = 9;

/**
 * The made and grown ground beside the circuit.
 *
 * Fills first, every zone, then one continuous edge per side over the top.
 *
 * The order is the whole trick. Edging each zone separately draws a line across
 * the skirt at every boundary, and a surface with a line round it is a unit — a
 * row of units is what the board has been accused of being, in those words,
 * three times now. Edging the *outside* only leaves the boundaries between
 * materials as changes of colour and grain with no outline at all, which is what
 * a change of ground actually looks like from the air.
 */
export function drawLand(): void {
  for (const zone of zones()) {
    const material = materialFor(zone.kind);
    if (material) drawZone(zone, material);
  }

  // Then what is painted on it, then the hard edge, which goes on last and only
  // where the ground was laid by someone: a concrete yard has a kerb and a field
  // does not.
  for (const zone of zones()) {
    const material = materialFor(zone.kind);
    if (material && material.made) drawMarkings(zone);
  }
  for (const side of [-1, 1] as const) drawBoundaryEdge(side);
}

/** Fills one zone: solid if it was laid, feathered if it grew. */
function drawZone(zone: Zone, material: Material): void {
  const grain = groundTexture(ctx, material.tile);
  const steps: Array<[number, number]> = material.made
    ? [[0, 1]]
    : SOFT_STEPS.map((inset, i) => [inset, SOFT_ALPHA[i]] as [number, number]);

  for (const [inset, alpha] of steps) {
    const outline = zoneOutline(zone, inset);
    if (outline.length < 6) continue;

    ctx.save();
    ctx.globalAlpha = alpha;
    trace(outline);
    ctx.fillStyle = material.fill;
    ctx.fill();

    if (grain) {
      ctx.clip();
      ctx.globalAlpha = alpha * material.grain;
      ctx.fillStyle = grain;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const point of outline) {
        const p = project(point.x, point.y);
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    }
    ctx.restore();
  }
}

/**
 * Four passes make a soft edge without a blur filter.
 *
 * Each is drawn a little further in and a little more opaque, so the outermost
 * ring of ground is a fifth strength and the middle is solid. It costs four
 * fills on a zone nobody will look at directly, and it is the difference between
 * a field and a patch.
 */
const SOFT_STEPS = [14, 9, 4.5, 0];
const SOFT_ALPHA = [0.22, 0.34, 0.5, 1];

/**
 * Parked cars, in muted paint.
 *
 * Never the traffic's blue. The player has to be able to count moving cars at a
 * glance, and a car park full of the same colour as the traffic is a car park
 * that has to be read before it can be dismissed. These are the colours a real
 * car park is full of and the ones this board has none of.
 */
const PARKED: VehicleStyle[] = [
  { body: '#C8C6C0', cabin: '#DEDCD6', window: '#5E666E', lights: '#EEE8D8', stripe: null, side: '#8A8882', rim: '#F2F0EA' },
  { body: '#8A9098', cabin: '#9CA2AA', window: '#4A525A', lights: '#E8E4D8', stripe: null, side: '#5C646C', rim: '#B8BEC6' },
  { body: '#7C4238', cabin: '#8E5044', window: '#46383A', lights: '#E8DCC8', stripe: null, side: '#4E2A24', rim: '#A66A5C' },
  { body: '#4C5A50', cabin: '#5A6A5E', window: '#38423C', lights: '#E2E2D4', stripe: null, side: '#2E382F', rim: '#7A8A7C' },
  { body: '#2E343A', cabin: '#3A424A', window: '#20262C', lights: '#DCDCD0', stripe: null, side: '#1A1E22', rim: '#5A646E' }
];

/**
 * Paint on the made ground, and what parks on it.
 *
 * The cheapest density on the board, and the only kind that works on a yard too
 * shallow to stand a building in — Grand Oval's is 35 units deep, and the only
 * model in the city's list that fits across it is a small tank, which is how
 * that straight ended up lined with eight identical barrels.
 *
 * Bays alone were tried first and read as a ladder painted on the ground, which
 * is exactly what they are until something parks in them. The cars are what turn
 * the marking into a place, and they cost nothing: the game already builds car
 * sprites procedurally, so a full car park is a few hundred bytes of code and no
 * bytes of art at all.
 *
 * One run of bays somewhere along the zone, not end to end. A car park the whole
 * length of a straight is a runway.
 */
function drawMarkings(zone: Zone): void {
  const n = centerPath.length;
  const span = zone.i1 - zone.i0;
  if (span < 40) return;
  const depth = depthOf(zone);
  if (depth < CAR_LENGTH * 1.1) return;

  const random = seeded(zone.i0 * 7919 + zone.side * 13 + zone.want);
  const from = zone.i0 + Math.floor(span * (0.08 + random() * 0.3));
  const to = Math.min(zone.i1 - 6, from + Math.floor(span * (0.3 + random() * 0.32)));
  if (to - from < 20) return;

  // A bay is a car and a bit, and the row of them is set against one edge of the
  // yard or the other.
  const bay = Math.min(CAR_LENGTH * 1.2, depth * 0.66);
  const back = random() < 0.5;
  const inner = back ? 1 - bay / depth - 0.06 : 0.08;
  const outer = inner + bay / depth;
  const middle = (inner + outer) / 2;

  ctx.save();
  ctx.strokeStyle = 'rgba(238,234,220,0.32)';
  ctx.lineWidth = 0.9 * lateralUnit();
  ctx.lineCap = 'round';

  const parked: Array<{ x: number; y: number; angle: number; style: VehicleStyle }> = [];
  let step = 0;
  for (let i = from; i <= to; i++) {
    if (step > 0) {
      step -= 1;
      continue;
    }
    const index = ((i % n) + n) % n;
    const here = depthAt(zone.side, i);
    if (here < CAR_LENGTH * 1.1) continue;

    const a = offsetPoint(index, zone.side * (NEAR_GAP + here * inner));
    const b = offsetPoint(index, zone.side * (NEAR_GAP + here * outer));
    const pa = project(a.x, a.y);
    const pb = project(b.x, b.y);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();

    // Most bays hold something; a car park with every bay full is a showroom.
    if (random() < 0.62) {
      const at = offsetPoint(index, zone.side * (NEAR_GAP + here * middle));
      const ahead = centerPath[(index + 1) % n];
      const behind = centerPath[(index - 1 + n) % n];
      parked.push({
        x: at.x,
        y: at.y,
        // Nose in: across the bay, which is across the yard.
        angle: Math.atan2(ahead.y - behind.y, ahead.x - behind.x) + Math.PI / 2,
        style: PARKED[Math.floor(random() * PARKED.length) % PARKED.length]
      });
    }

    const ahead = centerPath[(index + 1) % n];
    const behind = centerPath[(index - 1 + n) % n];
    const perSample = Math.hypot(ahead.x - behind.x, ahead.y - behind.y) / 2 || 1;
    step = Math.max(1, Math.round((CAR_WIDTH * 1.28) / perSample)) - 1;
  }
  ctx.restore();

  for (const car of parked) {
    const sprite = vehicleSprite(`parked-${car.style.body}`, car.style);
    if (!sprite) continue;
    const p = project(car.x, car.y);
    const length = CAR_LENGTH * lateralUnit();
    const width = CAR_WIDTH * lateralUnit();

    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.translate(p.x + SHADOW_X * CAR_SHADOW_DISTANCE, p.y + SHADOW_Y * CAR_SHADOW_DISTANCE);
    ctx.rotate(car.angle);
    ctx.drawImage(sprite.shadow as unknown as CanvasImageSource, -length / 2, -width / 2, length, width);
    ctx.restore();

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(car.angle);
    ctx.drawImage(sprite.image as unknown as CanvasImageSource, -length / 2, -width / 2, length, width);
    ctx.restore();
  }
}

/**
 * The outer edge, in unbroken runs.
 *
 * Three strokes and every one is load-bearing: a soft dark spread outside the
 * line, which is the ground falling away to the made surface; a firm line on it;
 * and a pale line just inside, which is the top of that edge catching the sun.
 * Weaker versions of the first two were tried and the skirt read as a slightly
 * paler patch of the same ground — an edge nobody can see is not an edge.
 */
function drawBoundaryEdge(side: 1 | -1): void {
  const line = boundary(side);
  const n = line.length;
  if (n === 0) return;
  const world = surfaceFor(activeTrackId);

  let run: Array<Vec2 & { depth: number }> = [];
  const flush = (): void => {
    if (run.length > 4) {
      const stroke = (colour: string, width: number, inset: number): void => {
        ctx.beginPath();
        for (let i = 0; i < run.length; i++) {
          const p = project(run[i].x, run[i].y);
          if (i === 0) ctx.moveTo(p.x, p.y + inset);
          else ctx.lineTo(p.x, p.y + inset);
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = colour;
        ctx.lineWidth = width * lateralUnit();
        ctx.stroke();
      };
      stroke('rgba(10,15,20,0.22)', 5.4, 0.8 * lateralUnit());
      stroke(world.yard.edge, 2.2, 0);
      stroke('rgba(255,250,238,0.26)', 1.1, -0.9 * lateralUnit());
    }
    run = [];
  };

  // Which samples belong to made ground, so the kerb stops where the concrete
  // does and a field simply fades out.
  const laid = new Array<boolean>(n).fill(false);
  for (const zone of zones()) {
    if (zone.side !== side) continue;
    const material = materialFor(zone.kind);
    if (!material || !material.made) continue;
    for (let i = zone.i0; i < zone.i1; i++) laid[(((i % n) + n) % n)] = true;
  }

  ctx.save();
  for (let i = 0; i <= n; i++) {
    const index = i % n;
    const point = line[index];
    if (i < n && laid[index] && point.depth > EDGE_FLOOR) run.push(point);
    else flush();
  }
  flush();
  ctx.restore();
}

/* ------------------------------------------------------------------------- */
/* What stands in the yard                                                    */
/* ------------------------------------------------------------------------- */

/**
 * A row of buildings along the yard, all facing the way it runs.
 *
 * The orientation is the whole reason the sprites are rendered at eight yaws.
 * A building on a circuit is square to the track beside it — that is what the
 * eye reads as "this was built here" rather than "this was dropped here" — and
 * turning a top-down sprite in the game turns its baked light with it, which
 * costs more than the alignment gains. So the turn happens in Blender under a
 * fixed sun, and the game picks the sprite.
 */
export interface Placed {
  x: number;
  y: number;
  model: string;
  /** Sprite width in plane units. */
  width: number;
  /** How far the footprint centre sits below the middle of the sprite. */
  anchor: number;
  /** Footprint radius in plane units, for keeping things off each other. */
  radius: number;
  /** Distance down the yard, for drawing back to front. */
  order: number;
}

/** Gap between neighbours, in plane units. Tight: a yard is not a sculpture park. */
const YARD_GAP = 9;
/** And an equal margin at each end, so the row does not run off the splay. */
const YARD_MARGIN = 26;

/**
 * Lays one row of things along the yard.
 *
 * Three rules, and all of them are about the yard rather than the things.
 *
 * Nothing goes in a row that does not fit across it. A yard is as deep as the
 * board let it be — 96 units on Tide Drop, 44 on Grand Oval — and a works
 * building is 86 deep, so on one it anchors the site and on the other it simply
 * does not belong. Picking by fit is what keeps a wall out of the run-off, and
 * it is also what gives two circuits different-looking facilities without anyone
 * choosing that.
 *
 * The row is measured along the yard by arc length, so neighbours keep a
 * constant gap however the yard curves — which is what a row of sheds on a real
 * site looks like from the air.
 *
 * And the spacing is not even. Even spacing is the one thing that says a machine
 * placed this: a real yard has a wide gap where the lorries turn and a narrow
 * one where two sheds share a wall. The jitter is seeded off the yard, so it is
 * the same yard every run.
 */
/** Whether a footprint would land on something already standing there. */
function clashes(placed: Placed[], x: number, y: number, radius: number): boolean {
  for (const other of placed) {
    if (Math.hypot(other.x - x, other.y - y) < (other.radius + radius) * 0.82) return true;
  }
  return false;
}

/**
 * Lays one row of things along a zone.
 *
 * Four rules, and all of them are about the ground rather than the things.
 *
 * Nothing goes in that does not fit across the skirt where it stands. The skirt
 * breathes — 93 units deep at the middle of a yard, 20 at its ends — so the test
 * is made per item at its own point, not once for the zone.
 *
 * The row is measured by arc length, so neighbours keep their gap however the
 * zone curves. That is what a row of sheds on a real site looks like from the
 * air.
 *
 * The spacing and the cross position are both jittered. Even spacing is the one
 * thing that says a machine placed this — a line of six identical tanks at
 * identical intervals was exactly what the first version drew, and it was the
 * most obviously generated thing on the board.
 *
 * And nothing is placed on top of anything else. The buildings and the clutter
 * were laid out by two passes that did not know about each other, so the tanks
 * were drawn through the sheds.
 */
function row(
  zone: Zone,
  anchor: number,
  maxShare: number,
  names: string[],
  gap: number,
  seed: number,
  limit: number,
  taken: Placed[]
): Placed[] {
  const depth = depthOf(zone);
  if (depth < MIN_DEPTH) return [];

  const line = buildLine(zone, anchor);
  if (line.length < 8) return [];

  const kinds = names.filter((name) => MODELS[name]);
  if (kinds.length === 0) return [];

  const step: number[] = [0];
  for (let i = 1; i < line.length; i++) {
    step.push(step[i - 1] + Math.hypot(line[i].x - line[i - 1].x, line[i].y - line[i - 1].y));
  }
  const total = step[step.length - 1];
  const random = seeded(seed);
  const margin = Math.min(YARD_MARGIN, total * 0.1);
  const n = centerPath.length;

  const placed: Placed[] = [];
  let at = margin;
  let previous = '';
  while (at < total - margin && placed.length < limit) {
    // Never the same thing twice running. Two identical sheds side by side is
    // the most obvious tell there is that nobody chose either of them.
    let name = kinds[Math.floor(random() * kinds.length) % kinds.length];
    if (name === previous && kinds.length > 1) {
      name = kinds[(kinds.indexOf(name) + 1 + Math.floor(random() * (kinds.length - 1))) % kinds.length];
    }
    const info = MODELS[name];
    const along = info.width * MODEL_SCALE;
    const across = info.depth * MODEL_SCALE;
    if (at + along > total - margin) break;

    const centre = at + along / 2;
    let i = 1;
    while (i < step.length - 1 && step[i] < centre) i++;
    const index = (((zone.i0 + i) % n) + n) % n;
    const here = depthAt(zone.side, index);

    if (across > here * maxShare) {
      // Too deep for the skirt at this point. Step on rather than give up: the
      // skirt is deeper further along, and that is where this belongs.
      at += along * 0.4 + gap;
      continue;
    }

    // Where across the skirt this one stands: the row's anchor, jittered, then
    // pushed in only as far as it has to be to keep its own footprint on the
    // ground it is standing on.
    const half = across / 2 / Math.max(1, here);
    const wanted = anchor + (random() - 0.5) * 0.16;
    const fraction = Math.min(Math.max(wanted, half + 0.04), 1 - half - 0.04);
    const point = offsetPoint(index, zone.side * (NEAR_GAP + here * fraction));
    const radius = Math.max(along, across) * 0.42;

    if (clashes(taken, point.x, point.y, radius) || clashes(placed, point.x, point.y, radius)) {
      at += gap;
      continue;
    }

    previous = name;
    const yaw = yawFor(line[i].angle, info.yaws);
    placed.push({
      x: point.x,
      y: point.y,
      model: yawSprite(name, info.yaws, yaw),
      width: modelWidth(name, yaw),
      anchor: info.anchors[Math.min(yaw, info.anchors.length - 1)],
      radius,
      order: point.y
    });

    at += along + gap * (0.5 + random() * 1.5);
  }
  return placed;
}

/**
 * Fills whatever the buildings left, anywhere in the yard.
 *
 * Not a row. The buildings are a row because buildings are built along a
 * frontage; the drums and containers and tanks around them are not, and laying
 * them in a second row produced six identical tanks at six identical intervals,
 * which was the most obviously machine-made thing on the board.
 *
 * This throws darts at the yard instead and keeps the ones that land on free
 * ground. It is the only part of the layout that is allowed to be random,
 * because clutter is the only part that really is.
 */
function scatter(
  zone: Zone,
  names: string[],
  attempts: number,
  seed: number,
  taken: Placed[]
): Placed[] {
  const depth = depthOf(zone);
  if (depth < 14) return [];
  const n = centerPath.length;
  // What will actually fit across this yard.
  const kinds = names.filter(
    (name) => MODELS[name] && MODELS[name].depth * MODEL_SCALE <= depth * 0.8
  );
  if (kinds.length === 0) return [];

  // One kind is not clutter, it is a pattern.
  //
  // Grand Oval's yard is 35 units deep and the only model in the city's list
  // that fits across it is a small tank, so the scatter filled the whole
  // straight with eight identical barrels in a line — the most obviously
  // machine-made thing on the board. Below two kinds the yard gets a token
  // couple and is otherwise left as made ground, which is what a yard mostly is.
  const limit = kinds.length >= 2 ? attempts : 2;

  const random = seeded(seed);
  const placed: Placed[] = [];
  const span = zone.i1 - zone.i0;

  for (let a = 0; a < attempts && placed.length < limit; a++) {
    const name = kinds[Math.floor(random() * kinds.length) % kinds.length];
    const info = MODELS[name];
    const along = info.width * MODEL_SCALE;
    const across = info.depth * MODEL_SCALE;

    const offset = 0.06 + random() * 0.88;
    const index = ((Math.round(zone.i0 + offset * span) % n) + n) % n;
    const here = depthAt(zone.side, index);
    if (across > here * 0.8) continue;

    const half = across / 2 / Math.max(1, here);
    // Biased towards the back of the yard: the near strip is the apron, and a
    // works yard has one because lorries have to turn somewhere.
    const wanted = 0.42 + random() * 0.5;
    const fraction = Math.min(Math.max(wanted, half + 0.03), 1 - half - 0.03);
    const point = offsetPoint(index, zone.side * (NEAR_GAP + here * fraction));
    const radius = Math.max(along, across) * 0.46;
    if (clashes(taken, point.x, point.y, radius) || clashes(placed, point.x, point.y, radius)) {
      continue;
    }

    const before = centerPath[(index - 1 + n) % n];
    const after = centerPath[(index + 1) % n];
    const yaw = yawFor(Math.atan2(after.y - before.y, after.x - before.x), info.yaws);
    placed.push({
      x: point.x,
      y: point.y,
      model: yawSprite(name, info.yaws, yaw),
      width: modelWidth(name, yaw),
      anchor: info.anchors[Math.min(yaw, info.anchors.length - 1)],
      radius,
      order: point.y
    });
  }
  return placed;
}

/**
 * The whole site: the buildings, and the yard full of what serves them.
 *
 * Two passes, the second knowing about the first. Three or four buildings is all
 * the frontage the board has — measured, the largest site on the widest circuit
 * is about three hundred units long, and a works building is eighty of them — so
 * the density has to come from everything else. A yard with four buildings and
 * nothing between them is four objects on made ground, which is the pad problem
 * again at yard scale.
 */
export function facility(): Placed[] {
  const world = surfaceFor(activeTrackId);
  const placed: Placed[] = [];

  for (const [index, zone] of zones().entries()) {
    if (zone.kind !== 'yard') continue;
    const seed = index * 977 + zone.i0 * 31 + zone.want;
    const site: Placed[] = [];
    // The near strip stays clear: that is the apron.
    site.push(...row(zone, 0.58, 0.95, world.structures, YARD_GAP, seed, 6, site));
    site.push(...scatter(zone, world.clutter, 90, seed + 13, site));
    placed.push(...site);
  }
  return placed;
}

/** Draws the facility, far to near, so a nearer building overlaps a farther one. */
export function drawFacility(): void {
  const world = surfaceFor(activeTrackId);
  for (const item of [...facility()].sort((a, b) => a.order - b.order)) {
    const p = project(item.x, item.y);
    drawModel(item.model, p.x, p.y, {
      width: item.width * lateralUnit(),
      anchor: item.anchor,
      shadow: 0.30,
      tint: world.artTint,
      tintStrength: world.artTintStrength * 0.5
    });
  }
}

/**
 * The road surface, drawn in perspective.
 *
 * Every edge of the circuit is offset on the plane and then projected, so the
 * road narrows with distance the way a real one does. Surfaces are filled
 * between their two projected edges rather than stroked, because a stroke of
 * constant width would ignore the perspective entirely.
 *
 * All of this lands in the cached static layer: the camera does not move, so it
 * is computed once per circuit.
 */

import { KERB_WIDTH, LANE_COUNT, ROAD_HALF_WIDTH } from '../config';
import { ctx } from '../platform';
import { activeTrackId, pathAtOffset, pathForLane, sampleAtDistance } from '../track';
import { surfaceFor } from './surface';
import { ROAD_DEPTH, ROAD_WALL_HEIGHT, SHADOW_X, SHADOW_Y } from './light';
import { fillNearFaces, fillRibbon, offsetPath } from './primitives';
import { lateralUnit, project, projectPath, projectedHeading } from './camera';
import { groundTexture } from './sprites';

/**
 * The made ground the circuit sits in, and the soft dark where the two meet.
 *
 * Drawn as strokes along the centre line rather than as offset paths. Offsetting
 * a closed loop further than its tightest corner radius turns the curve inside
 * out, and Long Bay's folds are radius 45 — anything wider than that from the
 * centre line inverts and draws a knot. A wide round-joined stroke sweeps the
 * same region and cannot fail that way.
 *
 * The contact shadow is three strokes rather than one, each wider and fainter
 * than the last. A single band has a hard outer edge and reads as a decal; three
 * steps read as a falloff, which is what light actually does at the foot of a
 * raised thing — and it costs three strokes in a layer that is drawn once.
 */
/**
 * 30 was far too wide. The road's own half-width is 34, so an apron of 30 on
 * each side nearly doubled the circuit's footprint and turned it into a fat
 * double ring that dominated the board — the opposite of the reference, where
 * the run-off is plainly subordinate to the track it serves. A shoulder should
 * read as the edge of the made ground, not as a second road.
 */
const APRON_WIDTH = 12;

function strokeAlongCentre(halfWidth: number, colour: string): void {
  const path = projectPath(pathAtOffset(0));
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = colour;
  ctx.lineWidth = halfWidth * 2 * lateralUnit();
  ctx.stroke();
  ctx.restore();
}

function drawApron(): void {
  const paint = surfaceFor(activeTrackId).road;

  // One faint step of ground shadow outside the apron, and no more. Two wider
  // ones were tried and they darkened most of the board: on a circuit with a
  // narrow infield the bands from both sides meet in the middle, so a shadow
  // "around the track" becomes a shadow over everything.
  strokeAlongCentre(ROAD_HALF_WIDTH + APRON_WIDTH + 8, 'rgba(6,14,20,0.10)');

  strokeAlongCentre(ROAD_HALF_WIDTH + APRON_WIDTH, paint.apronEdge);
  strokeAlongCentre(ROAD_HALF_WIDTH + APRON_WIDTH - 3, paint.apron);

  // And the contact shadow, hugging the deck.
  strokeAlongCentre(ROAD_HALF_WIDTH + 13, 'rgba(6,14,20,0.13)');
  strokeAlongCentre(ROAD_HALF_WIDTH + 8, 'rgba(6,14,20,0.16)');
  strokeAlongCentre(ROAD_HALF_WIDTH + 4.5, 'rgba(6,14,20,0.20)');
}

/**
 * Red and white blocks, at the corners only.
 *
 * The strongest single mark a circuit can carry: nothing else in the visual
 * language of racing is that unambiguous. The point is that it appears *only*
 * where the track turns — a stripe running the whole way round is decoration,
 * and was exactly the mistake the gold outline made, but a stripe that starts
 * where the corner starts and stops where it stops is information. It tells you
 * a corner is coming before you can see how tight it is.
 *
 * Curvature is measured off the centre line: the heading change between one
 * sample and the next over the distance covered, which is the reciprocal of the
 * corner radius.
 *
 * The threshold is a percentile of each circuit's own curvature, not a fixed
 * number. A fixed one was tried first, reasoned from Long Bay's radius-45 folds,
 * and measurement killed it: the smoothing spreads the peak, so the real maximum
 * on Long Bay is 0.0111 and on the other three it is 0.0060, 0.0071 and 0.0083 —
 * every one of them below the 0.009 that had been picked, so three of the four
 * circuits got no kerbs whatsoever.
 *
 * Relative is the better idea regardless. A corner is where *this* circuit turns
 * most, and that is true of a stadium whose only corners are two big sweepers
 * just as much as of a circuit with hairpins. It also cannot go wrong on a track
 * that does not exist yet.
 */
const CORNER_PERCENTILE = 0.72;
/** Below this nothing counts as a corner, however flat the rest of the lap. */
const CORNER_FLOOR = 0.0025;
/** Blocks per run, in path samples. */
const KERB_BLOCK = 7;

function centreCurvature(): number[] {
  const path = pathAtOffset(0);
  const out = new Array<number>(path.length).fill(0);
  for (let i = 0; i < path.length; i++) {
    const a = path[(i - 2 + path.length) % path.length];
    const b = path[i];
    const c = path[(i + 2) % path.length];
    const h1 = Math.atan2(b.y - a.y, b.x - a.x);
    const h2 = Math.atan2(c.y - b.y, c.x - b.x);
    let delta = h2 - h1;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    const span = Math.hypot(c.x - a.x, c.y - a.y) || 1;
    out[i] = Math.abs(delta) / span;
  }
  // Smoothed, or the blocks flicker in and out along a corner's entry.
  return out.map((_, i) => {
    let sum = 0;
    for (let k = -6; k <= 6; k++) sum += out[(i + k + out.length) % out.length];
    return sum / 13;
  });
}

function drawCornerKerbs(
  outerKerb: ReturnType<typeof edge>,
  outerRoad: ReturnType<typeof edge>,
  innerRoad: ReturnType<typeof edge>,
  innerKerb: ReturnType<typeof edge>
): void {
  const curvature = centreCurvature();
  const count = Math.min(outerKerb.length, curvature.length);

  const ranked = [...curvature].sort((a, b) => a - b);
  const threshold = Math.max(
    CORNER_FLOOR,
    ranked[Math.floor(ranked.length * CORNER_PERCENTILE)] ?? CORNER_FLOOR
  );

  let start: number | null = null;
  for (let i = 0; i <= count; i++) {
    const turning = i < count && curvature[i] > threshold;
    if (turning && start === null) start = i;
    if (!turning && start !== null) {
      // Blocks alternate along the run, and both sides of the road get them.
      for (let b = start; b < i; b += KERB_BLOCK) {
        const end = Math.min(b + KERB_BLOCK + 1, i);
        if (end - b < 2) continue;
        const red = Math.floor((b - start) / KERB_BLOCK) % 2 === 0;
        const colour = red ? '#B8453A' : '#EDE7DA';
        fillRibbon(outerKerb.slice(b, end), outerRoad.slice(b, end), colour);
        fillRibbon(innerRoad.slice(b, end), innerKerb.slice(b, end), colour);
      }
      start = null;
    }
  }
}

/** Offsets a plane path sideways, then projects it. */
function edge(offset: number): ReturnType<typeof projectPath> {
  return projectPath(pathAtOffset(offset));
}

export function drawTrack(): void {
  drawApron();
  // The paving belongs to the world the circuit is laid in, not to the game.
  // Because the baked tile stores lighting over transparency, these colours are
  // the whole difference between a pale harbour deck and black city asphalt —
  // a new road style costs a row in the surface table and nothing else.
  const paint = surfaceFor(activeTrackId).road;

  const outerShadow = projectPath(
    offsetPath(pathAtOffset(ROAD_HALF_WIDTH + 7), SHADOW_X * ROAD_DEPTH, SHADOW_Y * ROAD_DEPTH)
  );
  const innerShadow = projectPath(
    offsetPath(pathAtOffset(-ROAD_HALF_WIDTH - 7), SHADOW_X * ROAD_DEPTH, SHADOW_Y * ROAD_DEPTH)
  );
  fillRibbon(outerShadow, innerShadow, 'rgba(4,12,18,0.34)');

  // A second, tighter shadow right under the deck. One flat ribbon reads as a
  // decal; two at different offsets and strengths give the edge somewhere to sit.
  const outerContact = projectPath(
    offsetPath(pathAtOffset(ROAD_HALF_WIDTH + 2), SHADOW_X * ROAD_DEPTH * 0.45, SHADOW_Y * ROAD_DEPTH * 0.45)
  );
  const innerContact = projectPath(
    offsetPath(pathAtOffset(-ROAD_HALF_WIDTH - 2), SHADOW_X * ROAD_DEPTH * 0.45, SHADOW_Y * ROAD_DEPTH * 0.45)
  );
  fillRibbon(outerContact, innerContact, 'rgba(2,8,14,0.45)');

  // Deck side walls. This used to be the whole road band nudged down-light,
  // which only ever showed on one side of the circuit and read as a second
  // shadow. The causeway now has two real edges, and each one shows its wall
  // wherever it turns towards the camera — so every fold of the S has a lip on
  // its near side and none on its far side, which is what a raised deck does.
  const outerLip = edge(ROAD_HALF_WIDTH + 4);
  const outerLipIn = edge(ROAD_HALF_WIDTH + 1);
  const innerLip = edge(-ROAD_HALF_WIDTH - 4);
  const innerLipIn = edge(-ROAD_HALF_WIDTH - 1);
  fillNearFaces(outerLip, outerLipIn, ROAD_WALL_HEIGHT, paint.wall);
  fillNearFaces(innerLip, innerLipIn, ROAD_WALL_HEIGHT, paint.wall);
  // The wet course at the bottom of the wall, and the foam where it meets the
  // water. The foam is the line that actually sells the deck as standing in the
  // sea rather than being painted on it.
  const WET = ROAD_WALL_HEIGHT * 0.68;
  fillNearFaces(outerLip, outerLipIn, ROAD_WALL_HEIGHT, '#2B3A44', paint.waterline, WET);
  fillNearFaces(innerLip, innerLipIn, ROAD_WALL_HEIGHT, '#2B3A44', paint.waterline, WET);

  const outerEdge = edge(ROAD_HALF_WIDTH + 4);
  const innerEdge = edge(-ROAD_HALF_WIDTH - 4);
  fillRibbon(outerEdge, innerEdge, paint.edge);

  const outerKerb = edge(ROAD_HALF_WIDTH);
  const outerRoad = edge(ROAD_HALF_WIDTH - KERB_WIDTH);
  const innerRoad = edge(-ROAD_HALF_WIDTH + KERB_WIDTH);
  const innerKerb = edge(-ROAD_HALF_WIDTH);

  // Continuous stone kerbs down both sides; the red-and-white blocks read as a
  // race kerb, which this harbour road is not.
  fillRibbon(outerKerb, outerRoad, paint.kerb);
  fillRibbon(innerRoad, innerKerb, paint.kerb);
  drawCornerKerbs(outerKerb, outerRoad, innerRoad, innerKerb);

  // Lanes are shaded alternately rather than separated by dashed lines. Solid
  // bands read as five distinct channels at a glance, where dashes read as
  // texture and leave the eye to work out where one lane ends.
  for (let lane = 0; lane < LANE_COUNT; lane++) {
    const laneOuter = projectPath(pathForLane(lane - 0.5));
    const laneInner = projectPath(pathForLane(lane + 0.5));
    fillRibbon(laneOuter, laneInner, lane % 2 === 0 ? paint.surface : paint.alt);
  }

  // The paving's own grain, which is a different material from world to world:
  // fine aggregate in a smooth matrix for concrete, coarse stone and patches for
  // asphalt. Recolouring one tile gets a road that is a different colour;
  // changing the tile gets a road that is a different thing.
  const grain = groundTexture(ctx, paint.tile);
  if (grain) fillRibbon(outerRoad, innerRoad, grain);

  drawSlabVariation(outerRoad, innerRoad);
  // Concrete is cast in slabs and has joints across it; asphalt is laid as a
  // continuous mat and has none. Drawing them anyway was what kept a recoloured
  // road reading as the same road.
  if (paint.seams) drawSlabSeams(outerRoad, innerRoad);
  drawEdgeGrime();
  drawStartLine();
}

/**
 * Transverse joints across the concrete.
 *
 * A single flat tone reads as paint; real slabs are cast in panels and the
 * joints between them are the strongest cue that the surface is concrete rather
 * than a coloured shape. Drawn straight across between the two road edges, so
 * they follow the road through corners for free.
 */
const SEAM_SPACING = 6;

/**
 * Slight tone differences between panels. Concrete is poured in batches and no
 * two cure identically; without this the joints look scored into one sheet
 * rather than drawn between separate slabs.
 */
function drawSlabVariation(outer: ReturnType<typeof projectPath>, inner: ReturnType<typeof projectPath>): void {
  const count = Math.min(outer.length, inner.length);
  for (let i = 0; i < count - SEAM_SPACING; i += SEAM_SPACING) {
    const panel = Math.floor(i / SEAM_SPACING);
    // Deterministic, so a circuit looks the same every time it is loaded.
    const shade = Math.sin(panel * 12.9898) * 43758.5453;
    const tone = shade - Math.floor(shade);
    if (tone > 0.62) continue;

    const end = Math.min(count - 1, i + SEAM_SPACING);
    const top = outer.slice(i, end + 1);
    const bottom = inner.slice(i, end + 1);
    const light = tone < 0.31;
    fillRibbon(top, bottom, light ? 'rgba(255,255,250,0.05)' : 'rgba(96,100,96,0.05)');
  }
}

function drawSlabSeams(outer: ReturnType<typeof projectPath>, inner: ReturnType<typeof projectPath>): void {
  const count = Math.min(outer.length, inner.length);
  ctx.save();
  ctx.lineCap = 'butt';
  for (let i = 0; i < count; i += SEAM_SPACING) {
    // Alternate weight so the panels do not look stamped out by a machine.
    const heavy = Math.floor(i / SEAM_SPACING) % 3 === 0;
    ctx.strokeStyle = heavy ? 'rgba(96,100,96,0.34)' : 'rgba(112,116,112,0.2)';
    ctx.lineWidth = heavy ? 1.15 : 0.8;
    ctx.beginPath();
    ctx.moveTo(outer[i].x, outer[i].y);
    ctx.lineTo(inner[i].x, inner[i].y);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Dirt where the surface meets the edge lines.
 *
 * Roads are cleanest where the traffic runs and dirtiest at the margins, and
 * that gradient is most of what separates a used surface from a new one.
 *
 * It stays on the kerb. Reaching 8.5 units in from the road edge put it over
 * the outer 5.3 units of the outermost lane — 43% of that lane, darkened on one
 * side only — which is what made the two edge lanes read as narrower than the
 * three in the middle even though all five bands are the same width. Confined
 * to the kerb it still dirties the margin without touching a driving lane.
 */
function drawEdgeGrime(): void {
  const outerKerb = edge(ROAD_HALF_WIDTH);
  const outerLane = edge(ROAD_HALF_WIDTH - KERB_WIDTH);
  const innerLane = edge(-ROAD_HALF_WIDTH + KERB_WIDTH);
  const innerKerb = edge(-ROAD_HALF_WIDTH);

  fillRibbon(outerKerb, outerLane, 'rgba(112,112,100,0.3)');
  fillRibbon(innerLane, innerKerb, 'rgba(112,112,100,0.3)');

  // A narrower, darker band right against the outside line.
  const outerDark = edge(ROAD_HALF_WIDTH - 1.4);
  const innerDark = edge(-ROAD_HALF_WIDTH + 1.4);
  fillRibbon(outerKerb, outerDark, 'rgba(88,88,78,0.26)');
  fillRibbon(innerDark, innerKerb, 'rgba(88,88,78,0.26)');
}

/**
 * Start/finish chequer, projected onto the plane like everything else.
 *
 * Spans the full road. It used to be a fixed six cells — about 28 units — which
 * covered the middle of the old road and less than half of the current one, so
 * the chequer read as a patch in the centre with a plain line running out to
 * each kerb. That line was never drawn: it is the slab seam from drawSlabSeams
 * that happens to fall here, and it only looked deliberate because the chequer
 * stopped short of it. Sizing the cells off ROAD_HALF_WIDTH keeps the pattern
 * edge to edge whatever the road width becomes.
 */
const CHEQUER_CELLS = 14;

function drawStartLine(): void {
  const centre = sampleAtDistance(0, (LANE_COUNT - 1) / 2);
  const heading = projectedHeading(centre.x, centre.y, centre.angle);
  const origin = project(centre.x, centre.y);

  ctx.save();
  ctx.translate(origin.x, origin.y);
  ctx.rotate(heading);
  const cell = ((ROAD_HALF_WIDTH * 2) / CHEQUER_CELLS) * origin.scale;
  const half = CHEQUER_CELLS / 2;
  // Two columns along the track, centred on the line; CHEQUER_CELLS across it.
  for (let i = -half; i < half; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#F5F0E2' : '#242A2E';
    ctx.fillRect(-cell, i * cell, cell, cell);
    ctx.fillStyle = i % 2 === 0 ? '#242A2E' : '#F5F0E2';
    ctx.fillRect(0, i * cell, cell, cell);
  }
  ctx.restore();
}

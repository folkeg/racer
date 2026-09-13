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
import { COLORS } from '../theme';
import { pathAtOffset, pathForLane, sampleAtDistance } from '../track';
import { ROAD_DEPTH, ROAD_WALL_HEIGHT, SHADOW_X, SHADOW_Y } from './light';
import { fillNearFaces, fillRibbon, offsetPath, strokeClosedPath } from './primitives';
import { project, projectPath, projectedHeading } from './camera';
import { asphaltTexture } from './sprites';

/** Offsets a plane path sideways, then projects it. */
function edge(offset: number): ReturnType<typeof projectPath> {
  return projectPath(pathAtOffset(offset));
}

export function drawTrack(): void {
  const outerShadow = projectPath(
    offsetPath(pathAtOffset(ROAD_HALF_WIDTH + 7), SHADOW_X * ROAD_DEPTH, SHADOW_Y * ROAD_DEPTH)
  );
  const innerShadow = projectPath(
    offsetPath(pathAtOffset(-ROAD_HALF_WIDTH - 7), SHADOW_X * ROAD_DEPTH, SHADOW_Y * ROAD_DEPTH)
  );
  fillRibbon(outerShadow, innerShadow, 'rgba(4,12,18,0.55)');

  // Deck side walls. This used to be the whole road band nudged down-light,
  // which only ever showed on one side of the circuit and read as a second
  // shadow. The causeway now has two real edges, and each one shows its wall
  // wherever it turns towards the camera — so every fold of the S has a lip on
  // its near side and none on its far side, which is what a raised deck does.
  const outerLip = edge(ROAD_HALF_WIDTH + 4);
  const outerLipIn = edge(ROAD_HALF_WIDTH + 1);
  const innerLip = edge(-ROAD_HALF_WIDTH - 4);
  const innerLipIn = edge(-ROAD_HALF_WIDTH - 1);
  fillNearFaces(outerLip, outerLipIn, ROAD_WALL_HEIGHT, '#161F28');
  fillNearFaces(innerLip, innerLipIn, ROAD_WALL_HEIGHT, '#161F28');
  // The wet course at the bottom of the wall, and the foam where it meets the
  // water. The foam is the line that actually sells the deck as standing in the
  // sea rather than being painted on it.
  const WET = ROAD_WALL_HEIGHT * 0.68;
  fillNearFaces(outerLip, outerLipIn, ROAD_WALL_HEIGHT, '#2B3A44', 'rgba(232,244,248,0.8)', WET);
  fillNearFaces(innerLip, innerLipIn, ROAD_WALL_HEIGHT, '#2B3A44', 'rgba(232,244,248,0.8)', WET);

  const outerEdge = edge(ROAD_HALF_WIDTH + 4);
  const innerEdge = edge(-ROAD_HALF_WIDTH - 4);
  fillRibbon(outerEdge, innerEdge, COLORS.roadEdge);

  const outerKerb = edge(ROAD_HALF_WIDTH);
  const outerRoad = edge(ROAD_HALF_WIDTH - KERB_WIDTH);
  const innerRoad = edge(-ROAD_HALF_WIDTH + KERB_WIDTH);
  const innerKerb = edge(-ROAD_HALF_WIDTH);

  // Continuous tan lines down both sides, as on the original circuit; the
  // red-and-white blocks read as a race kerb, which this harbour road is not.
  fillRibbon(outerKerb, outerRoad, COLORS.curbLight);
  fillRibbon(innerRoad, innerKerb, COLORS.curbLight);

  // The kerb stands proud of the deck rather than being painted on it. Same
  // rule as the deck wall: its outer face shows wherever that edge turns
  // towards the camera. The pale line along the inner boundary is the top
  // arris catching the light, which is what gives a 2px band a top and a side.
  const KERB_HEIGHT = 3.0;
  fillNearFaces(outerKerb, outerRoad, KERB_HEIGHT, '#8E7C57');
  fillNearFaces(innerKerb, innerRoad, KERB_HEIGHT, '#8E7C57');
  strokeClosedPath(outerRoad, 0.9, 'rgba(255,248,226,0.30)');
  strokeClosedPath(innerRoad, 0.9, 'rgba(255,248,226,0.30)');

  // Lanes are shaded alternately rather than separated by dashed lines. Solid
  // bands read as five distinct channels at a glance, where dashes read as
  // texture and leave the eye to work out where one lane ends.
  for (let lane = 0; lane < LANE_COUNT; lane++) {
    const laneOuter = projectPath(pathForLane(lane - 0.5));
    const laneInner = projectPath(pathForLane(lane + 0.5));
    fillRibbon(laneOuter, laneInner, lane % 2 === 0 ? COLORS.road : COLORS.roadAlt);
  }

  const grain = asphaltTexture(ctx);
  if (grain) fillRibbon(outerRoad, innerRoad, grain);

  drawSlabVariation(outerRoad, innerRoad);
  drawSlabSeams(outerRoad, innerRoad);
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

/**
 * Track geometry for whichever circuit is loaded.
 *
 * The shapes themselves live in tracks/; this module turns the active one into
 * everything the game needs: cumulative arc length, per-lane paths, and the
 * sampling used to place cars. setTrack() rebuilds all of it, so every export
 * here is a live binding that changes when the circuit does.
 *
 * Pure geometry — no game state, no drawing.
 */

import { LANE_COUNT, LANE_GAP, ROAD_HALF_WIDTH } from './config';
import { fitCameraToPlane, projectedBounds, type Bounds } from './render/camera';
import { ROAD_DEPTH } from './render/light';
import { DEFAULT_TRACK_ID, trackById, type TrackId } from './tracks';
import type { TrackSample, Vec2 } from './types';

/**
 * How far past the centre line the road actually reaches on screen: road.ts
 * draws its deck shadow at ROAD_HALF_WIDTH + 7, then shifts that band a further
 * ROAD_DEPTH towards the light. Fitting to anything narrower clips the shadow.
 */
const ROAD_OUTER_EXTENT = ROAD_HALF_WIDTH + 7 + ROAD_DEPTH;

export let activeTrackId: TrackId = DEFAULT_TRACK_ID;
export let centerPath: Vec2[] = [];

interface ArcData {
  cumulative: number[];
  total: number;
}

function buildArcData(points: Vec2[]): ArcData {
  const cumulative = [0];
  let total = 0;
  for (let i = 1; i <= points.length; i++) {
    const a = points[i - 1];
    const b = points[i % points.length];
    total += Math.hypot(b.x - a.x, b.y - a.y);
    cumulative.push(total);
  }
  return { cumulative, total };
}

export let arc: ArcData = { cumulative: [0], total: 1 };

/** Lap length of the loaded circuit, in road units. */
export function trackLength(): number {
  return arc.total;
}

export function wrapDistance(distance: number): number {
  return ((distance % arc.total) + arc.total) % arc.total;
}

export function circularDistance(a: number, b: number): number {
  const raw = Math.abs(wrapDistance(a) - wrapDistance(b));
  return Math.min(raw, arc.total - raw);
}

export function forwardPathDistance(fromDistance: number, toDistance: number): number {
  return wrapDistance(toDistance - fromDistance);
}

interface Station {
  i: number;
  t: number;
  segmentLength: number;
}

function locateCenterSegment(distance: number): Station {
  const d = wrapDistance(distance);
  let lo = 0;
  let hi = centerPath.length;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (arc.cumulative[mid] <= d) lo = mid;
    else hi = mid;
  }

  const i = Math.min(lo, centerPath.length - 1);
  const segmentStart = arc.cumulative[i];
  const segmentLength = Math.max(0.0001, arc.cumulative[i + 1] - segmentStart);
  return {
    i,
    t: (d - segmentStart) / segmentLength,
    segmentLength
  };
}

export function pathAtOffset(offset: number): Vec2[] {
  return centerPath.map((p, i) => {
    const prev = centerPath[(i - 1 + centerPath.length) % centerPath.length];
    const next = centerPath[(i + 1) % centerPath.length];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    return { x: p.x + nx * offset, y: p.y + ny * offset };
  });
}

export function pathForLane(laneIndex: number): Vec2[] {
  const laneOffset = (laneIndex - (LANE_COUNT - 1) / 2) * LANE_GAP;
  return pathAtOffset(laneOffset);
}

// Each lane has its own physical arc length. Vehicles still keep an unwrapped
// center-line station for collision/overtake logic, but movement consumes actual
// road distance segment-by-segment on the current (possibly fractional) lane.
// This avoids both outer-lane and inner-lane speed spikes at straight/curve joins.
let laneCenterPaths: Vec2[][] = [];

function laneBounds(laneIndex: number): { lower: number; upper: number; blend: number } {
  const clamped = Math.max(0, Math.min(LANE_COUNT - 1, laneIndex));
  const lower = Math.floor(clamped);
  const upper = Math.ceil(clamped);
  return { lower, upper, blend: clamped - lower };
}

function interpolatedLanePoint(pointIndex: number, laneIndex: number): Vec2 {
  const lanes = laneBounds(laneIndex);
  const low = laneCenterPaths[lanes.lower][pointIndex];
  const high = laneCenterPaths[lanes.upper][pointIndex];
  return {
    x: low.x + (high.x - low.x) * lanes.blend,
    y: low.y + (high.y - low.y) * lanes.blend
  };
}

function laneSegmentLength(segmentIndex: number, laneIndex: number): number {
  const a = interpolatedLanePoint(segmentIndex, laneIndex);
  const b = interpolatedLanePoint((segmentIndex + 1) % centerPath.length, laneIndex);
  return Math.max(0.0001, Math.hypot(b.x - a.x, b.y - a.y));
}

export function sampleAtDistance(distance: number, laneIndex: number): TrackSample {
  const station = locateCenterSegment(distance);
  const a = interpolatedLanePoint(station.i, laneIndex);
  const b = interpolatedLanePoint((station.i + 1) % centerPath.length, laneIndex);
  const x = a.x + (b.x - a.x) * station.t;
  const y = a.y + (b.y - a.y) * station.t;

  return {
    x,
    y,
    angle: Math.atan2(b.y - a.y, b.x - a.x)
  };
}

export function advanceDistanceAtRoadSpeed(distance: number, speed: number, dt: number, laneIndex: number): number {
  let currentDistance = distance;
  let remainingRoadDistance = Math.max(0, speed * dt);
  let guard = 0;

  while (remainingRoadDistance > 0.000001 && guard < 128) {
    const station = locateCenterSegment(currentDistance);
    const roadSegmentLength = laneSegmentLength(station.i, laneIndex);
    const roadRemainingInSegment = roadSegmentLength * (1 - station.t);
    const centerRemainingInSegment = station.segmentLength * (1 - station.t);

    // Floating-point values can land microscopically before a segment boundary.
    // Move a negligible amount forward so the binary search selects the next one.
    if (roadRemainingInSegment <= 0.000001 || centerRemainingInSegment <= 0.000001) {
      currentDistance += 0.000001;
      guard += 1;
      continue;
    }

    if (remainingRoadDistance < roadRemainingInSegment) {
      currentDistance += station.segmentLength * (remainingRoadDistance / roadSegmentLength);
      remainingRoadDistance = 0;
    } else {
      currentDistance += centerRemainingInSegment;
      remainingRoadDistance -= roadRemainingInSegment;
    }

    guard += 1;
  }

  return currentDistance;
}

// Five separators create six actual lanes. Cars run between these lines.
export let laneDividerPaths: Vec2[][] = [];
export let outerRoadEdgePath: Vec2[] = [];
export let innerRoadEdgePath: Vec2[] = [];

/**
 * Loads a circuit and rebuilds every derived path. Call before resetGame(), which
 * places cars using the new arc length.
 */
export function setTrack(id: TrackId): void {
  activeTrackId = id;
  centerPath = trackById(id).build();
  arc = buildArcData(centerPath);

  // Lane paths depend on centerPath, and everything else depends on those, so the
  // rebuild order here matters.
  laneCenterPaths = Array.from({ length: LANE_COUNT }, (_, lane) => pathForLane(lane));
  laneDividerPaths = Array.from({ length: LANE_COUNT - 1 }, (_, i) => pathForLane(i + 0.5));
  outerRoadEdgePath = pathAtOffset(ROAD_HALF_WIDTH - 1.8);
  innerRoadEdgePath = pathAtOffset(-ROAD_HALF_WIDTH + 1.8);

  // Fit last: it measures the paths above, and everything projected from here on
  // — the cached static layer included — has to be built under the new fit.
  fitCameraToPlane([...pathAtOffset(ROAD_OUTER_EXTENT), ...pathAtOffset(-ROAD_OUTER_EXTENT)]);
}

/** Projected bounds of the outermost geometry, for the off-screen regression test. */
export function trackScreenBounds(): Bounds {
  return projectedBounds([...pathAtOffset(ROAD_OUTER_EXTENT), ...pathAtOffset(-ROAD_OUTER_EXTENT)]);
}

setTrack(DEFAULT_TRACK_ID);

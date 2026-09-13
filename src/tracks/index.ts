/**
 * Circuits.
 *
 * Every track is built from exact lines and arcs rather than hand-placed control
 * points, which keeps curvature continuous and the six lanes evenly spaced. All
 * of them are closed, non-crossing, and keep their *centre line* inside roughly
 * x 40..350 and y 60..705 in design space.
 *
 * That box does not by itself keep a circuit on screen, and reading it as if it
 * did is what let three of these four spill off the frame: the road is drawn a
 * further 39 units to each side, and the perspective camera then magnifies
 * lateral distance by up to 1.31 near the bottom of the plane. What guarantees
 * the fit is `fitCameraToPlane`, which measures the projected road per track and
 * scales it down when it has to — see src/render/camera.ts. Keep new circuits
 * near the box anyway, or the fit will shrink everything to accommodate them.
 */

import type { Vec2 } from '../types';

export type TrackId = 'long-bay' | 'grand-oval' | 'tide-drop' | 'half-moon';

class PathBuilder {
  readonly points: Vec2[] = [];

  private push(x: number, y: number): void {
    const last = this.points[this.points.length - 1];
    if (!last || Math.hypot(last.x - x, last.y - y) > 0.01) this.points.push({ x, y });
  }

  start(x: number, y: number): this {
    this.push(x, y);
    return this;
  }

  lineTo(x: number, y: number, spacing = 3.0): this {
    const from = this.points[this.points.length - 1];
    const length = Math.hypot(x - from.x, y - from.y);
    const count = Math.max(1, Math.ceil(length / spacing));
    for (let i = 1; i <= count; i++) {
      const t = i / count;
      this.push(from.x + (x - from.x) * t, from.y + (y - from.y) * t);
    }
    return this;
  }

  arcTo(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, spacing = 2.6): this {
    const sweep = endAngle - startAngle;
    const count = Math.max(8, Math.ceil((Math.abs(sweep) * radius) / spacing));
    for (let i = 1; i <= count; i++) {
      const angle = startAngle + sweep * (i / count);
      this.push(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    }
    return this;
  }

  /** Drops the duplicated closing point so the loop wraps cleanly. */
  close(): Vec2[] {
    const { points } = this;
    if (points.length > 1) {
      const first = points[0];
      const last = points[points.length - 1];
      if (Math.hypot(last.x - first.x, last.y - first.y) < 0.1) points.pop();
    }
    return points;
  }
}

/**
 * Long Bay — the original circuit, folded loosely rather than tightly.
 *
 * It used to be eight rows of straight stacked 90 apart, which left a gap of
 * only 21 between one road edge and the next once the road was widened to 68.
 * That is not enough to put anything in, so the circuit filled the screen with
 * nothing but circuit. Six rows over the same footprint spread the gap to 57,
 * which is where the planted islands live — the point of removing folds was to
 * make room beside the road, not to make the lap shorter.
 *
 * Each fold is a U rather than a half circle now: a quarter turn, a straight
 * down the outside, then a quarter turn back. A single 180 of radius 45 can
 * only span 90, so the wider spacing needs the straight in between.
 */
const LONG_BAY_ROWS = 6;
const LONG_BAY_TOP = 70;
const LONG_BAY_BOTTOM = 700;
const LONG_BAY_RADIUS = 45;

function buildLongBay(): Vec2[] {
  const step = (LONG_BAY_BOTTOM - LONG_BAY_TOP) / (LONG_BAY_ROWS - 1);
  const r = LONG_BAY_RADIUS;
  const eastX = 310;
  const innerX = 160;
  const path = new PathBuilder().start(110, LONG_BAY_TOP);

  for (let row = 0; row < LONG_BAY_ROWS; row++) {
    const y = LONG_BAY_TOP + row * step;
    const goingEast = row % 2 === 0;
    const last = row === LONG_BAY_ROWS - 1;

    // The final row runs all the way back to the west loop instead of folding.
    path.lineTo(last ? 110 : (goingEast ? eastX : innerX), y);
    if (last) break;

    if (goingEast) {
      path.arcTo(eastX, y + r, r, -Math.PI / 2, 0);
      path.lineTo(eastX + r, y + step - r);
      path.arcTo(eastX, y + step - r, r, 0, Math.PI / 2);
    } else {
      path.arcTo(innerX, y + r, r, -Math.PI / 2, -Math.PI);
      path.lineTo(innerX - r, y + step - r);
      path.arcTo(innerX, y + step - r, r, -Math.PI, -3 * Math.PI / 2);
    }
  }

  path.arcTo(110, LONG_BAY_BOTTOM - 60, 60, Math.PI / 2, Math.PI);
  path.lineTo(50, 130);
  path.arcTo(110, 130, 60, Math.PI, 3 * Math.PI / 2);
  return path.close();
}

/**
 * Grand Oval — a stadium with two very long straights and only two corners.
 * The shortest lap and the highest sustained speed, so traffic arrives fast and
 * there is almost nowhere to hide.
 */
function buildGrandOval(): Vec2[] {
  const left = 112;
  const right = 278;
  const top = 178;
  const bottom = 612;
  const radius = (right - left) / 2;
  const midX = (left + right) / 2;

  const path = new PathBuilder().start(left, bottom);
  path.lineTo(left, top);
  path.arcTo(midX, top, radius, Math.PI, Math.PI * 2);
  path.lineTo(right, bottom);
  path.arcTo(midX, bottom, radius, 0, Math.PI);
  return path.close();
}

/**
 * Tide Drop — a small northern turn and a big southern one, joined by their
 * common tangents.
 *
 * Built this way on purpose. The first attempt here was a kidney, with a
 * concave arc denting one side, and a concave joint has to be solved for
 * external tangency — centre distance equal to the *sum* of the radii. Getting
 * it wrong does not look subtly off, it doubles the road back on itself: the
 * measured heading jumped 178 degrees at the joint. A straight drawn tangent to
 * two circles cannot have that failure, because a tangent meets its circle at a
 * right angle to the radius by definition, so continuity is free rather than
 * solved.
 *
 * The two ends being different sizes is what makes it a shape rather than a
 * stadium: the north turn is tight enough to cost you the combo, the south one
 * opens far enough to get it back.
 */
function buildTideDrop(): Vec2[] {
  const axisX = 200;
  const northY = 180;
  const southY = 555;
  const northR = 70;
  const southR = 150;

  const span = southY - northY;
  // Unit normal of the common tangent. Its axial component is fixed by the
  // difference in radii; the rest follows from it being a unit vector.
  const ny = (southR - northR) / span;
  const nx = Math.sqrt(1 - ny * ny);
  const lean = Math.atan2(ny, nx);

  // Each tangent point is the foot of the perpendicular from its centre, which
  // is centre *minus* the radius along the normal. Adding it instead puts the
  // point on the far side of the circle and the line stops being tangent at
  // all — the check that catches it is that the line direction must dot to zero
  // against the radius, and the wrong sign gives 0.40.
  const northWest = { x: axisX - northR * nx, y: northY - northR * ny };
  const northEast = { x: axisX + northR * nx, y: northY - northR * ny };
  const southEast = { x: axisX + southR * nx, y: southY - southR * ny };

  const path = new PathBuilder().start(northEast.x, northEast.y);
  path.lineTo(southEast.x, southEast.y);
  path.arcTo(axisX, southY, southR, -lean, Math.PI + lean);   // round the open south turn
  path.lineTo(northWest.x, northWest.y);
  path.arcTo(axisX, northY, northR, Math.PI + lean, Math.PI * 2 - lean);
  return path.close();
}

/**
 * Half Moon — one dead-straight side and one continuous sweep.
 *
 * A true D is a semicircle on its diameter, and those meet at ninety degrees:
 * drawn that way the road had two hard corners where the car's heading changed
 * in a single step. Rounding them costs a little of the flat side and nothing of
 * the silhouette. The big arc's centre and radius are then solved so it stays
 * tangent to both corners and still reaches the east edge.
 */
function buildHalfMoon(): Vec2[] {
  const straightX = 70;
  const topY = 170;
  const bottomY = 610;
  const cornerR = 60;
  const eastX = 330;

  const midY = (topY + bottomY) / 2;
  const halfSpan = (bottomY - topY) / 2;
  const cornerCX = straightX + cornerR;
  // Internal tangency this time — the corners and the sweep bend the same way —
  // so |C - corner| = R - cornerR, solved together with C.x + R = eastX.
  const far = eastX - cornerR;
  const sweepCX =
    (far * far - cornerCX * cornerCX - halfSpan * halfSpan) / (2 * (far - cornerCX));
  const sweepR = eastX - sweepCX;
  const handover = Math.atan2(halfSpan, cornerCX - sweepCX);

  const path = new PathBuilder().start(straightX, bottomY);
  path.lineTo(straightX, topY);
  path.arcTo(cornerCX, topY, cornerR, Math.PI, Math.PI * 2 - handover);
  path.arcTo(sweepCX, midY, sweepR, -handover, handover);
  path.arcTo(cornerCX, bottomY, cornerR, handover, Math.PI);
  return path.close();
}

/** Decor sits in the space a circuit leaves empty, so it is defined per track. */
export interface TrackDecor {
  /** [x, y, width, height] park islands. */
  medians: Array<[number, number, number, number]>;
  /** [x, y, scale] trees. */
  trees: Array<[number, number, number]>;
  /** [x, y, scale] parasols. */
  umbrellas: Array<[number, number, number]>;
  /** [x, y] buoys out on the water. */
  buoys: Array<[number, number]>;
  /** [x, y, scale, angle] moored boats. */
  boats: Array<[number, number, number, number]>;
  /**
   * The three below are drawn but no circuit uses them any more. They framed the
   * board back when it sat small in the middle of the screen; now that the
   * camera fills the frame they only crowded its edges, so every track leaves
   * them empty. The renderers stay for whenever a circuit wants them again.
   */
  /** [x, y, width, height, seed] rocky shoreline. */
  rocks: Array<[number, number, number, number, number]>;
  /** [x, y, width, height, angle] harbour buildings. */
  buildings: Array<[number, number, number, number, number]>;
  /** [x, y, width, height, angle] chequered ground by the pits. */
  chequers: Array<[number, number, number, number, number]>;
  /** [x1, y1, x2, y2, width] footbridges across the water. */
  bridges: Array<[number, number, number, number, number]>;
}

export interface TrackDefinition {
  id: TrackId;
  name: string;
  build(): Vec2[];
  decor: TrackDecor;
}

const LONG_BAY_DECOR: TrackDecor = {
  // Sized by searching each gap for the widest island that still clears the
  // road by 3 — the fold takes one end of every gap, and which end alternates,
  // so these are not on a grid. Six rows instead of eight is what bought the
  // width: 180 across and 42 deep, against 113 by 16 before.
  medians: [
    [106, 108, 180, 42],
    [158, 234, 180, 42],
    [88, 360, 180, 42],
    [158, 486, 180, 42],
    [92, 612, 180, 42]
  ],
  trees: [[132, 129, 0.42], [250, 129, 0.4], [196, 255, 0.42], [120, 381, 0.4], [244, 381, 0.42], [200, 507, 0.4], [130, 633, 0.42], [246, 633, 0.4]],
  umbrellas: [[196, 129, 0.4], [268, 255, 0.38], [178, 381, 0.4], [240, 507, 0.38], [190, 633, 0.4]],
  buoys: [[26, 128], [365, 250], [25, 628], [366, 650]],
  boats: [[371, 165, 0.62, 1.57], [12, 335, 0.6, 1.57], [372, 455, 0.58, 1.57], [12, 585, 0.62, 1.57]],
  rocks: [],
  buildings: [],
  bridges: [[358, 150, 388, 150, 13], [4, 320, 32, 320, 13], [358, 440, 388, 440, 13], [4, 570, 32, 570, 13]],
  chequers: []
};

/** The oval's infield is one long clear strip, so it gets one long island. */
const GRAND_OVAL_DECOR: TrackDecor = {
  medians: [[170, 216, 50, 356]],
  trees: [[195, 252, 0.42], [195, 400, 0.42], [195, 540, 0.42]],
  umbrellas: [[195, 326, 0.4], [195, 468, 0.4]],
  buoys: [[40, 150], [352, 210], [40, 640], [352, 620]],
  boats: [[52, 300, 0.78, 1.57], [338, 400, 0.78, 1.57], [52, 540, 0.72, 1.57]],
  rocks: [],
  buildings: [],
  bridges: [[36, 286, 70, 286, 14], [322, 386, 356, 386, 14], [36, 526, 70, 526, 14]],
  chequers: []
};

/** The circuits with no infield to plant, so they only get open water. */
const OPEN_WATER_DECOR: TrackDecor = {
  medians: [],
  trees: [],
  umbrellas: [],
  buoys: [[20, 120], [372, 200], [20, 560], [372, 660], [18, 380]],
  boats: [[12, 250, 0.6, 1.57], [376, 340, 0.6, 1.57], [12, 620, 0.58, 1.57]],
  rocks: [],
  buildings: [],
  bridges: [[2, 236, 30, 236, 12], [360, 326, 388, 326, 12], [2, 606, 30, 606, 12]],
  chequers: []
};

export const TRACKS: TrackDefinition[] = [
  { id: 'long-bay', name: 'LONG BAY', build: buildLongBay, decor: LONG_BAY_DECOR },
  { id: 'grand-oval', name: 'GRAND OVAL', build: buildGrandOval, decor: GRAND_OVAL_DECOR },
  { id: 'tide-drop', name: 'TIDE DROP', build: buildTideDrop, decor: OPEN_WATER_DECOR },
  { id: 'half-moon', name: 'HALF MOON', build: buildHalfMoon, decor: OPEN_WATER_DECOR }
];

const BY_ID = new Map<TrackId, TrackDefinition>(TRACKS.map((track) => [track.id, track]));

export function trackById(id: TrackId): TrackDefinition {
  const track = BY_ID.get(id);
  if (!track) throw new Error(`unknown track: ${id}`);
  return track;
}

export const DEFAULT_TRACK_ID: TrackId = 'long-bay';

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

export type TrackId = 'long-bay' | 'grand-oval' | 'switchback' | 'marina-sprint';

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
 * Long Bay — the original circuit. Eight long straights folded into broad
 * hairpins give the longest lap and the most room to build a combo.
 */
function buildLongBay(): Vec2[] {
  const path = new PathBuilder().start(110, 70);
  path.lineTo(310, 70);
  path.arcTo(310, 115, 45, -Math.PI / 2, Math.PI / 2);
  path.lineTo(160, 160);
  path.arcTo(160, 205, 45, -Math.PI / 2, -3 * Math.PI / 2);
  path.lineTo(310, 250);
  path.arcTo(310, 295, 45, -Math.PI / 2, Math.PI / 2);
  path.lineTo(160, 340);
  path.arcTo(160, 385, 45, -Math.PI / 2, -3 * Math.PI / 2);
  path.lineTo(310, 430);
  path.arcTo(310, 475, 45, -Math.PI / 2, Math.PI / 2);
  path.lineTo(160, 520);
  path.arcTo(160, 565, 45, -Math.PI / 2, -3 * Math.PI / 2);
  path.lineTo(310, 610);
  path.arcTo(310, 655, 45, -Math.PI / 2, Math.PI / 2);
  path.lineTo(110, 700);
  path.arcTo(110, 640, 60, Math.PI / 2, Math.PI);
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
 * Switchback — ten short straights with tight hairpins. Corners come constantly,
 * so the outer lanes pay a real distance penalty and lane choice matters most.
 */
function buildSwitchback(): Vec2[] {
  const path = new PathBuilder().start(140, 92);
  const radius = 30;
  const leftX = 140;
  const rightX = 296;
  const rows = 9;
  const step = 60;

  for (let row = 0; row < rows; row++) {
    const y = 92 + row * step;
    const goingRight = row % 2 === 0;
    path.lineTo(goingRight ? rightX : leftX, y);

    if (row === rows - 1) break;
    const cx = goingRight ? rightX : leftX;
    const cy = y + radius;
    if (goingRight) path.arcTo(cx, cy, radius, -Math.PI / 2, Math.PI / 2);
    else path.arcTo(cx, cy, radius, -Math.PI / 2, -3 * Math.PI / 2);
  }

  // The last row ends heading right, so the exit has to be an arc; a straight
  // corner here left a visible kink in the road.
  path.arcTo(rightX, 611, 39, -Math.PI / 2, Math.PI / 2);
  path.lineTo(88, 650);
  path.arcTo(88, 598, 52, Math.PI / 2, Math.PI);
  path.lineTo(36, 144);
  path.arcTo(88, 144, 52, Math.PI, 3 * Math.PI / 2);
  path.lineTo(leftX, 92);
  return path.close();
}

/**
 * Marina Sprint — four straights and wide corners. A middle-length lap that
 * keeps a fast rhythm without the Oval's total lack of shelter.
 */
function buildMarinaSprint(): Vec2[] {
  const path = new PathBuilder().start(128, 110);
  path.lineTo(288, 110);
  path.arcTo(288, 168, 58, -Math.PI / 2, Math.PI / 2);
  path.lineTo(168, 226);
  path.arcTo(168, 284, 58, -Math.PI / 2, -3 * Math.PI / 2);
  path.lineTo(288, 342);
  path.arcTo(288, 400, 58, -Math.PI / 2, Math.PI / 2);
  path.lineTo(168, 458);
  path.arcTo(168, 516, 58, -Math.PI / 2, -3 * Math.PI / 2);
  path.lineTo(288, 574);
  path.arcTo(288, 632, 58, -Math.PI / 2, Math.PI / 2);
  path.lineTo(128, 690);
  path.arcTo(128, 632, 58, Math.PI / 2, Math.PI);
  path.lineTo(70, 168);
  path.arcTo(128, 168, 58, Math.PI, 3 * Math.PI / 2);
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
  /** [x, y, width, height, seed] rocky shoreline. */
  rocks: Array<[number, number, number, number, number]>;
  /** [x, y, width, height, angle] harbour buildings. */
  buildings: Array<[number, number, number, number, number]>;
  /** [x1, y1, x2, y2, width] footbridges across the water. */
  bridges: Array<[number, number, number, number, number]>;
  /** [x, y, width, height, angle] chequered ground by the pits. */
  chequers: Array<[number, number, number, number, number]>;
}

export interface TrackDefinition {
  id: TrackId;
  name: string;
  build(): Vec2[];
  decor: TrackDecor;
}

const LONG_BAY_DECOR: TrackDecor = {
  medians: [
    [178, 111, 113, 16],
    [178, 201, 113, 16],
    [178, 291, 113, 16],
    [178, 381, 113, 16],
    [178, 471, 113, 16],
    [178, 561, 113, 16],
    [178, 651, 113, 16]
  ],
  trees: [[194, 119, 0.4], [265, 209, 0.38], [205, 299, 0.4], [204, 479, 0.4], [265, 569, 0.38]],
  umbrellas: [[242, 119, 0.38], [252, 389, 0.38], [220, 659, 0.38]],
  buoys: [[26, 128], [365, 250], [25, 628], [366, 650]],
  boats: [[371, 165, 0.62, 1.57], [12, 335, 0.6, 1.57], [372, 455, 0.58, 1.57], [12, 585, 0.62, 1.57]],
  rocks: [[-14, 24, 96, 74, 3], [318, 18, 96, 66, 7], [-16, 690, 92, 80, 11], [322, 700, 92, 74, 5]],
  buildings: [[196, 748, 92, 40, 0], [300, 752, 58, 32, 0], [96, 754, 54, 30, 0]],
  bridges: [[358, 150, 388, 150, 13], [4, 320, 32, 320, 13], [358, 440, 388, 440, 13], [4, 570, 32, 570, 13]],
  chequers: [[130, 742, 54, 26, 0]]
};

/** The oval's infield is one long clear strip, so it gets one long island. */
const GRAND_OVAL_DECOR: TrackDecor = {
  medians: [[170, 216, 50, 356]],
  trees: [[195, 252, 0.42], [195, 400, 0.42], [195, 540, 0.42]],
  umbrellas: [[195, 326, 0.4], [195, 468, 0.4]],
  buoys: [[40, 150], [352, 210], [40, 640], [352, 620]],
  boats: [[52, 300, 0.78, 1.57], [338, 400, 0.78, 1.57], [52, 540, 0.72, 1.57]],
  rocks: [[-18, 40, 88, 88, 2], [326, 46, 88, 82, 9], [-18, 660, 88, 84, 6], [326, 668, 88, 80, 13]],
  buildings: [[150, 736, 96, 38, 0], [260, 742, 60, 30, 0]],
  bridges: [[36, 286, 70, 286, 14], [322, 386, 356, 386, 14], [36, 526, 70, 526, 14]],
  chequers: [[76, 734, 52, 24, 0]]
};

/** Switchback and Marina Sprint fill the screen, so they only get open water. */
const OPEN_WATER_DECOR: TrackDecor = {
  medians: [],
  trees: [],
  umbrellas: [],
  buoys: [[20, 120], [372, 200], [20, 560], [372, 660], [18, 380]],
  boats: [[12, 250, 0.6, 1.57], [376, 340, 0.6, 1.57], [12, 620, 0.58, 1.57]],
  rocks: [[-16, 30, 84, 70, 4], [330, 34, 84, 68, 8], [-16, 700, 84, 74, 12], [330, 706, 84, 70, 1]],
  buildings: [[176, 748, 88, 36, 0], [286, 752, 54, 28, 0]],
  bridges: [[2, 236, 30, 236, 12], [360, 326, 388, 326, 12], [2, 606, 30, 606, 12]],
  chequers: [[112, 744, 50, 24, 0]]
};

export const TRACKS: TrackDefinition[] = [
  { id: 'long-bay', name: 'LONG BAY', build: buildLongBay, decor: LONG_BAY_DECOR },
  { id: 'grand-oval', name: 'GRAND OVAL', build: buildGrandOval, decor: GRAND_OVAL_DECOR },
  { id: 'switchback', name: 'SWITCHBACK', build: buildSwitchback, decor: OPEN_WATER_DECOR },
  { id: 'marina-sprint', name: 'MARINA SPRINT', build: buildMarinaSprint, decor: OPEN_WATER_DECOR }
];

const BY_ID = new Map<TrackId, TrackDefinition>(TRACKS.map((track) => [track.id, track]));

export function trackById(id: TrackId): TrackDefinition {
  const track = BY_ID.get(id);
  if (!track) throw new Error(`unknown track: ${id}`);
  return track;
}

export const DEFAULT_TRACK_ID: TrackId = 'long-bay';

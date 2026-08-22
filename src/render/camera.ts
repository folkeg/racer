/**
 * Perspective camera for the ground plane.
 *
 * The whole circuit lives on a flat plane in design space. This projects that
 * plane through a real 3D camera — raised, pitched down, with a focal length —
 * so the far side of the track genuinely recedes and everything on it shrinks
 * with distance. That is proper perspective, not a skew, and it needs no WebGL:
 * points are projected in JavaScript and the result is drawn with Canvas 2D,
 * which is the same technique the arcade racers used.
 *
 * The camera never moves, so the track's projection is computed once and lives
 * in the cached static layer. Only the cars are projected per frame.
 */

import { DESIGN_H, DESIGN_W } from '../platform';
import type { Vec2 } from '../types';

export interface Projected extends Vec2 {
  /** How much a unit at this point shrinks. 1 is the reference plane. */
  scale: number;
  /** Distance from the camera, for depth sorting. */
  depth: number;
}

/** Perspective, or straight overhead. Overhead is kept only as an escape hatch. */
const PERSPECTIVE = true;

/**
 * Angle down from horizontal: 0 looks along the plane, PI/2 looks straight down.
 * So a *larger* number is a flatter, more top-down picture with less
 * foreshortening — the opposite of what "pitch" suggests at a glance.
 *
 * This sat at 0.30 for a long time, which was the worst available choice on both
 * counts. Measured across the four circuits:
 *
 *   pitch   near/far size   fit scale
 *   0.30      1.86x           0.845
 *   0.60      1.64x           0.942
 *   0.90      1.46x           0.955
 *   1.20      1.28x           0.881
 *
 * A shallow angle magnifies lateral distance near the bottom of the frame, so
 * 0.30 both shrank the far side of the circuit the most *and* forced the hardest
 * shrink-to-fit. 0.90 keeps a clear sense of depth while leaving traffic at the
 * far end readable, and lets the circuit sit larger on screen than 0.30 did.
 *
 * This is now almost overhead, and that is a deliberate trade the perspective
 * lost twice over.
 *
 * Every circuit is pinned to the side margins by the uniform fit, so width is
 * fixed whatever the angle and the only free axis is height — and
 * foreshortening is what was eating it. Worse, an off-centre straight cannot
 * look straight under perspective: parallel lines converge toward the vanishing
 * point, so Delta Run's long west straight, which is exactly vertical in the
 * track's own geometry, leaned visibly on screen. Both complaints have the same
 * single cause and the same single lever. Measured on that straight:
 *
 *   pitch    lean    its length   near/far
 *   0.90     8.3%      289px        1.46
 *   1.20     4.9%      370px        1.28
 *   1.40     2.3%      498px        1.14
 *   1.50     0.9%      610px        1.06
 *   PI/2     0.0%      724px        1.00
 *
 * 1.50 puts the lean under a pixel per hundred — invisible — and more than
 * doubles the usable length of a straight against the original 0.90. What it
 * costs is the depth cue: at 1.06 near/far, the far side of the board is
 * within six percent of the size of the near side, so this reads as a top-down
 * board with a hint of tilt rather than a raised camera. Drop back towards 1.20
 * to trade length and straightness for that depth again.
 */
const PITCH = 1.50;
/** Height above the plane, in design units. */
const HEIGHT = 900;
/** Ground distance from the camera to the nearest edge of the design area. */
const NEAR = 700;
/** Focal length. Larger is a longer lens and a weaker perspective. */
const FOCAL = 1400;

/**
 * Where the projected scene sits and how much of the frame it fills.
 *
 * Horizontal and vertical fit are separate on purpose: a portrait screen is
 * much taller than the projected plane is deep, so stretching only the vertical
 * fills the frame without pushing the near edge of the track off the sides.
 *
 * There is deliberately no vertical origin constant here. One used to exist, and
 * because its value only made sense at one PITCH, changing the angle threw the
 * whole scene off screen — which is most likely why an earlier attempt at a
 * flatter camera was abandoned as unworkable. The fit below centres the circuit
 * vertically instead, so PITCH can be changed on its own.
 */
const SCREEN_CX = DESIGN_W / 2;
const FIT_X = 0.94;
const FIT_Y = 1.02;

const cosPitch = Math.cos(PITCH);
const sinPitch = Math.sin(PITCH);


/**
 * Shrink-to-fit, applied after projection.
 *
 * FIT_X above was tuned by eye against one circuit, and a constant cannot know
 * how wide the next one is. Three of the four tracks
 * spilled off a portrait screen: the road is drawn a further 39 units past the
 * centre line, and perspective magnifies lateral distance by up to 1.31 near the
 * bottom of the frame, so a centre line that sits inside the design box does not
 * keep its road there.
 *
 * So the circuit is measured once per track and scaled down just enough to fit.
 * It only ever shrinks — a track already inside the frame is left exactly as it
 * was — and it scales uniformly about the projected centre, so the framing that
 * was tuned by hand survives at a slightly smaller size instead of being
 * squashed on one axis.
 */
const SAFE_MARGIN = 4;
const SAFE_TOP = 50;
const SAFE_BOTTOM = 742;

/**
 * How much taller than wide the fit may pull the plane.
 *
 * Every circuit projects far squarer than a portrait phone, so a purely uniform
 * fit hits the side margins with a third of the screen height still empty —
 * which is what made the board look small however big the track itself was.
 * The remaining slack is taken up by scaling the vertical further, capped here
 * because the cars keep a single sprite scale and start reading as squat if the
 * road under them stretches much past this.
 */
const MAX_VERTICAL_STRETCH = 1.22;

let fitScale = 1;
let fitScaleY = 1;
let fitDx = 0;
let fitDy = 0;

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function clearCameraFit(): void {
  fitScale = 1;
  fitScaleY = 1;
  fitDx = 0;
  fitDy = 0;
}

/** Projected bounds of a plane path under the fit currently installed. */
export function projectedBounds(points: Vec2[]): Bounds {
  const bounds: Bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  for (const point of points) {
    const projected = project(point.x, point.y);
    if (projected.x < bounds.minX) bounds.minX = projected.x;
    if (projected.x > bounds.maxX) bounds.maxX = projected.x;
    if (projected.y < bounds.minY) bounds.minY = projected.y;
    if (projected.y > bounds.maxY) bounds.maxY = projected.y;
  }
  return bounds;
}

/**
 * Measures `points` — the outermost geometry the track will draw — and installs
 * the scale that keeps it on screen. Call from setTrack, before anything is
 * projected for the new circuit.
 */
export function fitCameraToPlane(points: Vec2[]): void {
  clearCameraFit();
  if (points.length === 0) return;

  const { minX, maxX, minY, maxY } = projectedBounds(points);
  const width = maxX - minX;
  const height = maxY - minY;
  if (!(width > 0) || !(height > 0)) return;

  const roomX = (DESIGN_W - SAFE_MARGIN * 2) / width;
  const roomY = (SAFE_BOTTOM - SAFE_TOP) / height;

  // The tighter axis sets the base, so nothing is ever clipped. It is no longer
  // capped at 1: a circuit smaller than the frame used to be left at its natural
  // size, which cost Grand Oval about a third of the screen for no reason.
  fitScale = Math.min(roomX, roomY);
  // Then the looser axis — always the vertical, on a portrait screen — takes up
  // as much of its own slack as the stretch cap allows.
  fitScaleY = Math.min(roomY, fitScale * MAX_VERTICAL_STRETCH);

  // Centre on both axes. Vertical centring is what frees PITCH from needing a
  // matching hand-tuned origin: whatever the angle does to the projected height,
  // the circuit lands between the HUD and the control bar.
  fitDx = DESIGN_W / 2 - fitScale * ((minX + maxX) / 2);
  fitDy = (SAFE_TOP + SAFE_BOTTOM) / 2 - fitScaleY * ((minY + maxY) / 2);
}

export function project(x: number, y: number): Projected {
  if (!PERSPECTIVE) {
    // Straight overhead: design space is screen space. Depth still runs from the
    // far edge to the near one so draw ordering does not have to special-case it.
    return { x: x * fitScale + fitDx, y: y * fitScaleY + fitDy, scale: fitScale, depth: DESIGN_H - y };
  }

  // Design y runs top (far) to bottom (near); ground distance runs the other way.
  const ground = NEAR + (DESIGN_H - y);
  const lateral = x - SCREEN_CX;

  // Camera space after pitching down towards the plane.
  const depth = ground * cosPitch + HEIGHT * sinPitch;
  const vertical = ground * sinPitch - HEIGHT * cosPitch;

  const scale = FOCAL / Math.max(1, depth);
  return {
    x: (SCREEN_CX + lateral * scale * FIT_X) * fitScale + fitDx,
    y: -vertical * scale * FIT_Y * fitScaleY + fitDy,
    // Sprite scale is the same magnification the road gets, so a car always
    // covers the same share of its lane. It used to be `midBoardDepth / depth`,
    // which carries no focal length and so is a purely relative number, and it
    // only ever matched the road because at the original PITCH of 0.90 that
    // depth works out to 1402 — a rounding error away from FOCAL's 1400. The
    // coincidence broke as soon as the angle moved: by PITCH 1.50 it falls to
    // 977, and every car had quietly shrunk to 70% of its proper size while the
    // road around it kept growing.
    // Sprites take one scale, so the geometric mean of the two fit axes keeps
    // them from looking squashed when those axes differ.
    scale: scale * Math.sqrt(FIT_X * FIT_Y) * Math.sqrt(fitScale * fitScaleY),
    depth
  };
}

export function projectPath(points: Vec2[]): Projected[] {
  return points.map((point) => project(point.x, point.y));
}

/**
 * Screen heading at a point, given the direction it faces on the plane.
 * Perspective rotates directions, so a car's sprite angle has to be measured
 * after projection rather than taken from the track.
 */
export function projectedHeading(x: number, y: number, angle: number): number {
  const step = 2;
  const a = project(x, y);
  const b = project(x + Math.cos(angle) * step, y + Math.sin(angle) * step);
  return Math.atan2(b.y - a.y, b.x - a.x);
}

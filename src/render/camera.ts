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
 * 1.50 went too far. It put the lean under a pixel per hundred, but at 1.06
 * near/far the far side of the board is within six percent of the size of the
 * near side — no depth cue at all, a flat top-down board. Nothing else on
 * screen moves much either, so that flatness was most of why the game stopped
 * reading as alive.
 *
 * 1.40 buys the depth back for almost nothing. Measured across the circuits:
 *
 *   pitch   near/far   lean   height filled
 *   1.50      1.06      0.9%      100%
 *   1.40      1.14      2.3%      100%
 *   1.30      1.21      3.6%       97%
 *   1.25      1.25      4.2%       94%
 *
 * The taper is visible again at 1.40 and the frame is still completely filled,
 * so it costs nothing that was fought for. 1.30 has more depth still, but there
 * the lean is plainly visible on Delta Run's west straight, which is meant to
 * read as dead vertical. Below 1.30 the fit starts giving back real size.
 */
const PITCH = 1.40;
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
 * How much of the perspective applies *sideways*. None, now.
 *
 * This is the end of a long argument with the evidence, and the evidence won.
 *
 * Full perspective magnifies lateral distance with nearness, so parallel lines
 * converge towards the vanishing point. Correct — and on an off-centre straight
 * it is also the single thing that makes the board read as tilted rather than as
 * receding. Long Bay's west straight is exactly vertical in the track's own
 * geometry, and at full strength its two ends landed 14.7px apart on a 390-wide
 * screen, against a frame of HUD pills and buttons that are all dead square.
 *
 * The first fix was to blend it down to 0.35, which cut the lean to 5.1px. That
 * bought a worse problem: sprites still scaled on true depth, so the road barely
 * converged while the cars still shrank with distance. The road did not recede
 * and the traffic on it did. An observer cannot say what is wrong with a picture
 * like that, only that something is.
 *
 * So all three were built and looked at side by side — full, blended, and none —
 * and the verdict on the whole spectrum was that the difference was not visible
 * at all, except that the flat one looked straighter. Measured, that is not
 * surprising: at this pitch the near-to-far size ratio is 1.143, so the largest
 * effect the perspective was ever buying is fourteen percent on a car that is
 * ten pixels long. It was never going to read, and it cost a lean and a
 * contradiction to not read.
 *
 *   variant      lean     road near/far   car near/far
 *   full        14.7px       1.143           1.143
 *   blended      5.1px       1.048           1.143
 *   flat         0.0px       1.000           1.000
 *
 * What is kept is the vertical compression: rows still bunch towards the top of
 * the frame, so the plane still recedes. What is dropped is everything that was
 * pretending a 10px car is at a different distance from another 10px car.
 */
const LATERAL_PERSPECTIVE = 0;
const MID_DEPTH = (NEAR + DESIGN_H / 2) * cosPitch + HEIGHT * sinPitch;
const MID_SCALE = FOCAL / MID_DEPTH;


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
/**
 * How much frame the circuit is allowed to claim.
 *
 * These were pushed to the edge — a margin of 4 — when the board was reading as
 * too small, and at that setting Long Bay covers 98% of the width. That solved
 * the size complaint and created the opposite one: with the road running to the
 * bezel there is nowhere for the harbour to be, so the water it sits in reads as
 * a thin border rather than as somewhere the track was built.
 *
 * The side margin is the one that matters, because the sides are where the
 * boats and buoys live. Vertical is pulled in only slightly: height was the
 * scarce axis in the first place and is still what the fit fights for.
 */
const SAFE_MARGIN = 26;
const SAFE_TOP = 64;
const SAFE_BOTTOM = 700;

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
  const lateralScale = scale * LATERAL_PERSPECTIVE + MID_SCALE * (1 - LATERAL_PERSPECTIVE);
  return {
    x: (SCREEN_CX + lateral * lateralScale * FIT_X) * fitScale + fitDx,
    y: -vertical * scale * FIT_Y * fitScaleY + fitDy,
    // Sprites take the same lateral scale the road does, which is now the same
    // everywhere on the board: a car covers the same share of its lane wherever
    // it is. Scaling them on true depth instead is what made the far traffic
    // 14% smaller than the near traffic while the road under them stayed the
    // same width — the contradiction that made the old camera feel off without
    // being nameable. The geometric mean of the two fit axes keeps a sprite from
    // looking squashed when those axes differ.
    scale: lateralScale * Math.sqrt(FIT_X * FIT_Y) * Math.sqrt(fitScale * fitScaleY),
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

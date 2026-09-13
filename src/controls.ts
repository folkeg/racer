/**
 * On-screen control bar layout and its press state.
 *
 * Shared by input.ts (hit testing) and render/hud.ts (drawing) so the touch
 * targets and the pixels can never drift apart.
 */

import { LANE_COUNT } from './config';
import { requestLaneChange } from './player';
import type { Control, ControlId } from './types';

// This bottom strip never covers the track, and its lower edge stops at 810 to
// stay clear of the iPhone home indicator. It grew taller when the round stick
// arrived: a stick needs to be as tall as it is wide, and 58 was not enough to
// read as one.
export const CONTROL_BAR_TOP = 722;
export const CONTROL_H = 88;
export const CONTROL_HIT_PADDING = 12;
export const CONTROL_FLASH_DURATION = 0.14;

/**
 * A round stick and the two arrow buttons, side by side.
 *
 * They do different jobs rather than duplicating one. The buttons are exact —
 * one tap, one lane, which is what a game about threading a gap at speed wants
 * most of the time. The stick is for committing: push it and hold, and the car
 * keeps stepping across until it is where you want it or runs out of road.
 * Neither is a mode to be chosen in a menu; both are live at once, and tapping
 * the track above the bar still works as a third option.
 *
 * The gaps between them matter more than their sizes. The stick first sat 12
 * units from the left arrow, and with a courtesy margin on each they
 * overlapped — a thumb aimed at the arrow and landing short reached the stick
 * instead, which read it as a push to full deflection *right*, because
 * everything right of the stick's centre is a push right. Aiming left and going
 * right is about the worst failure a control can have. Every gap is now wider
 * than twice the margin, so no two of them ever compete.
 */
export const STICK = { cx: 56, cy: CONTROL_BAR_TOP + CONTROL_H / 2, radius: 38 };

export const CONTROLS: Control[] = [
  { id: 'steer', kind: 'steer', direction: 0, round: true, x: 18, y: 728, w: 76, h: 76 } as const,
  { id: 'left', kind: 'lane', direction: -1, round: true, x: 118, y: 740, w: 52, h: 52 } as const,
  { id: 'right', kind: 'lane', direction: +1, round: true, x: 194, y: 740, w: 52, h: 52 } as const,
  { id: 'throttle', kind: 'throttle', direction: 0, round: true, x: 298, y: 734, w: 64, h: 64 } as const
];

/** How far outside its body a point is, or 0 when it is inside. */
function distanceOutside(control: Control, x: number, y: number): number {
  if (control.round) {
    const cx = control.x + control.w / 2;
    const cy = control.y + control.h / 2;
    return Math.max(0, Math.hypot(x - cx, y - cy) - control.w / 2);
  }
  const dx = Math.max(control.x - x, 0, x - (control.x + control.w));
  const dy = Math.max(control.y - y, 0, y - (control.y + control.h));
  return Math.hypot(dx, dy);
}

/**
 * Exact hits first, then the nearest control within the courtesy margin.
 *
 * Taking the first match in declaration order is what let the stick answer for
 * points that were closer to the arrow beside it. Nearest-wins makes the
 * outcome depend on where the thumb actually landed rather than on the order
 * the controls happen to be listed in.
 */
export function controlAtDesignPoint(x: number, y: number): Control | null {
  let nearest: Control | null = null;
  let nearestDistance = Infinity;
  for (const control of CONTROLS) {
    const distance = distanceOutside(control, x, y);
    if (distance === 0) return control;
    if (distance <= CONTROL_HIT_PADDING && distance < nearestDistance) {
      nearest = control;
      nearestDistance = distance;
    }
  }
  return nearest;
}

/**
 * Deflection past which the pad counts as pushed, as a fraction of half its
 * width. Below this a touch is still just a tap on one side or the other.
 */
const DEADZONE = 0.22;

/**
 * Hold-to-repeat, in seconds.
 *
 * The first repeat waits longer than the ones after it, which is what separates
 * a flick from a hold: without that gap a quick tap regularly registers twice
 * and puts the car two lanes over. The repeat interval itself is far slower
 * than CHANGE_DURATION — the lane change animation takes 0.05s, and repeating
 * at that rate would cross the whole road in a quarter second, well under the
 * time it takes to see where the car ended up.
 */
const REPEAT_DELAY = 0.3;
const REPEAT_INTERVAL = 0.17;

export const steer = {
  /** -1, 0 or +1, in requestLaneChange's convention: +1 is the car's right. */
  direction: 0,
  /** Where the knob sits, -1..1, for drawing. */
  offset: 0,
  held: false,
  timer: 0
};

/** Called when a thumb lands on or moves across the stick. */
export function pressSteer(designX: number): void {
  const offset = Math.max(-1, Math.min(1, (designX - STICK.cx) / STICK.radius));
  const direction = Math.abs(offset) < DEADZONE ? 0 : (offset < 0 ? -1 : +1);

  // A new direction restarts the repeat clock and steps once immediately, so
  // the pad answers the very first frame rather than after REPEAT_DELAY.
  if (direction !== 0 && direction !== steer.direction) {
    requestLaneChange(direction);
    steer.timer = REPEAT_DELAY;
  }
  steer.offset = offset;
  steer.direction = direction;
  steer.held = true;
}

export function releaseSteer(): void {
  steer.held = false;
  steer.direction = 0;
  steer.offset = 0;
  steer.timer = 0;
}

export function updateSteer(dt: number): void {
  // The knob springs back when nothing is holding it.
  if (!steer.held) {
    steer.offset += (0 - steer.offset) * Math.min(1, dt * 14);
    return;
  }
  if (steer.direction === 0) return;

  steer.timer -= dt;
  if (steer.timer > 0) return;
  steer.timer = REPEAT_INTERVAL;
  requestLaneChange(steer.direction);
}

/** True once the car is already against the edge it is being pushed towards. */
export function steerIsBlocked(lane: number): boolean {
  if (steer.direction < 0) return lane <= 0;
  if (steer.direction > 0) return lane >= LANE_COUNT - 1;
  return false;
}

/** Seconds of highlight left on each side of the pad after a step. */
export const laneButtonFlash: Record<'left' | 'right', number> = {
  left: 0,
  right: 0
};

export function updateControlFlash(dt: number): void {
  laneButtonFlash.left = Math.max(0, laneButtonFlash.left - dt);
  laneButtonFlash.right = Math.max(0, laneButtonFlash.right - dt);
}

export function flashLaneButton(id: ControlId | 'left' | 'right'): void {
  if (id === 'left' || id === 'right') laneButtonFlash[id] = CONTROL_FLASH_DURATION;
}

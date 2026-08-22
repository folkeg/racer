/**
 * Touch, pointer and keyboard input.
 *
 * Pointers are tracked individually by id so one thumb can hold the throttle
 * while another taps a lane button.
 */

import { app, goBack, retryRun } from './app';
import { audio } from './audio';
import { controlAtDesignPoint, flashLaneButton } from './controls';
import { canvas, DESIGN_W, screenToDesignX, screenToDesignY, VIEW_H, VIEW_W } from './platform';
import { requestLaneChange, setThrottle } from './player';
import { BACK_BUTTON } from './render/hud';
import { handleMenuTap } from './screens/menu';
import { handleResultTap } from './screens/result';
import { handleTrackSelectTap } from './screens/trackSelect';
import type { Control, KeyboardEventLike, PointerEventLike } from './types';

/** pointer id -> what it is currently driving. */
type PointerAssignment = 'left' | 'right' | 'throttle' | 'track' | 'none';

const activePointers = new Map<number, PointerAssignment>();

function refreshThrottleFromPointers(): void {
  let held = false;
  for (const assignment of activePointers.values()) {
    if (assignment === 'throttle') {
      held = true;
      break;
    }
  }
  setThrottle(held);
}

function pressControl(control: Control): void {
  if (control.kind === 'throttle') return;
  flashLaneButton(control.id);
  requestLaneChange(control.direction);
}

export function pointerDown(pointerId: number, screenX: number, screenY: number): void {
  const x = screenToDesignX(screenX);
  const y = screenToDesignY(screenY);

  // Menus own the whole screen; driving controls only exist during a run.
  if (app.screen === 'MENU') {
    handleMenuTap(x, y);
    return;
  }
  if (app.screen === 'TRACKS') {
    handleTrackSelectTap(x, y);
    return;
  }
  if (app.screen === 'RESULT') {
    handleResultTap(x, y);
    return;
  }

  if (x >= BACK_BUTTON.x && x <= BACK_BUTTON.x + BACK_BUTTON.w &&
      y >= BACK_BUTTON.y && y <= BACK_BUTTON.y + BACK_BUTTON.h) {
    releaseAllPointers();
    goBack();
    return;
  }

  const control = controlAtDesignPoint(x, y);

  if (control) {
    activePointers.set(pointerId, control.id);
    if (control.kind === 'throttle') audio.ensureStarted();
    pressControl(control);
    refreshThrottleFromPointers();
    return;
  }

  // Above the control bar the original invisible left/right halves still work,
  // so the old one-thumb play style keeps working alongside the buttons.
  activePointers.set(pointerId, 'track');
  requestLaneChange(x < DESIGN_W * 0.5 ? +1 : -1);
}

export function pointerMove(pointerId: number, screenX: number, screenY: number): void {
  if (app.screen !== 'PLAYING') return;
  if (!activePointers.has(pointerId)) return;
  const control = controlAtDesignPoint(screenToDesignX(screenX), screenToDesignY(screenY));
  const previous = activePointers.get(pointerId);

  // Only the throttle reacts to sliding: a thumb that drifts off it releases,
  // and one that drifts onto it engages. Lane buttons stay strictly per-tap.
  if (control && control.kind === 'throttle') {
    if (previous !== 'throttle') audio.ensureStarted();
    activePointers.set(pointerId, 'throttle');
  } else if (previous === 'throttle') {
    activePointers.set(pointerId, 'none');
  }
  refreshThrottleFromPointers();
}

export function pointerUp(pointerId: number): void {
  if (!activePointers.delete(pointerId)) return;
  refreshThrottleFromPointers();
}

export function releaseAllPointers(): void {
  activePointers.clear();
  setThrottle(false);
}

function isThrottleKey(event: KeyboardEventLike): boolean {
  const key = String(event.key || '').toLowerCase();
  const code = String(event.code || '');
  const keyCode = Number(event.keyCode || event.which || 0);
  return key === 'arrowup' || key === 'up' || key === 'w' || key === ' ' || key === 'spacebar' ||
    code === 'ArrowUp' || code === 'KeyW' || code === 'Space' ||
    keyCode === 38 || keyCode === 87 || keyCode === 32;
}

function handleKeyboardInput(event: KeyboardEventLike): void {
  if (app.screen !== 'PLAYING') return;
  const key = String(event.key || '').toLowerCase();
  const code = String(event.code || '');
  const keyCode = Number(event.keyCode || event.which || 0);
  let handled = false;

  if (key === 'arrowleft' || key === 'left' || key === 'a' ||
      code === 'ArrowLeft' || code === 'KeyA' || keyCode === 37 || keyCode === 65) {
    requestLaneChange(+1);
    handled = true;
  } else if (key === 'arrowright' || key === 'right' || key === 'd' ||
             code === 'ArrowRight' || code === 'KeyD' || keyCode === 39 || keyCode === 68) {
    requestLaneChange(-1);
    handled = true;
  } else if (isThrottleKey(event)) {
    setThrottle(true);
    handled = true;
  } else if (key === 'r' || code === 'KeyR' || keyCode === 82) {
    retryRun();
    handled = true;
  } else if (key === 'escape' || code === 'Escape' || keyCode === 27) {
    releaseAllPointers();
    goBack();
    handled = true;
  }

  if (handled && typeof event.preventDefault === 'function') event.preventDefault();
}

function handleKeyboardRelease(event: KeyboardEventLike): void {
  if (!isThrottleKey(event)) return;
  setThrottle(false);
  if (typeof event.preventDefault === 'function') event.preventDefault();
}

export function installInput(): void {
  const usingWxTouch = typeof wx.onTouchStart === 'function';

  if (usingWxTouch) {
    // changedTouches carries exactly the fingers this event is about, which is what
    // multi-touch bookkeeping needs; event.touches is the full current set.
    const forEachChanged = (event: WxTouchEvent, handler: (touch: WxTouch, id: number) => void): void => {
      const list = (event && (event.changedTouches || event.touches)) || [];
      for (let i = 0; i < list.length; i++) {
        const touch = list[i];
        if (touch) handler(touch, touch.identifier != null ? touch.identifier : i);
      }
    };

    wx.onTouchStart!((event) => forEachChanged(event, (touch, id) => pointerDown(id, touch.clientX, touch.clientY)));
    if (typeof wx.onTouchMove === 'function') {
      wx.onTouchMove((event) => forEachChanged(event, (touch, id) => pointerMove(id, touch.clientX, touch.clientY)));
    }
    if (typeof wx.onTouchEnd === 'function') {
      wx.onTouchEnd((event) => forEachChanged(event, (_touch, id) => pointerUp(id)));
    }
    if (typeof wx.onTouchCancel === 'function') {
      wx.onTouchCancel((event) => forEachChanged(event, (_touch, id) => pointerUp(id)));
    }
  }

  // Only bind DOM pointer events when wx touch events are absent, otherwise a
  // single tap would be handled twice and change two lanes at once.
  if (!usingWxTouch && canvas && typeof canvas.addEventListener === 'function') {
    // A focusable canvas makes browser keyboard testing reliable, including after a click.
    if (typeof canvas.setAttribute === 'function') canvas.setAttribute('tabindex', '0');
    canvas.tabIndex = 0;

    const localPoint = (event: PointerEventLike): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect
        ? canvas.getBoundingClientRect()
        : { left: 0, top: 0, width: VIEW_W, height: VIEW_H };
      return {
        x: (event.clientX - rect.left) * VIEW_W / Math.max(1, rect.width),
        y: (event.clientY - rect.top) * VIEW_H / Math.max(1, rect.height)
      };
    };

    canvas.addEventListener('pointerdown', (event: PointerEventLike) => {
      if (typeof canvas.focus === 'function') canvas.focus({ preventScroll: true });
      const point = localPoint(event);
      pointerDown(event.pointerId, point.x, point.y);
      if (typeof event.preventDefault === 'function') event.preventDefault();
    });

    // Move and release listen on window so a thumb that slides off the canvas
    // cannot leave the throttle stuck on.
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('pointermove', (event) => {
        const point = localPoint(event);
        pointerMove(event.pointerId, point.x, point.y);
      });
      window.addEventListener('pointerup', (event) => pointerUp(event.pointerId));
      window.addEventListener('pointercancel', (event) => pointerUp(event.pointerId));
    }

    if (typeof canvas.focus === 'function') {
      setTimeout(() => canvas.focus!({ preventScroll: true }), 0);
    }
  }

  // Capture on window so arrow keys work even if another non-input element has focus.
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', handleKeyboardInput, { capture: true, passive: false });
    window.addEventListener('keyup', handleKeyboardRelease, { capture: true, passive: false });
    window.addEventListener('blur', releaseAllPointers);
  }
}

/** Exposed for the headless input tests. */
export const debugPointerCount = (): number => activePointers.size;

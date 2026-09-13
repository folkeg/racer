/**
 * Minimal ambient description of the WeChat Mini Game globals this project uses.
 *
 * Only the surface the game actually touches is declared, so a typo in an API
 * name fails type checking instead of silently doing nothing on a real phone.
 * index.html supplies a browser shim with the same shape for local testing.
 */

interface WxWindowInfo {
  windowWidth: number;
  windowHeight: number;
  pixelRatio?: number;
}

interface WxTouch {
  identifier?: number;
  clientX: number;
  clientY: number;
}

interface WxTouchEvent {
  touches?: WxTouch[];
  changedTouches?: WxTouch[];
}

interface WxCanvas {
  width: number;
  height: number;
  tabIndex?: number;
  getContext(contextId: '2d'): CanvasRenderingContext2D | null;
  addEventListener?(type: string, listener: (event: any) => void, options?: unknown): void;
  setAttribute?(name: string, value: string): void;
  getBoundingClientRect?(): { left: number; top: number; width: number; height: number };
  focus?(options?: { preventScroll?: boolean }): void;
}

interface WxImage {
  src: string;
  width: number;
  height: number;
  onload: (() => void) | null;
  onerror: (() => void) | null;
}

interface WxApi {
  createCanvas(): WxCanvas;
  /** WeChat's Image stand-in. Absent on platforms that cannot load art. */
  createImage?(): WxImage;
  getWindowInfo?(): WxWindowInfo;
  getSystemInfoSync?(): WxWindowInfo;
  createWebAudioContext?(): AudioContext;
  vibrateShort?(options: { type: 'heavy' | 'medium' | 'light' }): void;
  onTouchStart?(handler: (event: WxTouchEvent) => void): void;
  onTouchMove?(handler: (event: WxTouchEvent) => void): void;
  onTouchEnd?(handler: (event: WxTouchEvent) => void): void;
  onTouchCancel?(handler: (event: WxTouchEvent) => void): void;
  onHide?(handler: () => void): void;
  onShow?(handler: () => void): void;
}

declare const wx: WxApi;

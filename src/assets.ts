/**
 * Painted art, loaded at boot.
 *
 * Everything else in this game is drawn from code, and for most of it that is
 * the right answer: a road is geometry, and geometry belongs in geometry. Water
 * is not. A sea is a continuously shaded surface, and every attempt to reach one
 * with strokes produced the same thing — lines on a background, which is what
 * lines are. The tile these load is baked by tools/bake-water-tile.mjs from two
 * crossing wave trains lit by the scene's own light direction, at a resolution
 * no runtime stroke pass could afford.
 *
 * Loading is asynchronous and entirely optional. Nothing waits for it and
 * nothing breaks without it: until the image arrives, and forever on a platform
 * with no createImage, the generated tile is used instead. That fallback is why
 * this can be added without touching a single test.
 */

import { MODELS } from './models.generated';

const loaded: Record<string, WxImage | null> = {
  water: null,
  sand: null,
  concrete: null,
  // Baked, listed in the tile sizes, used as the city and works-yard paving —
  // and never loaded, so both of those roads have been running with no grain on
  // them at all. Nothing failed loudly; groundTexture simply returned null and
  // the fill went out flat.
  asphalt: null,
  grass: null
};

/**
 * Drawn objects, as opposed to surfaces.
 *
 * Everything standing on this board used to be hand-coded — twenty lines for a
 * tent, forty for a rotunda — and that cost is why the scene never had more than
 * five things in it while the reference has fifty. It is also why the mistakes
 * were the kind they were: a tent drawn in side elevation, a roof with twelve
 * ribs that read as a cog. A drawing does not have those failure modes, because
 * whoever drew it was looking at it.
 *
 * These are Kenney's Racing Pack, CC0, and they are genuinely top-down: the
 * marquee is four slopes meeting at a peak and the grandstand has a crowd in it,
 * seen from directly above.
 */
const PROP_NAMES = [
  'tent-red', 'tent-blue', 'tribune', 'tribune-roof', 'tree', 'tree-small',
  'rock', 'rock-alt', 'tyres', 'tyres-red', 'drum-red', 'drum-blue',
  'barrier', 'cone'
];

const props: Record<string, WxImage | null> = {};

/**
 * Sprites rendered from 3D, all under one camera and one light.
 *
 * These are the things nobody could identify when they were drawn by hand — a
 * factory, a storage tank, a chimney, a container — and the reason is not that
 * the drawing was poor. Nobody knows the silhouette of "a works building seen
 * from above", so there is nothing for a viewer to recognise it against. A
 * render of an actual model has that silhouette by construction.
 *
 * Kenney's City Kit (Industrial), CC0, put through tools/render-sprites.py with
 * an orthographic top-down camera and a sun at the project's own LIGHT_ANGLE.
 * The manifest beside them carries each model's true size, so the game scales
 * them from measurements rather than from whatever looked right.
 */
/**
 * Design units per model unit.
 *
 * Calibrated against the road, which is 68 units wide, by rendering the same
 * circuit at 38, 48 and 58 and looking at the three side by side.
 *
 * At 38 the works yard is a cluster of small sheds — busy, but nothing in it is
 * a landmark. At 58 three buildings fill the site and the rest of the yard is
 * empty concrete; each one is impressive and there is no density left. 48 keeps
 * both: a works is 100 units across and 90 deep, half as wide again as the
 * racing surface and five car lengths, with room for five or six of them.
 *
 * This only became a free choice once the fit test stopped asking whether a
 * building fits inside its yard. While it did, raising the scale meant deepening
 * the yards, and deepening the yards meant the made ground swallowed the
 * infield — see standsClear in render/land.ts.
 */
export let MODEL_SCALE = 48;

/** Only for comparing sizes from the console. Not used by the game. */
export function setModelScale(value: number): void {
  MODEL_SCALE = value;
}

/** Every turn of every model, by the filename it is stored under. */
function renderedSprites(): string[] {
  const names: string[] = [];
  for (const [name, info] of Object.entries(MODELS)) {
    if (info.yaws === 1) names.push(name);
    else for (let k = 0; k < info.yaws; k++) names.push(`${name}-${k}`);
  }
  return names;
}

/**
 * Called when a tile arrives.
 *
 * The road and the islands live in the layer that is rendered once per circuit,
 * so a tile that lands after that render would never be seen — the cache would
 * hold the generated texture for the rest of the run. Whoever owns that cache
 * hands us a way to drop it.
 */
let onLoaded: (() => void) | null = null;

/**
 * Says so when a piece of art does not arrive.
 *
 * Every draw falls back to a hand-coded shape when its image is missing, which
 * is the right behaviour and was also the cause of two long confusions: an
 * asphalt tile that was never added to the loader and went unnoticed for days,
 * and a whole sprite set failing to load under file:// while the game quietly
 * drew the old shapes and looked exactly as it had before. A silent fallback
 * hides the difference between "this is how it looks" and "this never loaded".
 */
let missing = 0;

function warn(path: string): void {
  missing += 1;
  const console = (globalThis as { console?: { warn?: (...args: unknown[]) => void } }).console;
  console?.warn?.(
    `[art] ${path} did not load (${missing} so far). Falling back to the drawn shape.` +
    ' Serving the game over http:// rather than opening the file directly usually fixes this.'
  );
}

export function setArtListener(listener: () => void): void {
  onLoaded = listener;
}

function load(name: string): void {
  const image = wx.createImage?.();
  if (!image) return;
  image.onload = () => {
    // A zero-sized image is a failed decode dressed as a success.
    if (image.width > 0 && image.height > 0) {
      loaded[name] = image;
      onLoaded?.();
    }
  };
  image.onerror = () => {
    loaded[name] = null;
    warn(`assets/${name}-tile.png`);
  };
  image.src = `assets/${name}-tile.png`;
}

function loadProp(name: string): void {
  const image = wx.createImage?.();
  if (!image) return;
  image.onload = () => {
    if (image.width > 0 && image.height > 0) {
      props[name] = image;
      onLoaded?.();
    }
  };
  image.onerror = () => {
    props[name] = null;
    warn(`assets/props/${name}.png`);
  };
  image.src = `assets/props/${name}.png`;
}

function loadRendered(name: string): void {
  const image = wx.createImage?.();
  if (!image) return;
  image.onload = () => {
    if (image.width > 0 && image.height > 0) {
      props[name] = image;
      onLoaded?.();
    }
  };
  image.onerror = () => {
    props[name] = null;
    warn(`assets/props3d/${name}.png`);
  };
  image.src = `assets/props3d/${name}.png`;
}

export function loadArt(): void {
  for (const name of Object.keys(loaded)) load(name);
  for (const name of PROP_NAMES) loadProp(name);
  for (const name of renderedSprites()) loadRendered(name);
}

/**
 * How wide one turn of a model should be drawn, in design units.
 *
 * The sprite is framed to what that turn of the model actually spans, and every
 * turn spans something different — a long shed seen end-on needs a third less
 * frame than the same shed seen broadside. Drawing them all at one width would
 * stretch or shrink the model with its own rotation, which is why the span of
 * each turn is carried rather than assumed.
 */
export function modelWidth(name: string, yaw = 0): number {
  const info = MODELS[name];
  if (!info) return 40;
  return info.spans[Math.min(yaw, info.spans.length - 1)] * MODEL_SCALE;
}

/** A drawn object, or null while it is loading or unavailable. */
export function propArt(name: string): WxImage | null {
  return props[name] ?? null;
}

/** A tile by name, or null while it is still loading or unavailable. */
export function tileArt(name: string): WxImage | null {
  return loaded[name] ?? null;
}
export function waterArt(): WxImage | null {
  return loaded.water;
}
export function concreteArt(): WxImage | null {
  return loaded.concrete;
}
export function grassArt(): WxImage | null {
  return loaded.grass;
}

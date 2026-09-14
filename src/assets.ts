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

export function loadArt(): void {
  for (const name of Object.keys(loaded)) load(name);
  for (const name of PROP_NAMES) loadProp(name);
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

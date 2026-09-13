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
  concrete: null,
  grass: null
};

/**
 * Called when a tile arrives.
 *
 * The road and the islands live in the layer that is rendered once per circuit,
 * so a tile that lands after that render would never be seen — the cache would
 * hold the generated texture for the rest of the run. Whoever owns that cache
 * hands us a way to drop it.
 */
let onLoaded: (() => void) | null = null;

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
  };
  image.src = `assets/${name}-tile.png`;
}

export function loadArt(): void {
  for (const name of Object.keys(loaded)) load(name);
}

/** A tile, or null while it is still loading or unavailable. */
export function waterArt(): WxImage | null {
  return loaded.water;
}
export function concreteArt(): WxImage | null {
  return loaded.concrete;
}
export function grassArt(): WxImage | null {
  return loaded.grass;
}

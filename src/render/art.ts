/**
 * Drawing the sprite sheet.
 *
 * One helper, because every drawn object wants the same three things: a shadow
 * on the ground, the image centred on its own footprint at a size given in plane
 * units, and the aspect ratio of the artwork respected. Getting any of those
 * wrong is how a sprite ends up looking pasted on — and the shadow is the one
 * that matters most, since without it the object floats however good the drawing
 * is.
 *
 * Returns false when the art has not loaded, so every caller can keep its
 * hand-drawn fallback and nothing breaks while the images are in flight or on a
 * platform that cannot fetch them.
 */

import { createOffscreenCanvas, ctx } from '../platform';
import { propArt } from '../assets';
import { SHADOW_X, SHADOW_Y } from './light';
import { groundTexture } from './sprites';

/**
 * Bringing bought art into the game's own language.
 *
 * The sprites are drawn in flat saturated vector with hard edges; everything
 * else here — the ground, the paving, the water, the cars — is soft, low
 * contrast and unoutlined. Put them in one frame and the result reads as
 * assembled from parts, which is exactly what it is. Each piece was fine on its
 * own and the whole never came together, because no amount of fixing individual
 * objects gives a picture one visual language.
 *
 * What they are worth keeping for is their *geometry*: a marquee that really is
 * four slopes meeting at a peak, seen from directly above. That survives a
 * change of palette. So each sprite is pulled towards the world it stands in —
 * tinted, desaturated and knocked back — once, into an offscreen copy that is
 * cached and reused.
 */
const harmonised = new Map<string, WxCanvas>();

/**
 * Bakes this game's lighting into a bought sprite, once.
 *
 * The technique is the old one: pre-rendered 2D games — Diablo, StarCraft —
 * look coherent because the lighting was chosen for the whole project and baked
 * into every asset before it ever reached the game, rather than being
 * reconciled object by object afterwards. In a 3D game that coherence is free,
 * which is why every good-looking top-down racer is 3D; in a composited 2D one
 * it has to be manufactured, and the cheapest place to manufacture it is at
 * import.
 *
 * Three passes, in the order they matter:
 *
 *   multiply a directional gradient, so the sprite is lit from up and left like
 *   everything else on the board rather than from wherever its author put the
 *   light;
 *
 *   knock the saturation back, because the pack is flat vector at full chroma
 *   and this board is not;
 *
 *   pull what is left towards the world it will stand in.
 *
 * The alpha is restored at the end with destination-in, because multiply over a
 * transparent surround would otherwise paint the gradient into it.
 */
function harmonise(
  name: string,
  image: WxImage,
  tint: string,
  strength: number,
  desaturate: number
): WxCanvas | null {
  const key = `${name}|${tint}|${strength}|${desaturate}`;
  const cached = harmonised.get(key);
  if (cached) return cached;

  const canvas = createOffscreenCanvas(image.width, image.height);
  const target = canvas ? canvas.getContext('2d') : null;
  if (!canvas || !target) return null;

  const source = image as unknown as CanvasImageSource;
  target.drawImage(source, 0, 0);

  // Lit from up and left, in the direction every shadow on this board agrees on.
  // Gentle. The first version ran from white to rgb(150) across every sprite,
  // which is a heavier gradient than any object on this board actually carries —
  // it flattened the artwork until a tyre stack was an anonymous ring and the
  // point of buying art was lost. Unifying the light must not cost the drawing
  // its own modelling.
  const light = target.createLinearGradient(0, 0, image.width, image.height);
  light.addColorStop(0, 'rgb(255,253,248)');
  light.addColorStop(0.5, 'rgb(232,230,226)');
  light.addColorStop(1, 'rgb(202,202,200)');
  target.globalCompositeOperation = 'multiply';
  target.fillStyle = light;
  target.fillRect(0, 0, image.width, image.height);

  // Chroma down, then towards the world's own colour.
  target.globalCompositeOperation = 'source-atop';
  if (desaturate > 0) {
    target.globalAlpha = desaturate;
    target.fillStyle = '#8E8E8A';
    target.fillRect(0, 0, image.width, image.height);
  }
  target.globalAlpha = strength;
  target.fillStyle = tint;
  target.fillRect(0, 0, image.width, image.height);
  target.globalAlpha = 1;

  // The same grain everything else on the board carries.
  //
  // The pack's own ground is a flat colour with a few speckles — its language
  // puts all the detail in the objects and none in the surface — and ours is the
  // other way round. Rather than flatten a board that was deliberately given
  // material, the material is put on the sprites: one film of the same grain, so
  // a tent and the sand it stands on are made of the same stuff.
  const grain = groundTexture(target, 'concrete');
  if (grain) {
    target.globalAlpha = 0.12;
    target.fillStyle = grain;
    target.fillRect(0, 0, image.width, image.height);
    target.globalAlpha = 1;
  }

  // And put the original silhouette back.
  target.globalCompositeOperation = 'destination-in';
  target.drawImage(source, 0, 0);
  target.globalCompositeOperation = 'source-over';

  harmonised.set(key, canvas);
  return canvas;
}

export interface ArtOptions {
  /** Radians, for things that face a direction. */
  angle?: number;
  /** Ground shadow, as a fraction of the sprite's width. 0 for no shadow. */
  shadow?: number;
  alpha?: number;
  /** Colour to pull the sprite towards, and how far. */
  tint?: string;
  tintStrength?: number;
  /**
   * How much chroma to take out first. Scenery wants plenty; a car wants none,
   * because the player's own car is the one thing on the board that has to be
   * findable at a glance and traffic that has been pulled towards the ground is
   * traffic that cannot be counted.
   */
  desaturate?: number;
}

export function drawArt(
  name: string,
  x: number,
  y: number,
  width: number,
  options: ArtOptions = {}
): boolean {
  const image = propArt(name);
  if (!image || !image.width) return false;

  const height = width * (image.height / image.width);
  const shadow = options.shadow ?? 0.34;

  if (shadow > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(12,18,24,0.34)';
    ctx.beginPath();
    ctx.ellipse(
      x + SHADOW_X * width * 0.2,
      y + SHADOW_Y * width * 0.2,
      width * shadow,
      height * shadow * 0.62,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  const toned = options.tint
    ? harmonise(name, image, options.tint, options.tintStrength ?? 0.3, options.desaturate ?? 0.09)
    : null;

  ctx.save();
  if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
  ctx.translate(x, y);
  if (options.angle) ctx.rotate(options.angle);
  ctx.drawImage(
    (toned ?? image) as unknown as CanvasImageSource,
    -width / 2,
    -height / 2,
    width,
    height
  );
  ctx.restore();
  return true;
}

/** Whether a named sprite is ready, for callers that need to decide layout. */
export function artReady(name: string): boolean {
  const image = propArt(name);
  return Boolean(image && image.width);
}

/* ------------------------------------------------------------------------- */
/* Models rendered from 3D                                                    */
/* ------------------------------------------------------------------------- */

/**
 * Which turn of a model to use for a heading, in plane space.
 *
 * The sprites were made by turning the model under a fixed sun, so the game
 * never rotates one: it picks the one that was rendered facing the right way.
 * Blender's +X is screen right and its +Y is screen *up*, while design y runs
 * down the screen — hence the sign flip. A model turned by a in Blender has its
 * own width axis along design (cos a, -sin a), so the turn wanted for a heading
 * (dx, dy) is atan2(-dy, dx), snapped to the nearest one rendered.
 */
export function yawFor(heading: number, yaws: number): number {
  if (yaws <= 1) return 0;
  const wanted = Math.atan2(-Math.sin(heading), Math.cos(heading));
  const step = (Math.PI * 2) / yaws;
  return ((Math.round(wanted / step) % yaws) + yaws) % yaws;
}

/** The sprite filename for a turn of a model. */
export function yawSprite(name: string, yaws: number, yaw: number): string {
  return yaws <= 1 ? name : `${name}-${yaw}`;
}

/**
 * How far a cast shadow leans, as a fraction of the sprite's own height.
 *
 * Not tuned to taste: the models were rendered under a sun at 1.15 elevation
 * against a unit of ground reach, so a wall of height h throws its shadow about
 * 0.87h. Rounded down a little, because a shadow that reaches further than the
 * building is tall reads as late afternoon and this board is lit at noon.
 */
const SHADOW_LEAN = 0.7;

const silhouettes = new Map<string, WxCanvas>();

/** The sprite as one flat dark shape, for casting. */
function silhouette(name: string, image: WxImage): WxCanvas | null {
  const cached = silhouettes.get(name);
  if (cached) return cached;

  const canvas = createOffscreenCanvas(image.width, image.height);
  const target = canvas ? canvas.getContext('2d') : null;
  if (!canvas || !target) return null;

  target.drawImage(image as unknown as CanvasImageSource, 0, 0);
  target.globalCompositeOperation = 'source-in';
  target.fillStyle = '#0B1218';
  target.fillRect(0, 0, image.width, image.height);
  target.globalCompositeOperation = 'source-over';

  silhouettes.set(name, canvas);
  return canvas;
}

export interface ModelOptions extends ArtOptions {
  /** Sprite width in screen pixels. */
  width: number;
  /** Footprint offset below the middle of the sprite, as a fraction of its height. */
  anchor: number;
}

/**
 * Draws a model so its *footprint* lands on (x, y).
 *
 * The sprite's middle is not its footprint's middle. The camera that rendered it
 * is tilted, so height carries the image up the frame — a water tower is nearly
 * a fifth of its own sprite taller than the ground it stands on. Ignoring that
 * stands every building slightly behind where it was put, which on a row of them
 * lining a straight is the difference between a row and a stagger.
 */
export function drawModel(sprite: string, x: number, y: number, options: ModelOptions): boolean {
  const image = propArt(sprite);
  if (!image || !image.width) return false;

  const width = options.width;
  const height = width * (image.height / image.width);
  const top = y - height / 2 - options.anchor * height;
  const shadow = options.shadow ?? 0;

  if (shadow > 0) {
    // The building's own silhouette, laid down the light.
    //
    // A soft ellipse under the middle is what small props get and it is wrong
    // for anything with a shape: a shed is 114 units long and an ellipse a
    // third of that under the middle of it reads as a stain, not a shadow, and
    // the building goes on floating. This takes the sprite's actual outline,
    // flips it about its own footprint and shears it down-light, which is what
    // the shadow of a solid standing on a plane is.
    const outline = silhouette(sprite, image);
    if (outline) {
      ctx.save();
      ctx.globalAlpha = shadow;
      ctx.translate(x, y);
      // Maps the sprite's up axis onto the light's own direction. The vertical
      // flip is not a mistake: the top of the building casts furthest away.
      ctx.transform(1, 0, -SHADOW_X * SHADOW_LEAN, -SHADOW_Y * SHADOW_LEAN, 0, 0);
      ctx.drawImage(
        outline as unknown as CanvasImageSource,
        -width / 2,
        top - y,
        width,
        height
      );
      ctx.restore();
    }

    // And a contact shadow, because a cast shadow alone leaves a gap of clean
    // ground where the wall actually meets the floor.
    ctx.save();
    ctx.fillStyle = `rgba(14,20,26,${(shadow * 0.55).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, width * 0.30, width * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const toned = options.tint
    ? harmonise(sprite, image, options.tint, options.tintStrength ?? 0.12, options.desaturate ?? 0)
    : null;

  ctx.save();
  if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
  ctx.drawImage(
    (toned ?? image) as unknown as CanvasImageSource,
    x - width / 2,
    top,
    width,
    height
  );
  ctx.restore();
  return true;
}

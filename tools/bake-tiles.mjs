// Bakes the game's seamless surface tiles to PNG. Pure stdlib, no dependencies.
//
//   node tools/bake-tiles.mjs assets
//
// Every tile is the same idea: build a height field that wraps exactly, light it
// from the one direction the whole scene agrees on, and write out the light and
// the shade as a transparent overlay.
//
// Overlay rather than opaque matters. The road tints its five lanes alternately
// and every island picks its own green; an opaque tile would bury both. So what
// is stored is the *lighting* of a surface, and the colour underneath stays
// whatever the renderer wants it to be.
//
// The point of baking rather than stroking at runtime: a lit height field has
// continuous tone across every pixel. A 2px stroke does not, and no quantity of
// strokes adds up to one — which is why every attempt to draw waves, grain or
// grass with lines came out looking like scribble.

import zlib from 'node:zlib';
import { writeFileSync } from 'node:fs';

const TAU = Math.PI * 2;
/** The direction the rest of the scene lights from: up and to the left. */
const LIGHT_ANGLE = Math.PI * 0.32;
const LX = -Math.cos(LIGHT_ANGLE), LY = -Math.sin(LIGHT_ANGLE);

// --- periodic value noise -------------------------------------------------
function lattice(period, seed) {
  const g = new Float32Array(period * period);
  let s = seed >>> 0;
  for (let i = 0; i < g.length; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    g[i] = s / 4294967296;
  }
  return g;
}
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/** Value noise on a lattice that divides `size`, so the field wraps exactly. */
function noise(size, periodX, periodY, seed) {
  const P = Math.max(periodX, periodY);
  const g = lattice(P, seed);
  const out = new Float32Array(size * size);
  const sx = size / periodX, sy = size / periodY;
  for (let y = 0; y < size; y++) {
    const fy = y / sy, y0 = Math.floor(fy) % periodY, y1 = (y0 + 1) % periodY, ty = fade(fy - Math.floor(fy));
    for (let x = 0; x < size; x++) {
      const fx = x / sx, x0 = Math.floor(fx) % periodX, x1 = (x0 + 1) % periodX, tx = fade(fx - Math.floor(fx));
      const a = g[y0 * P + x0], b = g[y0 * P + x1];
      const c = g[y1 * P + x0], d = g[y1 * P + x1];
      out[y * size + x] = (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
    }
  }
  return out;
}

/**
 * Light a height field and write it out as light-and-shade over transparency.
 *
 * `gain` is how hard the slopes are read; `hi` and `lo` are the two colours and
 * how strongly each may show. Crests get sharpened more than troughs, because
 * on every real surface the lit edge is the narrow one.
 */
function shade(size, height, { gain, hi, lo, hiAlpha, loAlpha, hiPower = 1.7, loPower = 1.25 }) {
  const at = (x, y) => height[((y + size) % size) * size + ((x + size) % size)];
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = (at(x + 1, y) - at(x - 1, y)) * 0.5;
      const gy = (at(x, y + 1) - at(x, y - 1)) * 0.5;
      const lit = Math.max(-1, Math.min(1, (gx * LX + gy * LY) * gain));
      const crest = Math.pow(Math.max(0, lit), hiPower);
      const trough = Math.pow(Math.max(0, -lit), loPower);
      const i = (y * size + x) * 4;
      const [c, alpha] = crest >= trough ? [hi, crest * hiAlpha] : [lo, trough * loAlpha];
      rgba[i] = c[0]; rgba[i + 1] = c[1]; rgba[i + 2] = c[2];
      rgba[i + 3] = Math.round(alpha);
    }
  }
  return rgba;
}

// --- the three surfaces ---------------------------------------------------

/**
 * Water: two sine wave trains at different angles, each one's phase pushed
 * around by low-frequency noise so the crests wander rather than ruling
 * straight across, with fine chop on top.
 *
 * The first attempt was five octaves of plain isotropic noise and produced
 * mottled paper — worth recording, because it is the whole lesson: a sea does
 * not look like randomness, it looks like a few wave trains with randomness
 * riding on them.
 */
function water(size) {
  const warpA = noise(size, 4, 4, 11);
  const warpB = noise(size, 8, 4, 27);
  const chop1 = noise(size, 16, 48, 53);
  const chop2 = noise(size, 32, 96, 91);
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const a = Math.sin(TAU * (y * 5 / size) + (warpA[i] - 0.5) * 4.2);
      const b = Math.sin(TAU * ((x * 3 + y * 7) / size) + (warpB[i] - 0.5) * 3.4);
      h[i] = 0.42 * a + 0.26 * b + 0.20 * (chop1[i] - 0.5) * 2 + 0.12 * (chop2[i] - 0.5) * 2;
    }
  }
  return shade(size, h, {
    gain: 34, hi: [255, 255, 252], lo: [10, 38, 58], hiAlpha: 210, loAlpha: 165
  });
}

/**
 * Concrete: aggregate, not asphalt.
 *
 * The circuit is a pale cast deck, so what this wants is the speckle of stone in
 * a matrix plus the broad unevenness of a poured slab — and almost no contrast,
 * because a road that competes with the traffic on it has failed at its job.
 */
function concrete(size) {
  const broad = noise(size, 8, 8, 17);
  const medium = noise(size, 32, 32, 61);
  const grit = noise(size, 128, 128, 103);
  const fine = noise(size, 256, 256, 149);
  const h = new Float32Array(size * size);
  for (let i = 0; i < h.length; i++) {
    h[i] = 0.34 * broad[i] + 0.26 * medium[i] + 0.26 * grit[i] + 0.14 * fine[i];
  }
  return shade(size, h, {
    gain: 30, hi: [255, 252, 240], lo: [40, 40, 44], hiAlpha: 70, loAlpha: 62, hiPower: 1.3, loPower: 1.3
  });
}

/**
 * Grass: clumps, at two scales, lit hard enough to have shape.
 *
 * An island reads as planted because the light breaks up across it, not because
 * anyone can see blades — at the size these are drawn a blade is a third of a
 * pixel. Clump shading is the honest version of the same cue.
 */
function grass(size) {
  const clump = noise(size, 24, 24, 23);
  const tuft = noise(size, 64, 64, 71);
  const fine = noise(size, 192, 192, 127);
  const h = new Float32Array(size * size);
  for (let i = 0; i < h.length; i++) {
    h[i] = 0.44 * clump[i] + 0.34 * tuft[i] + 0.22 * fine[i];
  }
  return shade(size, h, {
    gain: 26, hi: [242, 255, 214], lo: [22, 44, 18], hiAlpha: 108, loAlpha: 96
  });
}

/**
 * Sand: wind ripples.
 *
 * Almost free, because wind ripples and water waves are the same kind of field —
 * a travelling train with noise riding on it — and the only differences are that
 * sand has one dominant direction instead of two crossing ones, a shorter
 * wavelength, and far less contrast. Same function, different numbers, which is
 * the argument for baking these ourselves rather than hunting for them: a new
 * ground is a parameter change, not a shopping trip.
 */
function sand(size) {
  const warp = noise(size, 4, 6, 37);
  const drift = noise(size, 8, 12, 83);
  const grain = noise(size, 96, 96, 113);
  const fine = noise(size, 224, 224, 157);
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      // One train, 9 ridges across the tile, leaning slightly so the ripples do
      // not run square to the screen.
      const ridge = Math.sin(TAU * ((y * 9 + x * 2) / size) + (warp[i] - 0.5) * 5.0);
      // Ripples are sharp on the crest and flat in the trough, unlike a wave.
      const shaped = Math.sign(ridge) * Math.pow(Math.abs(ridge), 0.7);
      h[i] = 0.50 * shaped + 0.20 * (drift[i] - 0.5) * 2
        + 0.20 * (grain[i] - 0.5) * 2 + 0.10 * (fine[i] - 0.5) * 2;
    }
  }
  return shade(size, h, {
    gain: 22, hi: [255, 246, 222], lo: [92, 62, 34], hiAlpha: 96, loAlpha: 104
  });
}

// --- PNG ------------------------------------------------------------------
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return (buf) => {
    let c = -1;
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(body));
  return Buffer.concat([len, body, crc]);
}
function writePng(path, size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
  writeFileSync(path, png);
  return png.length;
}

const out = process.argv[2] || 'assets';
// Water is seen largest, so it is worth the most pixels; the other two are
// never seen at anything like this scale.
for (const [name, size, make] of [['water', 512, water], ['sand', 512, sand], ['concrete', 256, concrete], ['grass', 256, grass]]) {
  const path = `${out}/${name}-tile.png`;
  const bytes = writePng(path, size, make(size));
  console.log(`${path}  ${size}x${size}  ${(bytes / 1024).toFixed(0)}KB`);
}

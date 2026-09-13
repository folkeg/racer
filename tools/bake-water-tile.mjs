// Bakes a seamless, lit water tile to PNG. Pure stdlib.
import zlib from 'node:zlib';
import { writeFileSync } from 'node:fs';

const SIZE = 512;

// --- periodic value noise -------------------------------------------------
// The lattice period divides SIZE, so the field wraps exactly and the tile has
// no seam. This is the whole reason for generating rather than sourcing: a
// photographed water surface does not tile, and a stroke does not shade.
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

function noise(periodX, periodY, seed) {
  const g = lattice(Math.max(periodX, periodY), seed);
  const P = Math.max(periodX, periodY);
  const out = new Float32Array(SIZE * SIZE);
  const sx = SIZE / periodX, sy = SIZE / periodY;
  for (let y = 0; y < SIZE; y++) {
    const fy = y / sy, y0 = Math.floor(fy) % periodY, y1 = (y0 + 1) % periodY, ty = fade(fy - Math.floor(fy));
    for (let x = 0; x < SIZE; x++) {
      const fx = x / sx, x0 = Math.floor(fx) % periodX, x1 = (x0 + 1) % periodX, tx = fade(fx - Math.floor(fx));
      const a = g[y0 * P + x0], b = g[y0 * P + x1];
      const c = g[y1 * P + x0], d = g[y1 * P + x1];
      out[y * SIZE + x] = (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
    }
  }
  return out;
}

/**
 * Water is not noise.
 *
 * The first attempt here was five octaves of isotropic value noise, and what it
 * produced was mottled paper — because a sea does not look like randomness, it
 * looks like a few wave trains running in particular directions with randomness
 * riding on top. So the field is built the other way round: two sine trains at
 * different angles, each one's phase pushed about by a low-frequency noise so
 * the crests wander instead of ruling straight across, and only then some fine
 * chop added on top.
 *
 * Every frequency is a whole number of cycles across the tile and every noise
 * lattice divides it, so the whole thing wraps exactly.
 */
const height = new Float32Array(SIZE * SIZE);
{
  const warpA = noise(4, 4, 11);
  const warpB = noise(8, 4, 27);
  const chop1 = noise(16, 48, 53);
  const chop2 = noise(32, 96, 91);
  const TAU = Math.PI * 2;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      // Main swell: 5 crests down the tile, wandering by up to a third of a
      // wavelength.
      const a = Math.sin(TAU * (y * 5 / SIZE) + (warpA[i] - 0.5) * 4.2);
      // A second train crossing it, which is what stops the surface reading as
      // corduroy.
      const b = Math.sin(TAU * ((x * 3 + y * 7) / SIZE) + (warpB[i] - 0.5) * 3.4);
      const c = (chop1[i] - 0.5) * 2;
      const d = (chop2[i] - 0.5) * 2;
      height[i] = 0.42 * a + 0.26 * b + 0.20 * c + 0.12 * d;
    }
  }
}

// --- light it -------------------------------------------------------------
// Same direction the rest of the scene agrees on: down and slightly right,
// which means the light comes from up and left.
const LIGHT_ANGLE = Math.PI * 0.32;
const LX = -Math.cos(LIGHT_ANGLE), LY = -Math.sin(LIGHT_ANGLE);
const at = (x, y) => height[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)];

const rgba = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const gx = (at(x + 1, y) - at(x - 1, y)) * 0.5;
    const gy = (at(x, y + 1) - at(x, y - 1)) * 0.5;
    // Slope towards the light is a crest catching it; away is a trough.
    let lit = (gx * LX + gy * LY) * 34;
    lit = Math.max(-1, Math.min(1, lit));
    // Sharpen the bright side only: crests are narrow, troughs are broad.
    const crest = Math.pow(Math.max(0, lit), 1.7);
    const trough = Math.pow(Math.max(0, -lit), 1.25);

    const i = (y * SIZE + x) * 4;
    if (crest >= trough) {
      rgba[i] = 255; rgba[i + 1] = 255; rgba[i + 2] = 252;
      rgba[i + 3] = Math.round(crest * 210);
    } else {
      rgba[i] = 10; rgba[i + 1] = 38; rgba[i + 2] = 58;
      rgba[i + 3] = Math.round(trough * 165);
    }
  }
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
const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;
  rgba.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);
writeFileSync(process.argv[2], png);
console.log('wrote', process.argv[2], (png.length / 1024).toFixed(0) + 'KB');

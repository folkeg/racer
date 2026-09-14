/**
 * The parts of a world that move.
 *
 * Everything else in the scene — water, road, kerbs, islands — is rendered once
 * per circuit into the cached layer and blitted unchanged every frame. That is
 * the right call for a camera that never moves, but it left the board with
 * nothing on it in motion except the cars and the player's own trail, which is
 * most of why a big, clean, readable picture still read as a still life.
 *
 * So the two bits of decor that have any business moving were taken out of that
 * layer and are drawn here instead: boats drift and drag a wake, buoys rock in
 * the swell, and gulls cross the frame now and then. The cost is a few dozen
 * draw calls a frame and no cache invalidation at all.
 *
 * Motion, not clutter. The static rocks and buildings that used to fill this
 * space were removed for crowding the edges; the difference is that a thing
 * which moves reads as the harbour being alive rather than as decoration
 * competing with the road for attention.
 */

import { DESIGN_H, DESIGN_W, ctx } from '../platform';
import { activeTrackId } from '../track';
import { trackById } from '../tracks';
import { project } from './camera';
import { clipToBoard, drawBoardGround, drawBoat, drawGroundSurface } from './scenery';
import { surfaceFor } from './surface';
import { chimneys, freeGround, groundIsFree } from './props';

/** Seconds since the circuit loaded. Drives every phase below. */
let elapsed = 0;

/**
 * Deterministic per-item jitter, so two boats never bob in lockstep. Seeded off
 * the item's own index rather than a random number, which keeps a circuit
 * looking identical every time it is loaded.
 */
function phase(index: number): number {
  const raw = Math.sin(index * 12.9898) * 43758.5453;
  return (raw - Math.floor(raw)) * Math.PI * 2;
}

export function resetLivingWater(): void {
  elapsed = 0;
}

export function updateLivingWater(dt: number): void {
  elapsed += dt;
}

/**
 * Boats are under way, not at anchor.
 *
 * They used to drift on a slow figure-of-eight — a few units each way on two
 * periods — to avoid needing any wrapping logic. That was the wrong trade. At
 * that amplitude a boat covers less ground in ten seconds than the ripple tile
 * under it, so what it reads as is a sprite that is stuck and twitching, and
 * "the boats are far too slow" is exactly what it looks like.
 *
 * Now each one holds its heading and travels, at a speed that crosses the board
 * in roughly half a minute — six to nine times the drift of the water, which is
 * the ratio that makes it obvious a boat is moving through the water rather
 * than with it. When it runs off one edge it comes back on the other.
 */
const BOAT_SPEEDS = [27, 34, 22, 30, 25, 38, 20];

/** Back onto the board from the far side, with a margin so nothing pops. */
function wrap(value: number, span: number): number {
  const total = span + 120;
  return (((value + 60) % total) + total) % total - 60;
}

/** The wake: a short tapered streak off the transom, strongest when moving. */
function drawWake(x: number, y: number, size: number, angle: number, speed: number): void {
  const strength = Math.min(1, Math.abs(speed) * 1.4);
  if (strength < 0.05) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.3 * strength;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  // A wedge behind the transom, widening as it falls away astern.
  ctx.moveTo(-13 * size, -3.4 * size);
  ctx.lineTo(-13 * size - 34 * size * strength, -7 * size);
  ctx.lineTo(-13 * size - 34 * size * strength, 7 * size);
  ctx.lineTo(-13 * size, 3.4 * size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Gulls.
 *
 * Two of them, crossing on long independent periods. They are the only thing
 * here that travels the whole width of the board, which is what makes the water
 * read as open space rather than as a backdrop — and being above the plane,
 * they are drawn without projection so they pass in front of everything.
 */
const GULLS = 2;

function drawGulls(): void {
  for (let i = 0; i < GULLS; i++) {
    const period = 19 + i * 7;
    const t = ((elapsed + i * 11) % period) / period;
    // Offscreen for most of the cycle, so a gull is an event rather than a loop.
    if (t > 0.55) continue;

    const travel = t / 0.55;
    const x = -30 + travel * (DESIGN_W + 60);
    const y = DESIGN_H * (0.16 + i * 0.42) + Math.sin(elapsed * 0.9 + i) * 14;
    const flap = Math.sin(elapsed * 7 + i * 2) * 0.5 + 0.5;

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#F2EFE6';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    // Two strokes meeting at the body: a gull at this size is a pair of wings.
    ctx.beginPath();
    ctx.moveTo(x - 6, y + flap * 3.2);
    ctx.quadraticCurveTo(x - 2.5, y - 1.4, x, y);
    ctx.quadraticCurveTo(x + 2.5, y - 1.4, x + 6, y + flap * 3.2);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * The ground and everything resting on it, drawn *under* the cached layer.
 *
 * The boats go under it rather than over it now that they travel. A moored boat
 * could be parked in a gap and left there; one that crosses the whole board will
 * sooner or later pass a fold of the circuit, and drawn on top it would slide
 * across the tarmac with traffic on it. Underneath, the deck simply hides it and
 * gives it back a few seconds later — which at this scale reads as a boat
 * passing behind the causeway, and needs no routing, no per-track clearance and
 * no special cases.
 */
export function drawGroundLayer(): void {
  drawBoardGround();

  ctx.save();
  clipToBoard();
  drawGroundSurface(elapsed);

  // Boats and buoys belong to a sea. On sand they would be absurd, so a surface
  // that is not afloat simply gets none — the decor stays declared per track and
  // is ignored, which means a circuit can be moved between worlds without
  // rewriting its scenery.
  if (!surfaceFor(activeTrackId).afloat) {
    ctx.restore();
    return;
  }

  const decor = trackById(activeTrackId).decor;

  decor.boats.forEach(([x, y, size, angle], index) => {
    const travelled = elapsed * BOAT_SPEEDS[index % BOAT_SPEEDS.length];
    const heel = Math.sin(elapsed * 0.7 + phase(index)) * 0.035;
    const bob = Math.sin(elapsed * 1.5 + phase(index)) * 0.8;
    const point = project(
      wrap(x + Math.cos(angle) * travelled, DESIGN_W),
      wrap(y + Math.sin(angle) * travelled, DESIGN_H) + bob
    );
    drawWake(point.x, point.y, size * point.scale, angle + heel, 0.55);
    drawBoat(point.x, point.y, size * point.scale, angle + heel);
  });

  decor.buoys.forEach(([x, y], index) => {
    const p = phase(index + 97);
    const bob = Math.sin(elapsed * 1.3 + p) * 1.6;
    const point = project(x, y + bob * 0.4);
    const lean = Math.sin(elapsed * 1.1 + p) * 0.22;

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(lean);
    ctx.fillStyle = 'rgba(240,231,204,0.75)';
    ctx.beginPath();
    ctx.arc(0, 0, 2.2 * point.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(232,112,79,0.85)';
    ctx.beginPath();
    ctx.arc(0, -2.8 * point.scale, 1.2 * point.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  ctx.restore();
}

/** What flies over the top of the scene rather than floating in it. */
/**
 * Crabs.
 *
 * The sand looked right and looked dead, and a ground with nothing alive on it
 * reads as a diagram whatever material is on it. A crab is the cheapest possible
 * answer: four pixels of body, a scuttle that stops and starts, and the sudden
 * dart is the whole trick — the eye catches a thing that was still and then was
 * not far better than it catches anything moving steadily.
 *
 * They run in bursts on their own clocks, between two points they keep coming
 * back to, so no crab ever wanders off the board or needs to be put back.
 */
const CRABS = 9;
/** How far a crab may bolt from home. Kept short so it cannot reach the road. */
const CRAB_DASH = 16;

function drawCrabs(): void {
  // Homes come from the measured open ground, and only from the parts of it
  // deep enough that a full-length dash still lands clear of the tarmac. They
  // used to be hashed straight out of the design area, which is why they were
  // running across the racing line.
  const ground = freeGround().filter(
    (spot) => spot.clearance > CRAB_DASH + 14 && groundIsFree(spot.x, spot.y, CRAB_DASH)
  );
  if (ground.length === 0) return;

  for (let i = 0; i < CRABS; i++) {
    const p = phase(i * 3 + 5);
    const home = ground[Math.floor((p / (Math.PI * 2)) * ground.length) % ground.length];
    const homeX = home.x;
    const homeY = home.y;

    // Bursts: mostly still, then a quick dash and a stop.
    const period = 5.5 + (i % 4) * 1.7;
    const t = ((elapsed + i * 2.3) % period) / period;
    const dash = t < 0.22 ? Math.sin((t / 0.22) * Math.PI) : 0;
    const heading = p + Math.floor((elapsed + i * 2.3) / period) * 2.4;
    const reach = CRAB_DASH;

    const x = homeX + Math.cos(heading) * reach * dash;
    const y = homeY + Math.sin(heading) * reach * dash * 0.6;
    const point = project(x, y);
    const size = 1.15 * point.scale;
    // Legs scrabble only while it is moving.
    const scrabble = dash > 0.02 ? Math.sin(elapsed * 34 + i) * 1.1 : 0;

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.fillStyle = 'rgba(70,50,28,0.34)';
    ctx.beginPath();
    ctx.ellipse(1.2, 1.6, 3.4 * size, 2 * size, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#8A4A2E';
    ctx.lineWidth = 0.9 * size;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      for (let leg = -1; leg <= 1; leg++) {
        ctx.beginPath();
        ctx.moveTo(0, leg * 1.1 * size);
        ctx.lineTo(side * (3.4 + scrabble) * size, leg * 2.4 * size + scrabble * 0.4);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#B4593A';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3 * size, 2.2 * size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#D4785A';
    ctx.beginPath();
    ctx.ellipse(-0.6 * size, -0.6 * size, 1.6 * size, 1 * size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Smoke.
 *
 * Plumes rise from whatever chimneys the prop scatter put down, lean with an
 * imagined wind, spread and fade. Each puff is one circle; the plume is a dozen
 * of them at staggered ages, which is enough because smoke has no edges to get
 * wrong.
 */
const PUFFS = 11;

function drawSmoke(): void {
  for (const [index, stack] of chimneys().entries()) {
    // The lip of the stack, in the same units the prop was drawn at.
    const base = project(stack.x, stack.y);
    const lip = { x: base.x + 4.2 * stack.size * base.scale, y: base.y - 21 * stack.size * base.scale };
    const seed = phase(index * 13 + 3);

    for (let i = 0; i < PUFFS; i++) {
      const age = ((elapsed * 0.34 + i / PUFFS + seed) % 1);
      const rise = age * 46 * stack.size * base.scale;
      const lean = age * age * 26 * stack.size * base.scale;
      const radius = (2.4 + age * 9) * stack.size * base.scale;
      const alpha = 0.30 * (1 - age) * Math.min(1, age * 6);
      if (alpha <= 0.004) continue;
      ctx.fillStyle = `rgba(206,201,192,${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(
        lip.x + lean + Math.sin(age * 7 + seed) * 2.4 * base.scale,
        lip.y - rise,
        radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}

/** What moves above the ground rather than on it. */
export function drawLivingWater(): void {
  const life = surfaceFor(activeTrackId).life;
  if (life === 'none') return;
  ctx.save();
  clipToBoard();
  if (life === 'harbour') drawGulls();
  else if (life === 'crabs') drawCrabs();
  else if (life === 'smoke') drawSmoke();
  ctx.restore();
}

/** Car sprites: one shared top-down shape, restyled per vehicle. */

import { shakeOffsetX, shakeOffsetY } from '../feel';
import { ctx } from '../platform';
import { PLAYER_MAX_SPEED } from '../config';
import { tuning } from '../difficulty';
import { aiCars, baseCruiseSpeed, player } from '../state';
import { COLORS } from '../theme';
import { forwardPathDistance, sampleAtDistance } from '../track';
import type { AiCar, VehicleStyle } from '../types';
import { CAR_BODY_DEPTH, CAR_SHADOW_DISTANCE, SHADOW_X, SHADOW_Y, localLight } from './light';
import { roundRect } from './primitives';
import { CAR_LENGTH, CAR_WIDTH, vehicleSprite } from './sprites';
import { project, projectedHeading } from './camera';

const PLAYER_STYLE: VehicleStyle = {
  body: COLORS.player,
  cabin: COLORS.playerLight,
  window: COLORS.window,
  lights: '#FFE6A4',
  stripe: COLORS.playerStripe,
  side: '#96271B',
  rim: '#FFC9B2'
};

const AI_STYLE: VehicleStyle = {
  body: COLORS.ai,
  cabin: COLORS.aiLight,
  window: COLORS.aiWindow,
  lights: '#DCF4FF',
  stripe: null,
  side: '#1B4769',
  rim: '#7FD4F5'
};

function drawVehicle(
  distance: number,
  laneIndex: number,
  style: VehicleStyle,
  alpha = 1,
  indicatorDirection = 0,
  indicatorOn = false,
  spriteKey = '',
  swell = 1
): void {
  const plane = sampleAtDistance(distance, laneIndex);
  // Project onto the camera plane: position, screen heading and depth scale.
  const projected = project(plane.x, plane.y);
  const p = {
    x: projected.x,
    y: projected.y,
    angle: projectedHeading(plane.x, plane.y, plane.angle)
  };
  const depthScale = projected.scale;

  const sprite = spriteKey ? vehicleSprite(spriteKey, style) : null;
  if (sprite) {
    drawSpriteVehicle(p, sprite, style, alpha, indicatorDirection, indicatorOn, swell * depthScale);
    return;
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(depthScale, depthScale);
  ctx.rotate(p.angle);
  ctx.translate(-p.x, -p.y);

  // Cast shadow first, offset in screen space so it stays put through a corner.
  // A hard offset silhouette beats a blur here: it is crisper and much cheaper.
  ctx.save();
  ctx.globalAlpha = alpha * 0.32;
  ctx.translate(p.x + SHADOW_X * CAR_SHADOW_DISTANCE, p.y + SHADOW_Y * CAR_SHADOW_DISTANCE);
  ctx.rotate(p.angle);
  ctx.fillStyle = '#050D13';
  roundRect(ctx, -7.8, -4.0, 15.6, 8.0, 2.8);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);

  // Side face, offset down-light, gives the body its thickness.
  const depth = localLight(p.angle, CAR_BODY_DEPTH);
  ctx.fillStyle = style.side;
  roundRect(ctx, -7.8 + depth.x, -4.0 + depth.y, 15.6, 8.0, 2.8);
  ctx.fill();

  // Top face.
  ctx.fillStyle = style.body;
  roundRect(ctx, -7.8, -4.0, 15.6, 8.0, 2.8);
  ctx.fill();

  // Rim light along the lit edge: the cue that separates a box from a rectangle.
  ctx.save();
  ctx.globalAlpha = alpha * 0.5;
  ctx.strokeStyle = style.rim;
  ctx.lineWidth = 0.7;
  roundRect(ctx, -7.55 - depth.x * 0.35, -3.75 - depth.y * 0.35, 15.1, 7.5, 2.6);
  ctx.stroke();
  ctx.restore();

  // Cabin, raised again above the body.
  const cabinDepth = localLight(p.angle, CAR_BODY_DEPTH * 0.6);
  ctx.fillStyle = style.side;
  roundRect(ctx, -2.7 + cabinDepth.x, -3.05 + cabinDepth.y, 6.9, 6.1, 1.9);
  ctx.fill();
  ctx.fillStyle = style.cabin;
  roundRect(ctx, -2.7, -3.05, 6.9, 6.1, 1.9);
  ctx.fill();

  ctx.fillStyle = style.window;
  roundRect(ctx, -1.35, -2.3, 4.2, 4.6, 1.2);
  ctx.fill();

  // Glass highlight, on the lit side of the window.
  ctx.save();
  ctx.globalAlpha = alpha * 0.55;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, -1.1 - cabinDepth.x, -2.05 - cabinDepth.y, 1.7, 4.0, 0.8);
  ctx.fill();
  ctx.restore();

  if (style.stripe) {
    ctx.fillStyle = style.stripe;
    roundRect(ctx, -6.7, -0.55, 10.6, 1.1, 0.55);
    ctx.fill();
  }

  ctx.fillStyle = style.lights;
  ctx.fillRect(6.15, -2.75, 1.15, 1.8);
  ctx.fillRect(6.15, 0.95, 1.15, 1.8);

  if (indicatorDirection !== 0 && indicatorOn) {
    ctx.fillStyle = '#FFD55C';
    const indicatorY = indicatorDirection > 0 ? 3.65 : -4.85;
    ctx.fillRect(2.8, indicatorY, 3.2, 1.4);
    ctx.fillRect(-5.5, indicatorY, 2.6, 1.4);
  }
  ctx.restore();
  ctx.restore();
}

/** Sprite playback: one shadow blit, one body blit, plus any indicator. */
function drawSpriteVehicle(
  p: { x: number; y: number; angle: number },
  sprite: { image: WxCanvas; shadow: WxCanvas },
  style: VehicleStyle,
  alpha: number,
  indicatorDirection: number,
  indicatorOn: boolean,
  swell = 1
): void {
  const length = CAR_LENGTH * swell;
  const width = CAR_WIDTH * swell;
  const halfL = length / 2;
  const halfW = width / 2;

  ctx.save();
  ctx.globalAlpha = alpha * 0.34;
  ctx.translate(p.x + SHADOW_X * CAR_SHADOW_DISTANCE, p.y + SHADOW_Y * CAR_SHADOW_DISTANCE);
  ctx.rotate(p.angle);
  ctx.drawImage(sprite.shadow as unknown as CanvasImageSource, -halfL, -halfW, length, width);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.drawImage(sprite.image as unknown as CanvasImageSource, -halfL, -halfW, length, width);

  if (indicatorDirection !== 0 && indicatorOn) {
    ctx.fillStyle = '#FFD55C';
    const indicatorY = indicatorDirection > 0 ? halfW - 0.4 : -halfW - 1.0;
    ctx.fillRect(2.8, indicatorY, 3.2, 1.4);
    ctx.fillRect(-5.5, indicatorY, 2.6, 1.4);
  }
  ctx.restore();
  void style;
}

function drawAiCar(car: AiCar): void {
  const indicatorOn = car.state === 'WARNING' && Math.floor(car.stateElapsed * 30) % 2 === 0;
  drawVehicle(car.distance, car.visualLane, AI_STYLE, 1, car.direction, indicatorOn, 'ai');
}

/** A destroyed car briefly leaves a scorch mark so the kill reads on screen. */
function drawWreck(car: AiCar): void {
  const plane = sampleAtDistance(car.distance, car.visualLane);
  const p = project(plane.x, plane.y);
  const t = Math.max(0, Math.min(1, car.wreck));
  ctx.save();
  ctx.globalAlpha = t;
  ctx.translate(p.x, p.y);
  const radius = (5 + (1 - t) * 12) * p.scale;
  ctx.fillStyle = 'rgba(255,150,72,0.55)';
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(46,30,26,0.75)';
  ctx.beginPath(); ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/**
 * In The Zone marks a slipstream box trailing the car. It is drawn as a bar in
 * the lane rather than a shape on the road so it stays readable at speed.
 */
function drawZone(car: AiCar): void {
  const gap = forwardPathDistance(player.distance, car.distance);
  const engaged = gap > 13 && gap < 66 && Math.abs(player.visualLane - car.visualLane) < 0.7;

  ctx.save();
  for (let offset = 16; offset <= 62; offset += 8) {
    const plane = sampleAtDistance(car.distance - offset, car.visualLane);
    const p = project(plane.x, plane.y);
    ctx.globalAlpha = engaged ? 0.55 : 0.26;
    ctx.fillStyle = engaged ? COLORS.accentLight : COLORS.accent;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.8 * p.scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fill meter rides just above the marked car.
  const headPlane = sampleAtDistance(car.distance, car.visualLane);
  const head = project(headPlane.x, headPlane.y);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(8,17,25,0.7)';
  ctx.fillRect(head.x - 9, head.y - 11, 18, 3);
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(head.x - 9, head.y - 11, 18 * Math.max(0, Math.min(1, car.zoneFill)), 3);
  ctx.restore();
}

function playerAlpha(): number {
  if (player.invincible > 0) return Math.floor(player.invincible * 12) % 2 === 0 ? 0.25 : 1;
  return 1;
}

/** The armed car gets a halo so the "contact is a kill now" state is unmissable. */
function drawFireballAura(): void {
  if (player.fireball <= 0) return;
  const plane = sampleAtDistance(player.distance, player.visualLane);
  const p = project(plane.x, plane.y);
  const pulse = 0.72 + Math.sin(player.travelled * 0.06) * 0.28;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.scale, p.scale);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = 'rgba(255,164,72,0.75)';
  ctx.beginPath(); ctx.arc(0, 0, 11 + pulse * 3, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = 'rgba(255,226,150,0.85)';
  ctx.beginPath(); ctx.arc(0, 0, 7 + pulse * 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/**
 * Afterimage.
 *
 * Faded copies of the car sprite were the wrong tool: a detailed image at low
 * opacity turns to mush against the road instead of reading as motion. The
 * trail is now drawn as a solid tapered ribbon along the path the car actually
 * took — wide and saturated at the tail, narrowing into a bright core near the
 * car — with only a couple of sprite ghosts left on top for body.
 *
 * Every dimension scales with speed: length, width, opacity and the number of
 * ghosts. At cruise there is nothing at all.
 */
/**
 * How many samples the smear spans, from cruise to flat out.
 *
 * The count used to be a flat 9, which made the trail barely change with speed:
 * the only thing that grew was the gap between samples, and that tops out
 * quickly. Scaling the segment count as well is what makes the tail visibly
 * stretch as the car winds up — at full speed it reaches nearly three times as
 * far back as it did. TRAIL_LENGTH in player.ts has to cover
 * TRAIL_MAX_SEGMENTS * TRAIL_STRIDE, or the smear runs out of history.
 */
const TRAIL_MIN_SEGMENTS = 8;
const TRAIL_MAX_SEGMENTS = 26;
const TRAIL_STRIDE = 2;
const GHOSTS_MAX = 3;

/**
 * How much trail there is, from none at the opening speed to full at the cap.
 *
 * Measured against absolute speed, not against the car's own cruise target.
 * The old version divided by the *current* target, which asks "how hard are you
 * pushing past your own cruise" rather than "how fast are you" — so a 60-combo
 * car doing 380 scored 0.28 while a standing start on the throttle at 185
 * scored 0.45, and the smear was shorter at high speed than at low. That is the
 * whole reason the trail read as absent once the car got quick.
 */
function trailIntensity(): number {
  const base = baseCruiseSpeed();
  const span = PLAYER_MAX_SPEED * tuning.player - base;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (player.speed - base) / span));
}

function drawAfterimage(): void {
  const trail = player.trail;
  if (trail.length < 4 || player.state === 'CRASHED') return;

  const intensity = trailIntensity();
  if (intensity <= 0.04) return;

  // Sample the recorded path, newest first. The car covers more ground per
  // frame the faster it goes, so a fixed span already lengthens with speed;
  // scaling the count on top is what makes that growth actually read.
  const stride = TRAIL_STRIDE;
  const segments = Math.round(
    TRAIL_MIN_SEGMENTS + intensity * (TRAIL_MAX_SEGMENTS - TRAIL_MIN_SEGMENTS)
  );
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < segments; i++) {
    const index = trail.length - 1 - i * stride;
    if (index < 0) break;
    const sample = trail[index];
    const plane = sampleAtDistance(sample.distance, sample.lane);
    points.push(project(plane.x, plane.y));
  }
  if (points.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Outer ribbon: the body colour, widest and most opaque behind the car.
  for (let i = 0; i < points.length - 1; i++) {
    const t = i / (points.length - 1);
    ctx.globalAlpha = intensity * 0.62 * Math.pow(1 - t, 0.85);
    ctx.strokeStyle = PLAYER_STYLE.body;
    ctx.lineWidth = CAR_WIDTH * (0.92 - t * 0.55);
    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(points[i + 1].x, points[i + 1].y);
    ctx.stroke();
  }

  // Inner core, drawn additively. Additive blending is what separates a glow
  // from a paint stroke: the trail brightens whatever is under it instead of
  // covering it, which is why it reads instantly against dark asphalt.
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < points.length - 1; i++) {
    const t = i / (points.length - 1);
    ctx.globalAlpha = intensity * 0.85 * Math.pow(1 - t, 1.4);
    ctx.strokeStyle = '#FF7A46';
    ctx.lineWidth = CAR_WIDTH * (0.5 - t * 0.34);
    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(points[i + 1].x, points[i + 1].y);
    ctx.stroke();
  }
  for (let i = 0; i < points.length - 1; i++) {
    const t = i / (points.length - 1);
    ctx.globalAlpha = intensity * 0.8 * Math.pow(1 - t, 2.2);
    ctx.strokeStyle = '#FFE7B8';
    ctx.lineWidth = CAR_WIDTH * (0.2 - t * 0.15);
    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(points[i + 1].x, points[i + 1].y);
    ctx.stroke();
  }
  ctx.restore();

  // A few solid ghosts on top, so the tail still has a car in it.
  const ghosts = 1 + Math.round(intensity * (GHOSTS_MAX - 1));
  for (let ghost = ghosts; ghost >= 1; ghost--) {
    const index = trail.length - 1 - ghost * stride * 2;
    if (index < 0) continue;
    const sample = trail[index];
    const fade = 1 - ghost / (ghosts + 1);
    drawVehicle(
      sample.distance,
      sample.lane,
      PLAYER_STYLE,
      intensity * 0.55 * fade,
      0,
      false,
      'player',
      1 + intensity * 0.16 * (ghost / ghosts)
    );
  }
}

/**
 * Shake strength in design units, relative to the raw value from feel.ts. The
 * car is 16.4 units long, so the raw 9 of a crash would throw it more than half
 * its own length; a quarter of that is a body rattle rather than a teleport.
 */
const CAR_SHAKE = 0.26;

export function drawCars(): void {
  // Perspective means depth order matters: draw the far side of the board first.
  const ordered = aiCars
    .map((car) => {
      const plane = sampleAtDistance(car.distance, car.visualLane);
      return { car, depth: project(plane.x, plane.y).depth };
    })
    .sort((a, b) => b.depth - a.depth);

  for (const { car } of ordered) {
    if (!car.alive) {
      if (car.wreck > 0) drawWreck(car);
      continue;
    }
    if (car.hasZone) drawZone(car);
    drawAiCar(car);
  }
  // The impact shake belongs to the red car, not to the frame. Applied here it
  // rattles the player and its trail while the road, the traffic and the HUD
  // hold still, which is what makes it read as a collision.
  const shakeX = shakeOffsetX() * CAR_SHAKE;
  const shakeY = shakeOffsetY() * CAR_SHAKE;
  const shaking = shakeX !== 0 || shakeY !== 0;
  if (shaking) {
    ctx.save();
    ctx.translate(shakeX, shakeY);
  }
  drawAfterimage();
  drawFireballAura();
  drawVehicle(player.distance, player.visualLane, PLAYER_STYLE, playerAlpha(), 0, false, 'player');
  if (shaking) ctx.restore();
}

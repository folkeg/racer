/** In-race HUD: combo, clock, score, objective bar, banners and the control bar. */

import { PLAYER_TIER_BOOST_DURATION } from '../config';
import { CONTROLS, STICK, laneButtonFlash, steer } from '../controls';
import { modeById } from '../modes';
import { ctx, DESIGN_W } from '../platform';
import { run } from '../run';
import { inputState, player } from '../state';
import { countdownActive, countdownLabel } from '../countdown';
import { onboardingActive, onboardingState } from '../onboarding';
import { COLORS } from '../theme';
import { roundRect } from './primitives';

export const BACK_BUTTON = { x: DESIGN_W - 46, y: 9, w: 34, h: 34 };

/**
 * The HUD carries the best streak only. The running count pops on the car
 * itself, so a crash never wipes the number the player is chasing.
 */
function drawComboPill(): void {
  ctx.fillStyle = 'rgba(8,17,25,0.66)';
  roundRect(ctx, 12, 9, 66, 34, 11);
  ctx.fill();

  ctx.fillStyle = 'rgba(247,244,234,0.5)';
  ctx.font = '700 6.5px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BEST', 45, 19);

  ctx.fillStyle = player.bestCombo > 0 ? COLORS.accentLight : COLORS.text;
  const tierPulse = player.tierBoostElapsed > 0
    ? 1 + Math.sin((PLAYER_TIER_BOOST_DURATION - player.tierBoostElapsed) * Math.PI * 8) * 0.08
    : 1;
  ctx.save();
  ctx.translate(45, 33);
  ctx.scale(tierPulse, tierPulse);
  ctx.font = '900 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`x${player.bestCombo}`, 0, 3);
  ctx.restore();
}

/** Three, two, one. Drawn over a dimmed world that is genuinely holding still. */
function drawCountdown(): void {
  if (!countdownActive()) return;
  const label = countdownLabel();

  ctx.save();
  ctx.fillStyle = 'rgba(8,17,25,0.42)';
  ctx.fillRect(0, 0, DESIGN_W, 844);

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.accentLight;
  ctx.font = '900 116px monospace';
  ctx.fillText(label, DESIGN_W / 2, 420);

  ctx.fillStyle = 'rgba(247,244,234,0.7)';
  ctx.font = '900 13px sans-serif';
  ctx.fillText('准备', DESIGN_W / 2, 462);
  ctx.restore();
}

function drawClockAndScore(): void {
  const mode = modeById(run.modeId);

  if (Number.isFinite(run.timeRemaining)) {
    const urgent = run.timeRemaining <= 10;
    ctx.fillStyle = 'rgba(8,17,25,0.66)';
    roundRect(ctx, 84, 9, 62, 34, 11);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = urgent ? '#FF7A6B' : COLORS.text;
    ctx.font = '900 18px monospace';
    ctx.fillText(run.timeRemaining.toFixed(1), 115, 32);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.accentLight;
  ctx.font = '900 17px monospace';
  ctx.fillText(String(run.score), DESIGN_W - 54, 27);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '700 7px sans-serif';
  ctx.fillText(mode.scoreUnit, DESIGN_W - 54, 38);
  ctx.textAlign = 'center';
}

function drawBackButton(): void {
  roundRect(ctx, BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h, 12);
  ctx.fillStyle = COLORS.button;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = COLORS.buttonEdge;
  ctx.stroke();

  // Two bars: a pause glyph, which reads as "stop this run" without any text.
  ctx.fillStyle = COLORS.text;
  ctx.fillRect(BACK_BUTTON.x + 11, BACK_BUTTON.y + 10, 4, 14);
  ctx.fillRect(BACK_BUTTON.x + 19, BACK_BUTTON.y + 10, 4, 14);
}

function drawObjectiveBar(): void {
  if (run.progress < 0) return;
  const x = 12;
  const y = 62;
  const w = DESIGN_W - 24;
  const h = 6;

  roundRect(ctx, x, y, w, h, 3);
  ctx.fillStyle = 'rgba(8,17,25,0.66)';
  ctx.fill();

  const filled = Math.max(0, Math.min(1, run.progress));
  if (filled > 0) {
    roundRect(ctx, x, y, w * filled, h, 3);
    ctx.fillStyle = COLORS.accent;
    ctx.fill();
  }
}

function drawBanner(): void {
  if (!run.banner || run.bannerTimer <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, run.bannerTimer * 2.4);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.accentLight;
  ctx.font = '900 26px sans-serif';
  ctx.fillText(run.banner, DESIGN_W / 2, 372);
  ctx.restore();
}

function drawCrashBanner(): void {
  if (player.state !== 'CRASHED') return;
  ctx.fillStyle = 'rgba(255,79,82,0.92)';
  roundRect(ctx, 122, 390, 146, 54, 16);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 21px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CRASH!', 195, 420);
  ctx.font = '700 9px sans-serif';
  ctx.fillText('COMBO RESET', 195, 437);
}

/**
 * Points at whichever control the player has not tried yet. Drawn above the
 * control bar so it never covers the buttons it is describing.
 */
function drawOnboarding(): void {
  if (!onboardingActive()) return;
  const hints = onboardingState();

  ctx.save();
  // A gentle pulse, because a static label reads as decoration.
  ctx.globalAlpha = 0.78 + Math.sin(player.travelled * 0.05) * 0.2;
  ctx.textAlign = 'center';

  // Each hint sits on its own backing: the road underneath is busy and light,
  // and unbacked text on it was unreadable.
  const hint = (text: string, cx: number, cy: number, size: number, color: string): void => {
    ctx.font = `900 ${size}px sans-serif`;
    const width = ctx.measureText(text).width + 20;
    roundRect(ctx, cx - width / 2, cy - size * 0.9, width, size * 1.8, size);
    ctx.fillStyle = 'rgba(8,17,25,0.86)';
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillText(text, cx, cy + size * 0.36);
  };

  // Kept hugging the control bar, which moved down when the buttons shrank.
  if (hints.lane) hint('摇杆推住连续变道', 96, 706, 11, COLORS.accentLight);
  if (hints.throttle) hint('按住加速', 311, 706, 11, COLORS.accentLight);
  if (hints.lane || hints.throttle) hint('超车加 Combo · 撞车清零', DESIGN_W / 2, 678, 10, COLORS.text);

  ctx.restore();
}

export function drawHud(): void {
  drawComboPill();
  drawClockAndScore();
  drawBackButton();
  drawObjectiveBar();
  drawCrashBanner();
  drawBanner();
  drawOnboarding();
  drawCountdown();
}

/**
 * A round arcade button, built the same way the stick's base is.
 *
 * The bar used to be flat rounded rectangles with a hairline stroke, which read
 * as placeholders beside a scene that has lighting and cast shadows. These are
 * the same object as the stick's dish — shadow, side wall, lit top face, rim —
 * so the whole strip reads as one piece of hardware rather than as a stick that
 * happens to sit next to some tiles.
 */
function roundButton(cx: number, cy: number, radius: number, active: boolean): void {
  ctx.save();

  ctx.beginPath();
  ctx.arc(cx, cy + 6, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(3,8,13,0.42)';
  ctx.fill();

  // Side wall: the same disc pushed down, so the button has a height.
  ctx.beginPath();
  ctx.arc(cx, cy + 3.5, radius, 0, Math.PI * 2);
  ctx.fillStyle = active ? '#0E4B50' : '#0B141C';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  const face = ctx.createLinearGradient(0, cy - radius, 0, cy + radius);
  if (active) {
    face.addColorStop(0, '#8AF0E6');
    face.addColorStop(1, '#2B9AA2');
  } else {
    face.addColorStop(0, '#31485C');
    face.addColorStop(1, '#131F2A');
  }
  ctx.fillStyle = face;
  ctx.fill();

  ctx.lineWidth = 1.4;
  ctx.strokeStyle = active ? 'rgba(214,255,250,0.9)' : 'rgba(247,244,234,0.3)';
  ctx.stroke();

  // Inner ring: what makes a blank disc read as a button you press rather than
  // a dot. It is also all the throttle has now that its label is gone.
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.68, 0, Math.PI * 2);
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = active ? 'rgba(255,255,255,0.34)' : 'rgba(247,244,234,0.12)';
  ctx.stroke();

  ctx.restore();
}

/**
 * A chevron rather than a solid triangle: lighter, and it reads as a hint.
 *
 * `direction` is the lane-index delta, where +1 is the car's right, so the
 * negative one is the arrow that points left. Deriving the glyph from the same
 * number the button sends is what keeps the icon honest: when the mapping was
 * corrected, this flipped with it instead of having to be remembered.
 */
function drawChevron(cx: number, cy: number, direction: number, size: number, color: string, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const tip = direction < 0 ? -size * 0.5 : size * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - tip, cy - size * 0.72);
  ctx.lineTo(cx + tip, cy);
  ctx.lineTo(cx - tip, cy + size * 0.72);
  ctx.stroke();
  ctx.restore();
}

/**
 * The stick, drawn as if you were standing over it rather than looking at it
 * side on.
 *
 * The first version put the ball straight above the centre of the dish, which
 * is what you would see from directly in front — but the dish is an ellipse,
 * which is what you see from above. Those two disagreed, and the eye resolves a
 * contradiction like that as "flat". Everything here exists to make them agree
 * on one viewpoint: a cabinet stick seen from where the player stands, leaning
 * back towards them.
 *
 * Four cues, in order of how much they carry:
 *
 *   shadow   The ball drops a shadow onto the dish, offset the way the ball
 *            leans. Nothing else locates one object above another as cheaply.
 *   overlap  The ball is large and covers part of the near rim, so it is
 *            unambiguously in front of the base rather than beside it.
 *   rim      The dish is drawn twice, the lower copy darker, which gives the
 *            base a thickness instead of being a painted circle.
 *   taper    The shaft is wider where it leaves the dish than where it meets
 *            the ball, which is foreshortening.
 */
function drawStick(): void {
  const { cx, cy, radius } = STICK;
  const lean = steer.offset;
  const pushed = steer.direction !== 0;

  // A flatter ellipse than a true top-down circle: this is the angle the whole
  // control is drawn at, and the ball's position below is derived from it.
  const dishRY = radius * 0.52;

  ctx.save();

  // Base, drawn as a slab: a dark copy pushed down is its side wall.
  ctx.beginPath();
  ctx.ellipse(cx, cy + 9, radius, dishRY, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(3,8,13,0.5)';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, radius, dishRY, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#0C1620';
  ctx.fill();

  // Top face.
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, dishRY, 0, 0, Math.PI * 2);
  const face = ctx.createLinearGradient(0, cy - dishRY, 0, cy + dishRY);
  face.addColorStop(0, '#2C4255');
  face.addColorStop(1, '#101D28');
  ctx.fillStyle = face;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(247,244,234,0.26)';
  ctx.stroke();

  // The well the shaft rises out of.
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, radius * 0.4, dishRY * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(2,6,10,0.6)';
  ctx.fill();

  const ballR = radius * 0.5;
  // Leaning swings the ball across the dish and drops it, the way the top of a
  // real shaft travels on an arc rather than sliding along a rail.
  const ballX = cx + lean * (radius * 0.66);
  const ballY = cy - (ballR + 6) + Math.abs(lean) * 7;
  const baseX = cx + lean * (radius * 0.2);

  // Shadow on the dish, thrown opposite the light and squashed to lie flat.
  ctx.beginPath();
  ctx.ellipse(ballX + 5, cy + 4, ballR * 0.82, ballR * 0.34, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(2,6,10,0.45)';
  ctx.fill();

  // Shaft: wider at the dish than at the ball.
  ctx.beginPath();
  ctx.moveTo(baseX - 8.5, cy + 2);
  ctx.lineTo(ballX - ballR * 0.34, ballY);
  ctx.lineTo(ballX + ballR * 0.34, ballY);
  ctx.lineTo(baseX + 8.5, cy + 2);
  ctx.closePath();
  const shaft = ctx.createLinearGradient(baseX - 9, 0, baseX + 9, 0);
  shaft.addColorStop(0, '#4A545B');
  shaft.addColorStop(0.4, '#D2D8DA');
  shaft.addColorStop(1, '#4A545B');
  ctx.fillStyle = shaft;
  ctx.fill();

  // Ball, lit from the top left like the rest of the scene.
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
  const ball = ctx.createRadialGradient(
    ballX - ballR * 0.4, ballY - ballR * 0.45, ballR * 0.1,
    ballX, ballY, ballR
  );
  if (pushed) {
    ball.addColorStop(0, '#F2FFFD');
    ball.addColorStop(0.45, '#7BE0DA');
    ball.addColorStop(1, '#16646B');
  } else {
    ball.addColorStop(0, '#FFFEF8');
    ball.addColorStop(0.45, '#DAD4C6');
    ball.addColorStop(1, '#5C615E');
  }
  ctx.fillStyle = ball;
  ctx.fill();

  // A darker crescent along the lower edge sells it as a sphere rather than a
  // disc: the terminator, where the surface turns away from the light.
  ctx.save();
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(ballX + ballR * 0.3, ballY + ballR * 0.42, ballR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(4,10,16,0.28)';
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(ballX - ballR * 0.33, ballY - ballR * 0.4, ballR * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.fill();

  ctx.restore();
}

export function drawControls(): void {
  drawStick();

  for (const control of CONTROLS) {
    if (control.kind === 'steer') continue;

    const cx = control.x + control.w * 0.5;
    const cy = control.y + control.h * 0.5;
    const radius = control.w * 0.5;
    const active = control.kind === 'throttle'
      ? inputState.throttle
      : laneButtonFlash[control.id as 'left' | 'right'] > 0;

    roundButton(cx, cy, radius, active);

    if (control.kind === 'lane') {
      drawChevron(cx, cy, control.direction, 15,
        active ? '#08323A' : COLORS.text, active ? 0.9 : 0.78);
      continue;
    }

    // The throttle carries no glyph at all now. In Hot Rods it still doubles as
    // the heat gauge, which fills it from the bottom — clipped to the disc so
    // the fill follows the button's own shape.
    if (player.heat > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
      ctx.clip();
      const heatH = radius * 2 * Math.min(1, player.heat);
      ctx.fillStyle = player.heat > 0.75 ? 'rgba(255,110,90,0.5)' : 'rgba(255,181,90,0.32)';
      ctx.fillRect(cx - radius, cy + radius - heatH, radius * 2, heatH);
      ctx.restore();
    }
  }
}

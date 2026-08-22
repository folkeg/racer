/** In-race HUD: combo, clock, score, objective bar, banners and the control bar. */

import { PLAYER_TIER_BOOST_DURATION } from '../config';
import { CONTROL_RADIUS, CONTROLS, laneButtonFlash } from '../controls';
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
  if (hints.lane) hint('点这里换车道', 96, 738, 11, COLORS.accentLight);
  if (hints.throttle) hint('按住加速', 307, 738, 11, COLORS.accentLight);
  if (hints.lane || hints.throttle) hint('超车加 Combo · 撞车清零', DESIGN_W / 2, 708, 10, COLORS.text);

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

function drawLaneArrow(cx: number, cy: number, direction: number, color: string): void {
  // direction +1 is the left-hand lane change, so it draws the left-pointing arrow.
  const tip = direction > 0 ? -15 : 15;
  ctx.beginPath();
  ctx.moveTo(cx + tip, cy);
  ctx.lineTo(cx - tip * 0.6, cy - 15);
  ctx.lineTo(cx - tip * 0.6, cy + 15);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawControls(): void {
  for (const control of CONTROLS) {
    const active = control.kind === 'throttle'
      ? inputState.throttle
      : laneButtonFlash[control.id as 'left' | 'right'] > 0;
    const cx = control.x + control.w * 0.5;
    const cy = control.y + control.h * 0.5;

    roundRect(ctx, control.x, control.y, control.w, control.h, CONTROL_RADIUS);
    ctx.fillStyle = COLORS.button;
    ctx.fill();
    if (active) {
      ctx.fillStyle = COLORS.buttonActive;
      ctx.fill();
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = active ? COLORS.accentLight : COLORS.buttonEdge;
    ctx.stroke();

    const glyph = active ? COLORS.accentLight : COLORS.text;
    if (control.kind === 'lane') {
      drawLaneArrow(cx, cy, control.direction, glyph);
    } else {
      // The throttle doubles as the heat gauge in Hot Rods.
      if (player.heat > 0) {
        const heatH = (control.h - 8) * Math.min(1, player.heat);
        roundRect(ctx, control.x + 4, control.y + control.h - 4 - heatH, control.w - 8, heatH, 12);
        ctx.fillStyle = player.heat > 0.75 ? 'rgba(255,110,90,0.42)' : 'rgba(255,181,90,0.26)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.moveTo(cx, cy - 19);
      ctx.lineTo(cx - 15, cy);
      ctx.lineTo(cx + 15, cy);
      ctx.closePath();
      ctx.fillStyle = glyph;
      ctx.fill();
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAS', cx, cy + 21);
    }
  }
}

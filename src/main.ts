/**
 * 心跳加速-冲刺 — WeChat Mini Game.
 *
 * Entry point: owns the frame loop and switches between the three screens.
 * Everything it calls lives in its own module, so this stays a table of contents.
 *
 * Structure:
 * - One extra-long, smooth, non-crossing six-lane top-down circuit.
 * - Sixteen race modes at three speeds, selected from the menu.
 * - Eighteen black AI cars with readable, telegraphed lane changes.
 * - Overtake -> combo; every ten overtakes raises a permanent speed tier.
 * - What a contact means (crash, kill, nothing) is the active mode's decision.
 * - Two lane buttons and a hold-to-accelerate throttle for touch play; keyboard
 *   arrows plus Space work for browser testing.
 * - Procedural engine, lane-change and overtake audio via WebAudio.
 * - Personal bests in local storage, career total on the WeChat friend ranking.
 */

import { updateAi } from './ai';
import { app, finishRun } from './app';
import { audio } from './audio';
import { frameDelta } from './clock';
import { updateControlFlash } from './controls';
import { updateCountdown } from './countdown';
import { consumeHitStop, updateFeel } from './feel';
import { installInput, releaseAllPointers } from './input';
import { updateOnboarding } from './onboarding';
import { ctx, DPR, offsetX, offsetY, scale, scheduleFrame, VIEW_H, VIEW_W } from './platform';
import { updatePlayer } from './player';
import { drawControls, drawHud } from './render/hud';
import { drawBlackout, drawHazardLane } from './render/overlays';
import { drawFloaters, drawParticles, updateFloaters, updateParticles } from './render/particles';
import { drawSpeedLines } from './render/speedLines';
import { drawStaticScene } from './render/staticLayer';
import { drawCars } from './render/vehicles';
import { runIsOver, updateRun } from './run';
import { drawMenu, updateMenu } from './screens/menu';
import { drawResult, enterResultScreen } from './screens/result';
import { drawTrackSelect } from './screens/trackSelect';
import { detectCollisions, detectOvertakes } from './scoring';
import { installShareMenu } from './share';
import { aiCars, engineSnapshot, inputState, player } from './state';
import { loadMuted } from './storage';

function stepRace(dt: number): void {
  updateControlFlash(dt);

  // Nothing moves until the lights go out.
  if (updateCountdown(dt)) return;

  updateOnboarding(dt);
  updateFeel(dt);
  updateParticles(dt);
  updateFloaters(dt);

  // Hit-stop returns zero simulation time, so the world holds still for a beat
  // while the particles and the shake keep playing.
  const simDt = consumeHitStop(dt);
  if (simDt <= 0) return;

  updateAi(simDt);
  updatePlayer(simDt);
  audio.update(simDt, engineSnapshot());

  const collided = detectCollisions();
  if (!collided) detectOvertakes();

  updateRun(simDt);
}

/** The static scene is blitted first, then only the moving parts are drawn. */
function drawRace(): void {
  drawStaticScene();

  ctx.save();
  // No shake here. An impact used to displace every car, particle and speed line
  // against a road that stayed nailed down, which read as the whole picture
  // sliding rather than as a hit. The shake now moves only the car that was in
  // the collision; see drawCars.
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  drawHazardLane();
  drawSpeedLines();
  drawCars();
  drawParticles();
  drawFloaters();
  ctx.restore();

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  drawBlackout();
  drawHud();
  drawControls();
  ctx.restore();
}

function frame(nowValue?: number): void {
  const now = typeof nowValue === 'number' ? nowValue : Date.now();
  const dt = frameDelta(now);

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  if (app.screen === 'PLAYING') {
    stepRace(dt);
    drawRace();
  } else {
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    if (app.screen === 'MENU') {
      updateMenu(dt);
      drawMenu();
    } else if (app.screen === 'TRACKS') {
      drawTrackSelect();
    } else {
      drawResult();
    }
    ctx.restore();
  }

  // Transition after drawing, so the last frame of the run is shown once.
  if (app.screen === 'PLAYING' && runIsOver()) {
    releaseAllPointers();
    // A crash on the very last frame leaves its noise burst mid-decay; nothing
    // ticks it down once the race stops updating, so cut it here rather than
    // let it ring on into the result screen.
    audio.stopTransients();
    enterResultScreen();
    finishRun();
  }

  scheduleFrame(frame);
}

audio.setMuted(loadMuted());
installInput();
installShareMenu();

if (typeof wx.onHide === 'function') {
  wx.onHide(() => {
    releaseAllPointers();
    audio.suspend();
  });
}
if (typeof wx.onShow === 'function') wx.onShow(() => audio.resume());

scheduleFrame(frame);

/**
 * Exposed on the bundle's global (HarborLoop) for the headless tests and for
 * poking at state from the WeChat devtools console.
 */
export { player, aiCars, inputState };
export { app, startMode, openMenu, openTrackPicker, goBack, retryRun, startDaily, shareForRevive, canRevive } from './app';
export { run } from './run';
export { trackLength, trackScreenBounds } from './track';
export { currentCruiseSpeed, cruiseSpeedForCombo } from './state';
export { MODES, RELEASED_MODES } from './modes';
export { laneButtonFlash } from './controls';
export { debugPointerCount } from './input';
export { feelState } from './feel';
export { activeParticles } from './render/particles';
export { dailyPlan, todayKey } from './daily';
export { renderShareCard } from './shareCard';
export { audio } from './audio';
export { loadMuted, saveMuted } from './storage';
export { onboardingActive, resetOnboarding } from './onboarding';
export { currentStreak, touchStreak } from './streak';
export { countdownActive, countdownRemaining, clearCountdown } from './countdown';
export { setSeed, clearSeed, random, isSeeded } from './rng';
export { bestScore, careerPoints, dailyBestScore, submitDailyBest } from './storage';
export { TRACKS } from './tracks';
export { totalStars, starsFor, modeUnlocked, modeUnlockCost, setUnlockOverride } from './progress';
export { LANE_COUNT, LANE_GAP, ROAD_HALF_WIDTH, KERB_WIDTH } from './config';

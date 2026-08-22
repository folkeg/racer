// GENERATED FILE - do not edit. Source lives in src/; rebuild with `npm run build`.
"use strict";
var HarborLoop = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key2 of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key2) && key2 !== except)
          __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/main.ts
  var main_exports = {};
  __export(main_exports, {
    KERB_WIDTH: () => KERB_WIDTH,
    LANE_COUNT: () => LANE_COUNT,
    LANE_GAP: () => LANE_GAP,
    MODES: () => MODES,
    RELEASED_MODES: () => RELEASED_MODES,
    ROAD_HALF_WIDTH: () => ROAD_HALF_WIDTH,
    TRACKS: () => TRACKS,
    activeParticles: () => activeParticles,
    aiCars: () => aiCars,
    app: () => app,
    audio: () => audio,
    bestScore: () => bestScore,
    canRevive: () => canRevive,
    careerPoints: () => careerPoints,
    clearCountdown: () => clearCountdown,
    clearSeed: () => clearSeed,
    countdownActive: () => countdownActive,
    countdownRemaining: () => countdownRemaining,
    cruiseSpeedForCombo: () => cruiseSpeedForCombo,
    currentCruiseSpeed: () => currentCruiseSpeed,
    currentStreak: () => currentStreak,
    dailyBestScore: () => dailyBestScore,
    dailyPlan: () => dailyPlan,
    debugPointerCount: () => debugPointerCount,
    feelState: () => feelState,
    goBack: () => goBack,
    inputState: () => inputState,
    isSeeded: () => isSeeded,
    laneButtonFlash: () => laneButtonFlash,
    loadMuted: () => loadMuted,
    modeUnlockCost: () => modeUnlockCost,
    modeUnlocked: () => modeUnlocked,
    onboardingActive: () => onboardingActive,
    openMenu: () => openMenu,
    openTrackPicker: () => openTrackPicker,
    player: () => player,
    random: () => random,
    renderShareCard: () => renderShareCard,
    resetOnboarding: () => resetOnboarding,
    retryRun: () => retryRun,
    run: () => run,
    saveMuted: () => saveMuted,
    setSeed: () => setSeed,
    setUnlockOverride: () => setUnlockOverride,
    shareForRevive: () => shareForRevive,
    starsFor: () => starsFor,
    startDaily: () => startDaily,
    startMode: () => startMode,
    submitDailyBest: () => submitDailyBest,
    todayKey: () => todayKey,
    totalStars: () => totalStars,
    touchStreak: () => touchStreak,
    trackLength: () => trackLength,
    trackScreenBounds: () => trackScreenBounds
  });

  // src/config.ts
  var LANE_COUNT = 5;
  var LANE_GAP = 12.4;
  var KERB_WIDTH = 3.2;
  var ROAD_HALF_WIDTH = LANE_COUNT * LANE_GAP / 2 + KERB_WIDTH;
  var PLAYER_CRUISE_BASE_SPEED = 125;
  var SPEED_BANDS = [
    [10, 6],
    [15, 3],
    [25, 1.5],
    [Infinity, 0.55]
  ];
  var OVERTAKE_KICK_EVERY = 5;
  var OVERTAKE_KICK_SPEED = 18;
  var OVERTAKE_KICK_TAPER_AFTER = 30;
  var OVERTAKE_KICK_SPEED_LATE = 6;
  var CRUISE_SPEED_CAP = 380;
  var THROTTLE_MARGIN = 60;
  var PLAYER_MAX_SPEED = CRUISE_SPEED_CAP + THROTTLE_MARGIN;
  var PLAYER_ACCELERATION = 112;
  var PLAYER_TIER_ACCELERATION = 165;
  var PLAYER_COAST_DECELERATION = 42;
  var PLAYER_TIER_BOOST_DURATION = 0.72;
  var CHANGE_DURATION = 0.05;
  var AI_WARNING_DURATION = 0.16;
  var AI_CHANGE_DURATION = 0.2;
  var AI_MIN_DECISION_DELAY = 0.85;
  var AI_MAX_DECISION_DELAY = 2.35;
  var AI_LANE_CLEAR_DISTANCE = 32;
  var AI_PLAYER_BASE_SAFETY_DISTANCE = 50;
  var AI_PLAYER_MAX_SAFETY_DISTANCE = 265;
  var AI_PLAYER_SAFETY_PER_SPEED = 0.39;
  var AI_PLAYER_REAR_SAFETY_DISTANCE = 30;
  var COLLISION_PATH_DISTANCE = 14.4;
  var COLLISION_LANE_DISTANCE = 0.48;
  function buildBlueprints(count) {
    const blueprints = [];
    for (let i = 0; i < count; i++) {
      const lane = i % LANE_COUNT;
      blueprints.push({
        fraction: i * 0.6180339887498949 % 1,
        lane,
        speed: 84 + lane * 7 + i % 3 * 5
      });
    }
    return blueprints;
  }

  // src/difficulty.ts
  var DIFFICULTY_PROFILES = {
    master: {
      label: "STANDARD",
      // The field is no longer a flat number: it scales with the circuit's lap so
      // the spacing between cars stays the same everywhere.
      blurb: "车流按赛道长度铺开 · 起步平缓 · 每超一辆车提速",
      playerSpeed: 1,
      trafficSpeed: 1,
      carCount: 24,
      aiSafetyScale: 0.75,
      aiDecisionScale: 0.75,
      maxSimultaneousAi: 3,
      invincibleSeconds: 1.15
    }
  };
  var DIFFICULTY_LABEL = {
    master: DIFFICULTY_PROFILES.master.label
  };
  var DEFAULT_DIFFICULTY = "master";
  var DIFFICULTIES = ["master"];
  var tuning = {
    profile: DIFFICULTY_PROFILES.master,
    player: DIFFICULTY_PROFILES.master.playerSpeed,
    traffic: DIFFICULTY_PROFILES.master.trafficSpeed
  };
  function applyTuning(difficulty, trafficScale) {
    const profile = DIFFICULTY_PROFILES[difficulty];
    tuning.profile = profile;
    tuning.player = profile.playerSpeed;
    tuning.traffic = profile.trafficSpeed * trafficScale;
  }

  // src/platform.ts
  var canvas = wx.createCanvas();
  var context2d = canvas.getContext("2d");
  if (!context2d) throw new Error("2D canvas context is unavailable");
  var ctx = context2d;
  function withRenderTarget(target, draw) {
    const previous = ctx;
    ctx = target;
    try {
      draw();
    } finally {
      ctx = previous;
    }
  }
  function createOffscreenCanvas(width, height) {
    try {
      const offscreen = wx.createCanvas();
      offscreen.width = width;
      offscreen.height = height;
      return offscreen;
    } catch (error) {
      return null;
    }
  }
  var windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  var VIEW_W = windowInfo.windowWidth;
  var VIEW_H = windowInfo.windowHeight;
  var DPR = Math.min(windowInfo.pixelRatio || 1, 3);
  canvas.width = Math.floor(VIEW_W * DPR);
  canvas.height = Math.floor(VIEW_H * DPR);
  ctx.scale(DPR, DPR);
  var DESIGN_W = 390;
  var DESIGN_H = 844;
  var scale = Math.min(VIEW_W / DESIGN_W, VIEW_H / DESIGN_H);
  var offsetX = (VIEW_W - DESIGN_W * scale) * 0.5;
  var offsetY = (VIEW_H - DESIGN_H * scale) * 0.5;
  function screenToDesignX(screenX) {
    return (screenX - offsetX) / scale;
  }
  function screenToDesignY(screenY) {
    return (screenY - offsetY) / scale;
  }
  function vibrate(type) {
    if (typeof wx.vibrateShort !== "function") return;
    try {
      wx.vibrateShort({ type });
    } catch (error) {
    }
  }
  function createCompatibleAudioContext() {
    if (typeof wx !== "undefined" && typeof wx.createWebAudioContext === "function") {
      try {
        return wx.createWebAudioContext();
      } catch (error) {
      }
    }
    if (typeof globalThis !== "undefined") {
      const scope = globalThis;
      const BrowserAudioContext = scope.AudioContext || scope.webkitAudioContext;
      if (BrowserAudioContext) {
        try {
          return new BrowserAudioContext();
        } catch (error) {
        }
      }
    }
    return null;
  }
  var scheduleFrame = typeof requestAnimationFrame === "function" ? (callback) => {
    requestAnimationFrame(callback);
  } : (callback) => {
    setTimeout(() => callback(Date.now()), 16);
  };

  // src/render/camera.ts
  var PERSPECTIVE = true;
  var PITCH = 1.5;
  var HEIGHT = 900;
  var NEAR = 700;
  var FOCAL = 1400;
  var SCREEN_CX = DESIGN_W / 2;
  var FIT_X = 0.94;
  var FIT_Y = 1.02;
  var cosPitch = Math.cos(PITCH);
  var sinPitch = Math.sin(PITCH);
  var SAFE_MARGIN = 4;
  var SAFE_TOP = 50;
  var SAFE_BOTTOM = 742;
  var MAX_VERTICAL_STRETCH = 1.22;
  var fitScale = 1;
  var fitScaleY = 1;
  var fitDx = 0;
  var fitDy = 0;
  function clearCameraFit() {
    fitScale = 1;
    fitScaleY = 1;
    fitDx = 0;
    fitDy = 0;
  }
  function projectedBounds(points) {
    const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    for (const point of points) {
      const projected = project(point.x, point.y);
      if (projected.x < bounds.minX) bounds.minX = projected.x;
      if (projected.x > bounds.maxX) bounds.maxX = projected.x;
      if (projected.y < bounds.minY) bounds.minY = projected.y;
      if (projected.y > bounds.maxY) bounds.maxY = projected.y;
    }
    return bounds;
  }
  function fitCameraToPlane(points) {
    clearCameraFit();
    if (points.length === 0) return;
    const { minX, maxX, minY, maxY } = projectedBounds(points);
    const width = maxX - minX;
    const height = maxY - minY;
    if (!(width > 0) || !(height > 0)) return;
    const roomX = (DESIGN_W - SAFE_MARGIN * 2) / width;
    const roomY = (SAFE_BOTTOM - SAFE_TOP) / height;
    fitScale = Math.min(roomX, roomY);
    fitScaleY = Math.min(roomY, fitScale * MAX_VERTICAL_STRETCH);
    fitDx = DESIGN_W / 2 - fitScale * ((minX + maxX) / 2);
    fitDy = (SAFE_TOP + SAFE_BOTTOM) / 2 - fitScaleY * ((minY + maxY) / 2);
  }
  function project(x, y) {
    if (!PERSPECTIVE) {
      return { x: x * fitScale + fitDx, y: y * fitScaleY + fitDy, scale: fitScale, depth: DESIGN_H - y };
    }
    const ground = NEAR + (DESIGN_H - y);
    const lateral = x - SCREEN_CX;
    const depth = ground * cosPitch + HEIGHT * sinPitch;
    const vertical = ground * sinPitch - HEIGHT * cosPitch;
    const scale2 = FOCAL / Math.max(1, depth);
    return {
      x: (SCREEN_CX + lateral * scale2 * FIT_X) * fitScale + fitDx,
      y: -vertical * scale2 * FIT_Y * fitScaleY + fitDy,
      // Sprite scale is the same magnification the road gets, so a car always
      // covers the same share of its lane. It used to be `midBoardDepth / depth`,
      // which carries no focal length and so is a purely relative number, and it
      // only ever matched the road because at the original PITCH of 0.90 that
      // depth works out to 1402 — a rounding error away from FOCAL's 1400. The
      // coincidence broke as soon as the angle moved: by PITCH 1.50 it falls to
      // 977, and every car had quietly shrunk to 70% of its proper size while the
      // road around it kept growing.
      // Sprites take one scale, so the geometric mean of the two fit axes keeps
      // them from looking squashed when those axes differ.
      scale: scale2 * Math.sqrt(FIT_X * FIT_Y) * Math.sqrt(fitScale * fitScaleY),
      depth
    };
  }
  function projectPath(points) {
    return points.map((point) => project(point.x, point.y));
  }
  function projectedHeading(x, y, angle) {
    const step = 2;
    const a = project(x, y);
    const b = project(x + Math.cos(angle) * step, y + Math.sin(angle) * step);
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  // src/render/light.ts
  var LIGHT_ANGLE = Math.PI * 0.32;
  var SHADOW_X = Math.cos(LIGHT_ANGLE);
  var SHADOW_Y = Math.sin(LIGHT_ANGLE);
  var CAR_SHADOW_DISTANCE = 3.2;
  var CAR_BODY_DEPTH = 1.5;
  var ISLAND_DEPTH = 3.4;
  var ROAD_DEPTH = 5;
  function localLight(angle, distance) {
    const local = LIGHT_ANGLE - angle;
    return { x: Math.cos(local) * distance, y: Math.sin(local) * distance };
  }

  // src/tracks/index.ts
  var PathBuilder = class {
    constructor() {
      this.points = [];
    }
    push(x, y) {
      const last = this.points[this.points.length - 1];
      if (!last || Math.hypot(last.x - x, last.y - y) > 0.01) this.points.push({ x, y });
    }
    start(x, y) {
      this.push(x, y);
      return this;
    }
    lineTo(x, y, spacing = 3) {
      const from = this.points[this.points.length - 1];
      const length = Math.hypot(x - from.x, y - from.y);
      const count = Math.max(1, Math.ceil(length / spacing));
      for (let i = 1; i <= count; i++) {
        const t = i / count;
        this.push(from.x + (x - from.x) * t, from.y + (y - from.y) * t);
      }
      return this;
    }
    arcTo(cx, cy, radius, startAngle, endAngle, spacing = 2.6) {
      const sweep = endAngle - startAngle;
      const count = Math.max(8, Math.ceil(Math.abs(sweep) * radius / spacing));
      for (let i = 1; i <= count; i++) {
        const angle = startAngle + sweep * (i / count);
        this.push(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      }
      return this;
    }
    /** Drops the duplicated closing point so the loop wraps cleanly. */
    close() {
      const { points } = this;
      if (points.length > 1) {
        const first = points[0];
        const last = points[points.length - 1];
        if (Math.hypot(last.x - first.x, last.y - first.y) < 0.1) points.pop();
      }
      return points;
    }
  };
  function buildLongBay() {
    const path = new PathBuilder().start(110, 70);
    path.lineTo(310, 70);
    path.arcTo(310, 115, 45, -Math.PI / 2, Math.PI / 2);
    path.lineTo(160, 160);
    path.arcTo(160, 205, 45, -Math.PI / 2, -3 * Math.PI / 2);
    path.lineTo(310, 250);
    path.arcTo(310, 295, 45, -Math.PI / 2, Math.PI / 2);
    path.lineTo(160, 340);
    path.arcTo(160, 385, 45, -Math.PI / 2, -3 * Math.PI / 2);
    path.lineTo(310, 430);
    path.arcTo(310, 475, 45, -Math.PI / 2, Math.PI / 2);
    path.lineTo(160, 520);
    path.arcTo(160, 565, 45, -Math.PI / 2, -3 * Math.PI / 2);
    path.lineTo(310, 610);
    path.arcTo(310, 655, 45, -Math.PI / 2, Math.PI / 2);
    path.lineTo(110, 700);
    path.arcTo(110, 640, 60, Math.PI / 2, Math.PI);
    path.lineTo(50, 130);
    path.arcTo(110, 130, 60, Math.PI, 3 * Math.PI / 2);
    return path.close();
  }
  function buildGrandOval() {
    const left = 112;
    const right = 278;
    const top = 178;
    const bottom = 612;
    const radius = (right - left) / 2;
    const midX = (left + right) / 2;
    const path = new PathBuilder().start(left, bottom);
    path.lineTo(left, top);
    path.arcTo(midX, top, radius, Math.PI, Math.PI * 2);
    path.lineTo(right, bottom);
    path.arcTo(midX, bottom, radius, 0, Math.PI);
    return path.close();
  }
  function roundedPolygon(vertices, radius) {
    const count = vertices.length;
    const corners = vertices.map((vertex, index) => {
      const previous = vertices[(index - 1 + count) % count];
      const next = vertices[(index + 1) % count];
      const toPreviousLength = Math.hypot(previous.x - vertex.x, previous.y - vertex.y);
      const toNextLength = Math.hypot(next.x - vertex.x, next.y - vertex.y);
      const toPrevious = { x: (previous.x - vertex.x) / toPreviousLength, y: (previous.y - vertex.y) / toPreviousLength };
      const toNext = { x: (next.x - vertex.x) / toNextLength, y: (next.y - vertex.y) / toNextLength };
      const dot = Math.max(-1, Math.min(1, toPrevious.x * toNext.x + toPrevious.y * toNext.y));
      const interior = Math.acos(dot);
      const tangent = radius / Math.tan(interior / 2);
      const bisectorLength = Math.hypot(toPrevious.x + toNext.x, toPrevious.y + toNext.y);
      const bisector = {
        x: (toPrevious.x + toNext.x) / bisectorLength,
        y: (toPrevious.y + toNext.y) / bisectorLength
      };
      const centreDistance = radius / Math.sin(interior / 2);
      return {
        entry: { x: vertex.x + toPrevious.x * tangent, y: vertex.y + toPrevious.y * tangent },
        exit: { x: vertex.x + toNext.x * tangent, y: vertex.y + toNext.y * tangent },
        centre: { x: vertex.x + bisector.x * centreDistance, y: vertex.y + bisector.y * centreDistance }
      };
    });
    const path = new PathBuilder().start(corners[0].exit.x, corners[0].exit.y);
    for (let i = 1; i <= count; i++) {
      const corner = corners[i % count];
      path.lineTo(corner.entry.x, corner.entry.y);
      const from = Math.atan2(corner.entry.y - corner.centre.y, corner.entry.x - corner.centre.x);
      const to = Math.atan2(corner.exit.y - corner.centre.y, corner.exit.x - corner.centre.x);
      let sweep = to - from;
      while (sweep > Math.PI) sweep -= Math.PI * 2;
      while (sweep < -Math.PI) sweep += Math.PI * 2;
      path.arcTo(corner.centre.x, corner.centre.y, radius, from, from + sweep);
    }
    return path.close();
  }
  function buildDeltaRun() {
    return roundedPolygon([
      { x: 64, y: -20 },
      // top of the long straight
      { x: 392, y: 415 },
      // east apex
      { x: 64, y: 772 }
      // foot of the long straight
    ], 58);
  }
  var LONG_BAY_DECOR = {
    medians: [
      [178, 111, 113, 16],
      [178, 201, 113, 16],
      [178, 291, 113, 16],
      [178, 381, 113, 16],
      [178, 471, 113, 16],
      [178, 561, 113, 16],
      [178, 651, 113, 16]
    ],
    trees: [[194, 119, 0.4], [265, 209, 0.38], [205, 299, 0.4], [204, 479, 0.4], [265, 569, 0.38]],
    umbrellas: [[242, 119, 0.38], [252, 389, 0.38], [220, 659, 0.38]],
    buoys: [[26, 128], [365, 250], [25, 628], [366, 650]],
    boats: [[371, 165, 0.62, 1.57], [12, 335, 0.6, 1.57], [372, 455, 0.58, 1.57], [12, 585, 0.62, 1.57]],
    rocks: [],
    buildings: [],
    bridges: [[358, 150, 388, 150, 13], [4, 320, 32, 320, 13], [358, 440, 388, 440, 13], [4, 570, 32, 570, 13]],
    chequers: []
  };
  var GRAND_OVAL_DECOR = {
    medians: [[170, 216, 50, 356]],
    trees: [[195, 252, 0.42], [195, 400, 0.42], [195, 540, 0.42]],
    umbrellas: [[195, 326, 0.4], [195, 468, 0.4]],
    buoys: [[40, 150], [352, 210], [40, 640], [352, 620]],
    boats: [[52, 300, 0.78, 1.57], [338, 400, 0.78, 1.57], [52, 540, 0.72, 1.57]],
    rocks: [],
    buildings: [],
    bridges: [[36, 286, 70, 286, 14], [322, 386, 356, 386, 14], [36, 526, 70, 526, 14]],
    chequers: []
  };
  var OPEN_WATER_DECOR = {
    medians: [],
    trees: [],
    umbrellas: [],
    buoys: [[20, 120], [372, 200], [20, 560], [372, 660], [18, 380]],
    boats: [[12, 250, 0.6, 1.57], [376, 340, 0.6, 1.57], [12, 620, 0.58, 1.57]],
    rocks: [],
    buildings: [],
    bridges: [[2, 236, 30, 236, 12], [360, 326, 388, 326, 12], [2, 606, 30, 606, 12]],
    chequers: []
  };
  var TRACKS = [
    { id: "long-bay", name: "LONG BAY", build: buildLongBay, decor: LONG_BAY_DECOR },
    { id: "grand-oval", name: "GRAND OVAL", build: buildGrandOval, decor: GRAND_OVAL_DECOR },
    { id: "delta-run", name: "DELTA RUN", build: buildDeltaRun, decor: OPEN_WATER_DECOR }
  ];
  var BY_ID = new Map(TRACKS.map((track) => [track.id, track]));
  function trackById(id) {
    const track = BY_ID.get(id);
    if (!track) throw new Error(`unknown track: ${id}`);
    return track;
  }
  var DEFAULT_TRACK_ID = "long-bay";

  // src/track.ts
  var ROAD_OUTER_EXTENT = ROAD_HALF_WIDTH + 7 + ROAD_DEPTH;
  var activeTrackId = DEFAULT_TRACK_ID;
  var centerPath = [];
  function buildArcData(points) {
    const cumulative = [0];
    let total = 0;
    for (let i = 1; i <= points.length; i++) {
      const a = points[i - 1];
      const b = points[i % points.length];
      total += Math.hypot(b.x - a.x, b.y - a.y);
      cumulative.push(total);
    }
    return { cumulative, total };
  }
  var arc = { cumulative: [0], total: 1 };
  function trackLength() {
    return arc.total;
  }
  function wrapDistance(distance) {
    return (distance % arc.total + arc.total) % arc.total;
  }
  function circularDistance(a, b) {
    const raw = Math.abs(wrapDistance(a) - wrapDistance(b));
    return Math.min(raw, arc.total - raw);
  }
  function forwardPathDistance(fromDistance, toDistance) {
    return wrapDistance(toDistance - fromDistance);
  }
  function locateCenterSegment(distance) {
    const d = wrapDistance(distance);
    let lo = 0;
    let hi = centerPath.length;
    while (lo + 1 < hi) {
      const mid = lo + hi >> 1;
      if (arc.cumulative[mid] <= d) lo = mid;
      else hi = mid;
    }
    const i = Math.min(lo, centerPath.length - 1);
    const segmentStart = arc.cumulative[i];
    const segmentLength = Math.max(1e-4, arc.cumulative[i + 1] - segmentStart);
    return {
      i,
      t: (d - segmentStart) / segmentLength,
      segmentLength
    };
  }
  function pathAtOffset(offset) {
    return centerPath.map((p, i) => {
      const prev = centerPath[(i - 1 + centerPath.length) % centerPath.length];
      const next = centerPath[(i + 1) % centerPath.length];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      return { x: p.x + nx * offset, y: p.y + ny * offset };
    });
  }
  function pathForLane(laneIndex) {
    const laneOffset = (laneIndex - (LANE_COUNT - 1) / 2) * LANE_GAP;
    return pathAtOffset(laneOffset);
  }
  var laneCenterPaths = [];
  function laneBounds(laneIndex) {
    const clamped = Math.max(0, Math.min(LANE_COUNT - 1, laneIndex));
    const lower = Math.floor(clamped);
    const upper = Math.ceil(clamped);
    return { lower, upper, blend: clamped - lower };
  }
  function interpolatedLanePoint(pointIndex, laneIndex) {
    const lanes = laneBounds(laneIndex);
    const low = laneCenterPaths[lanes.lower][pointIndex];
    const high = laneCenterPaths[lanes.upper][pointIndex];
    return {
      x: low.x + (high.x - low.x) * lanes.blend,
      y: low.y + (high.y - low.y) * lanes.blend
    };
  }
  function laneSegmentLength(segmentIndex, laneIndex) {
    const a = interpolatedLanePoint(segmentIndex, laneIndex);
    const b = interpolatedLanePoint((segmentIndex + 1) % centerPath.length, laneIndex);
    return Math.max(1e-4, Math.hypot(b.x - a.x, b.y - a.y));
  }
  function sampleAtDistance(distance, laneIndex) {
    const station = locateCenterSegment(distance);
    const a = interpolatedLanePoint(station.i, laneIndex);
    const b = interpolatedLanePoint((station.i + 1) % centerPath.length, laneIndex);
    const x = a.x + (b.x - a.x) * station.t;
    const y = a.y + (b.y - a.y) * station.t;
    return {
      x,
      y,
      angle: Math.atan2(b.y - a.y, b.x - a.x)
    };
  }
  function advanceDistanceAtRoadSpeed(distance, speed, dt, laneIndex) {
    let currentDistance = distance;
    let remainingRoadDistance = Math.max(0, speed * dt);
    let guard = 0;
    while (remainingRoadDistance > 1e-6 && guard < 128) {
      const station = locateCenterSegment(currentDistance);
      const roadSegmentLength = laneSegmentLength(station.i, laneIndex);
      const roadRemainingInSegment = roadSegmentLength * (1 - station.t);
      const centerRemainingInSegment = station.segmentLength * (1 - station.t);
      if (roadRemainingInSegment <= 1e-6 || centerRemainingInSegment <= 1e-6) {
        currentDistance += 1e-6;
        guard += 1;
        continue;
      }
      if (remainingRoadDistance < roadRemainingInSegment) {
        currentDistance += station.segmentLength * (remainingRoadDistance / roadSegmentLength);
        remainingRoadDistance = 0;
      } else {
        currentDistance += centerRemainingInSegment;
        remainingRoadDistance -= roadRemainingInSegment;
      }
      guard += 1;
    }
    return currentDistance;
  }
  var laneDividerPaths = [];
  var outerRoadEdgePath = [];
  var innerRoadEdgePath = [];
  function setTrack(id) {
    activeTrackId = id;
    centerPath = trackById(id).build();
    arc = buildArcData(centerPath);
    laneCenterPaths = Array.from({ length: LANE_COUNT }, (_, lane) => pathForLane(lane));
    laneDividerPaths = Array.from({ length: LANE_COUNT - 1 }, (_, i) => pathForLane(i + 0.5));
    outerRoadEdgePath = pathAtOffset(ROAD_HALF_WIDTH - 1.8);
    innerRoadEdgePath = pathAtOffset(-ROAD_HALF_WIDTH + 1.8);
    fitCameraToPlane([...pathAtOffset(ROAD_OUTER_EXTENT), ...pathAtOffset(-ROAD_OUTER_EXTENT)]);
  }
  function trackScreenBounds() {
    return projectedBounds([...pathAtOffset(ROAD_OUTER_EXTENT), ...pathAtOffset(-ROAD_OUTER_EXTENT)]);
  }
  setTrack(DEFAULT_TRACK_ID);

  // src/rng.ts
  var state = 0;
  var seeded = false;
  function setSeed(seed) {
    state = seed >>> 0 || 1;
    seeded = true;
  }
  function clearSeed() {
    seeded = false;
  }
  function isSeeded() {
    return seeded;
  }
  function random() {
    if (!seeded) return Math.random();
    state = state + 1831565813 >>> 0;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  function hashSeed(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  // src/state.ts
  var STARTING_LANE = 2;
  var inputState = {
    throttle: false
  };
  var player = {
    distance: 0,
    lane: STARTING_LANE,
    visualLane: STARTING_LANE,
    laneFrom: STARTING_LANE,
    laneTo: STARTING_LANE,
    laneChangeElapsed: 0,
    speed: PLAYER_CRUISE_BASE_SPEED,
    state: "NORMAL",
    stateElapsed: 0,
    invincible: 0,
    combo: 0,
    bestCombo: 0,
    totalPasses: 0,
    passPopElapsed: 10,
    tierBoostElapsed: 0,
    previousDistance: 0,
    previousVisualLane: STARTING_LANE,
    collisionCount: 0,
    fireball: 0,
    heat: 0,
    travelled: 0,
    trail: [],
    previousHeading: 0,
    cornering: 0
  };
  var aiCars = [];
  var REFERENCE_LAP = 2988;
  var MIN_FIELD = 8;
  function fieldSize() {
    const scaled = Math.round(tuning.profile.carCount * (arc.total / REFERENCE_LAP));
    return Math.max(MIN_FIELD, scaled);
  }
  function resetGame() {
    player.distance = arc.total * 0.03;
    player.lane = STARTING_LANE;
    player.visualLane = STARTING_LANE;
    player.laneFrom = STARTING_LANE;
    player.laneTo = STARTING_LANE;
    player.laneChangeElapsed = 0;
    player.speed = baseCruiseSpeed();
    inputState.throttle = false;
    player.state = "NORMAL";
    player.stateElapsed = 0;
    player.invincible = 0;
    player.combo = 0;
    player.bestCombo = 0;
    player.totalPasses = 0;
    player.passPopElapsed = 10;
    player.tierBoostElapsed = 0;
    player.previousDistance = player.distance;
    player.previousVisualLane = player.visualLane;
    player.collisionCount = 0;
    player.fireball = 0;
    player.heat = 0;
    player.travelled = 0;
    player.trail.length = 0;
    player.previousHeading = 0;
    player.cornering = 0;
    aiCars = buildBlueprints(fieldSize()).map((blueprint, index) => {
      const distance = arc.total * blueprint.fraction;
      const baseSpeed = blueprint.speed * tuning.traffic;
      return {
        id: index,
        distance,
        lane: blueprint.lane,
        visualLane: blueprint.lane,
        laneFrom: blueprint.lane,
        laneTo: blueprint.lane,
        baseSpeed,
        speed: baseSpeed,
        previousDistance: distance,
        previousVisualLane: blueprint.lane,
        state: "IDLE",
        stateElapsed: 0,
        direction: 0,
        decisionTimer: (AI_MIN_DECISION_DELAY + random() * (AI_MAX_DECISION_DELAY - AI_MIN_DECISION_DELAY)) * tuning.profile.aiDecisionScale,
        passIndex: Math.floor((player.distance - distance) / arc.total),
        alive: true,
        wreck: 0,
        hasZone: false,
        zoneFill: 0
      };
    });
  }
  function baseCruiseSpeed() {
    return PLAYER_CRUISE_BASE_SPEED * tuning.player;
  }
  function currentSpeedTier(combo = player.combo) {
    return Math.min(10, Math.floor(Math.max(0, combo) / 10));
  }
  function cruiseSpeedForCombo(combo) {
    let speed = PLAYER_CRUISE_BASE_SPEED;
    let remaining = Math.max(0, combo);
    for (const [count, step] of SPEED_BANDS) {
      const taken = Math.min(remaining, count);
      speed += taken * step;
      remaining -= taken;
      if (remaining <= 0) break;
    }
    const kicksTotal = Math.floor(Math.max(0, combo) / OVERTAKE_KICK_EVERY);
    const kicksBeforeTaper = Math.floor(OVERTAKE_KICK_TAPER_AFTER / OVERTAKE_KICK_EVERY);
    const fullKicks = Math.min(kicksTotal, kicksBeforeTaper);
    const lateKicks = kicksTotal - fullKicks;
    speed += fullKicks * OVERTAKE_KICK_SPEED + lateKicks * OVERTAKE_KICK_SPEED_LATE;
    return Math.min(CRUISE_SPEED_CAP, speed);
  }
  function currentCruiseSpeed() {
    return cruiseSpeedForCombo(player.combo) * tuning.player;
  }
  function currentThrottleMaxSpeed() {
    return (cruiseSpeedForCombo(player.combo) + THROTTLE_MARGIN) * tuning.player;
  }
  function currentTargetSpeed() {
    return inputState.throttle ? currentThrottleMaxSpeed() : currentCruiseSpeed();
  }
  function engineSnapshot() {
    return {
      tier: currentSpeedTier(),
      cornering: player.cornering,
      throttle: inputState.throttle,
      speed: player.speed,
      cruiseSpeed: currentCruiseSpeed(),
      throttleMaxSpeed: currentThrottleMaxSpeed(),
      maxSpeed: PLAYER_MAX_SPEED * tuning.player,
      state: player.state
    };
  }

  // src/ai.ts
  function currentAiPlayerSafetyDistance() {
    const speedExtra = Math.max(0, player.speed - baseCruiseSpeed()) * AI_PLAYER_SAFETY_PER_SPEED;
    const zone = Math.min(AI_PLAYER_MAX_SAFETY_DISTANCE, AI_PLAYER_BASE_SAFETY_DISTANCE + speedExtra);
    return zone * tuning.profile.aiSafetyScale;
  }
  function playerIsApproachingAi(car) {
    const playerToCar = forwardPathDistance(player.distance, car.distance);
    if (playerToCar > 0.1 && playerToCar < currentAiPlayerSafetyDistance()) return true;
    const carToPlayer = forwardPathDistance(car.distance, player.distance);
    return carToPlayer > 0.1 && carToPlayer < AI_PLAYER_REAR_SAFETY_DISTANCE;
  }
  function countActiveAiLaneChanges() {
    let count = 0;
    for (const car of aiCars) {
      if (car.alive && (car.state === "WARNING" || car.state === "CHANGING")) count += 1;
    }
    return count;
  }
  function nearestAiAhead(car, lane, maxDistance = 90) {
    let nearest = null;
    let nearestDistance = maxDistance;
    for (const other of aiCars) {
      if (other === car || !other.alive || Math.abs(other.visualLane - lane) > 0.55) continue;
      const distance = forwardPathDistance(car.distance, other.distance);
      if (distance > 0.1 && distance < nearestDistance) {
        nearest = other;
        nearestDistance = distance;
      }
    }
    return nearest ? { car: nearest, distance: nearestDistance } : null;
  }
  function isAiTargetLaneClear(car, targetLane) {
    for (const other of aiCars) {
      if (other === car || !other.alive || Math.abs(other.visualLane - targetLane) > 0.62) continue;
      if (circularDistance(car.distance, other.distance) < AI_LANE_CLEAR_DISTANCE) return false;
    }
    if (Math.abs(player.visualLane - targetLane) < 0.72 && circularDistance(car.distance, player.distance) < currentAiPlayerSafetyDistance()) {
      return false;
    }
    return true;
  }
  function shuffledDirections() {
    return random() < 0.5 ? [-1, 1] : [1, -1];
  }
  function tryBeginAiLaneChange(car) {
    if (countActiveAiLaneChanges() >= tuning.profile.maxSimultaneousAi) return false;
    if (playerIsApproachingAi(car)) return false;
    const ahead = nearestAiAhead(car, car.visualLane, 62);
    const needsToPass = Boolean(ahead && ahead.car.speed + 2 < car.baseSpeed && ahead.distance < 46);
    if (!needsToPass) return false;
    const directions = shuffledDirections();
    for (const direction of directions) {
      const targetLane = car.lane + direction;
      if (targetLane < 0 || targetLane >= LANE_COUNT) continue;
      if (!isAiTargetLaneClear(car, targetLane)) continue;
      car.state = "WARNING";
      car.stateElapsed = 0;
      car.direction = direction;
      car.laneFrom = car.visualLane;
      car.laneTo = targetLane;
      return true;
    }
    return false;
  }
  function updateAi(dt) {
    for (const car of aiCars) {
      if (!car.alive) {
        car.wreck = Math.max(0, car.wreck - dt);
        continue;
      }
      car.previousDistance = car.distance;
      car.previousVisualLane = car.visualLane;
      car.decisionTimer -= dt;
      if (car.state === "IDLE" && car.decisionTimer <= 0) {
        car.decisionTimer = (AI_MIN_DECISION_DELAY + random() * (AI_MAX_DECISION_DELAY - AI_MIN_DECISION_DELAY)) * tuning.profile.aiDecisionScale;
        tryBeginAiLaneChange(car);
      } else if (car.state === "WARNING") {
        car.stateElapsed += dt;
        if (playerIsApproachingAi(car) || !isAiTargetLaneClear(car, car.laneTo)) {
          car.state = "IDLE";
          car.stateElapsed = 0;
          car.direction = 0;
          car.decisionTimer = 0.55 + random() * 0.75;
        } else if (car.stateElapsed >= AI_WARNING_DURATION) {
          car.state = "CHANGING";
          car.stateElapsed = 0;
          car.laneFrom = car.visualLane;
          car.lane = car.laneTo;
        }
      } else if (car.state === "CHANGING") {
        car.stateElapsed += dt;
        const t = Math.min(1, car.stateElapsed / AI_CHANGE_DURATION);
        const eased = t * t * (3 - 2 * t);
        car.visualLane = car.laneFrom + (car.laneTo - car.laneFrom) * eased;
        if (t >= 1) {
          car.visualLane = car.laneTo;
          car.lane = car.laneTo;
          car.state = "IDLE";
          car.stateElapsed = 0;
          car.direction = 0;
          car.decisionTimer = 0.9 + random() * 1.5;
        }
      }
      const ahead = nearestAiAhead(car, car.visualLane, 34);
      let desiredSpeed = car.baseSpeed;
      if (ahead && ahead.distance < 24) desiredSpeed = Math.min(desiredSpeed, ahead.car.speed * 0.96);
      const response = Math.min(1, dt * 4.5);
      car.speed += (desiredSpeed - car.speed) * response;
      car.distance = advanceDistanceAtRoadSpeed(car.distance, car.speed, dt, car.visualLane);
    }
  }

  // src/mathUtil.ts
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function moveToward(value, target, maxDelta) {
    if (value < target) return Math.min(target, value + maxDelta);
    if (value > target) return Math.max(target, value - maxDelta);
    return target;
  }

  // src/audio.ts
  function setAudioParam(param, value) {
    if (!param) return;
    try {
      param.value = value;
    } catch (error) {
    }
  }
  function safelyStartNode(node) {
    if (!node || typeof node.start !== "function") return;
    try {
      node.start(0);
    } catch (error) {
    }
  }
  function safelyStopNode(node) {
    if (!node) return;
    if (typeof node.stop === "function") {
      try {
        node.stop(0);
      } catch (error) {
      }
    }
    if (typeof node.disconnect === "function") {
      try {
        node.disconnect();
      } catch (error) {
      }
    }
  }
  function createLoopingNoiseSource(context3) {
    if (!context3 || typeof context3.createBuffer !== "function" || typeof context3.createBufferSource !== "function") return null;
    try {
      const sampleRate = context3.sampleRate || 44100;
      const frameCount = Math.max(1, Math.floor(sampleRate * 1.25));
      const buffer = context3.createBuffer(1, frameCount, sampleRate);
      const data = buffer.getChannelData(0);
      let previous = 0;
      for (let index = 0; index < frameCount; index++) {
        const white = Math.random() * 2 - 1;
        previous = previous * 0.965 + white * 0.035;
        data[index] = previous * 2.4;
      }
      const source = context3.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      return source;
    } catch (error) {
      return null;
    }
  }
  var TIER_RPM_MULTIPLIER = [1, 1.065, 1.13, 1.19, 1.245, 1.295, 1.34, 1.38, 1.415, 1.445, 1.47];
  function masterGainForTyres(master) {
    return master;
  }
  var MAX_VOICES = 12;
  var MASTER_VOLUME = 0.46;
  var AudioEngine = class {
    constructor() {
      this.context = null;
      this.started = false;
      this.disabled = false;
      this.masterGain = null;
      this.engineGain = null;
      this.engineFilter = null;
      this.engineLow = null;
      this.engineMid = null;
      this.engineHigh = null;
      this.engineMidGain = null;
      this.engineHighGain = null;
      this.engineNoise = null;
      this.engineNoiseFilter = null;
      this.engineNoiseGain = null;
      /** Sub-octave sine: the body the three-layer engine was missing. */
      this.engineBody = null;
      this.engineBodyGain = null;
      /** Tyre scrub, a separate filtered noise voice driven by cornering load. */
      this.tyreNoise = null;
      this.tyreFilter = null;
      this.tyreGain = null;
      this.smoothCornering = 0;
      this.muted = false;
      this.smoothEngineFrequency = 48;
      this.smoothEngineVolume = 0;
      this.smoothThrottle = 0;
      this.enginePulsePhase = 0;
      this.effectDuck = 0;
      this.voices = [];
      /** One-shot nodes that decay on their own schedule (the crash noise burst). */
      this.transients = [];
    }
    ensureStarted() {
      if (this.disabled) return false;
      if (!this.context) {
        this.context = createCompatibleAudioContext();
        if (!this.context) {
          this.disabled = true;
          return false;
        }
      }
      if (this.context.state === "suspended" && typeof this.context.resume === "function") {
        try {
          const resumeResult = this.context.resume();
          if (resumeResult && typeof resumeResult.catch === "function") resumeResult.catch(() => {
          });
        } catch (error) {
        }
      }
      if (!this.started) {
        try {
          const context3 = this.context;
          this.masterGain = context3.createGain();
          this.engineGain = context3.createGain();
          this.engineMidGain = context3.createGain();
          this.engineHighGain = context3.createGain();
          this.engineNoiseGain = context3.createGain();
          this.engineFilter = context3.createBiquadFilter();
          this.engineNoiseFilter = context3.createBiquadFilter();
          this.engineLow = context3.createOscillator();
          this.engineMid = context3.createOscillator();
          this.engineHigh = context3.createOscillator();
          this.engineNoise = createLoopingNoiseSource(context3);
          this.engineBody = context3.createOscillator();
          this.engineBodyGain = context3.createGain();
          this.tyreNoise = createLoopingNoiseSource(context3);
          this.tyreFilter = context3.createBiquadFilter();
          this.tyreGain = context3.createGain();
          setAudioParam(this.masterGain.gain, this.muted ? 0 : MASTER_VOLUME);
          setAudioParam(this.engineGain.gain, 1e-4);
          setAudioParam(this.engineMidGain.gain, 0.07);
          setAudioParam(this.engineHighGain.gain, 0.018);
          setAudioParam(this.engineNoiseGain.gain, 1e-4);
          setAudioParam(this.engineBodyGain.gain, 0.055);
          setAudioParam(this.tyreGain.gain, 1e-4);
          try {
            this.tyreFilter.type = "bandpass";
          } catch (error) {
          }
          setAudioParam(this.tyreFilter.frequency, 2400);
          setAudioParam(this.tyreFilter.Q, 1.5);
          try {
            this.engineBody.type = "sine";
          } catch (error) {
          }
          setAudioParam(this.engineBody.frequency, this.smoothEngineFrequency * 0.5);
          try {
            this.engineFilter.type = "lowpass";
          } catch (error) {
          }
          setAudioParam(this.engineFilter.frequency, 520);
          setAudioParam(this.engineFilter.Q, 0.72);
          try {
            this.engineNoiseFilter.type = "bandpass";
          } catch (error) {
          }
          setAudioParam(this.engineNoiseFilter.frequency, 720);
          setAudioParam(this.engineNoiseFilter.Q, 0.85);
          try {
            this.engineLow.type = "triangle";
          } catch (error) {
          }
          try {
            this.engineMid.type = "sawtooth";
          } catch (error) {
          }
          try {
            this.engineHigh.type = "triangle";
          } catch (error) {
          }
          setAudioParam(this.engineLow.frequency, this.smoothEngineFrequency);
          setAudioParam(this.engineMid.frequency, this.smoothEngineFrequency * 2.02);
          setAudioParam(this.engineHigh.frequency, this.smoothEngineFrequency * 4.07);
          this.engineLow.connect(this.engineFilter);
          this.engineMid.connect(this.engineMidGain);
          this.engineMidGain.connect(this.engineFilter);
          this.engineHigh.connect(this.engineHighGain);
          this.engineHighGain.connect(this.engineFilter);
          if (this.engineNoise) {
            this.engineNoise.connect(this.engineNoiseFilter);
            this.engineNoiseFilter.connect(this.engineNoiseGain);
            this.engineNoiseGain.connect(this.engineGain);
          }
          this.engineBody.connect(this.engineBodyGain);
          this.engineBodyGain.connect(this.engineGain);
          if (this.tyreNoise) {
            this.tyreNoise.connect(this.tyreFilter);
            this.tyreFilter.connect(this.tyreGain);
            this.tyreGain.connect(masterGainForTyres(this.masterGain));
          }
          this.engineFilter.connect(this.engineGain);
          this.engineGain.connect(this.masterGain);
          this.masterGain.connect(context3.destination);
          safelyStartNode(this.engineLow);
          safelyStartNode(this.engineMid);
          safelyStartNode(this.engineHigh);
          safelyStartNode(this.engineNoise);
          safelyStartNode(this.engineBody);
          safelyStartNode(this.tyreNoise);
          this.started = true;
        } catch (error) {
          this.disabled = true;
          this.started = false;
          return false;
        }
      }
      return true;
    }
    addTone(type, duration, startFrequency, endFrequency, volume) {
      if (!this.ensureStarted()) return;
      const context3 = this.context;
      const masterGain = this.masterGain;
      if (!context3 || !masterGain) return;
      try {
        const oscillator = context3.createOscillator();
        const gain = context3.createGain();
        try {
          oscillator.type = type;
        } catch (error) {
        }
        setAudioParam(oscillator.frequency, startFrequency);
        setAudioParam(gain.gain, 1e-4);
        oscillator.connect(gain);
        gain.connect(masterGain);
        safelyStartNode(oscillator);
        while (this.voices.length >= MAX_VOICES) {
          const oldest = this.voices.shift();
          safelyStopNode(oldest == null ? void 0 : oldest.oscillator);
          safelyStopNode(oldest == null ? void 0 : oldest.gain);
        }
        this.voices.push({
          oscillator,
          gain,
          elapsed: 0,
          duration,
          startFrequency,
          endFrequency,
          volume
        });
      } catch (error) {
      }
    }
    /** Silence without tearing anything down, so unmuting is instant. */
    setMuted(muted) {
      var _a;
      this.muted = muted;
      setAudioParam((_a = this.masterGain) == null ? void 0 : _a.gain, muted ? 0 : MASTER_VOLUME);
    }
    isMuted() {
      return this.muted;
    }
    /** UI tap. Deliberately dry and short: menus should click, not sing. */
    playUiTap() {
      this.addTone("triangle", 0.045, 660, 520, 0.05);
    }
    /** Confirmation, one step up from a tap: starting a run, choosing a mode. */
    playUiConfirm() {
      this.addTone("triangle", 0.07, 520, 780, 0.055);
      this.addTone("sine", 0.09, 780, 1040, 0.022);
    }
    /** Refusal: a flat, slightly sour pair that reads as "no" without being harsh. */
    playUiDenied() {
      this.addTone("sawtooth", 0.09, 220, 180, 0.038);
      this.addTone("triangle", 0.07, 175, 150, 0.022);
    }
    /** Stage or objective cleared: a rising major triad. */
    playFanfare() {
      this.effectDuck = Math.max(this.effectDuck, 0.4);
      const root = 392;
      this.addTone("triangle", 0.13, root, root, 0.06);
      this.addTone("triangle", 0.15, root * 1.26, root * 1.26, 0.055);
      this.addTone("triangle", 0.22, root * 1.5, root * 1.5, 0.05);
      this.addTone("sine", 0.3, root * 3, root * 3, 0.016);
    }
    /** Revive: a low swell up into the engine coming back. */
    playRevive() {
      this.effectDuck = Math.max(this.effectDuck, 0.5);
      this.addTone("sawtooth", 0.34, 90, 300, 0.07);
      this.addTone("sine", 0.4, 300, 660, 0.03);
    }
    playLaneChange(direction) {
      const directionLift = direction > 0 ? 16 : -16;
      this.effectDuck = Math.max(this.effectDuck, 0.22);
      this.addTone("triangle", 0.065, 330 + directionLift, 205 + directionLift, 0.04);
      this.addTone("sine", 0.045, 510 + directionLift, 350 + directionLift, 0.01);
    }
    playOvertake(combo, count = 1) {
      const withinBlock = Math.max(0, combo - 1) % 10;
      const notePattern = [0, 2, 3, 5, 7, 8, 10, 12, 10, 12];
      const tier = Math.min(7, Math.floor(Math.max(0, combo - 1) / 10));
      const semitones = notePattern[withinBlock] + tier * 0.34;
      const baseFrequency = Math.min(760, 305 * Math.pow(2, semitones / 12));
      const volume = Math.min(0.064, 0.046 + Math.max(0, count - 1) * 6e-3);
      this.effectDuck = Math.max(this.effectDuck, 0.25);
      this.addTone("triangle", 0.07, baseFrequency * 0.95, baseFrequency, volume);
      this.addTone("sine", 0.046, baseFrequency * 1.45, baseFrequency * 1.49, volume * 0.12);
    }
    /**
     * Crash. A filtered noise burst plus a low body thud: the noise carries the
     * scrape, the sine carries the mass. Crashes used to be silent, which cost
     * most of the perceived impact.
     */
    playCrash() {
      if (!this.ensureStarted()) return;
      const context3 = this.context;
      const masterGain = this.masterGain;
      if (!context3 || !masterGain) return;
      this.effectDuck = Math.max(this.effectDuck, 0.85);
      try {
        const noise = createLoopingNoiseSource(context3);
        if (noise) {
          const filter = context3.createBiquadFilter();
          const gain = context3.createGain();
          try {
            filter.type = "bandpass";
          } catch (error) {
          }
          setAudioParam(filter.frequency, 1500);
          setAudioParam(filter.Q, 0.7);
          setAudioParam(gain.gain, 0.3);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);
          safelyStartNode(noise);
          this.transients.push({ nodes: [noise, gain], gain, elapsed: 0, duration: 0.55, volume: 0.34 });
        }
      } catch (error) {
      }
      this.addTone("sine", 0.42, 128, 34, 0.4);
      this.addTone("triangle", 0.26, 320, 96, 0.16);
      this.addTone("sawtooth", 0.13, 900, 240, 0.07);
    }
    /** Close call: a short upward whoosh, distinct from the overtake blip. */
    playCloseCall() {
      this.effectDuck = Math.max(this.effectDuck, 0.3);
      this.addTone("sine", 0.2, 520, 1500, 0.052);
      this.addTone("triangle", 0.13, 260, 700, 0.028);
    }
    playSpeedTierUp(tier) {
      const start = Math.min(250, 118 + tier * 9);
      const end = Math.min(390, start * 1.42);
      this.effectDuck = Math.max(this.effectDuck, 0.18);
      this.addTone("sawtooth", 0.145, start, end, 0.036);
      this.addTone("triangle", 0.11, start * 1.95, end * 1.74, 0.018);
    }
    update(dt, snapshot) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
      if (!this.started || this.disabled) return;
      const tierMultiplier = TIER_RPM_MULTIPLIER[snapshot.tier];
      const throttleTarget = snapshot.throttle && snapshot.state !== "CRASHED" ? 1 : 0;
      const throttleResponse = throttleTarget > this.smoothThrottle ? 8 : 4.6;
      this.smoothThrottle += (throttleTarget - this.smoothThrottle) * (1 - Math.exp(-dt * throttleResponse));
      const speedInsideBand = clamp(
        (snapshot.speed - snapshot.cruiseSpeed) / Math.max(1, snapshot.throttleMaxSpeed - snapshot.cruiseSpeed),
        0,
        1
      );
      const revAmount = clamp(this.smoothThrottle * 0.74 + speedInsideBand * 0.26, 0, 1);
      let targetFrequency = 48 * tierMultiplier * (1 + revAmount * 0.26);
      if (snapshot.state === "CRASHED") targetFrequency = 36;
      if (snapshot.state === "RECOVERING") targetFrequency *= 0.82;
      const engineResponse = 1 - Math.exp(-dt * 6.6);
      this.smoothEngineFrequency += (targetFrequency - this.smoothEngineFrequency) * engineResponse;
      const speedRatio = clamp(snapshot.speed / snapshot.maxSpeed, 0, 1);
      let targetVolume = 0.016 + snapshot.tier * 1e-3 + revAmount * 0.01 + speedRatio * 0.012;
      if (snapshot.state === "CRASHED") targetVolume = 35e-4;
      if (snapshot.state === "RECOVERING") targetVolume *= 0.72;
      this.smoothEngineVolume += (targetVolume - this.smoothEngineVolume) * (1 - Math.exp(-dt * 8));
      const pulseRate = 7.2 + snapshot.tier * 0.72 + revAmount * 6.4;
      this.enginePulsePhase = (this.enginePulsePhase + dt * pulseRate) % 1;
      const pulseWave = Math.max(0, Math.sin(this.enginePulsePhase * Math.PI * 2));
      const pulse = 0.82 + Math.pow(pulseWave, 3.2) * 0.18;
      this.effectDuck = Math.max(0, this.effectDuck - dt * 3.6);
      const duck = 1 - this.effectDuck * 0.28;
      setAudioParam((_a = this.engineLow) == null ? void 0 : _a.frequency, this.smoothEngineFrequency);
      setAudioParam((_b = this.engineMid) == null ? void 0 : _b.frequency, this.smoothEngineFrequency * (2.01 + revAmount * 0.035));
      setAudioParam((_c = this.engineHigh) == null ? void 0 : _c.frequency, this.smoothEngineFrequency * (4.03 + revAmount * 0.11));
      setAudioParam((_d = this.engineMidGain) == null ? void 0 : _d.gain, 0.052 + revAmount * 0.035 + speedRatio * 0.01);
      setAudioParam((_e = this.engineHighGain) == null ? void 0 : _e.gain, 0.012 + revAmount * 0.018);
      setAudioParam((_f = this.engineGain) == null ? void 0 : _f.gain, this.smoothEngineVolume * pulse * duck);
      setAudioParam((_g = this.engineFilter) == null ? void 0 : _g.frequency, 330 + snapshot.tier * 46 + revAmount * 740 + speedRatio * 260);
      setAudioParam((_h = this.engineNoiseFilter) == null ? void 0 : _h.frequency, 560 + snapshot.tier * 65 + revAmount * 920 + speedRatio * 380);
      setAudioParam((_i = this.engineNoiseGain) == null ? void 0 : _i.gain, (3e-3 + revAmount * 0.01 + speedRatio * 9e-3) * duck);
      setAudioParam((_j = this.engineBody) == null ? void 0 : _j.frequency, this.smoothEngineFrequency * 0.503);
      setAudioParam((_k = this.engineBodyGain) == null ? void 0 : _k.gain, (0.05 + speedRatio * 0.03) * duck);
      const corneringTarget = snapshot.state === "CRASHED" ? 0 : snapshot.cornering * speedRatio;
      this.smoothCornering += (corneringTarget - this.smoothCornering) * (1 - Math.exp(-dt * 7));
      setAudioParam((_l = this.tyreFilter) == null ? void 0 : _l.frequency, 1500 + this.smoothCornering * 2600);
      setAudioParam((_m = this.tyreGain) == null ? void 0 : _m.gain, Math.max(1e-4, this.smoothCornering * 0.055 * duck));
      for (let index = this.transients.length - 1; index >= 0; index--) {
        const transient = this.transients[index];
        transient.elapsed += dt;
        const t = clamp(transient.elapsed / transient.duration, 0, 1);
        setAudioParam(transient.gain.gain, Math.max(1e-4, transient.volume * Math.pow(1 - t, 2.2)));
        if (t >= 1) {
          for (const node of transient.nodes) safelyStopNode(node);
          this.transients.splice(index, 1);
        }
      }
      for (let index = this.voices.length - 1; index >= 0; index--) {
        const voice = this.voices[index];
        voice.elapsed += dt;
        const t = clamp(voice.elapsed / voice.duration, 0, 1);
        const attack = Math.min(1, t / 0.1);
        const decay = Math.pow(1 - t, 1.7);
        const envelope = attack * decay;
        const frequency = voice.startFrequency + (voice.endFrequency - voice.startFrequency) * t;
        setAudioParam(voice.oscillator.frequency, frequency);
        setAudioParam(voice.gain.gain, Math.max(1e-4, voice.volume * envelope));
        if (t >= 1) {
          safelyStopNode(voice.oscillator);
          safelyStopNode(voice.gain);
          this.voices.splice(index, 1);
        }
      }
    }
    /**
     * Hard-stops every in-flight one-shot immediately, instead of letting it
     * decay. update() is what normally fades these out, but it only runs while
     * a race is playing — a crash that ends the run right on the frame it
     * happens leaves its noise burst mid-decay with nothing left to tick it
     * down, so it plays on into the result screen unless cut here.
     */
    stopTransients() {
      for (const transient of this.transients) {
        for (const node of transient.nodes) safelyStopNode(node);
      }
      this.transients.length = 0;
      for (const voice of this.voices) {
        safelyStopNode(voice.oscillator);
        safelyStopNode(voice.gain);
      }
      this.voices.length = 0;
    }
    suspend() {
      if (!this.context || typeof this.context.suspend !== "function") return;
      try {
        const result = this.context.suspend();
        if (result && typeof result.catch === "function") result.catch(() => {
        });
      } catch (error) {
      }
    }
    resume() {
      if (!this.started) return;
      this.ensureStarted();
    }
  };
  var audio = new AudioEngine();

  // src/effects.ts
  var effects = {
    /** 0 = clear, 1 = fully blacked out. */
    dim: 0,
    /** Lane index that is currently lethal, or -1. */
    hazardLane: -1
  };
  function resetEffects() {
    effects.dim = 0;
    effects.hazardLane = -1;
  }

  // src/modes/blackout.ts
  var CYCLE = 7;
  var DARK_SECONDS = 2;
  var FADE = 0.45;
  var blackout = {
    id: "blackout",
    name: "BLACKOUT",
    rule: "每 7 秒熄灯 2 秒 · 靠记忆穿过车流",
    timeLimit: 60,
    scoreUnit: "PASSES",
    trafficScale: 0.9,
    trackId: "delta-run",
    stars: [15, 28, 43],
    setup() {
      effects.dim = 0;
    },
    update(_dt, run2) {
      const phase = run2.elapsed % CYCLE;
      let dim = 0;
      if (phase < DARK_SECONDS) {
        const t = phase / DARK_SECONDS;
        const edge2 = Math.min(t, 1 - t) / (FADE / DARK_SECONDS);
        dim = Math.min(1, Math.max(0, edge2)) * 0.94;
      }
      effects.dim = dim;
      run2.score = player.totalPasses;
      run2.progress = 1 - dim / 0.94;
    }
  };

  // src/modes/chainReaction.ts
  var CHAIN_WINDOW = 3.2;
  var ARM_COMBO = 5;
  var chain = 0;
  var best = 0;
  var chainReaction = {
    id: "chain-reaction",
    name: "CHAIN REACTION",
    rule: `${ARM_COMBO} 次超车装填 · 每次摧毁刷新 ${CHAIN_WINDOW} 秒窗口`,
    timeLimit: 75,
    scoreUnit: "CHAIN",
    trafficScale: 0.9,
    trackId: "long-bay",
    stars: [3, 6, 10],
    setup() {
      chain = 0;
      best = 0;
      player.fireball = 0;
    },
    update(_dt, run2) {
      if (player.fireball <= 0 && chain > 0) {
        chain = 0;
        run2.banner = "CHAIN BROKEN";
        run2.bannerTimer = 0.9;
      }
      if (player.fireball <= 0 && player.combo > 0 && player.combo % ARM_COMBO === 0) {
        player.fireball = CHAIN_WINDOW;
      }
      run2.score = best;
      run2.progress = player.fireball > 0 ? Math.min(1, player.fireball / CHAIN_WINDOW) : -1;
    },
    onContact() {
      return player.fireball > 0 ? "destroy" : "crash";
    },
    onDestroy(_car, run2) {
      chain += 1;
      if (chain > best) best = chain;
      player.fireball = CHAIN_WINDOW;
      run2.banner = `CHAIN x${chain}`;
      run2.bannerTimer = 0.7;
    },
    onCrash(run2) {
      chain = 0;
      run2.banner = "CHAIN LOST";
      run2.bannerTimer = 0.9;
    }
  };

  // src/modes/comboRacers.ts
  var comboRacers = {
    id: "combo-racers",
    name: "COMBO RACERS",
    rule: "限时 60 秒 · 看你能连超多少辆 · 撞车断连击",
    timeLimit: 60,
    scoreUnit: "COMBO",
    trafficScale: 1,
    trackId: "long-bay",
    stars: [12, 26, 40],
    update(_dt, run2) {
      run2.score = player.bestCombo;
      run2.progress = -1;
    },
    onCrash(run2) {
      run2.banner = "COMBO LOST";
      run2.bannerTimer = 1.1;
    }
  };

  // src/modes/deathRace.ts
  var deathRace = {
    id: "death-race",
    name: "DEATH RACE",
    rule: "限时 90 秒 · 撞毁场上全部车辆",
    timeLimit: 90,
    scoreUnit: "POINTS",
    trafficScale: 0.85,
    trackId: "delta-run",
    stars: [800, 2e3, 3600],
    // Contact always destroys here, never crashes, so there's no crash to wait
    // for — the clock has to be what ends the run.
    timeoutIsFinal: true,
    setup() {
      player.fireball = Number.POSITIVE_INFINITY;
    },
    update(_dt, run2, cars) {
      const remaining = cars.filter((car) => car.alive).length;
      run2.progress = cars.length === 0 ? 1 : run2.destroyed / cars.length;
      run2.score = run2.destroyed * 100 + Math.max(0, Math.floor(run2.timeRemaining)) * 20;
      if (remaining === 0) run2.banner = "ALL CLEAR";
    },
    onContact() {
      return "destroy";
    },
    cleared(_run, cars) {
      return cars.length > 0 && cars.every((car) => !car.alive);
    }
  };

  // src/modes/endurance.ts
  var RAMP_PER_SECOND = 8e-3;
  var baseline = [];
  var endurance = {
    id: "endurance",
    name: "ENDURANCE",
    rule: "无时间限制 · 一条命 · 车流永远在加速",
    timeLimit: Infinity,
    scoreUnit: "PASSES",
    trafficScale: 0.75,
    trackId: "long-bay",
    stars: [15, 35, 62],
    setup(_run, cars) {
      baseline = cars.map((car) => car.baseSpeed);
    },
    update(_dt, run2, cars) {
      const ramp = 1 + run2.elapsed * RAMP_PER_SECOND;
      cars.forEach((car, index) => {
        const original = baseline[index];
        if (original !== void 0) car.baseSpeed = original * ramp;
      });
      run2.score = player.totalPasses;
      run2.progress = -1;
    },
    onCrash(run2) {
      run2.outcome = "wrecked";
    }
  };

  // src/modes/fireballFrenzy.ts
  var COMBO_PER_FIREBALL = 10;
  var FIREBALL_DURATION = 6;
  var lastCharge = 0;
  var fireballFrenzy = {
    id: "fireball-frenzy",
    name: "FIREBALL FRENZY",
    rule: `每 ${COMBO_PER_FIREBALL} 次超车化身火球 · 火球状态撞车即摧毁`,
    timeLimit: 60,
    scoreUnit: "POINTS",
    trafficScale: 1,
    trackId: "long-bay",
    stars: [400, 1200, 2600],
    setup() {
      lastCharge = 0;
    },
    update(_dt, run2) {
      const charge2 = Math.floor(player.combo / COMBO_PER_FIREBALL);
      if (charge2 > lastCharge) {
        lastCharge = charge2;
        player.fireball = FIREBALL_DURATION;
        run2.banner = "FIREBALL!";
        run2.bannerTimer = 1.2;
      }
      run2.score = run2.destroyed * 200 + player.totalPasses * 10;
      run2.progress = player.fireball > 0 ? player.fireball / FIREBALL_DURATION : -1;
    },
    onContact(_car) {
      return player.fireball > 0 ? "destroy" : "crash";
    },
    onCrash(run2) {
      lastCharge = 0;
      run2.banner = "BURNED OUT";
      run2.bannerTimer = 1;
    }
  };

  // src/countdown.ts
  var COUNT_FROM = 3;
  var state2 = {
    remaining: 0
  };
  function beginCountdown(seconds = COUNT_FROM) {
    state2.remaining = seconds;
  }
  function countdownActive() {
    return state2.remaining > 0;
  }
  function updateCountdown(dt) {
    if (state2.remaining <= 0) return false;
    state2.remaining = Math.max(0, state2.remaining - dt);
    return true;
  }
  function countdownRemaining() {
    return state2.remaining;
  }
  function countdownLabel() {
    if (state2.remaining <= 0) return "";
    const step = Math.ceil(state2.remaining);
    return step > 0 ? String(step) : "GO";
  }
  function clearCountdown() {
    state2.remaining = 0;
  }

  // src/storage.ts
  var STORAGE_KEY = "harbor-loop-bests-v1";
  var cache = null;
  function readRaw() {
    try {
      const anyWx = wx;
      if (typeof anyWx.getStorageSync === "function") {
        const value = anyWx.getStorageSync(STORAGE_KEY);
        return typeof value === "string" && value ? value : null;
      }
    } catch (error) {
    }
    try {
      if (typeof localStorage !== "undefined") return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
    }
    return null;
  }
  function writeRaw(value) {
    try {
      const anyWx = wx;
      if (typeof anyWx.setStorageSync === "function") {
        anyWx.setStorageSync(STORAGE_KEY, value);
        return;
      }
    } catch (error) {
    }
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
    }
  }
  function table() {
    if (cache) return cache;
    const raw = readRaw();
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          cache = parsed;
          return cache;
        }
      } catch (error) {
      }
    }
    cache = {};
    return cache;
  }
  function key(modeId, difficulty) {
    return `${modeId}:${difficulty}`;
  }
  function bestScore(modeId, difficulty) {
    const value = table()[key(modeId, difficulty)];
    return typeof value === "number" ? value : null;
  }
  function submitScore(modeId, difficulty, score, lowerIsBetter) {
    const current = bestScore(modeId, difficulty);
    const improved = current === null || (lowerIsBetter ? score < current : score > current);
    if (!improved) return false;
    table()[key(modeId, difficulty)] = score;
    writeRaw(JSON.stringify(table()));
    return true;
  }
  var MUTE_KEY = "harbor-loop-muted-v1";
  function loadMuted() {
    try {
      const anyWx = wx;
      if (typeof anyWx.getStorageSync === "function") return anyWx.getStorageSync(MUTE_KEY) === "1";
    } catch (error) {
    }
    try {
      if (typeof localStorage !== "undefined") return localStorage.getItem(MUTE_KEY) === "1";
    } catch (error) {
    }
    return false;
  }
  function saveMuted(muted) {
    const value = muted ? "1" : "0";
    try {
      const anyWx = wx;
      if (typeof anyWx.setStorageSync === "function") {
        anyWx.setStorageSync(MUTE_KEY, value);
        return;
      }
    } catch (error) {
    }
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(MUTE_KEY, value);
    } catch (error) {
    }
  }
  var ONBOARDED_KEY = "harbor-loop-onboarded-v1";
  var STREAK_KEY = "harbor-loop-streak-v1";
  function readFlag(key2) {
    try {
      const anyWx = wx;
      if (typeof anyWx.getStorageSync === "function") {
        const value = anyWx.getStorageSync(key2);
        return typeof value === "string" && value ? value : null;
      }
    } catch (error) {
    }
    try {
      if (typeof localStorage !== "undefined") return localStorage.getItem(key2);
    } catch (error) {
    }
    return null;
  }
  function writeFlag(key2, value) {
    try {
      const anyWx = wx;
      if (typeof anyWx.setStorageSync === "function") {
        anyWx.setStorageSync(key2, value);
        return;
      }
    } catch (error) {
    }
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(key2, value);
    } catch (error) {
    }
  }
  function loadOnboarded() {
    return readFlag(ONBOARDED_KEY) === "1";
  }
  function saveOnboarded(done) {
    writeFlag(ONBOARDED_KEY, done ? "1" : "0");
  }
  function loadStreak() {
    const raw = readFlag(STREAK_KEY);
    if (!raw) return { days: 0, lastDay: "" };
    try {
      const parsed = JSON.parse(raw);
      return {
        days: typeof parsed.days === "number" ? parsed.days : 0,
        lastDay: typeof parsed.lastDay === "string" ? parsed.lastDay : ""
      };
    } catch (error) {
      return { days: 0, lastDay: "" };
    }
  }
  function saveStreak(streak) {
    writeFlag(STREAK_KEY, JSON.stringify(streak));
  }
  var DAILY_BEST_KEY = "harbor-loop-daily-best-v1";
  var dailyBestCache = null;
  function dailyBestTable() {
    if (dailyBestCache) return dailyBestCache;
    const raw = readFlag(DAILY_BEST_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          dailyBestCache = parsed;
          return dailyBestCache;
        }
      } catch (error) {
      }
    }
    dailyBestCache = {};
    return dailyBestCache;
  }
  function dailyBestScore(modeId) {
    const value = dailyBestTable()[modeId];
    return typeof value === "number" ? value : null;
  }
  function submitDailyBest(modeId, score) {
    const current = dailyBestScore(modeId);
    if (current !== null && score <= current) return false;
    dailyBestTable()[modeId] = score;
    writeFlag(DAILY_BEST_KEY, JSON.stringify(dailyBestTable()));
    return true;
  }
  function careerPoints() {
    return Object.entries(table()).reduce((total, [entryKey, value]) => {
      if (entryKey.startsWith("time-attack:")) return total;
      return total + (typeof value === "number" ? value : 0);
    }, 0);
  }

  // src/onboarding.ts
  var MAX_SECONDS = 12;
  var state3 = {
    active: false,
    usedLane: false,
    usedThrottle: false,
    elapsed: 0
  };
  function beginOnboarding() {
    if (loadOnboarded()) {
      state3.active = false;
      return;
    }
    state3.active = true;
    state3.usedLane = false;
    state3.usedThrottle = false;
    state3.elapsed = 0;
  }
  function onboardingActive() {
    return state3.active;
  }
  function noteLaneChange() {
    if (state3.active) state3.usedLane = true;
  }
  function noteThrottle() {
    if (state3.active) state3.usedThrottle = true;
  }
  function updateOnboarding(dt) {
    if (!state3.active) return;
    state3.elapsed += dt;
    if (state3.usedLane && state3.usedThrottle || state3.elapsed > MAX_SECONDS) {
      state3.active = false;
      saveOnboarded(true);
    }
  }
  function onboardingState() {
    return { lane: !state3.usedLane, throttle: !state3.usedThrottle };
  }
  function resetOnboarding() {
    saveOnboarded(false);
    state3.active = false;
  }

  // src/player.ts
  function laneInputStateAllows() {
    return player.state !== "CRASHED" && !countdownActive();
  }
  function requestLaneChange(direction) {
    if (!laneInputStateAllows()) return;
    audio.ensureStarted();
    const target = Math.max(0, Math.min(LANE_COUNT - 1, player.lane + direction));
    if (target === player.lane) return;
    noteLaneChange();
    audio.playLaneChange(direction);
    player.laneFrom = player.visualLane;
    player.laneTo = target;
    player.lane = target;
    player.laneChangeElapsed = 1e-4;
    if (player.state === "NORMAL" || player.state === "CHANGING_LANE") {
      player.state = "CHANGING_LANE";
    }
  }
  function setThrottle(active) {
    inputState.throttle = Boolean(active) && !countdownActive();
    if (inputState.throttle) {
      noteThrottle();
      audio.ensureStarted();
    }
  }
  function beginCollision() {
    if (player.invincible > 0 || player.state === "CRASHED") return;
    player.state = "CRASHED";
    player.stateElapsed = 0;
    player.speed = 0;
    player.invincible = tuning.profile.invincibleSeconds;
    player.combo = 0;
    player.tierBoostElapsed = 0;
    player.collisionCount += 1;
    vibrate("medium");
  }
  function updatePlayer(dt) {
    player.previousDistance = player.distance;
    player.previousVisualLane = player.visualLane;
    player.invincible = Math.max(0, player.invincible - dt);
    player.tierBoostElapsed = Math.max(0, player.tierBoostElapsed - dt);
    player.passPopElapsed += dt;
    if (Number.isFinite(player.fireball)) player.fireball = Math.max(0, player.fireball - dt);
    if (player.laneChangeElapsed > 0) {
      player.laneChangeElapsed += dt;
      const t = Math.min(1, player.laneChangeElapsed / CHANGE_DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      player.visualLane = player.laneFrom + (player.laneTo - player.laneFrom) * eased;
      if (t >= 1) {
        player.visualLane = player.laneTo;
        player.laneChangeElapsed = 0;
        if (player.state === "CHANGING_LANE") player.state = "NORMAL";
      }
    }
    if (player.state === "CRASHED") {
      player.stateElapsed += dt;
      player.speed = 0;
      if (player.stateElapsed >= 0.35) {
        player.state = "RECOVERING";
        player.stateElapsed = 0;
      }
    } else if (player.state === "RECOVERING") {
      player.stateElapsed += dt;
      const t = Math.min(1, player.stateElapsed / 0.7);
      player.speed = baseCruiseSpeed() * t;
      if (t >= 1) {
        player.speed = baseCruiseSpeed();
        player.state = "NORMAL";
        player.stateElapsed = 0;
      }
    } else {
      const targetSpeed = currentTargetSpeed();
      const acceleration = player.tierBoostElapsed > 0 ? PLAYER_TIER_ACCELERATION : PLAYER_ACCELERATION;
      const rate = targetSpeed >= player.speed ? acceleration : PLAYER_COAST_DECELERATION;
      player.speed = moveToward(player.speed, targetSpeed, rate * dt);
    }
    const before = player.distance;
    player.distance = advanceDistanceAtRoadSpeed(player.distance, player.speed, dt, player.visualLane);
    player.travelled += Math.max(0, player.distance - before);
    recordTrail();
    updateCornering(dt);
  }
  function updateCornering(dt) {
    const heading = sampleAtDistance(player.distance, player.visualLane).angle;
    let delta = heading - player.previousHeading;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    player.previousHeading = heading;
    const rate = Math.abs(delta) / Math.max(dt, 1e-4);
    const load = Math.min(1, rate * player.speed / 900);
    const response = load > player.cornering ? 9 : 3.2;
    player.cornering += (load - player.cornering) * (1 - Math.exp(-dt * response));
  }
  var TRAIL_LENGTH = 56;
  function recordTrail() {
    player.trail.push({ distance: player.distance, lane: player.visualLane });
    if (player.trail.length > TRAIL_LENGTH) player.trail.shift();
  }

  // src/modes/ghostLane.ts
  var SWITCH_SECONDS = 4.5;
  var WARNING_SECONDS = 1.2;
  var timer = 0;
  var nextLane = 0;
  var ghostLane = {
    id: "ghost-lane",
    name: "GHOST LANE",
    rule: "每隔几秒一条车道带电 · 提前 1.2 秒预警",
    timeLimit: 60,
    scoreUnit: "PASSES",
    trafficScale: 1,
    trackId: "delta-run",
    stars: [10, 20, 33],
    setup() {
      timer = SWITCH_SECONDS;
      nextLane = Math.floor(random() * LANE_COUNT);
      effects.hazardLane = -1;
    },
    update(dt, run2) {
      timer -= dt;
      if (timer <= 0) {
        effects.hazardLane = nextLane;
        let candidate = Math.floor(random() * LANE_COUNT);
        if (candidate === nextLane) candidate = (candidate + 1) % LANE_COUNT;
        nextLane = candidate;
        timer = SWITCH_SECONDS;
      } else if (timer <= WARNING_SECONDS) {
        effects.hazardLane = nextLane;
      }
      const live = timer > WARNING_SECONDS;
      if (live && effects.hazardLane >= 0 && Math.abs(player.visualLane - effects.hazardLane) < 0.45 && player.state !== "CRASHED" && player.invincible <= 0) {
        run2.banner = "ZAPPED";
        run2.bannerTimer = 1;
        beginCollision();
      }
      run2.score = player.totalPasses;
      run2.progress = Math.max(0, Math.min(1, timer / SWITCH_SECONDS));
    }
  };

  // src/modes/hotRods.ts
  var HEAT_RISE_SECONDS = 3.2;
  var HEAT_FALL_SECONDS = 2;
  var hotRods = {
    id: "hot-rods",
    name: "HOT RODS",
    rule: "油门会过热 · 限时 60 秒跑出最远距离",
    timeLimit: 60,
    scoreUnit: "METRES",
    trafficScale: 1,
    trackId: "delta-run",
    stars: [4e3, 8200, 12500],
    setup() {
      player.heat = 0;
    },
    update(dt, run2) {
      if (player.state === "CRASHED") {
        player.heat = Math.max(0, player.heat - dt / HEAT_FALL_SECONDS);
      } else if (inputState.throttle) {
        player.heat = Math.min(1, player.heat + dt / HEAT_RISE_SECONDS);
        if (player.heat >= 1) {
          player.heat = 0;
          run2.banner = "ENGINE BLOWN";
          run2.bannerTimer = 1.2;
          beginCollision();
        }
      } else {
        player.heat = Math.max(0, player.heat - dt / HEAT_FALL_SECONDS);
      }
      run2.score = Math.floor(player.travelled);
      run2.progress = player.heat;
    }
  };

  // src/modes/inTheZone.ts
  var ZONE_COUNT = 6;
  var ZONE_NEAR = 13;
  var ZONE_FAR = 66;
  var ZONE_LANE_TOLERANCE = 0.7;
  var ZONE_FILL_SECONDS = 2;
  var inTheZone = {
    id: "in-the-zone",
    name: "IN THE ZONE",
    rule: `跟住 ${ZONE_COUNT} 辆标记车尾流 · 待满即清除`,
    timeLimit: 75,
    scoreUnit: "POINTS",
    trafficScale: 0.9,
    trackId: "grand-oval",
    stars: [1e3, 2100, 3300],
    setup(_run, cars) {
      const stride = Math.max(1, Math.floor(cars.length / ZONE_COUNT));
      cars.forEach((car) => {
        car.hasZone = false;
        car.zoneFill = 0;
      });
      for (let i = 0; i < ZONE_COUNT; i++) {
        const car = cars[i * stride % cars.length];
        if (car) car.hasZone = true;
      }
    },
    update(dt, run2, cars) {
      let cleared = 0;
      let marked = 0;
      for (const car of cars) {
        if (!car.alive) continue;
        if (!car.hasZone) {
          if (car.zoneFill >= 1) cleared += 1;
          continue;
        }
        marked += 1;
        const gap = forwardPathDistance(player.distance, car.distance);
        const inBand = gap > ZONE_NEAR && gap < ZONE_FAR;
        const inLane = Math.abs(player.visualLane - car.visualLane) < ZONE_LANE_TOLERANCE;
        if (inBand && inLane && player.state !== "CRASHED") {
          car.zoneFill = Math.min(1, car.zoneFill + dt / ZONE_FILL_SECONDS);
          if (car.zoneFill >= 1) {
            car.hasZone = false;
            run2.banner = "ZONE CLEAR";
            run2.bannerTimer = 0.9;
          }
        } else {
          car.zoneFill = Math.max(0, car.zoneFill - dt * 0.55);
        }
      }
      run2.score = cleared * 500 + Math.max(0, Math.floor(run2.timeRemaining)) * 5;
      run2.progress = Math.min(1, cleared / Math.max(1, cleared + marked));
    },
    cleared(_run, cars) {
      return cars.every((car) => !car.hasZone);
    }
  };

  // src/modes/lastMan.ts
  var CULL_INTERVAL = 4;
  var timer2 = 0;
  var lastMan = {
    id: "last-man",
    name: "LAST MAN",
    rule: "对手每 4 秒自爆一辆 · 车越少分越难拿",
    timeLimit: 75,
    scoreUnit: "PASSES",
    trafficScale: 0.95,
    trackId: "delta-run",
    stars: [12, 24, 38],
    setup() {
      timer2 = CULL_INTERVAL;
    },
    update(dt, run2, cars) {
      timer2 -= dt;
      if (timer2 <= 0) {
        timer2 = CULL_INTERVAL;
        const alive2 = cars.filter((car) => car.alive);
        if (alive2.length > 2) {
          const victim = alive2[Math.floor(random() * alive2.length)];
          victim.alive = false;
          victim.wreck = 1;
          run2.banner = `${alive2.length - 1} LEFT`;
          run2.bannerTimer = 0.8;
        }
      }
      run2.score = player.totalPasses;
      const alive = cars.filter((car) => car.alive).length;
      run2.progress = cars.length === 0 ? 0 : alive / cars.length;
    }
  };

  // src/modes/paceSetter.ts
  var BAND_HALF_WIDTH = 26;
  var BAND_MIN = 150;
  var BAND_MAX = 430;
  var BAND_PERIOD = 13;
  var inBandSeconds = 0;
  function paceTarget(elapsed) {
    const t = (Math.sin(elapsed / BAND_PERIOD * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    return BAND_MIN + (BAND_MAX - BAND_MIN) * t;
  }
  var paceSetter = {
    id: "pace-setter",
    name: "PACE SETTER",
    rule: "把车速保持在移动的目标区间内 · 计时 60 秒",
    timeLimit: 60,
    scoreUnit: "POINTS",
    trafficScale: 0.85,
    trackId: "grand-oval",
    stars: [1200, 2600, 4100],
    setup() {
      inBandSeconds = 0;
    },
    update(dt, run2) {
      const target = paceTarget(run2.elapsed);
      const delta = Math.abs(player.speed - target);
      const inside = delta <= BAND_HALF_WIDTH && player.state !== "CRASHED";
      if (inside) inBandSeconds += dt;
      run2.score = Math.floor(inBandSeconds * 100);
      run2.progress = Math.max(0, 1 - delta / (BAND_HALF_WIDTH * 3));
    }
  };

  // src/modes/rushHour.ts
  var RAMP_PER_SECOND2 = 0.011;
  var baseline2 = [];
  var rushHour = {
    id: "rush-hour",
    name: "RUSH HOUR",
    rule: "车流持续提速 · 撑满 75 秒超越尽可能多的车",
    timeLimit: 75,
    scoreUnit: "PASSES",
    trafficScale: 0.8,
    trackId: "grand-oval",
    stars: [18, 33, 50],
    setup(_run, cars) {
      baseline2 = cars.map((car) => car.baseSpeed);
    },
    update(_dt, run2, cars) {
      const ramp = 1 + run2.elapsed * RAMP_PER_SECOND2;
      cars.forEach((car, index) => {
        const original = baseline2[index];
        if (original !== void 0) car.baseSpeed = original * ramp;
      });
      run2.score = player.totalPasses;
      run2.progress = Math.min(1, (ramp - 1) / (RAMP_PER_SECOND2 * 75));
    }
  };

  // src/modes/slipstream.ts
  var TUCK_NEAR = 11;
  var TUCK_FAR = 30;
  var CHARGE_SECONDS = 1.6;
  var charge = 0;
  var slipstream = {
    id: "slipstream",
    name: "SLIPSTREAM",
    rule: "贴住前车尾流蓄力 · 满蓄时超车得双倍分",
    timeLimit: 60,
    scoreUnit: "POINTS",
    trafficScale: 0.95,
    trackId: "long-bay",
    stars: [1400, 3e3, 5e3],
    setup() {
      charge = 0;
    },
    update(dt, run2, cars) {
      let tucked = false;
      for (const car of cars) {
        if (!car.alive) continue;
        const gap = forwardPathDistance(player.distance, car.distance);
        if (gap > TUCK_NEAR && gap < TUCK_FAR && Math.abs(player.visualLane - car.visualLane) < 0.6) {
          tucked = true;
          break;
        }
      }
      charge = tucked ? Math.min(1, charge + dt / CHARGE_SECONDS) : Math.max(0, charge - dt * 0.35);
      run2.progress = charge;
    },
    onOvertake(count, run2) {
      const multiplier = charge >= 1 ? 2 : 1;
      if (multiplier === 2) {
        run2.banner = "SLIPSTREAM x2";
        run2.bannerTimer = 0.8;
        charge = 0;
      }
      run2.score += count * 100 * multiplier;
    },
    onCrash(run2) {
      charge = 0;
      run2.banner = "SPUN OUT";
      run2.bannerTimer = 0.9;
    }
  };

  // src/modes/speedMonkey.ts
  var speedMonkey = {
    id: "speed-monkey",
    name: "SPEED MONKEY",
    rule: "速度只增不减 · 撞一次就结束",
    timeLimit: Infinity,
    scoreUnit: "COMBO",
    trafficScale: 1,
    trackId: "long-bay",
    stars: [10, 26, 48],
    update(_dt, run2) {
      run2.progress = -1;
      if (player.combo > run2.score) run2.score = player.combo;
    },
    onCrash(run2) {
      run2.outcome = "wrecked";
    }
  };

  // src/modes/sundayDrivers.ts
  var sundayDrivers = {
    id: "sunday-drivers",
    name: "SUNDAY DRIVERS",
    rule: "车流极慢 · 限时 60 秒超越尽可能多的车",
    timeLimit: 60,
    scoreUnit: "PASSES",
    trafficScale: 0.42,
    trackId: "grand-oval",
    stars: [30, 55, 82],
    update(_dt, run2) {
      run2.score = player.totalPasses;
      run2.progress = -1;
    },
    onCrash(run2) {
      run2.banner = `CRASH x${run2.crashes}`;
      run2.bannerTimer = 0.9;
    }
  };

  // src/modes/timeAttack.ts
  var LAPS = 3;
  var startDistance = 0;
  var timeAttack = {
    id: "time-attack",
    name: "TIME ATTACK",
    rule: `跑完 ${LAPS} 圈 · 用时越短越好`,
    timeLimit: 180,
    scoreUnit: "SECONDS",
    trafficScale: 0.9,
    trackId: "grand-oval",
    stars: [95, 80, 68],
    lowerIsBetter: true,
    setup() {
      startDistance = player.distance;
    },
    update(_dt, run2) {
      const lapsDone = (player.distance - startDistance) / arc.total;
      run2.progress = Math.min(1, lapsDone / LAPS);
      run2.score = Math.round(run2.elapsed * 10) / 10;
    },
    cleared() {
      return (player.distance - startDistance) / arc.total >= LAPS;
    }
  };

  // src/modes/index.ts
  var MODES = [
    speedMonkey,
    comboRacers,
    sundayDrivers,
    fireballFrenzy,
    deathRace,
    inTheZone,
    hotRods,
    slipstream,
    ghostLane,
    rushHour,
    paceSetter,
    lastMan,
    chainReaction,
    blackout,
    timeAttack,
    endurance
  ];
  var ORIGINAL_MODE_IDS = /* @__PURE__ */ new Set([
    "speed-monkey",
    "combo-racers",
    "sunday-drivers",
    "fireball-frenzy",
    "death-race",
    "in-the-zone",
    "hot-rods"
  ]);
  var RELEASED_MODE_IDS = /* @__PURE__ */ new Set(["combo-racers"]);
  var RELEASED_MODES = MODES.filter((mode) => RELEASED_MODE_IDS.has(mode.id));
  var BY_ID2 = new Map(MODES.map((mode) => [mode.id, mode]));
  function modeById(id) {
    const mode = BY_ID2.get(id);
    if (!mode) throw new Error(`unknown mode: ${id}`);
    return mode;
  }

  // src/daily.ts
  var DAILY_POOL = RELEASED_MODES.filter((mode) => !mode.lowerIsBetter).map((mode) => mode.id);
  function pad(value) {
    return value < 10 ? `0${value}` : String(value);
  }
  function todayKey(now = /* @__PURE__ */ new Date()) {
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }
  function dailyPlan(day = todayKey()) {
    const seed = hashSeed(`harbor-loop:${day}`);
    const modeIndex = hashSeed(`mode:${day}`) % DAILY_POOL.length;
    return { day, modeId: DAILY_POOL[modeIndex], seed };
  }

  // src/render/icons.ts
  function drawStar(cx, cy, radius, color, filled) {
    const inner = radius * 0.45;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? radius : inner;
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (filled) {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  }
  function drawLock(cx, cy, size, color) {
    const bodyW = size;
    const bodyH = size * 0.78;
    const bodyY = cy - bodyH / 2 + size * 0.16;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.4, size * 0.16);
    ctx.beginPath();
    ctx.arc(cx, bodyY, bodyW * 0.32, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(cx - bodyW / 2, bodyY, bodyW, bodyH);
    ctx.fill();
    ctx.restore();
  }
  function drawSpeaker(cx, cy, size, color, on) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.2, size * 0.16);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.6, cy - size * 0.28);
    ctx.lineTo(cx - size * 0.2, cy - size * 0.28);
    ctx.lineTo(cx + size * 0.18, cy - size * 0.62);
    ctx.lineTo(cx + size * 0.18, cy + size * 0.62);
    ctx.lineTo(cx - size * 0.2, cy + size * 0.28);
    ctx.lineTo(cx - size * 0.6, cy + size * 0.28);
    ctx.closePath();
    ctx.fill();
    if (on) {
      ctx.beginPath();
      ctx.arc(cx + size * 0.24, cy, size * 0.42, -0.9, 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + size * 0.24, cy, size * 0.72, -0.8, 0.8);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx + size * 0.32, cy - size * 0.42);
      ctx.lineTo(cx + size * 0.86, cy + size * 0.42);
      ctx.stroke();
    }
    ctx.restore();
  }

  // src/theme.ts
  var COLORS = {
    water: "#9DB5C0",
    waterDeep: "#8FA9B6",
    waterLine: "rgba(255,255,255,0.14)",
    land: "#C6CE7E",
    landLight: "#D4DA92",
    landDark: "#A8B265",
    rock: "#7C7C74",
    roadShadow: "rgba(70,78,84,0.30)",
    roadEdge: "#B9B9B1",
    /** Tan lines run along both sides of the road, as on the original circuit. */
    curbLight: "#E3C25E",
    curbRed: "#D8B44E",
    road: "#D9D9D2",
    /** Every other lane, so the channels read without dashed dividers. */
    roadAlt: "#C4C4BC",
    roadHighlight: "rgba(255,255,255,0.18)",
    lane: "rgba(255,255,255,0.7)",
    player: "#E8452F",
    playerLight: "#FF7A5E",
    playerStripe: "#FFF4D8",
    window: "#BFEAF2",
    ai: "#2C6EA8",
    aiLight: "#4FA8DC",
    aiWindow: "#BEE9F7",
    text: "#F7F4EA",
    muted: "rgba(247,244,234,0.66)",
    accent: "#2BB6C4",
    accentLight: "#8FF0FA",
    button: "rgba(8,17,25,0.82)",
    buttonActive: "rgba(87,213,203,0.30)",
    buttonDisabled: "rgba(8,17,25,0.42)",
    buttonEdge: "rgba(247,244,234,0.28)"
  };
  var UI = {
    ground: "#12384E",
    groundDeep: "#0A2233",
    groundStripe: "rgba(255,255,255,0.028)",
    card: "#FFF6E4",
    cardAlt: "#FFEDCC",
    ink: "#22323F",
    inkSoft: "#6C7C88",
    outline: "#152532",
    primary: "#FFB43C",
    primaryDeep: "#E38C15",
    good: "#5FCF80",
    bad: "#FF6B5E",
    chip: "#1B3F55"
  };

  // src/shareCard.ts
  var CARD_W = 500;
  var CARD_H = 400;
  var cardCanvas = null;
  var cardCtx = null;
  function ensureCanvas() {
    if (cardCanvas && cardCtx) return true;
    cardCanvas = createOffscreenCanvas(CARD_W, CARD_H);
    cardCtx = cardCanvas ? cardCanvas.getContext("2d") : null;
    return Boolean(cardCanvas && cardCtx);
  }
  function drawTrackSketch(target, cx, cy, height) {
    if (centerPath.length < 2) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const point of centerPath) {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
    }
    const scale2 = height / Math.max(1, maxY - minY);
    const originX = cx - (minX + maxX) / 2 * scale2;
    const originY = cy - (minY + maxY) / 2 * scale2;
    target.save();
    target.beginPath();
    for (let i = 0; i < centerPath.length; i++) {
      const x = originX + centerPath[i].x * scale2;
      const y = originY + centerPath[i].y * scale2;
      if (i === 0) target.moveTo(x, y);
      else target.lineTo(x, y);
    }
    target.closePath();
    target.strokeStyle = "rgba(255,246,228,0.16)";
    target.lineWidth = 9;
    target.lineJoin = "round";
    target.stroke();
    target.restore();
  }
  function renderShareCard(data) {
    if (!ensureCanvas() || !cardCanvas || !cardCtx) return null;
    const target = cardCtx;
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.fillStyle = UI.ground;
    target.fillRect(0, 0, CARD_W, CARD_H);
    target.save();
    target.fillStyle = "rgba(255,255,255,0.03)";
    for (let i = -CARD_H; i < CARD_W + CARD_H; i += 46) {
      target.beginPath();
      target.moveTo(i, 0);
      target.lineTo(i + 20, 0);
      target.lineTo(i + 20 + CARD_H, CARD_H);
      target.lineTo(i + CARD_H, CARD_H);
      target.closePath();
      target.fill();
    }
    target.restore();
    drawTrackSketch(target, CARD_W - 108, CARD_H / 2, CARD_H * 0.78);
    withRenderTarget(target, () => {
      const mode = modeById(data.modeId);
      target.textAlign = "left";
      target.fillStyle = UI.primary;
      target.font = "900 20px sans-serif";
      target.fillText("心跳加速-冲刺", 40, 56);
      target.fillStyle = UI.card;
      target.font = "900 34px sans-serif";
      target.fillText(data.daily ? "每日挑战" : mode.name, 40, 108);
      target.fillStyle = "rgba(255,246,228,0.6)";
      target.font = "700 15px sans-serif";
      target.fillText(data.difficultyLabel, 40, 134);
      target.fillStyle = UI.card;
      target.font = "900 92px monospace";
      target.fillText(String(data.score), 38, 236);
      target.fillStyle = "rgba(255,246,228,0.6)";
      target.font = "900 16px sans-serif";
      target.fillText(data.scoreUnit, 42, 264);
      for (let i = 0; i < 3; i++) {
        drawStar(56 + i * 40, 310, 16, i < data.stars ? UI.primary : "rgba(255,246,228,0.18)", i < data.stars);
      }
      target.fillStyle = "rgba(255,246,228,0.45)";
      target.font = "700 14px sans-serif";
      target.fillText("来超我", 40, 364);
    });
    const canvas2 = cardCanvas;
    if (typeof canvas2.toTempFilePathSync !== "function") return null;
    try {
      return canvas2.toTempFilePathSync({
        x: 0,
        y: 0,
        width: CARD_W,
        height: CARD_H,
        destWidth: CARD_W,
        destHeight: CARD_H,
        fileType: "png"
      });
    } catch (error) {
      return null;
    }
  }

  // src/share.ts
  var context = null;
  function setShareContext(next) {
    context = next;
  }
  function shareTitle() {
    if (!context) return "心跳加速-冲刺 — 16 种模式的像素赛车";
    if (context.daily) {
      return `每日挑战我拿了 ${context.score}，你能过吗`;
    }
    const mode = modeById(context.modeId);
    return `我在 ${mode.name}(${DIFFICULTY_LABEL[context.difficulty]}) 拿了 ${context.score} ${context.scoreUnit}，来超我`;
  }
  function shareQuery() {
    if (!context) return "";
    return `mode=${context.modeId}&difficulty=${context.difficulty}`;
  }
  function shareImage() {
    if (!context) return void 0;
    const path = renderShareCard({
      modeId: context.modeId,
      difficulty: context.difficulty,
      difficultyLabel: DIFFICULTY_LABEL[context.difficulty],
      score: context.score,
      scoreUnit: context.scoreUnit,
      stars: context.stars,
      daily: context.daily
    });
    return path != null ? path : void 0;
  }
  function shareRun() {
    const api2 = wx;
    if (typeof api2.shareAppMessage !== "function") return;
    try {
      api2.shareAppMessage({ title: shareTitle(), query: shareQuery(), imageUrl: shareImage() });
    } catch (error) {
    }
  }
  function installShareMenu() {
    var _a, _b;
    const api2 = wx;
    try {
      (_a = api2.showShareMenu) == null ? void 0 : _a.call(api2, { withShareTicket: true });
      (_b = api2.onShareAppMessage) == null ? void 0 : _b.call(api2, () => ({ title: shareTitle(), query: shareQuery(), imageUrl: shareImage() }));
    } catch (error) {
    }
  }

  // src/cloud.ts
  var CLOUD_ENV = "";
  var initialised = false;
  var unavailable = false;
  function api() {
    if (unavailable) return null;
    const scope = wx;
    const cloud = scope.cloud;
    if (!cloud || typeof cloud.callFunction !== "function" || !CLOUD_ENV) {
      unavailable = true;
      return null;
    }
    if (!initialised) {
      try {
        cloud.init({ env: CLOUD_ENV, traceUser: true });
        initialised = true;
      } catch (error) {
        unavailable = true;
        return null;
      }
    }
    return cloud;
  }
  function cloudAvailable() {
    return api() !== null;
  }
  function callFunction(name, data) {
    const cloud = api();
    if (!cloud) return Promise.resolve(null);
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      try {
        cloud.callFunction({
          name,
          data,
          success: (res) => {
            var _a;
            return finish((_a = res == null ? void 0 : res.result) != null ? _a : null);
          },
          fail: () => finish(null)
        });
      } catch (error) {
        finish(null);
      }
      setTimeout(() => finish(null), 6e3);
    });
  }

  // src/leaderboard.ts
  var openDataContext = null;
  var openDataChecked = false;
  function context2() {
    if (openDataChecked) return openDataContext;
    openDataChecked = true;
    const api2 = wx;
    if (typeof api2.getOpenDataContext === "function") {
      try {
        openDataContext = api2.getOpenDataContext();
      } catch (error) {
        openDataContext = null;
      }
    }
    return openDataContext;
  }
  function leaderboardAvailable() {
    return context2() !== null;
  }
  function submitFriendScore(points) {
    const api2 = wx;
    if (typeof api2.setUserCloudStorage !== "function") return;
    try {
      api2.setUserCloudStorage({
        // WeChat requires string values; the key is what the open data context reads.
        KVDataList: [{ key: "career", value: String(Math.round(points)) }],
        fail: () => {
        }
      });
    } catch (error) {
    }
  }
  function requestFriendRanking(width, height, dpr) {
    const ctx2 = context2();
    if (!ctx2) return;
    try {
      ctx2.canvas.width = Math.floor(width * dpr);
      ctx2.canvas.height = Math.floor(height * dpr);
      ctx2.postMessage({ type: "render", key: "career", width, height, dpr });
    } catch (error) {
    }
  }
  function sharedCanvas() {
    const ctx2 = context2();
    return ctx2 ? ctx2.canvas : null;
  }
  var boards = /* @__PURE__ */ new Map();
  function boardKey(modeId, difficulty, day) {
    return `${modeId}:${difficulty}:${day}`;
  }
  function globalBoardAvailable() {
    return cloudAvailable();
  }
  function submitGlobalScore(modeId, difficulty, score, lowerIsBetter, day = "") {
    if (!cloudAvailable()) return;
    void callFunction("submitScore", { modeId, difficulty, score, lowerIsBetter, day });
    boards.delete(boardKey(modeId, difficulty, day));
  }
  function globalBoard(modeId, difficulty, day = "") {
    const key2 = boardKey(modeId, difficulty, day);
    const cached = boards.get(key2);
    if (cached) return cached;
    const board = {
      rows: [],
      selfRank: null,
      total: 0,
      state: cloudAvailable() ? "loading" : "unavailable"
    };
    boards.set(key2, board);
    if (board.state === "unavailable") return board;
    void callFunction("topScores", { modeId, difficulty, day, limit: 20 }).then((result) => {
      var _a, _b, _c;
      if (!result || !result.ok) {
        board.state = "failed";
        return;
      }
      board.rows = (_a = result.rows) != null ? _a : [];
      board.selfRank = (_b = result.selfRank) != null ? _b : null;
      board.total = (_c = result.total) != null ? _c : 0;
      board.state = "ready";
    });
    return board;
  }

  // src/progress.ts
  var MAX_STARS_PER_ENTRY = 3;
  var unlockOverride = false;
  function setUnlockOverride(value) {
    unlockOverride = value;
  }
  var STARTING_MODE_COUNT = 3;
  var MODE_UNLOCK_COST = [3, 6, 10, 14, 19, 24, 30, 36, 43, 50, 58, 66, 75];
  var DIFFICULTY_STAR_SCALE = {
    master: 1
  };
  function starTarget(mode, tier, difficulty) {
    const base = mode.stars[tier];
    const scale2 = DIFFICULTY_STAR_SCALE[difficulty];
    return mode.lowerIsBetter ? base / scale2 : base * scale2;
  }
  function starsFor(modeId, difficulty) {
    const best2 = bestScore(modeId, difficulty);
    if (best2 === null) return 0;
    const mode = modeById(modeId);
    let earned = 0;
    for (let tier = 0; tier < MAX_STARS_PER_ENTRY; tier++) {
      const target = starTarget(mode, tier, difficulty);
      const reached = mode.lowerIsBetter ? best2 <= target : best2 >= target;
      if (reached) earned = tier + 1;
    }
    return earned;
  }
  function totalStars() {
    let total = 0;
    for (const mode of RELEASED_MODES) {
      for (const difficulty of DIFFICULTIES) {
        total += starsFor(mode.id, difficulty);
      }
    }
    return total;
  }
  function maxStars() {
    return RELEASED_MODES.length * DIFFICULTIES.length * MAX_STARS_PER_ENTRY;
  }
  function modeUnlockCost(modeId) {
    var _a;
    const index = RELEASED_MODES.findIndex((mode) => mode.id === modeId);
    if (index < 0) return 0;
    if (index < STARTING_MODE_COUNT) return 0;
    return (_a = MODE_UNLOCK_COST[index - STARTING_MODE_COUNT]) != null ? _a : 0;
  }
  function modeUnlocked(modeId, stars = totalStars()) {
    if (unlockOverride) return true;
    if (!RELEASED_MODE_IDS.has(modeId)) return false;
    return stars >= modeUnlockCost(modeId);
  }
  function nextUnlock() {
    const stars = totalStars();
    for (const mode of RELEASED_MODES) {
      const cost = modeUnlockCost(mode.id);
      if (stars < cost) return { label: mode.name, cost };
    }
    return null;
  }
  function nextStarTarget(modeId, difficulty) {
    const mode = modeById(modeId);
    const earned = starsFor(modeId, difficulty);
    if (earned >= MAX_STARS_PER_ENTRY) return null;
    return Math.round(starTarget(mode, earned, difficulty));
  }

  // src/clock.ts
  var MAX_DELTA = 0.05;
  var NOMINAL_DELTA = 1 / 60;
  var lastTime = null;
  var restarting = true;
  function frameDelta(now) {
    if (restarting || lastTime === null) {
      restarting = false;
      lastTime = now;
      return NOMINAL_DELTA;
    }
    const dt = Math.min(MAX_DELTA, Math.max(0, (now - lastTime) / 1e3));
    lastTime = now;
    return dt;
  }
  function resetClock() {
    restarting = true;
  }

  // src/streak.ts
  function previousDay(day) {
    const [year, month, date] = day.split("-").map(Number);
    if (!year || !month || !date) return "";
    const stamp = new Date(year, month - 1, date);
    stamp.setDate(stamp.getDate() - 1);
    const pad2 = (value) => value < 10 ? `0${value}` : String(value);
    return `${stamp.getFullYear()}-${pad2(stamp.getMonth() + 1)}-${pad2(stamp.getDate())}`;
  }
  function touchStreak(today = todayKey()) {
    const current = loadStreak();
    if (current.lastDay === today) return current;
    const next = {
      days: current.lastDay === previousDay(today) ? current.days + 1 : 1,
      lastDay: today
    };
    saveStreak(next);
    return next;
  }
  function currentStreak(today = todayKey()) {
    const streak = loadStreak();
    if (streak.lastDay === today || streak.lastDay === previousDay(today)) return streak.days;
    return 0;
  }

  // src/render/particles.ts
  var POOL_SIZE = 160;
  var pool = Array.from({ length: POOL_SIZE }, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 1,
    size: 1,
    drag: 3,
    color: "#fff",
    streak: false
  }));
  var nextIndex = 0;
  function take() {
    for (let i = 0; i < POOL_SIZE; i++) {
      const candidate = pool[(nextIndex + i) % POOL_SIZE];
      if (candidate.life <= 0) {
        nextIndex = (nextIndex + i + 1) % POOL_SIZE;
        return candidate;
      }
    }
    const particle = pool[nextIndex];
    nextIndex = (nextIndex + 1) % POOL_SIZE;
    return particle;
  }
  function burst(x, y, options) {
    var _a, _b, _c;
    const spread = (_a = options.spread) != null ? _a : Math.PI * 2;
    const base = (_b = options.angle) != null ? _b : 0;
    for (let i = 0; i < options.count; i++) {
      const particle = take();
      const angle = base + (Math.random() - 0.5) * spread;
      const speed = options.speed * (0.55 + Math.random() * 0.75);
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.maxLife = options.life * (0.7 + Math.random() * 0.6);
      particle.life = particle.maxLife;
      particle.size = options.size * (0.7 + Math.random() * 0.7);
      particle.drag = (_c = options.drag) != null ? _c : 3.2;
      particle.color = options.colors[Math.floor(Math.random() * options.colors.length)];
      particle.streak = Boolean(options.streak);
    }
  }
  function updateParticles(dt) {
    for (const particle of pool) {
      if (particle.life <= 0) continue;
      particle.life -= dt;
      const decay = Math.max(0, 1 - particle.drag * dt);
      particle.vx *= decay;
      particle.vy *= decay;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    }
  }
  function drawParticles() {
    ctx.save();
    for (const particle of pool) {
      if (particle.life <= 0) continue;
      const t = particle.life / particle.maxLife;
      ctx.globalAlpha = Math.min(1, t * 1.4);
      ctx.fillStyle = particle.color;
      if (particle.streak) {
        const length = Math.min(14, Math.hypot(particle.vx, particle.vy) * 0.035);
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = particle.size * t;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.vx * 0.02, particle.y - particle.vy * 0.02);
        ctx.stroke();
        void length;
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * t, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  function clearParticles() {
    for (const particle of pool) particle.life = 0;
  }
  function activeParticles() {
    let count = 0;
    for (const particle of pool) if (particle.life > 0) count += 1;
    return count;
  }
  var FLOATER_POOL = 8;
  var FLOATER_CEILING = 78;
  var floaters = Array.from({ length: FLOATER_POOL }, () => ({
    x: 0,
    y: 0,
    text: "",
    life: 0,
    maxLife: 1,
    size: 12,
    color: "#fff"
  }));
  var nextFloater = 0;
  function floatText(x, y, text, color, size = 26, life = 1.05) {
    const floater = floaters[nextFloater];
    nextFloater = (nextFloater + 1) % FLOATER_POOL;
    floater.x = x;
    floater.y = y;
    floater.text = text;
    floater.color = color;
    floater.size = size;
    floater.maxLife = life;
    floater.life = floater.maxLife;
  }
  function updateFloaters(dt) {
    for (const floater of floaters) {
      if (floater.life <= 0) continue;
      floater.life -= dt;
      const age = 1 - floater.life / floater.maxLife;
      floater.y -= dt * 34 * Math.max(0.15, 1 - age);
      if (floater.y < FLOATER_CEILING) floater.y = FLOATER_CEILING;
    }
  }
  function drawFloaters() {
    ctx.save();
    ctx.textAlign = "center";
    for (const floater of floaters) {
      if (floater.life <= 0) continue;
      const t = floater.life / floater.maxLife;
      const age = 1 - t;
      const pop = age < 0.16 ? 0.5 + age / 0.16 * 0.72 : 1.22 - Math.min(1, (age - 0.16) / 0.2) * 0.22;
      ctx.globalAlpha = Math.min(1, t * 3);
      ctx.save();
      ctx.translate(floater.x, floater.y);
      ctx.scale(pop, pop);
      ctx.font = `900 ${floater.size}px monospace`;
      ctx.lineWidth = floater.size * 0.28;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(6,14,20,0.9)";
      ctx.strokeText(floater.text, 0, 0);
      ctx.fillStyle = floater.color;
      ctx.fillText(floater.text, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
  function clearFloaters() {
    for (const floater of floaters) floater.life = 0;
  }

  // src/feel.ts
  var MAX_SHAKE = 9;
  var state4 = {
    /** Seconds of simulation freeze left. */
    hitStop: 0,
    shake: 0,
    shakeAngle: 0,
    shakeTime: 0
  };
  function addHitStop(seconds) {
    state4.hitStop = Math.max(state4.hitStop, seconds);
  }
  function addShake(strength, angle = Math.random() * Math.PI * 2) {
    if (strength <= state4.shake) return;
    state4.shake = Math.min(MAX_SHAKE, strength);
    state4.shakeAngle = angle;
    state4.shakeTime = 0;
  }
  function consumeHitStop(dt) {
    if (state4.hitStop <= 0) return dt;
    state4.hitStop = Math.max(0, state4.hitStop - dt);
    return 0;
  }
  function updateFeel(dt) {
    state4.shakeTime += dt;
    state4.shake = Math.max(0, state4.shake - dt * 52);
  }
  function shakeOffsetX() {
    if (state4.shake <= 0) return 0;
    return Math.cos(state4.shakeAngle + state4.shakeTime * 47) * state4.shake;
  }
  function shakeOffsetY() {
    if (state4.shake <= 0) return 0;
    return Math.sin(state4.shakeAngle + state4.shakeTime * 41) * state4.shake * 0.7;
  }
  function resetFeel() {
    state4.hitStop = 0;
    state4.shake = 0;
    state4.shakeTime = 0;
  }
  function feelState() {
    return { hitStop: state4.hitStop, shake: state4.shake };
  }

  // src/run.ts
  var run = {
    modeId: MODES[0].id,
    difficulty: DEFAULT_DIFFICULTY,
    elapsed: 0,
    timeRemaining: Infinity,
    score: 0,
    destroyed: 0,
    crashes: 0,
    closeCalls: 0,
    daily: false,
    revives: 0,
    outcome: "running",
    progress: -1,
    banner: "",
    bannerTimer: 0
  };
  var activeMode = MODES[0];
  function startRun(modeId, difficulty, daily, trackId) {
    var _a;
    activeMode = modeById(modeId);
    if (daily) setSeed(daily.seed);
    else clearSeed();
    setTrack(trackId != null ? trackId : activeMode.trackId);
    applyTuning(difficulty, activeMode.trafficScale);
    resetGame();
    resetEffects();
    resetFeel();
    clearParticles();
    clearFloaters();
    resetClock();
    beginCountdown();
    beginOnboarding();
    touchStreak();
    run.modeId = modeId;
    run.difficulty = difficulty;
    run.elapsed = 0;
    run.timeRemaining = activeMode.timeLimit;
    run.score = 0;
    run.destroyed = 0;
    run.crashes = 0;
    run.closeCalls = 0;
    run.daily = Boolean(daily);
    run.revives = 0;
    run.outcome = "running";
    run.progress = -1;
    run.banner = "";
    run.bannerTimer = 0;
    (_a = activeMode.setup) == null ? void 0 : _a.call(activeMode, run, aiCars);
  }
  function updateRun(dt) {
    var _a, _b, _c;
    if (run.outcome !== "running") return;
    run.elapsed += dt;
    if (Number.isFinite(run.timeRemaining)) {
      run.timeRemaining = Math.max(0, run.timeRemaining - dt);
    }
    run.bannerTimer = Math.max(0, run.bannerTimer - dt);
    if (run.bannerTimer <= 0) run.banner = "";
    (_a = activeMode.update) == null ? void 0 : _a.call(activeMode, dt, run, aiCars);
    if (run.outcome !== "running") return;
    if ((_b = activeMode.cleared) == null ? void 0 : _b.call(activeMode, run, aiCars)) run.outcome = "cleared";
    if (run.outcome !== "running") return;
    if ((_c = activeMode.failed) == null ? void 0 : _c.call(activeMode, run, aiCars)) run.outcome = "wrecked";
    else if (run.timeRemaining <= 0) {
      if (activeMode.timeoutIsFinal || player.state === "CRASHED") run.outcome = "timeout";
    }
  }
  function runIsOver() {
    return run.outcome !== "running";
  }
  var MAX_REVIVES = 1;
  function reviveAvailable() {
    if (run.revives >= MAX_REVIVES) return false;
    return run.outcome === "wrecked" || run.outcome === "timeout";
  }
  function revive() {
    if (!reviveAvailable()) return;
    run.revives += 1;
    run.outcome = "running";
    run.banner = "REVIVED";
    run.bannerTimer = 1.4;
    if (Number.isFinite(run.timeRemaining) && run.timeRemaining <= 0.01) {
      run.timeRemaining = REVIVE_SECONDS;
    }
    player.state = "RECOVERING";
    player.stateElapsed = 0;
    player.speed = 0;
    player.invincible = 2.5;
    resetClock();
  }
  var REVIVE_SECONDS = 15;

  // src/app.ts
  var app = {
    screen: "MENU",
    difficulty: DEFAULT_DIFFICULTY,
    /** Pixels the mode list is scrolled by; only used when the list overflows. */
    menuScroll: 0,
    /** Mode the track picker is choosing a circuit for. */
    trackPickerMode: null,
    /** Circuit the current run is on, so a finished run can go back to the picker. */
    trackId: null,
    result: null
  };
  function openMenu() {
    app.screen = "MENU";
    app.trackPickerMode = null;
    app.trackId = null;
  }
  function openTrackPicker(modeId) {
    if (!modeUnlocked(modeId)) return false;
    app.trackPickerMode = modeId;
    app.screen = "TRACKS";
    return true;
  }
  function startMode(modeId, trackId) {
    if (!modeUnlocked(modeId)) return false;
    app.trackId = trackId != null ? trackId : null;
    startRun(modeId, app.difficulty, void 0, trackId);
    app.screen = "PLAYING";
    return true;
  }
  function startDaily() {
    const plan = dailyPlan();
    app.trackPickerMode = null;
    app.trackId = null;
    startRun(plan.modeId, DEFAULT_DIFFICULTY, { seed: plan.seed });
    app.screen = "PLAYING";
  }
  function shareForRevive() {
    if (!reviveAvailable()) return false;
    if (run.outcome === "cleared") audio.playFanfare();
    setShareContext({
      modeId: run.modeId,
      difficulty: run.difficulty,
      score: run.score,
      scoreUnit: modeById(run.modeId).scoreUnit,
      daily: run.daily,
      stars: starsFor(run.modeId, run.difficulty)
    });
    shareRun();
    revive();
    audio.playRevive();
    app.screen = "PLAYING";
    return true;
  }
  function canRevive() {
    return reviveAvailable();
  }
  function retryRun() {
    var _a;
    const summary = app.result;
    if (!summary) {
      startMode(MODES[0].id);
      return;
    }
    if (summary.daily) startDaily();
    else {
      startRun(summary.modeId, summary.difficulty, void 0, (_a = app.trackId) != null ? _a : void 0);
      app.screen = "PLAYING";
    }
  }
  function goBack() {
    if (app.trackPickerMode) app.screen = "TRACKS";
    else openMenu();
  }
  function finishRun() {
    const mode = modeById(run.modeId);
    const lowerIsBetter = Boolean(mode.lowerIsBetter);
    const scoreCounts = run.score > 0 && !(lowerIsBetter && run.outcome !== "cleared");
    const newBest = scoreCounts && (run.daily ? submitDailyBest(run.modeId, run.score) : submitScore(run.modeId, run.difficulty, run.score, lowerIsBetter));
    app.result = {
      modeId: run.modeId,
      difficulty: run.difficulty,
      outcome: run.outcome,
      score: run.score,
      best: run.daily ? dailyBestScore(run.modeId) : bestScore(run.modeId, run.difficulty),
      newBest,
      scoreUnit: mode.scoreUnit,
      daily: run.daily,
      day: run.daily ? todayKey() : ""
    };
    setShareContext({
      modeId: run.modeId,
      difficulty: run.difficulty,
      score: run.score,
      scoreUnit: mode.scoreUnit,
      daily: run.daily,
      stars: starsFor(run.modeId, run.difficulty)
    });
    if (run.daily) {
      submitGlobalScore("daily", run.difficulty, run.score, false, todayKey());
      submitFriendScore(careerPoints());
    } else if (newBest) {
      submitFriendScore(careerPoints());
      submitGlobalScore(run.modeId, run.difficulty, run.score, lowerIsBetter);
    }
    app.screen = "RESULT";
  }

  // src/controls.ts
  var CONTROL_BAR_TOP = 752;
  var CONTROL_H = 58;
  var CONTROL_RADIUS = 16;
  var CONTROL_HIT_PADDING = 14;
  var CONTROL_FLASH_DURATION = 0.14;
  var CONTROLS = [
    { id: "left", kind: "lane", direction: 1, x: 20, w: 72 },
    { id: "right", kind: "lane", direction: -1, x: 100, w: 72 },
    { id: "throttle", kind: "throttle", direction: 0, x: 244, w: 126 }
  ].map((control) => __spreadProps(__spreadValues({}, control), { y: CONTROL_BAR_TOP, h: CONTROL_H }));
  function controlAtDesignPoint(x, y) {
    for (const control of CONTROLS) {
      if (x >= control.x - CONTROL_HIT_PADDING && x <= control.x + control.w + CONTROL_HIT_PADDING && y >= control.y - CONTROL_HIT_PADDING && y <= control.y + control.h + CONTROL_HIT_PADDING) {
        return control;
      }
    }
    return null;
  }
  var laneButtonFlash = {
    left: 0,
    right: 0
  };
  function updateControlFlash(dt) {
    laneButtonFlash.left = Math.max(0, laneButtonFlash.left - dt);
    laneButtonFlash.right = Math.max(0, laneButtonFlash.right - dt);
  }
  function flashLaneButton(id) {
    if (id === "throttle") return;
    laneButtonFlash[id] = CONTROL_FLASH_DURATION;
  }

  // src/render/primitives.ts
  function roundRect(context3, x, y, w, h, r) {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    context3.beginPath();
    context3.moveTo(x + radius, y);
    context3.arcTo(x + w, y, x + w, y + h, radius);
    context3.arcTo(x + w, y + h, x, y + h, radius);
    context3.arcTo(x, y + h, x, y, radius);
    context3.arcTo(x, y, x + w, y, radius);
    context3.closePath();
  }
  function offsetPath(points, dx, dy) {
    return points.map((point) => ({ x: point.x + dx, y: point.y + dy }));
  }
  function fillRibbon(outer, inner, fill) {
    if (outer.length < 2 || inner.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(outer[0].x, outer[0].y);
    for (let i = 1; i < outer.length; i++) ctx.lineTo(outer[i].x, outer[i].y);
    for (let i = inner.length - 1; i >= 0; i--) ctx.lineTo(inner[i].x, inner[i].y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  // src/render/hud.ts
  var BACK_BUTTON = { x: DESIGN_W - 46, y: 9, w: 34, h: 34 };
  function drawComboPill() {
    ctx.fillStyle = "rgba(8,17,25,0.66)";
    roundRect(ctx, 12, 9, 66, 34, 11);
    ctx.fill();
    ctx.fillStyle = "rgba(247,244,234,0.5)";
    ctx.font = "700 6.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BEST", 45, 19);
    ctx.fillStyle = player.bestCombo > 0 ? COLORS.accentLight : COLORS.text;
    const tierPulse = player.tierBoostElapsed > 0 ? 1 + Math.sin((PLAYER_TIER_BOOST_DURATION - player.tierBoostElapsed) * Math.PI * 8) * 0.08 : 1;
    ctx.save();
    ctx.translate(45, 33);
    ctx.scale(tierPulse, tierPulse);
    ctx.font = "900 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`x${player.bestCombo}`, 0, 3);
    ctx.restore();
  }
  function drawCountdown() {
    if (!countdownActive()) return;
    const label = countdownLabel();
    ctx.save();
    ctx.fillStyle = "rgba(8,17,25,0.42)";
    ctx.fillRect(0, 0, DESIGN_W, 844);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.accentLight;
    ctx.font = "900 116px monospace";
    ctx.fillText(label, DESIGN_W / 2, 420);
    ctx.fillStyle = "rgba(247,244,234,0.7)";
    ctx.font = "900 13px sans-serif";
    ctx.fillText("准备", DESIGN_W / 2, 462);
    ctx.restore();
  }
  function drawClockAndScore() {
    const mode = modeById(run.modeId);
    if (Number.isFinite(run.timeRemaining)) {
      const urgent = run.timeRemaining <= 10;
      ctx.fillStyle = "rgba(8,17,25,0.66)";
      roundRect(ctx, 84, 9, 62, 34, 11);
      ctx.fill();
      ctx.textAlign = "center";
      ctx.fillStyle = urgent ? "#FF7A6B" : COLORS.text;
      ctx.font = "900 18px monospace";
      ctx.fillText(run.timeRemaining.toFixed(1), 115, 32);
    }
    ctx.textAlign = "right";
    ctx.fillStyle = COLORS.accentLight;
    ctx.font = "900 17px monospace";
    ctx.fillText(String(run.score), DESIGN_W - 54, 27);
    ctx.fillStyle = COLORS.muted;
    ctx.font = "700 7px sans-serif";
    ctx.fillText(mode.scoreUnit, DESIGN_W - 54, 38);
    ctx.textAlign = "center";
  }
  function drawBackButton() {
    roundRect(ctx, BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h, 12);
    ctx.fillStyle = COLORS.button;
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = COLORS.buttonEdge;
    ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.fillRect(BACK_BUTTON.x + 11, BACK_BUTTON.y + 10, 4, 14);
    ctx.fillRect(BACK_BUTTON.x + 19, BACK_BUTTON.y + 10, 4, 14);
  }
  function drawObjectiveBar() {
    if (run.progress < 0) return;
    const x = 12;
    const y = 62;
    const w = DESIGN_W - 24;
    const h = 6;
    roundRect(ctx, x, y, w, h, 3);
    ctx.fillStyle = "rgba(8,17,25,0.66)";
    ctx.fill();
    const filled = Math.max(0, Math.min(1, run.progress));
    if (filled > 0) {
      roundRect(ctx, x, y, w * filled, h, 3);
      ctx.fillStyle = COLORS.accent;
      ctx.fill();
    }
  }
  function drawBanner() {
    if (!run.banner || run.bannerTimer <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, run.bannerTimer * 2.4);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.accentLight;
    ctx.font = "900 26px sans-serif";
    ctx.fillText(run.banner, DESIGN_W / 2, 372);
    ctx.restore();
  }
  function drawCrashBanner() {
    if (player.state !== "CRASHED") return;
    ctx.fillStyle = "rgba(255,79,82,0.92)";
    roundRect(ctx, 122, 390, 146, 54, 16);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 21px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CRASH!", 195, 420);
    ctx.font = "700 9px sans-serif";
    ctx.fillText("COMBO RESET", 195, 437);
  }
  function drawOnboarding() {
    if (!onboardingActive()) return;
    const hints = onboardingState();
    ctx.save();
    ctx.globalAlpha = 0.78 + Math.sin(player.travelled * 0.05) * 0.2;
    ctx.textAlign = "center";
    const hint = (text, cx, cy, size, color) => {
      ctx.font = `900 ${size}px sans-serif`;
      const width = ctx.measureText(text).width + 20;
      roundRect(ctx, cx - width / 2, cy - size * 0.9, width, size * 1.8, size);
      ctx.fillStyle = "rgba(8,17,25,0.86)";
      ctx.fill();
      ctx.fillStyle = color;
      ctx.fillText(text, cx, cy + size * 0.36);
    };
    if (hints.lane) hint("点这里换车道", 96, 738, 11, COLORS.accentLight);
    if (hints.throttle) hint("按住加速", 307, 738, 11, COLORS.accentLight);
    if (hints.lane || hints.throttle) hint("超车加 Combo · 撞车清零", DESIGN_W / 2, 708, 10, COLORS.text);
    ctx.restore();
  }
  function drawHud() {
    drawComboPill();
    drawClockAndScore();
    drawBackButton();
    drawObjectiveBar();
    drawCrashBanner();
    drawBanner();
    drawOnboarding();
    drawCountdown();
  }
  function drawLaneArrow(cx, cy, direction, color) {
    const tip = direction > 0 ? -15 : 15;
    ctx.beginPath();
    ctx.moveTo(cx + tip, cy);
    ctx.lineTo(cx - tip * 0.6, cy - 15);
    ctx.lineTo(cx - tip * 0.6, cy + 15);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  function drawControls() {
    for (const control of CONTROLS) {
      const active = control.kind === "throttle" ? inputState.throttle : laneButtonFlash[control.id] > 0;
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
      if (control.kind === "lane") {
        drawLaneArrow(cx, cy, control.direction, glyph);
      } else {
        if (player.heat > 0) {
          const heatH = (control.h - 8) * Math.min(1, player.heat);
          roundRect(ctx, control.x + 4, control.y + control.h - 4 - heatH, control.w - 8, heatH, 12);
          ctx.fillStyle = player.heat > 0.75 ? "rgba(255,110,90,0.42)" : "rgba(255,181,90,0.26)";
          ctx.fill();
        }
        ctx.beginPath();
        ctx.moveTo(cx, cy - 19);
        ctx.lineTo(cx - 15, cy);
        ctx.lineTo(cx + 15, cy);
        ctx.closePath();
        ctx.fillStyle = glyph;
        ctx.fill();
        ctx.font = "900 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAS", cx, cy + 21);
      }
    }
  }

  // src/render/ui.ts
  function hits(rect, x, y) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }
  function panel(rect, style) {
    var _a, _b, _c, _d;
    const radius = (_a = style.radius) != null ? _a : 14;
    const lift = (_b = style.lift) != null ? _b : 4;
    const outline = (_c = style.outline) != null ? _c : UI.outline;
    if (lift > 0) {
      roundRect(ctx, rect.x, rect.y + lift, rect.w, rect.h, radius);
      ctx.fillStyle = outline;
      ctx.fill();
    }
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, radius);
    ctx.fillStyle = style.fill;
    ctx.fill();
    ctx.lineWidth = (_d = style.outlineWidth) != null ? _d : 2.5;
    ctx.strokeStyle = outline;
    ctx.stroke();
  }
  var VARIANT_FILL = {
    primary: UI.primary,
    good: UI.good,
    plain: UI.card
  };
  function chunkyButton(rect, label, variant = "plain", size = 16) {
    panel(rect, { fill: VARIANT_FILL[variant], radius: Math.min(18, rect.h / 2), lift: 5 });
    ctx.textAlign = "center";
    ctx.fillStyle = UI.ink;
    ctx.font = `900 ${size}px sans-serif`;
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + size * 0.36);
  }
  function chip(rect, label, fill, textColor, size = 11) {
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, rect.h / 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = textColor;
    ctx.font = `900 ${size}px sans-serif`;
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + size * 0.36);
  }
  function headline(text, x, y, size, fill, align = "left") {
    ctx.textAlign = align;
    ctx.font = `900 ${size}px sans-serif`;
    ctx.fillStyle = UI.outline;
    ctx.fillText(text, x, y + 2.5);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }
  function screenBackground(width, height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, UI.groundDeep);
    gradient.addColorStop(1, UI.ground);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.fillStyle = UI.groundStripe;
    for (let i = -height; i < width + height; i += 44) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 18, 0);
      ctx.lineTo(i + 18 + height, height);
      ctx.lineTo(i + height, height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // src/screens/menu.ts
  var MARGIN = 14;
  var SETTING_Y = 82;
  var DAILY_Y = 96;
  var DAILY_H = 44;
  var LIST_TOP = 152;
  var ROW_H = 36;
  var ROW_GAP = 2;
  var toast = { text: "", timer: 0 };
  function updateMenu(dt) {
    toast.timer = Math.max(0, toast.timer - dt);
    if (toast.timer <= 0) toast.text = "";
  }
  var DAILY_RECT = { x: MARGIN, y: DAILY_Y, w: DESIGN_W - MARGIN * 2, h: DAILY_H };
  var MUTE_RECT = { x: 0, y: 22, w: 32, h: 26 };
  function rowRect(index) {
    return {
      x: MARGIN,
      y: LIST_TOP + index * (ROW_H + ROW_GAP),
      w: DESIGN_W - MARGIN * 2,
      h: ROW_H
    };
  }
  function drawMenu() {
    screenBackground(DESIGN_W, DESIGN_H);
    const stars = totalStars();
    headline("心跳加速-冲刺", MARGIN, 42, 28, UI.card);
    const starText = `${stars}/${maxStars()}`;
    ctx.font = "900 12px sans-serif";
    const starWidth = Math.max(78, ctx.measureText(starText).width + 42);
    const starChip = { x: DESIGN_W - MARGIN - starWidth, y: 22, w: starWidth, h: 26 };
    chip(starChip, "", UI.chip, UI.primary);
    drawStar(starChip.x + 17, starChip.y + 13, 7, UI.primary, true);
    ctx.textAlign = "left";
    ctx.fillStyle = UI.primary;
    ctx.font = "900 12px sans-serif";
    ctx.fillText(starText, starChip.x + 28, starChip.y + 17);
    MUTE_RECT.x = starChip.x - MUTE_RECT.w - 8;
    panel(MUTE_RECT, { fill: UI.chip, radius: 10, lift: 2 });
    drawSpeaker(
      MUTE_RECT.x + MUTE_RECT.w / 2,
      MUTE_RECT.y + MUTE_RECT.h / 2,
      8,
      audio.isMuted() ? "rgba(255,246,228,0.4)" : UI.primary,
      !audio.isMuted()
    );
    const next = nextUnlock();
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,246,228,0.55)";
    ctx.font = "600 10px sans-serif";
    const streak = currentStreak();
    let progressText;
    if (next) progressText = `再拿 ${next.cost - stars} 颗星解锁 ${next.label}`;
    else if (stars < maxStars()) progressText = `再拿 ${maxStars() - stars} 颗星拿满`;
    else progressText = "星星已拿满";
    ctx.fillText(streak > 1 ? `连续 ${streak} 天 · ${progressText}` : progressText, MARGIN, 60);
    const profile = DIFFICULTY_PROFILES[app.difficulty];
    ctx.textAlign = "left";
    ctx.fillStyle = UI.primary;
    ctx.font = "900 12px sans-serif";
    ctx.fillText(profile.label, MARGIN, SETTING_Y);
    const labelWidth = ctx.measureText(profile.label).width;
    ctx.fillStyle = "rgba(255,246,228,0.6)";
    ctx.font = "600 10px sans-serif";
    ctx.fillText(`· ${profile.blurb}`, MARGIN + labelWidth + 7, SETTING_Y);
    drawDailyCard();
    RELEASED_MODES.forEach((mode, index) => {
      drawModeRow(mode.id, index, stars);
    });
    if (toast.text) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, toast.timer * 2.5);
      const width = 250;
      panel({ x: (DESIGN_W - width) / 2, y: DESIGN_H / 2 - 26, w: width, h: 52 }, {
        fill: UI.chip,
        radius: 14,
        lift: 4
      });
      ctx.textAlign = "center";
      ctx.fillStyle = UI.card;
      ctx.font = "900 13px sans-serif";
      ctx.fillText(toast.text, DESIGN_W / 2, DESIGN_H / 2 + 5);
      ctx.restore();
    }
    ctx.textAlign = "center";
  }
  function drawDailyCard() {
    const plan = dailyPlan();
    const mode = RELEASED_MODES.find((entry) => entry.id === plan.modeId);
    panel(DAILY_RECT, { fill: UI.primary, radius: 13, lift: 4 });
    ctx.textAlign = "left";
    ctx.fillStyle = UI.ink;
    ctx.font = "900 14px sans-serif";
    ctx.fillText("每日挑战", DAILY_RECT.x + 14, DAILY_RECT.y + 20);
    ctx.font = "600 9.5px sans-serif";
    ctx.fillStyle = "rgba(34,50,63,0.7)";
    ctx.fillText(
      `${plan.day} · ${mode ? mode.name : ""} · 全服同一份车流`,
      DAILY_RECT.x + 14,
      DAILY_RECT.y + 35
    );
    ctx.textAlign = "right";
    ctx.fillStyle = UI.ink;
    ctx.font = "900 12px sans-serif";
    ctx.fillText("开始 ▸", DAILY_RECT.x + DAILY_RECT.w - 14, DAILY_RECT.y + 27);
  }
  function drawModeRow(modeId, index, stars) {
    const mode = RELEASED_MODES[index];
    const rect = rowRect(index);
    const unlocked = modeUnlocked(modeId, stars);
    const fromOriginal = ORIGINAL_MODE_IDS.has(modeId);
    panel(rect, {
      fill: unlocked ? fromOriginal ? UI.card : UI.cardAlt : "rgba(255,246,228,0.13)",
      radius: 11,
      lift: unlocked ? 3 : 1,
      outlineWidth: unlocked ? 2.5 : 1.4
    });
    if (!unlocked) {
      drawLock(rect.x + 22, rect.y + rect.h / 2, 11, "rgba(255,246,228,0.55)");
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,246,228,0.5)";
      ctx.font = "900 12px sans-serif";
      ctx.fillText(mode.name, rect.x + 40, rect.y + 24);
      const costText = String(modeUnlockCost(modeId));
      ctx.textAlign = "right";
      ctx.fillStyle = UI.primary;
      ctx.font = "900 13px sans-serif";
      ctx.fillText(costText, rect.x + rect.w - 14, rect.y + 24);
      const costWidth = ctx.measureText(costText).width;
      drawStar(rect.x + rect.w - 22 - costWidth, rect.y + rect.h / 2 - 1, 6, UI.primary, true);
      return;
    }
    ctx.textAlign = "left";
    ctx.fillStyle = UI.ink;
    ctx.font = "900 13px sans-serif";
    ctx.fillText(mode.name, rect.x + 12, rect.y + 16);
    const nameWidth = ctx.measureText(mode.name).width;
    ctx.fillStyle = fromOriginal ? UI.primaryDeep : UI.good;
    ctx.font = "900 8px sans-serif";
    ctx.fillText(fromOriginal ? "PJ" : "NEW", rect.x + 17 + nameWidth, rect.y + 12);
    ctx.fillStyle = UI.inkSoft;
    ctx.font = "500 9px sans-serif";
    ctx.fillText(mode.rule, rect.x + 12, rect.y + 29);
    ctx.fillStyle = "rgba(34,50,63,0.3)";
    ctx.font = "700 7px sans-serif";
    ctx.fillText(trackById(mode.trackId).name, rect.x + rect.w - 118, rect.y + 29);
    const earned = starsFor(modeId, app.difficulty);
    for (let i = 0; i < 3; i++) {
      drawStar(rect.x + rect.w - 66 + i * 15, rect.y + 14, 6, i < earned ? UI.primary : "rgba(34,50,63,0.18)", i < earned);
    }
    const best2 = bestScore(modeId, app.difficulty);
    ctx.textAlign = "right";
    if (best2 === null) {
      ctx.fillStyle = "rgba(34,50,63,0.3)";
      ctx.font = "900 10px monospace";
      ctx.fillText("--", rect.x + rect.w - 14, rect.y + 31);
    } else {
      ctx.fillStyle = UI.ink;
      ctx.font = "900 12px monospace";
      ctx.fillText(String(best2), rect.x + rect.w - 14, rect.y + 31);
    }
  }
  function handleMenuTap(x, y) {
    const stars = totalStars();
    if (hits(MUTE_RECT, x, y)) {
      setMuted(!audio.isMuted());
      audio.playUiTap();
      return true;
    }
    if (hits(DAILY_RECT, x, y)) {
      audio.playUiConfirm();
      startDaily();
      return true;
    }
    for (let i = 0; i < RELEASED_MODES.length; i++) {
      if (!hits(rowRect(i), x, y)) continue;
      const mode = RELEASED_MODES[i];
      if (!modeUnlocked(mode.id, stars)) {
        audio.playUiDenied();
        showToast(`需要 ${modeUnlockCost(mode.id)} 颗星解锁`);
      } else {
        audio.playUiConfirm();
        openTrackPicker(mode.id);
      }
      return true;
    }
    return false;
  }
  function setMuted(muted) {
    audio.setMuted(muted);
    saveMuted(muted);
  }
  function showToast(text) {
    toast.text = text;
    toast.timer = 1.6;
  }

  // src/screens/result.ts
  var MARGIN2 = 20;
  var CONTENT_W = DESIGN_W - MARGIN2 * 2;
  var SCORE_CARD = { x: MARGIN2, y: 96, w: CONTENT_W, h: 214 };
  var RANK_CARD = { x: MARGIN2, y: 328, w: CONTENT_W, h: 300 };
  var RETRY = { x: MARGIN2, y: 648, w: CONTENT_W, h: 56 };
  var SHARE = { x: MARGIN2, y: 716, w: CONTENT_W / 2 - 5, h: 50 };
  var MENU = { x: MARGIN2 + CONTENT_W / 2 + 5, y: 716, w: CONTENT_W / 2 - 5, h: 50 };
  var OUTCOME = {
    cleared: { text: "目标达成", fill: UI.good },
    timeout: { text: "时间到", fill: UI.primary },
    wrecked: { text: "撞毁", fill: UI.bad },
    running: { text: "", fill: UI.primary }
  };
  var rankingRequested = false;
  var boardTab = "friends";
  var TAB_FRIENDS = { x: 0, y: 0, w: 0, h: 0 };
  var TAB_GLOBAL = { x: 0, y: 0, w: 0, h: 0 };
  function layoutTabs() {
    const w = 66;
    const h = 22;
    TAB_GLOBAL.x = RANK_CARD.x + RANK_CARD.w - 14 - w;
    TAB_GLOBAL.y = RANK_CARD.y + 12;
    TAB_GLOBAL.w = w;
    TAB_GLOBAL.h = h;
    TAB_FRIENDS.x = TAB_GLOBAL.x - w - 6;
    TAB_FRIENDS.y = TAB_GLOBAL.y;
    TAB_FRIENDS.w = w;
    TAB_FRIENDS.h = h;
  }
  function enterResultScreen() {
    rankingRequested = false;
    boardTab = "friends";
  }
  function drawResult() {
    var _a;
    const summary = app.result;
    if (!summary) return;
    const mode = modeById(summary.modeId);
    const outcome = (_a = OUTCOME[summary.outcome]) != null ? _a : OUTCOME.running;
    screenBackground(DESIGN_W, DESIGN_H);
    const title = summary.daily ? "每日挑战" : mode.name;
    headline(title, DESIGN_W / 2, 56, summary.daily ? 21 : 24, UI.card, "center");
    ctx.font = "900 11px sans-serif";
    const diffLabel = DIFFICULTY_PROFILES[summary.difficulty].label;
    const diffWidth = Math.max(72, ctx.measureText(diffLabel).width + 32);
    chip(
      { x: (DESIGN_W - diffWidth) / 2, y: 66, w: diffWidth, h: 22 },
      diffLabel,
      UI.chip,
      UI.primary
    );
    panel(SCORE_CARD, { fill: UI.card, radius: 18, lift: 6 });
    ctx.textAlign = "center";
    ctx.fillStyle = outcome.fill;
    ctx.font = "900 17px sans-serif";
    ctx.fillText(outcome.text, DESIGN_W / 2, SCORE_CARD.y + 34);
    ctx.fillStyle = UI.ink;
    ctx.font = "900 70px monospace";
    ctx.fillText(String(summary.score), DESIGN_W / 2, SCORE_CARD.y + 116);
    ctx.fillStyle = UI.inkSoft;
    ctx.font = "900 11px sans-serif";
    ctx.fillText(summary.scoreUnit, DESIGN_W / 2, SCORE_CARD.y + 138);
    const earned = summary.daily ? 0 : starsFor(summary.modeId, summary.difficulty);
    for (let i = 0; i < 3 && !summary.daily; i++) {
      drawStar(DESIGN_W / 2 - 34 + i * 34, SCORE_CARD.y + 162, 14, i < earned ? UI.primary : "rgba(34,50,63,0.16)", i < earned);
    }
    const target = summary.daily ? null : nextStarTarget(summary.modeId, summary.difficulty);
    ctx.textAlign = "center";
    ctx.fillStyle = UI.inkSoft;
    ctx.font = "700 10px sans-serif";
    if (summary.newBest) {
      ctx.fillStyle = UI.primaryDeep;
      ctx.font = "900 11px sans-serif";
      ctx.fillText("NEW BEST!", DESIGN_W / 2, SCORE_CARD.y + 192);
    } else if (target !== null) {
      ctx.fillText(`下一颗星：${target} ${summary.scoreUnit}`, DESIGN_W / 2, SCORE_CARD.y + 192);
    } else if (summary.best !== null) {
      ctx.fillText(`BEST ${summary.best}`, DESIGN_W / 2, SCORE_CARD.y + 192);
    }
    drawRankingPanel();
    if (canRevive()) {
      chunkyButton(RETRY, "分享复活 · 继续这一局", "good", 16);
    } else {
      chunkyButton(RETRY, "再来一次", "primary", 18);
    }
    chunkyButton(SHARE, "分享成绩", "good", 15);
    chunkyButton(MENU, app.trackPickerMode ? "选择赛道" : "选择模式", "plain", 15);
  }
  function drawRankingPanel() {
    panel(RANK_CARD, { fill: UI.chip, radius: 16, lift: 5 });
    layoutTabs();
    ctx.textAlign = "left";
    ctx.fillStyle = UI.card;
    ctx.font = "900 12px sans-serif";
    ctx.fillText("排行榜", RANK_CARD.x + 14, RANK_CARD.y + 28);
    drawTab(TAB_FRIENDS, "好友", boardTab === "friends");
    drawTab(TAB_GLOBAL, "全服", boardTab === "global");
    const listY = RANK_CARD.y + 42;
    const listH = RANK_CARD.h - 52;
    if (boardTab === "friends") drawFriendBoard(listY, listH);
    else drawGlobalBoard(listY, listH);
  }
  function drawTab(rect, label, active) {
    chip(rect, label, active ? UI.primary : "rgba(255,246,228,0.12)", active ? UI.ink : UI.card, 10);
  }
  function drawFriendBoard(listY, listH) {
    ctx.textAlign = "center";
    if (!leaderboardAvailable()) {
      ctx.fillStyle = "rgba(255,246,228,0.38)";
      ctx.font = "600 11px sans-serif";
      ctx.fillText("好友榜仅在微信小游戏内可用", DESIGN_W / 2, RANK_CARD.y + RANK_CARD.h / 2);
      return;
    }
    if (!rankingRequested) {
      requestFriendRanking(RANK_CARD.w - 20, listH, DPR);
      rankingRequested = true;
    }
    const shared = sharedCanvas();
    if (shared) {
      try {
        ctx.drawImage(shared, RANK_CARD.x + 10, listY, RANK_CARD.w - 20, listH);
      } catch (error) {
      }
    }
  }
  function drawGlobalBoard(listY, listH) {
    const summary = app.result;
    ctx.textAlign = "center";
    if (!summary || !globalBoardAvailable()) {
      ctx.fillStyle = "rgba(255,246,228,0.38)";
      ctx.font = "600 11px sans-serif";
      ctx.fillText("全服榜需要配置云开发环境", DESIGN_W / 2, RANK_CARD.y + RANK_CARD.h / 2 - 8);
      ctx.font = "600 9px sans-serif";
      ctx.fillText("见 README 的云开发部署说明", DESIGN_W / 2, RANK_CARD.y + RANK_CARD.h / 2 + 10);
      return;
    }
    const board = summary.daily ? globalBoard("daily", summary.difficulty, summary.day) : globalBoard(summary.modeId, summary.difficulty);
    if (board.state === "loading") {
      ctx.fillStyle = "rgba(255,246,228,0.38)";
      ctx.font = "600 11px sans-serif";
      ctx.fillText("加载中…", DESIGN_W / 2, RANK_CARD.y + RANK_CARD.h / 2);
      return;
    }
    if (board.state === "failed" || board.rows.length === 0) {
      ctx.fillStyle = "rgba(255,246,228,0.38)";
      ctx.font = "600 11px sans-serif";
      ctx.fillText(board.state === "failed" ? "加载失败" : "还没有人上榜，你可以是第一个", DESIGN_W / 2, RANK_CARD.y + RANK_CARD.h / 2);
      return;
    }
    const rowH = 22;
    const visible = Math.min(board.rows.length, Math.floor((listH - 16) / rowH));
    for (let i = 0; i < visible; i++) {
      const row = board.rows[i];
      const y = listY + i * rowH;
      if (row.self) {
        ctx.fillStyle = "rgba(87,213,203,0.16)";
        ctx.fillRect(RANK_CARD.x + 8, y - 2, RANK_CARD.w - 16, rowH - 2);
      }
      ctx.textAlign = "left";
      ctx.fillStyle = i < 3 ? UI.primary : "rgba(255,246,228,0.5)";
      ctx.font = "900 11px monospace";
      ctx.fillText(String(row.rank), RANK_CARD.x + 14, y + 12);
      ctx.fillStyle = UI.card;
      ctx.font = "600 11px sans-serif";
      ctx.fillText(row.nickname.slice(0, 8), RANK_CARD.x + 40, y + 12);
      ctx.textAlign = "right";
      ctx.fillStyle = row.self ? UI.primary : "rgba(255,246,228,0.75)";
      ctx.font = "900 11px monospace";
      ctx.fillText(String(row.score), RANK_CARD.x + RANK_CARD.w - 14, y + 12);
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,246,228,0.5)";
    ctx.font = "700 9px sans-serif";
    const rankText = board.selfRank ? `你排第 ${board.selfRank} / ${board.total}` : `共 ${board.total} 人上榜`;
    ctx.fillText(rankText, DESIGN_W / 2, RANK_CARD.y + RANK_CARD.h - 10);
  }
  function handleResultTap(x, y) {
    layoutTabs();
    if (hits(TAB_FRIENDS, x, y)) {
      audio.playUiTap();
      boardTab = "friends";
      return true;
    }
    if (hits(TAB_GLOBAL, x, y)) {
      audio.playUiTap();
      boardTab = "global";
      return true;
    }
    if (hits(RETRY, x, y)) {
      audio.playUiConfirm();
      if (!shareForRevive()) retryRun();
      return true;
    }
    if (hits(MENU, x, y)) {
      audio.playUiTap();
      goBack();
      return true;
    }
    if (hits(SHARE, x, y)) {
      audio.playUiConfirm();
      shareRun();
      return true;
    }
    return false;
  }

  // src/screens/trackSelect.ts
  var MARGIN3 = 14;
  var GAP = 12;
  var COLUMNS = 3;
  var CELL = (DESIGN_W - MARGIN3 * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
  var GRID_TOP = 64;
  var INSET = CELL * 0.13;
  var BACK = { x: MARGIN3, y: DESIGN_H - 84, w: DESIGN_W - MARGIN3 * 2, h: 54 };
  var boundsCache = /* @__PURE__ */ new Map();
  function trackBounds(trackId) {
    const cached = boundsCache.get(trackId);
    if (cached) return cached;
    const points = TRACKS.find((track) => track.id === trackId).build();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const point of points) {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    }
    const measured = { points, minX, minY, width: maxX - minX, height: maxY - minY };
    boundsCache.set(trackId, measured);
    return measured;
  }
  function cardRect(index) {
    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    return {
      x: MARGIN3 + column * (CELL + GAP),
      y: GRID_TOP + row * (CELL + GAP),
      w: CELL,
      h: CELL
    };
  }
  function drawThumbnail(trackId, box) {
    const bounds = trackBounds(trackId);
    const scale2 = Math.min(box.w / bounds.width, box.h / bounds.height);
    const originX = box.x + (box.w - bounds.width * scale2) / 2;
    const originY = box.y + (box.h - bounds.height * scale2) / 2;
    ctx.beginPath();
    bounds.points.forEach((point, index) => {
      const x = originX + (point.x - bounds.minX) * scale2;
      const y = originY + (point.y - bounds.minY) * scale2;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = CELL * 0.075;
    ctx.strokeStyle = "rgba(34,50,63,0.35)";
    ctx.stroke();
    ctx.lineWidth = CELL * 0.011;
    ctx.strokeStyle = "rgba(255,246,228,0.5)";
    ctx.stroke();
  }
  function drawTrackSelect() {
    screenBackground(DESIGN_W, DESIGN_H);
    TRACKS.forEach((track, index) => {
      const rect = cardRect(index);
      panel(rect, { fill: UI.card, radius: 12, lift: 3, outlineWidth: 2 });
      drawThumbnail(track.id, {
        x: rect.x + INSET,
        y: rect.y + INSET,
        w: rect.w - INSET * 2,
        h: rect.h - INSET * 2
      });
    });
    chunkyButton(BACK, "返回", "plain", 16);
    ctx.textAlign = "center";
  }
  function handleTrackSelectTap(x, y) {
    if (hits(BACK, x, y)) {
      audio.playUiTap();
      openMenu();
      return true;
    }
    const modeId = app.trackPickerMode;
    if (!modeId) return false;
    for (let i = 0; i < TRACKS.length; i++) {
      if (!hits(cardRect(i), x, y)) continue;
      audio.playUiConfirm();
      startMode(modeId, TRACKS[i].id);
      return true;
    }
    return false;
  }

  // src/input.ts
  var activePointers = /* @__PURE__ */ new Map();
  function refreshThrottleFromPointers() {
    let held = false;
    for (const assignment of activePointers.values()) {
      if (assignment === "throttle") {
        held = true;
        break;
      }
    }
    setThrottle(held);
  }
  function pressControl(control) {
    if (control.kind === "throttle") return;
    flashLaneButton(control.id);
    requestLaneChange(control.direction);
  }
  function pointerDown(pointerId, screenX, screenY) {
    const x = screenToDesignX(screenX);
    const y = screenToDesignY(screenY);
    if (app.screen === "MENU") {
      handleMenuTap(x, y);
      return;
    }
    if (app.screen === "TRACKS") {
      handleTrackSelectTap(x, y);
      return;
    }
    if (app.screen === "RESULT") {
      handleResultTap(x, y);
      return;
    }
    if (x >= BACK_BUTTON.x && x <= BACK_BUTTON.x + BACK_BUTTON.w && y >= BACK_BUTTON.y && y <= BACK_BUTTON.y + BACK_BUTTON.h) {
      releaseAllPointers();
      goBack();
      return;
    }
    const control = controlAtDesignPoint(x, y);
    if (control) {
      activePointers.set(pointerId, control.id);
      if (control.kind === "throttle") audio.ensureStarted();
      pressControl(control);
      refreshThrottleFromPointers();
      return;
    }
    activePointers.set(pointerId, "track");
    requestLaneChange(x < DESIGN_W * 0.5 ? 1 : -1);
  }
  function pointerMove(pointerId, screenX, screenY) {
    if (app.screen !== "PLAYING") return;
    if (!activePointers.has(pointerId)) return;
    const control = controlAtDesignPoint(screenToDesignX(screenX), screenToDesignY(screenY));
    const previous = activePointers.get(pointerId);
    if (control && control.kind === "throttle") {
      if (previous !== "throttle") audio.ensureStarted();
      activePointers.set(pointerId, "throttle");
    } else if (previous === "throttle") {
      activePointers.set(pointerId, "none");
    }
    refreshThrottleFromPointers();
  }
  function pointerUp(pointerId) {
    if (!activePointers.delete(pointerId)) return;
    refreshThrottleFromPointers();
  }
  function releaseAllPointers() {
    activePointers.clear();
    setThrottle(false);
  }
  function isThrottleKey(event) {
    const key2 = String(event.key || "").toLowerCase();
    const code = String(event.code || "");
    const keyCode = Number(event.keyCode || event.which || 0);
    return key2 === "arrowup" || key2 === "up" || key2 === "w" || key2 === " " || key2 === "spacebar" || code === "ArrowUp" || code === "KeyW" || code === "Space" || keyCode === 38 || keyCode === 87 || keyCode === 32;
  }
  function handleKeyboardInput(event) {
    if (app.screen !== "PLAYING") return;
    const key2 = String(event.key || "").toLowerCase();
    const code = String(event.code || "");
    const keyCode = Number(event.keyCode || event.which || 0);
    let handled = false;
    if (key2 === "arrowleft" || key2 === "left" || key2 === "a" || code === "ArrowLeft" || code === "KeyA" || keyCode === 37 || keyCode === 65) {
      requestLaneChange(1);
      handled = true;
    } else if (key2 === "arrowright" || key2 === "right" || key2 === "d" || code === "ArrowRight" || code === "KeyD" || keyCode === 39 || keyCode === 68) {
      requestLaneChange(-1);
      handled = true;
    } else if (isThrottleKey(event)) {
      setThrottle(true);
      handled = true;
    } else if (key2 === "r" || code === "KeyR" || keyCode === 82) {
      retryRun();
      handled = true;
    } else if (key2 === "escape" || code === "Escape" || keyCode === 27) {
      releaseAllPointers();
      goBack();
      handled = true;
    }
    if (handled && typeof event.preventDefault === "function") event.preventDefault();
  }
  function handleKeyboardRelease(event) {
    if (!isThrottleKey(event)) return;
    setThrottle(false);
    if (typeof event.preventDefault === "function") event.preventDefault();
  }
  function installInput() {
    const usingWxTouch = typeof wx.onTouchStart === "function";
    if (usingWxTouch) {
      const forEachChanged = (event, handler) => {
        const list = event && (event.changedTouches || event.touches) || [];
        for (let i = 0; i < list.length; i++) {
          const touch = list[i];
          if (touch) handler(touch, touch.identifier != null ? touch.identifier : i);
        }
      };
      wx.onTouchStart((event) => forEachChanged(event, (touch, id) => pointerDown(id, touch.clientX, touch.clientY)));
      if (typeof wx.onTouchMove === "function") {
        wx.onTouchMove((event) => forEachChanged(event, (touch, id) => pointerMove(id, touch.clientX, touch.clientY)));
      }
      if (typeof wx.onTouchEnd === "function") {
        wx.onTouchEnd((event) => forEachChanged(event, (_touch, id) => pointerUp(id)));
      }
      if (typeof wx.onTouchCancel === "function") {
        wx.onTouchCancel((event) => forEachChanged(event, (_touch, id) => pointerUp(id)));
      }
    }
    if (!usingWxTouch && canvas && typeof canvas.addEventListener === "function") {
      if (typeof canvas.setAttribute === "function") canvas.setAttribute("tabindex", "0");
      canvas.tabIndex = 0;
      const localPoint = (event) => {
        const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: VIEW_W, height: VIEW_H };
        return {
          x: (event.clientX - rect.left) * VIEW_W / Math.max(1, rect.width),
          y: (event.clientY - rect.top) * VIEW_H / Math.max(1, rect.height)
        };
      };
      canvas.addEventListener("pointerdown", (event) => {
        if (typeof canvas.focus === "function") canvas.focus({ preventScroll: true });
        const point = localPoint(event);
        pointerDown(event.pointerId, point.x, point.y);
        if (typeof event.preventDefault === "function") event.preventDefault();
      });
      if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
        window.addEventListener("pointermove", (event) => {
          const point = localPoint(event);
          pointerMove(event.pointerId, point.x, point.y);
        });
        window.addEventListener("pointerup", (event) => pointerUp(event.pointerId));
        window.addEventListener("pointercancel", (event) => pointerUp(event.pointerId));
      }
      if (typeof canvas.focus === "function") {
        setTimeout(() => canvas.focus({ preventScroll: true }), 0);
      }
    }
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("keydown", handleKeyboardInput, { capture: true, passive: false });
      window.addEventListener("keyup", handleKeyboardRelease, { capture: true, passive: false });
      window.addEventListener("blur", releaseAllPointers);
    }
  }
  var debugPointerCount = () => activePointers.size;

  // src/render/overlays.ts
  function drawHazardLane() {
    if (effects.hazardLane < 0) return;
    const outer = projectPath(pathForLane(effects.hazardLane + 0.42));
    const inner = projectPath(pathForLane(effects.hazardLane - 0.42));
    fillRibbon(outer, inner, "rgba(255,96,84,0.42)");
    const coreOuter = projectPath(pathForLane(effects.hazardLane + 0.14));
    const coreInner = projectPath(pathForLane(effects.hazardLane - 0.14));
    fillRibbon(coreOuter, coreInner, "rgba(255,196,120,0.85)");
    void project;
  }
  function drawBlackout() {
    if (effects.dim <= 0) return;
    ctx.save();
    ctx.globalAlpha = effects.dim;
    ctx.fillStyle = "#050C12";
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
    ctx.restore();
    if (effects.dim > 0.5) {
      ctx.save();
      ctx.globalAlpha = (effects.dim - 0.5) * 0.6;
      ctx.fillStyle = COLORS.accent;
      ctx.fillRect(0, DESIGN_H * 0.5 - 1, DESIGN_W, 2);
      ctx.restore();
    }
  }

  // src/render/speedLines.ts
  var TRAIL_SEGMENTS = 7;
  var TRAIL_STEP = 5.5;
  function intensity() {
    const cruise = currentCruiseSpeed();
    const over = player.speed - cruise * 0.92;
    if (over <= 0) return 0;
    return Math.min(1, over / 260);
  }
  function drawSpeedLines() {
    const power = intensity();
    if (power <= 0.02 || player.state === "CRASHED") return;
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 0; i < TRAIL_SEGMENTS; i++) {
      const back = (i + 1) * TRAIL_STEP;
      const plane = sampleAtDistance(player.distance - back, player.visualLane);
      const point = project(plane.x, plane.y);
      const fade = (1 - i / TRAIL_SEGMENTS) * power;
      ctx.globalAlpha = fade * 0.5;
      ctx.strokeStyle = i < 3 ? "#FFD9A8" : "#FFFFFF";
      ctx.lineWidth = (3.4 * (1 - i / TRAIL_SEGMENTS) + 0.5) * point.scale;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      const tailPlane = sampleAtDistance(player.distance - back - TRAIL_STEP * 0.85, player.visualLane);
      const tail = project(tailPlane.x, tailPlane.y);
      ctx.lineTo(tail.x, tail.y);
      ctx.stroke();
    }
    if (power > 0.45) {
      const laneOffsets = [-1.6, -0.9, 0.9, 1.6];
      ctx.globalAlpha = (power - 0.45) * 0.5;
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.1;
      for (const offset of laneOffsets) {
        const lane = player.visualLane + offset;
        if (lane < -0.4 || lane > LANE_COUNT - 0.6) continue;
        for (let i = 0; i < 3; i++) {
          const back = 14 + i * 26 + player.travelled * 1.6 % 26;
          const headPlane = sampleAtDistance(player.distance - back, lane);
          const tailPlane = sampleAtDistance(player.distance - back - 11, lane);
          const head = project(headPlane.x, headPlane.y);
          const tail = project(tailPlane.x, tailPlane.y);
          ctx.beginPath();
          ctx.moveTo(head.x, head.y);
          ctx.lineTo(tail.x, tail.y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // src/render/sprites.ts
  var CAR_LENGTH = 20.5;
  var CAR_WIDTH = 10.8;
  var SUPERSAMPLE = 10;
  var SPRITE_W = Math.round(CAR_LENGTH * SUPERSAMPLE);
  var SPRITE_H = Math.round(CAR_WIDTH * SUPERSAMPLE);
  function roundedPath(ctx2, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx2.beginPath();
    ctx2.moveTo(x + radius, y);
    ctx2.arcTo(x + w, y, x + w, y + h, radius);
    ctx2.arcTo(x + w, y + h, x, y + h, radius);
    ctx2.arcTo(x, y + h, x, y, radius);
    ctx2.arcTo(x, y, x + w, y, radius);
    ctx2.closePath();
  }
  function paintCar(ctx2, style) {
    const w = SPRITE_W;
    const h = SPRITE_H;
    const cy = h / 2;
    ctx2.clearRect(0, 0, w, h);
    ctx2.fillStyle = "#14181B";
    const wheelW = w * 0.155;
    const wheelH = h * 0.15;
    for (const wx2 of [w * 0.16, w * 0.66]) {
      roundedPath(ctx2, wx2, h * 0.02, wheelW, wheelH, wheelH * 0.45);
      ctx2.fill();
      roundedPath(ctx2, wx2, h * 0.83, wheelW, wheelH, wheelH * 0.45);
      ctx2.fill();
    }
    ctx2.save();
    ctx2.globalAlpha = 0.32;
    ctx2.fillStyle = "#05090C";
    roundedPath(ctx2, w * 0.03, h * 0.16, w * 0.94, h * 0.74, h * 0.3);
    ctx2.fill();
    ctx2.restore();
    const bodyGradient = ctx2.createLinearGradient(0, h * 0.1, w * 0.35, h);
    bodyGradient.addColorStop(0, style.rim);
    bodyGradient.addColorStop(0.28, style.body);
    bodyGradient.addColorStop(1, style.side);
    ctx2.fillStyle = bodyGradient;
    roundedPath(ctx2, w * 0.02, h * 0.12, w * 0.96, h * 0.76, h * 0.28);
    ctx2.fill();
    const noseGradient = ctx2.createLinearGradient(w * 0.72, 0, w, 0);
    noseGradient.addColorStop(0, "rgba(0,0,0,0)");
    noseGradient.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx2.fillStyle = noseGradient;
    roundedPath(ctx2, w * 0.02, h * 0.12, w * 0.96, h * 0.76, h * 0.28);
    ctx2.fill();
    const cabinGradient = ctx2.createLinearGradient(0, h * 0.2, 0, h * 0.8);
    cabinGradient.addColorStop(0, style.cabin);
    cabinGradient.addColorStop(1, style.side);
    ctx2.fillStyle = cabinGradient;
    roundedPath(ctx2, w * 0.3, h * 0.2, w * 0.34, h * 0.6, h * 0.2);
    ctx2.fill();
    const glassGradient = ctx2.createLinearGradient(w * 0.34, h * 0.26, w * 0.6, h * 0.74);
    glassGradient.addColorStop(0, "#EAFBFF");
    glassGradient.addColorStop(0.45, style.window);
    glassGradient.addColorStop(1, "#40626E");
    ctx2.fillStyle = glassGradient;
    roundedPath(ctx2, w * 0.345, h * 0.27, w * 0.25, h * 0.46, h * 0.14);
    ctx2.fill();
    ctx2.save();
    ctx2.globalAlpha = 0.55;
    ctx2.fillStyle = "#FFFFFF";
    ctx2.beginPath();
    ctx2.moveTo(w * 0.37, h * 0.3);
    ctx2.lineTo(w * 0.45, h * 0.3);
    ctx2.lineTo(w * 0.4, h * 0.7);
    ctx2.lineTo(w * 0.35, h * 0.7);
    ctx2.closePath();
    ctx2.fill();
    ctx2.restore();
    if (style.stripe) {
      ctx2.save();
      ctx2.globalAlpha = 0.9;
      ctx2.fillStyle = style.stripe;
      ctx2.fillRect(w * 0.06, cy - h * 0.055, w * 0.88, h * 0.11);
      ctx2.restore();
    }
    ctx2.save();
    ctx2.globalAlpha = 0.22;
    ctx2.strokeStyle = "#05090C";
    ctx2.lineWidth = Math.max(1, h * 0.02);
    ctx2.beginPath();
    ctx2.moveTo(w * 0.66, h * 0.18);
    ctx2.lineTo(w * 0.66, h * 0.82);
    ctx2.stroke();
    ctx2.restore();
    ctx2.fillStyle = style.lights;
    roundedPath(ctx2, w * 0.9, h * 0.2, w * 0.07, h * 0.2, h * 0.06);
    ctx2.fill();
    roundedPath(ctx2, w * 0.9, h * 0.6, w * 0.07, h * 0.2, h * 0.06);
    ctx2.fill();
    ctx2.save();
    ctx2.globalAlpha = 0.5;
    ctx2.fillStyle = "#C4413A";
    roundedPath(ctx2, w * 0.035, h * 0.26, w * 0.05, h * 0.16, h * 0.05);
    ctx2.fill();
    roundedPath(ctx2, w * 0.035, h * 0.58, w * 0.05, h * 0.16, h * 0.05);
    ctx2.fill();
    ctx2.restore();
    ctx2.save();
    ctx2.globalAlpha = 0.6;
    ctx2.strokeStyle = style.rim;
    ctx2.lineWidth = Math.max(1.4, h * 0.035);
    ctx2.beginPath();
    ctx2.moveTo(w * 0.12, h * 0.145);
    ctx2.lineTo(w * 0.86, h * 0.145);
    ctx2.stroke();
    ctx2.restore();
  }
  function paintShadow(ctx2) {
    const w = SPRITE_W;
    const h = SPRITE_H;
    ctx2.clearRect(0, 0, w, h);
    ctx2.fillStyle = "#040A0E";
    roundedPath(ctx2, w * 0.02, h * 0.12, w * 0.96, h * 0.76, h * 0.28);
    ctx2.fill();
  }
  function build(paint) {
    const canvas2 = createOffscreenCanvas(SPRITE_W, SPRITE_H);
    const ctx2 = canvas2 ? canvas2.getContext("2d") : null;
    if (!canvas2 || !ctx2) return null;
    paint(ctx2);
    return canvas2;
  }
  var cache2 = /* @__PURE__ */ new Map();
  function vehicleSprite(key2, style) {
    const cached = cache2.get(key2);
    if (cached !== void 0) return cached;
    const image = build((ctx2) => paintCar(ctx2, style));
    const shadow = build(paintShadow);
    const sprite = image && shadow ? { image, shadow } : null;
    cache2.set(key2, sprite);
    return sprite;
  }
  var ASPHALT_TILE = 96;
  var asphaltPattern = null;
  var asphaltTried = false;
  function asphaltTexture(target) {
    if (asphaltTried) return asphaltPattern;
    asphaltTried = true;
    const canvas2 = createOffscreenCanvas(ASPHALT_TILE, ASPHALT_TILE);
    const ctx2 = canvas2 ? canvas2.getContext("2d") : null;
    if (!canvas2 || !ctx2) return null;
    ctx2.clearRect(0, 0, ASPHALT_TILE, ASPHALT_TILE);
    for (let i = 0; i < 1400; i++) {
      const x = Math.random() * ASPHALT_TILE;
      const y = Math.random() * ASPHALT_TILE;
      const light = Math.random() < 0.5;
      ctx2.fillStyle = light ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.06)";
      ctx2.fillRect(x, y, 1, 1);
    }
    for (let i = 0; i < 180; i++) {
      const x = Math.random() * ASPHALT_TILE;
      const y = Math.random() * ASPHALT_TILE;
      ctx2.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
      ctx2.fillRect(x, y, 2, 2);
    }
    try {
      asphaltPattern = target.createPattern(canvas2, "repeat");
    } catch (error) {
      asphaltPattern = null;
    }
    return asphaltPattern;
  }
  var WATER_TILE = 128;
  var waterPattern = null;
  var waterTried = false;
  function waterTexture(target) {
    if (waterTried) return waterPattern;
    waterTried = true;
    const canvas2 = createOffscreenCanvas(WATER_TILE, WATER_TILE);
    const ctx2 = canvas2 ? canvas2.getContext("2d") : null;
    if (!canvas2 || !ctx2) return null;
    ctx2.clearRect(0, 0, WATER_TILE, WATER_TILE);
    ctx2.lineCap = "round";
    const bands = [
      { cycles: 3, amplitude: 3.2, spacing: 9, alpha: 0.1, width: 1.5, phase: 0 },
      { cycles: 5, amplitude: 2, spacing: 14, alpha: 0.07, width: 1.1, phase: 1.7 },
      { cycles: 2, amplitude: 4.4, spacing: 21, alpha: 0.06, width: 2.4, phase: 3.1 }
    ];
    for (const band of bands) {
      ctx2.strokeStyle = `rgba(255,255,255,${band.alpha})`;
      ctx2.lineWidth = band.width;
      for (let y = 0; y < WATER_TILE; y += band.spacing) {
        ctx2.beginPath();
        for (let x = 0; x <= WATER_TILE; x += 4) {
          const wave = Math.sin(x / WATER_TILE * Math.PI * 2 * band.cycles + band.phase + y * 0.11);
          const yy = y + wave * band.amplitude;
          if (x === 0) ctx2.moveTo(x, yy);
          else ctx2.lineTo(x, yy);
        }
        ctx2.stroke();
      }
    }
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * WATER_TILE;
      const y = Math.random() * WATER_TILE;
      ctx2.fillStyle = "rgba(255,255,255,0.16)";
      ctx2.beginPath();
      ctx2.ellipse(x, y, 2.6, 0.9, 0, 0, Math.PI * 2);
      ctx2.fill();
    }
    try {
      waterPattern = target.createPattern(canvas2, "repeat");
    } catch (error) {
      waterPattern = null;
    }
    return waterPattern;
  }
  var GRASS_TILE = 72;
  var grassPattern = null;
  var grassTried = false;
  function grassTexture(target) {
    if (grassTried) return grassPattern;
    grassTried = true;
    const canvas2 = createOffscreenCanvas(GRASS_TILE, GRASS_TILE);
    const ctx2 = canvas2 ? canvas2.getContext("2d") : null;
    if (!canvas2 || !ctx2) return null;
    ctx2.clearRect(0, 0, GRASS_TILE, GRASS_TILE);
    ctx2.lineCap = "round";
    ctx2.lineWidth = 1;
    for (let i = 0; i < 520; i++) {
      const x = Math.random() * GRASS_TILE;
      const y = Math.random() * GRASS_TILE;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const length = 1.6 + Math.random() * 2.4;
      const light = Math.random() < 0.5;
      ctx2.strokeStyle = light ? "rgba(255,255,235,0.13)" : "rgba(80,96,50,0.16)";
      ctx2.beginPath();
      ctx2.moveTo(x, y);
      ctx2.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx2.stroke();
    }
    try {
      grassPattern = target.createPattern(canvas2, "repeat");
    } catch (error) {
      grassPattern = null;
    }
    return grassPattern;
  }

  // src/render/road.ts
  function edge(offset) {
    return projectPath(pathAtOffset(offset));
  }
  function drawTrack() {
    const outerShadow = projectPath(
      offsetPath(pathAtOffset(ROAD_HALF_WIDTH + 7), SHADOW_X * ROAD_DEPTH, SHADOW_Y * ROAD_DEPTH)
    );
    const innerShadow = projectPath(
      offsetPath(pathAtOffset(-ROAD_HALF_WIDTH - 7), SHADOW_X * ROAD_DEPTH, SHADOW_Y * ROAD_DEPTH)
    );
    fillRibbon(outerShadow, innerShadow, "rgba(4,12,18,0.55)");
    const outerWall = projectPath(
      offsetPath(pathAtOffset(ROAD_HALF_WIDTH + 5), SHADOW_X * ROAD_DEPTH * 0.5, SHADOW_Y * ROAD_DEPTH * 0.5)
    );
    const innerWall = projectPath(
      offsetPath(pathAtOffset(-ROAD_HALF_WIDTH - 5), SHADOW_X * ROAD_DEPTH * 0.5, SHADOW_Y * ROAD_DEPTH * 0.5)
    );
    fillRibbon(outerWall, innerWall, "#121A20");
    const outerEdge = edge(ROAD_HALF_WIDTH + 4);
    const innerEdge = edge(-ROAD_HALF_WIDTH - 4);
    fillRibbon(outerEdge, innerEdge, COLORS.roadEdge);
    const outerKerb = edge(ROAD_HALF_WIDTH);
    const outerRoad = edge(ROAD_HALF_WIDTH - KERB_WIDTH);
    const innerRoad = edge(-ROAD_HALF_WIDTH + KERB_WIDTH);
    const innerKerb = edge(-ROAD_HALF_WIDTH);
    fillRibbon(outerKerb, outerRoad, COLORS.curbLight);
    fillRibbon(innerRoad, innerKerb, COLORS.curbLight);
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const laneOuter = projectPath(pathForLane(lane - 0.5));
      const laneInner = projectPath(pathForLane(lane + 0.5));
      fillRibbon(laneOuter, laneInner, lane % 2 === 0 ? COLORS.road : COLORS.roadAlt);
    }
    const grain = asphaltTexture(ctx);
    if (grain) fillRibbon(outerRoad, innerRoad, grain);
    drawSlabVariation(outerRoad, innerRoad);
    drawSlabSeams(outerRoad, innerRoad);
    drawEdgeGrime();
    drawStartLine();
  }
  var SEAM_SPACING = 6;
  function drawSlabVariation(outer, inner) {
    const count = Math.min(outer.length, inner.length);
    for (let i = 0; i < count - SEAM_SPACING; i += SEAM_SPACING) {
      const panel2 = Math.floor(i / SEAM_SPACING);
      const shade = Math.sin(panel2 * 12.9898) * 43758.5453;
      const tone = shade - Math.floor(shade);
      if (tone > 0.62) continue;
      const end = Math.min(count - 1, i + SEAM_SPACING);
      const top = outer.slice(i, end + 1);
      const bottom = inner.slice(i, end + 1);
      const light = tone < 0.31;
      fillRibbon(top, bottom, light ? "rgba(255,255,250,0.05)" : "rgba(96,100,96,0.05)");
    }
  }
  function drawSlabSeams(outer, inner) {
    const count = Math.min(outer.length, inner.length);
    ctx.save();
    ctx.lineCap = "butt";
    for (let i = 0; i < count; i += SEAM_SPACING) {
      const heavy = Math.floor(i / SEAM_SPACING) % 3 === 0;
      ctx.strokeStyle = heavy ? "rgba(96,100,96,0.34)" : "rgba(112,116,112,0.2)";
      ctx.lineWidth = heavy ? 1.15 : 0.8;
      ctx.beginPath();
      ctx.moveTo(outer[i].x, outer[i].y);
      ctx.lineTo(inner[i].x, inner[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawEdgeGrime() {
    const outerKerb = edge(ROAD_HALF_WIDTH);
    const outerLane = edge(ROAD_HALF_WIDTH - KERB_WIDTH);
    const innerLane = edge(-ROAD_HALF_WIDTH + KERB_WIDTH);
    const innerKerb = edge(-ROAD_HALF_WIDTH);
    fillRibbon(outerKerb, outerLane, "rgba(112,112,100,0.3)");
    fillRibbon(innerLane, innerKerb, "rgba(112,112,100,0.3)");
    const outerDark = edge(ROAD_HALF_WIDTH - 1.4);
    const innerDark = edge(-ROAD_HALF_WIDTH + 1.4);
    fillRibbon(outerKerb, outerDark, "rgba(88,88,78,0.26)");
    fillRibbon(innerDark, innerKerb, "rgba(88,88,78,0.26)");
  }
  var CHEQUER_CELLS = 14;
  function drawStartLine() {
    const centre = sampleAtDistance(0, (LANE_COUNT - 1) / 2);
    const heading = projectedHeading(centre.x, centre.y, centre.angle);
    const origin = project(centre.x, centre.y);
    ctx.save();
    ctx.translate(origin.x, origin.y);
    ctx.rotate(heading);
    const cell = ROAD_HALF_WIDTH * 2 / CHEQUER_CELLS * origin.scale;
    const half = CHEQUER_CELLS / 2;
    for (let i = -half; i < half; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#F5F0E2" : "#242A2E";
      ctx.fillRect(-cell, i * cell, cell, cell);
      ctx.fillStyle = i % 2 === 0 ? "#242A2E" : "#F5F0E2";
      ctx.fillRect(0, i * cell, cell, cell);
    }
    ctx.restore();
  }

  // src/render/scenery.ts
  function drawTree(x, y, size = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(13,35,30,0.22)";
    ctx.beginPath();
    ctx.ellipse(2, 4, 9 * size, 5 * size, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5C7E48";
    ctx.beginPath();
    ctx.arc(-3 * size, 0, 6.5 * size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#739556";
    ctx.beginPath();
    ctx.arc(3 * size, -2 * size, 7 * size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#94AD69";
    ctx.beginPath();
    ctx.arc(0, -6 * size, 5.5 * size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawBoat(x, y, size, angle) {
    const length = 26 * size;
    const beam = 8.5 * size;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "rgba(60,80,92,0.28)";
    ctx.beginPath();
    ctx.ellipse(1.5 * size, 1.8 * size, length * 0.5, beam * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F4F3EE";
    ctx.beginPath();
    ctx.moveTo(length * 0.5, 0);
    ctx.quadraticCurveTo(length * 0.12, -beam * 0.5, -length * 0.42, -beam * 0.42);
    ctx.lineTo(-length * 0.5, -beam * 0.3);
    ctx.lineTo(-length * 0.5, beam * 0.3);
    ctx.lineTo(-length * 0.42, beam * 0.42);
    ctx.quadraticCurveTo(length * 0.12, beam * 0.5, length * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#D8DCDA";
    ctx.beginPath();
    ctx.moveTo(length * 0.32, 0);
    ctx.quadraticCurveTo(length * 0.05, -beam * 0.3, -length * 0.34, -beam * 0.26);
    ctx.lineTo(-length * 0.34, beam * 0.26);
    ctx.quadraticCurveTo(length * 0.05, beam * 0.3, length * 0.32, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#9FB0B8";
    ctx.fillRect(-length * 0.2, -beam * 0.2, length * 0.26, beam * 0.4);
    ctx.fillStyle = "#5E7480";
    ctx.fillRect(-length * 0.14, -beam * 0.12, length * 0.14, beam * 0.24);
    ctx.restore();
  }
  function drawUmbrella(x, y, size = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(7,21,28,0.20)";
    ctx.beginPath();
    ctx.ellipse(2, 5, 9 * size, 4 * size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6B5140";
    ctx.lineWidth = 1.3 * size;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 8 * size);
    ctx.stroke();
    const colors = ["#F2E7C9", "#E9864F", "#F2E7C9", "#E9864F"];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 9 * size, i * Math.PI / 2, (i + 1) * Math.PI / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  function drawRocks(x, y, w, h, seed) {
    const points = [];
    const steps = 14;
    for (let i = 0; i < steps; i++) {
      const angle = i / steps * Math.PI * 2;
      const wobble = 0.78 + 0.34 * Math.abs(Math.sin(seed * 2.7 + i * 1.9));
      const px = x + w / 2 + Math.cos(angle) * (w / 2) * wobble;
      const py = y + h / 2 + Math.sin(angle) * (h / 2) * wobble;
      points.push(project(px, py));
    }
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.closePath();
    };
    ctx.save();
    ctx.translate(SHADOW_X * 3, SHADOW_Y * 3);
    trace();
    ctx.fillStyle = "rgba(48,58,64,0.35)";
    ctx.fill();
    ctx.restore();
    trace();
    ctx.fillStyle = COLORS.rock;
    ctx.fill();
    ctx.save();
    trace();
    ctx.clip();
    ctx.fillStyle = "rgba(214,214,204,0.30)";
    const cap = project(x + w * 0.5 - SHADOW_X * 12, y + h * 0.5 - SHADOW_Y * 12);
    ctx.beginPath();
    ctx.ellipse(cap.x, cap.y, w * 0.42 * cap.scale, h * 0.4 * cap.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawBuilding(x, y, w, h, angle) {
    const corners = (dx, dy, inset) => {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const hw = w / 2 - inset;
      const hh = h / 2 - inset;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(
        ([ox, oy]) => project(cx + ox * cos - oy * sin + dx, cy + ox * sin + oy * cos + dy)
      );
    };
    const fillQuad = (pts, color) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };
    fillQuad(corners(SHADOW_X * 7, SHADOW_Y * 7, 0), "rgba(52,62,70,0.32)");
    fillQuad(corners(SHADOW_X * 3.5, SHADOW_Y * 3.5, 0), "#8E938F");
    fillQuad(corners(0, 0, 0), "#C9CCC5");
    fillQuad(corners(0, 0, w * 0.16), "#AFB4AE");
  }
  function drawBridge(x1, y1, x2, y2, width) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length * (width / 2);
    const ny = dx / length * (width / 2);
    const railA = [];
    const railB = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      railA.push(project(x1 + dx * t + nx, y1 + dy * t + ny));
      railB.push(project(x1 + dx * t - nx, y1 + dy * t - ny));
    }
    ctx.save();
    ctx.translate(SHADOW_X * 5, SHADOW_Y * 5);
    fillRibbon(railA, railB, "rgba(52,62,70,0.3)");
    ctx.restore();
    fillRibbon(railA, railB, "#E0BE63");
    ctx.strokeStyle = "rgba(140,110,44,0.55)";
    for (let i = 1; i < steps; i++) {
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(railA[i].x, railA[i].y);
      ctx.lineTo(railB[i].x, railB[i].y);
      ctx.stroke();
    }
    ctx.strokeStyle = "#C9A84D";
    ctx.lineWidth = 2.4;
    for (const rail of [railA, railB]) {
      ctx.beginPath();
      ctx.moveTo(rail[0].x, rail[0].y);
      for (let i = 1; i < rail.length; i++) ctx.lineTo(rail[i].x, rail[i].y);
      ctx.stroke();
    }
  }
  function drawChequer(x, y, w, h, angle) {
    const cols = 8;
    const rows = 4;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const cellW = w / cols;
    const cellH = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = -w / 2 + c * cellW;
        const oy = -h / 2 + r * cellH;
        const pts = [[ox, oy], [ox + cellW, oy], [ox + cellW, oy + cellH], [ox, oy + cellH]].map(
          ([px, py]) => project(x + w / 2 + px * cos - py * sin, y + h / 2 + px * sin + py * cos)
        );
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        ctx.fillStyle = (r + c) % 2 === 0 ? "#F2F0E8" : "#3B4249";
        ctx.fill();
      }
    }
  }
  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, DESIGN_H);
    gradient.addColorStop(0, COLORS.waterDeep);
    gradient.addColorStop(0.55, COLORS.water);
    gradient.addColorStop(1, "#94AEBA");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
    const ripple = waterTexture(ctx);
    if (ripple) {
      ctx.fillStyle = ripple;
      ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
    }
    const decor = trackById(activeTrackId).decor;
    const quad = (x, y, w, h, dx = 0, dy = 0) => {
      const top = [project(x + dx, y + dy), project(x + w + dx, y + dy)];
      const bottom = [project(x + dx, y + h + dy), project(x + w + dx, y + h + dy)];
      fillRibbon(top, bottom, ctx.fillStyle);
    };
    decor.medians.forEach(([x, y, w, h], i) => {
      ctx.fillStyle = "rgba(4,12,18,0.42)";
      quad(x - 4, y - 4, w + 8, h + 8, SHADOW_X * ISLAND_DEPTH, SHADOW_Y * ISLAND_DEPTH);
      ctx.fillStyle = "#5A7043";
      quad(x - 4, y - 4, w + 8, h + 8, SHADOW_X * ISLAND_DEPTH * 0.5, SHADOW_Y * ISLAND_DEPTH * 0.5);
      ctx.fillStyle = COLORS.landDark;
      quad(x - 4, y - 4, w + 8, h + 8);
      ctx.fillStyle = i % 2 === 0 ? COLORS.land : COLORS.landLight;
      quad(x, y, w, h);
      const grass = grassTexture(ctx);
      if (grass) {
        ctx.fillStyle = grass;
        quad(x, y, w, h);
      }
    });
    for (const [x, y, size] of decor.trees) {
      const p = project(x, y);
      drawTree(p.x, p.y, size * p.scale);
    }
    for (const [x, y, size] of decor.umbrellas) {
      const p = project(x, y);
      drawUmbrella(p.x, p.y, size * p.scale);
    }
    for (const [x, y, w, h, seed] of decor.rocks) drawRocks(x, y, w, h, seed);
    for (const [x1, y1, x2, y2, width] of decor.bridges) drawBridge(x1, y1, x2, y2, width);
    for (const [x, y, w, h, angle] of decor.chequers) drawChequer(x, y, w, h, angle);
    for (const [x, y, w, h, angle] of decor.buildings) drawBuilding(x, y, w, h, angle);
    for (const [x, y, size, angle] of decor.boats) {
      const p = project(x, y);
      drawBoat(p.x, p.y, size * p.scale, angle);
    }
    for (const [x, y] of decor.buoys) {
      const p = project(x, y);
      ctx.fillStyle = "rgba(240,231,204,0.75)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2 * p.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(232,112,79,0.85)";
      ctx.beginPath();
      ctx.arc(p.x, p.y - 2.8 * p.scale, 1.2 * p.scale, 0, Math.PI * 2);
      ctx.fill();
    }
    drawVignette();
  }
  function drawVignette() {
    const gradient = ctx.createRadialGradient(
      DESIGN_W * 0.42,
      DESIGN_H * 0.38,
      DESIGN_H * 0.18,
      DESIGN_W * 0.5,
      DESIGN_H * 0.5,
      DESIGN_H * 0.72
    );
    gradient.addColorStop(0, "rgba(255,255,245,0.10)");
    gradient.addColorStop(0.55, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(40,60,72,0.32)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
  }

  // src/render/staticLayer.ts
  var layer = null;
  var layerCtx = null;
  var renderedTrack = null;
  var unavailable2 = false;
  function ensureLayer() {
    if (unavailable2) return false;
    if (layer && layerCtx) return true;
    layer = createOffscreenCanvas(Math.floor(VIEW_W * DPR), Math.floor(VIEW_H * DPR));
    layerCtx = layer ? layer.getContext("2d") : null;
    if (!layer || !layerCtx) {
      unavailable2 = true;
      return false;
    }
    return true;
  }
  function renderLayer(target) {
    target.setTransform(DPR, 0, 0, DPR, 0, 0);
    target.clearRect(0, 0, VIEW_W, VIEW_H);
    target.save();
    target.translate(offsetX, offsetY);
    target.scale(scale, scale);
    withRenderTarget(target, () => {
      drawBackground();
      drawTrack();
    });
    target.restore();
  }
  function drawStaticScene() {
    if (!ensureLayer() || !layer || !layerCtx) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      drawBackground();
      drawTrack();
      ctx.restore();
      return;
    }
    if (renderedTrack !== activeTrackId) {
      renderLayer(layerCtx);
      renderedTrack = activeTrackId;
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  }

  // src/render/vehicles.ts
  var PLAYER_STYLE = {
    body: COLORS.player,
    cabin: COLORS.playerLight,
    window: COLORS.window,
    lights: "#FFE6A4",
    stripe: COLORS.playerStripe,
    side: "#96271B",
    rim: "#FFC9B2"
  };
  var AI_STYLE = {
    body: COLORS.ai,
    cabin: COLORS.aiLight,
    window: COLORS.aiWindow,
    lights: "#DCF4FF",
    stripe: null,
    side: "#1B4769",
    rim: "#7FD4F5"
  };
  function drawVehicle(distance, laneIndex, style, alpha = 1, indicatorDirection = 0, indicatorOn = false, spriteKey = "", swell = 1) {
    const plane = sampleAtDistance(distance, laneIndex);
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
    ctx.save();
    ctx.globalAlpha = alpha * 0.32;
    ctx.translate(p.x + SHADOW_X * CAR_SHADOW_DISTANCE, p.y + SHADOW_Y * CAR_SHADOW_DISTANCE);
    ctx.rotate(p.angle);
    ctx.fillStyle = "#050D13";
    roundRect(ctx, -7.8, -4, 15.6, 8, 2.8);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    const depth = localLight(p.angle, CAR_BODY_DEPTH);
    ctx.fillStyle = style.side;
    roundRect(ctx, -7.8 + depth.x, -4 + depth.y, 15.6, 8, 2.8);
    ctx.fill();
    ctx.fillStyle = style.body;
    roundRect(ctx, -7.8, -4, 15.6, 8, 2.8);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = style.rim;
    ctx.lineWidth = 0.7;
    roundRect(ctx, -7.55 - depth.x * 0.35, -3.75 - depth.y * 0.35, 15.1, 7.5, 2.6);
    ctx.stroke();
    ctx.restore();
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
    ctx.save();
    ctx.globalAlpha = alpha * 0.55;
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, -1.1 - cabinDepth.x, -2.05 - cabinDepth.y, 1.7, 4, 0.8);
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
      ctx.fillStyle = "#FFD55C";
      const indicatorY = indicatorDirection > 0 ? 3.65 : -4.85;
      ctx.fillRect(2.8, indicatorY, 3.2, 1.4);
      ctx.fillRect(-5.5, indicatorY, 2.6, 1.4);
    }
    ctx.restore();
    ctx.restore();
  }
  function drawSpriteVehicle(p, sprite, style, alpha, indicatorDirection, indicatorOn, swell = 1) {
    const length = CAR_LENGTH * swell;
    const width = CAR_WIDTH * swell;
    const halfL = length / 2;
    const halfW = width / 2;
    ctx.save();
    ctx.globalAlpha = alpha * 0.34;
    ctx.translate(p.x + SHADOW_X * CAR_SHADOW_DISTANCE, p.y + SHADOW_Y * CAR_SHADOW_DISTANCE);
    ctx.rotate(p.angle);
    ctx.drawImage(sprite.shadow, -halfL, -halfW, length, width);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.drawImage(sprite.image, -halfL, -halfW, length, width);
    if (indicatorDirection !== 0 && indicatorOn) {
      ctx.fillStyle = "#FFD55C";
      const indicatorY = indicatorDirection > 0 ? halfW - 0.4 : -halfW - 1;
      ctx.fillRect(2.8, indicatorY, 3.2, 1.4);
      ctx.fillRect(-5.5, indicatorY, 2.6, 1.4);
    }
    ctx.restore();
    void style;
  }
  function drawAiCar(car) {
    const indicatorOn = car.state === "WARNING" && Math.floor(car.stateElapsed * 30) % 2 === 0;
    drawVehicle(car.distance, car.visualLane, AI_STYLE, 1, car.direction, indicatorOn, "ai");
  }
  function drawWreck(car) {
    const plane = sampleAtDistance(car.distance, car.visualLane);
    const p = project(plane.x, plane.y);
    const t = Math.max(0, Math.min(1, car.wreck));
    ctx.save();
    ctx.globalAlpha = t;
    ctx.translate(p.x, p.y);
    const radius = (5 + (1 - t) * 12) * p.scale;
    ctx.fillStyle = "rgba(255,150,72,0.55)";
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(46,30,26,0.75)";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawZone(car) {
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
    const headPlane = sampleAtDistance(car.distance, car.visualLane);
    const head = project(headPlane.x, headPlane.y);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(8,17,25,0.7)";
    ctx.fillRect(head.x - 9, head.y - 11, 18, 3);
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(head.x - 9, head.y - 11, 18 * Math.max(0, Math.min(1, car.zoneFill)), 3);
    ctx.restore();
  }
  function playerAlpha() {
    if (player.invincible > 0) return Math.floor(player.invincible * 12) % 2 === 0 ? 0.25 : 1;
    return 1;
  }
  function drawFireballAura() {
    if (player.fireball <= 0) return;
    const plane = sampleAtDistance(player.distance, player.visualLane);
    const p = project(plane.x, plane.y);
    const pulse = 0.72 + Math.sin(player.travelled * 0.06) * 0.28;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.scale, p.scale);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "rgba(255,164,72,0.75)";
    ctx.beginPath();
    ctx.arc(0, 0, 11 + pulse * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "rgba(255,226,150,0.85)";
    ctx.beginPath();
    ctx.arc(0, 0, 7 + pulse * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  var TRAIL_MIN_SEGMENTS = 8;
  var TRAIL_MAX_SEGMENTS = 26;
  var TRAIL_STRIDE = 2;
  var GHOSTS_MAX = 3;
  function trailIntensity() {
    const base = baseCruiseSpeed();
    const span = PLAYER_MAX_SPEED * tuning.player - base;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, (player.speed - base) / span));
  }
  function drawAfterimage() {
    const trail = player.trail;
    if (trail.length < 4 || player.state === "CRASHED") return;
    const intensity2 = trailIntensity();
    if (intensity2 <= 0.04) return;
    const stride = TRAIL_STRIDE;
    const segments = Math.round(
      TRAIL_MIN_SEGMENTS + intensity2 * (TRAIL_MAX_SEGMENTS - TRAIL_MIN_SEGMENTS)
    );
    const points = [];
    for (let i = 0; i < segments; i++) {
      const index = trail.length - 1 - i * stride;
      if (index < 0) break;
      const sample = trail[index];
      const plane = sampleAtDistance(sample.distance, sample.lane);
      points.push(project(plane.x, plane.y));
    }
    if (points.length < 2) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 0; i < points.length - 1; i++) {
      const t = i / (points.length - 1);
      ctx.globalAlpha = intensity2 * 0.62 * Math.pow(1 - t, 0.85);
      ctx.strokeStyle = PLAYER_STYLE.body;
      ctx.lineWidth = CAR_WIDTH * (0.92 - t * 0.55);
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[i + 1].x, points[i + 1].y);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < points.length - 1; i++) {
      const t = i / (points.length - 1);
      ctx.globalAlpha = intensity2 * 0.85 * Math.pow(1 - t, 1.4);
      ctx.strokeStyle = "#FF7A46";
      ctx.lineWidth = CAR_WIDTH * (0.5 - t * 0.34);
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[i + 1].x, points[i + 1].y);
      ctx.stroke();
    }
    for (let i = 0; i < points.length - 1; i++) {
      const t = i / (points.length - 1);
      ctx.globalAlpha = intensity2 * 0.8 * Math.pow(1 - t, 2.2);
      ctx.strokeStyle = "#FFE7B8";
      ctx.lineWidth = CAR_WIDTH * (0.2 - t * 0.15);
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[i + 1].x, points[i + 1].y);
      ctx.stroke();
    }
    ctx.restore();
    const ghosts = 1 + Math.round(intensity2 * (GHOSTS_MAX - 1));
    for (let ghost = ghosts; ghost >= 1; ghost--) {
      const index = trail.length - 1 - ghost * stride * 2;
      if (index < 0) continue;
      const sample = trail[index];
      const fade = 1 - ghost / (ghosts + 1);
      drawVehicle(
        sample.distance,
        sample.lane,
        PLAYER_STYLE,
        intensity2 * 0.55 * fade,
        0,
        false,
        "player",
        1 + intensity2 * 0.16 * (ghost / ghosts)
      );
    }
  }
  var CAR_SHAKE = 0.26;
  function drawCars() {
    const ordered = aiCars.map((car) => {
      const plane = sampleAtDistance(car.distance, car.visualLane);
      return { car, depth: project(plane.x, plane.y).depth };
    }).sort((a, b) => b.depth - a.depth);
    for (const { car } of ordered) {
      if (!car.alive) {
        if (car.wreck > 0) drawWreck(car);
        continue;
      }
      if (car.hasZone) drawZone(car);
      drawAiCar(car);
    }
    const shakeX = shakeOffsetX() * CAR_SHAKE;
    const shakeY = shakeOffsetY() * CAR_SHAKE;
    const shaking = shakeX !== 0 || shakeY !== 0;
    if (shaking) {
      ctx.save();
      ctx.translate(shakeX, shakeY);
    }
    drawAfterimage();
    drawFireballAura();
    drawVehicle(player.distance, player.visualLane, PLAYER_STYLE, playerAlpha(), 0, false, "player");
    if (shaking) ctx.restore();
  }

  // src/scoring.ts
  var WRECK_SECONDS = 0.9;
  var CLOSE_CALL_LANE_DISTANCE = 1.25;
  var CLOSE_CALL_PATH_DISTANCE = 42;
  var CLOSE_CALL_BOOST = 0.55;
  function destroyCar(car) {
    var _a, _b;
    car.alive = false;
    car.wreck = WRECK_SECONDS;
    car.hasZone = false;
    run.destroyed += 1;
    const point = sampleAtDistance(car.distance, car.visualLane);
    burst(point.x, point.y, {
      count: 14,
      speed: 95,
      life: 0.42,
      size: 2.6,
      colors: ["#FFD48A", "#FF8A3C", "#FFF2CE"],
      streak: true
    });
    addShake(4.5);
    addHitStop(0.045);
    audio.playSpeedTierUp(Math.min(7, 2 + run.destroyed));
    vibrate("medium");
    (_b = (_a = activeMode).onDestroy) == null ? void 0 : _b.call(_a, car, run);
  }
  function crash() {
    var _a, _b;
    const point = sampleAtDistance(player.distance, player.visualLane);
    burst(point.x, point.y, {
      count: 22,
      speed: 130,
      life: 0.55,
      size: 3.1,
      colors: ["#FF6B5E", "#FFB43C", "#FFF2CE", "#9AA7AE"],
      streak: true
    });
    addHitStop(0.075);
    addShake(9);
    audio.playCrash();
    beginCollision();
    run.crashes += 1;
    (_b = (_a = activeMode).onCrash) == null ? void 0 : _b.call(_a, run);
  }
  function registerCloseCall() {
    var _a, _b;
    run.closeCalls += 1;
    player.tierBoostElapsed = Math.max(player.tierBoostElapsed, CLOSE_CALL_BOOST);
    const point = sampleAtDistance(player.distance, player.visualLane);
    burst(point.x, point.y, {
      count: 7,
      speed: 70,
      life: 0.3,
      size: 1.8,
      colors: ["#C5FFF7", "#57D5CB"],
      streak: true
    });
    audio.playCloseCall();
    (_b = (_a = activeMode).onCloseCall) == null ? void 0 : _b.call(_a, run);
  }
  function detectCollisions() {
    var _a, _b, _c;
    if (player.invincible > 0 || player.state === "CRASHED") return false;
    for (const car of aiCars) {
      if (!car.alive) continue;
      const laneDistanceNow = Math.abs(player.visualLane - car.visualLane);
      const laneDistanceBefore = Math.abs(player.previousVisualLane - car.previousVisualLane);
      const laneDistance = Math.min(laneDistanceNow, laneDistanceBefore);
      const pathDistance = circularDistance(player.distance, car.distance);
      const previousGap = player.previousDistance - car.previousDistance;
      const currentGap = player.distance - car.distance;
      const previousPassIndex = Math.floor(previousGap / arc.total);
      const currentPassIndex = Math.floor(currentGap / arc.total);
      const sweptThroughCar = currentPassIndex > previousPassIndex;
      const touching = laneDistance <= COLLISION_LANE_DISTANCE && (pathDistance <= COLLISION_PATH_DISTANCE || sweptThroughCar);
      if (!touching) continue;
      const response = (_c = (_b = (_a = activeMode).onContact) == null ? void 0 : _b.call(_a, car, run)) != null ? _c : "crash";
      if (response === "ignore") continue;
      if (response === "destroy") {
        destroyCar(car);
        continue;
      }
      crash();
      return true;
    }
    return false;
  }
  function detectOvertakes() {
    var _a, _b;
    for (const car of aiCars) {
      if (!car.alive) continue;
      const currentPassIndex = Math.floor((player.distance - car.distance) / arc.total);
      if (currentPassIndex > car.passIndex) {
        const overtakes = currentPassIndex - car.passIndex;
        const previousCombo = player.combo;
        const previousTier = currentSpeedTier(previousCombo);
        player.combo += overtakes;
        const newTier = currentSpeedTier(player.combo);
        player.totalPasses += overtakes;
        player.bestCombo = Math.max(player.bestCombo, player.combo);
        player.passPopElapsed = 0;
        car.passIndex = currentPassIndex;
        audio.playOvertake(player.combo, overtakes);
        const passPlane = sampleAtDistance(player.distance, player.visualLane);
        const passPoint = project(passPlane.x, passPlane.y);
        floatText(passPoint.x, passPoint.y - 14 * passPoint.scale, `${player.combo}`, "#C5FFF7", 26 * passPoint.scale);
        const kicked = Math.floor(player.combo / OVERTAKE_KICK_EVERY) > Math.floor(previousCombo / OVERTAKE_KICK_EVERY);
        if (kicked) player.tierBoostElapsed = PLAYER_TIER_BOOST_DURATION;
        if (newTier > previousTier) audio.playSpeedTierUp(newTier);
        if (kicked) {
          const point = sampleAtDistance(player.distance, player.visualLane);
          burst(point.x, point.y, {
            count: 18,
            speed: 120,
            life: 0.5,
            size: 2.4,
            colors: ["#C5FFF7", "#57D5CB", "#FFF4D8"],
            streak: true
          });
        }
        vibrate(kicked ? "medium" : "light");
        (_b = (_a = activeMode).onOvertake) == null ? void 0 : _b.call(_a, overtakes, run);
        const laneGap = Math.abs(player.visualLane - car.visualLane);
        const pathGap = circularDistance(player.distance, car.distance);
        if (laneGap <= CLOSE_CALL_LANE_DISTANCE && pathGap <= CLOSE_CALL_PATH_DISTANCE) {
          registerCloseCall();
        }
      } else if (currentPassIndex < car.passIndex) {
        car.passIndex = currentPassIndex;
      }
    }
  }

  // src/main.ts
  function stepRace(dt) {
    updateControlFlash(dt);
    if (updateCountdown(dt)) return;
    updateOnboarding(dt);
    updateFeel(dt);
    updateParticles(dt);
    updateFloaters(dt);
    const simDt = consumeHitStop(dt);
    if (simDt <= 0) return;
    updateAi(simDt);
    updatePlayer(simDt);
    audio.update(simDt, engineSnapshot());
    const collided = detectCollisions();
    if (!collided) detectOvertakes();
    updateRun(simDt);
  }
  function drawRace() {
    drawStaticScene();
    ctx.save();
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
  function frame(nowValue) {
    const now = typeof nowValue === "number" ? nowValue : Date.now();
    const dt = frameDelta(now);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    if (app.screen === "PLAYING") {
      stepRace(dt);
      drawRace();
    } else {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      if (app.screen === "MENU") {
        updateMenu(dt);
        drawMenu();
      } else if (app.screen === "TRACKS") {
        drawTrackSelect();
      } else {
        drawResult();
      }
      ctx.restore();
    }
    if (app.screen === "PLAYING" && runIsOver()) {
      releaseAllPointers();
      audio.stopTransients();
      enterResultScreen();
      finishRun();
    }
    scheduleFrame(frame);
  }
  audio.setMuted(loadMuted());
  installInput();
  installShareMenu();
  if (typeof wx.onHide === "function") {
    wx.onHide(() => {
      releaseAllPointers();
      audio.suspend();
    });
  }
  if (typeof wx.onShow === "function") wx.onShow(() => audio.resume());
  scheduleFrame(frame);
  return __toCommonJS(main_exports);
})();

/**
 * Procedural audio: no copyrighted samples and no external sound files.
 * WeChat Mini Game uses wx.createWebAudioContext when available; browser preview
 * falls back to the standard AudioContext implementation supplied by index.html.
 *
 * This module never imports game state. update() receives a snapshot instead, so
 * audio and gameplay stay independently testable.
 */

import { clamp } from './mathUtil';
import { createCompatibleAudioContext } from './platform';
import type { EngineSnapshot } from './types';

interface Voice {
  oscillator: OscillatorNode;
  gain: GainNode;
  elapsed: number;
  duration: number;
  startFrequency: number;
  endFrequency: number;
  volume: number;
}

function setAudioParam(param: AudioParam | undefined | null, value: number): void {
  if (!param) return;
  try {
    param.value = value;
  } catch (error) {
    /* unsupported audio parameter */
  }
}

function safelyStartNode(node: { start?: (when: number) => void } | null): void {
  if (!node || typeof node.start !== 'function') return;
  try {
    node.start(0);
  } catch (error) {
    /* already started or unsupported */
  }
}

function safelyStopNode(node: { stop?: (when: number) => void; disconnect?: () => void } | null | undefined): void {
  if (!node) return;
  if (typeof node.stop === 'function') {
    try {
      node.stop(0);
    } catch (error) {
      /* already stopped */
    }
  }
  if (typeof node.disconnect === 'function') {
    try {
      node.disconnect();
    } catch (error) {
      /* already disconnected */
    }
  }
}

function createLoopingNoiseSource(context: AudioContext): AudioBufferSourceNode | null {
  if (!context || typeof context.createBuffer !== 'function' || typeof context.createBufferSource !== 'function') return null;
  try {
    const sampleRate = context.sampleRate || 44100;
    const frameCount = Math.max(1, Math.floor(sampleRate * 1.25));
    const buffer = context.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < frameCount; index++) {
      // Brown-ish noise creates mechanical texture without a harsh hiss.
      const white = Math.random() * 2 - 1;
      previous = previous * 0.965 + white * 0.035;
      data[index] = previous * 2.4;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  } catch (error) {
    return null;
  }
}

/** Every ten overtakes lifts the whole RPM band by one step. */
const TIER_RPM_MULTIPLIER = [1.00, 1.065, 1.13, 1.19, 1.245, 1.295, 1.34, 1.38, 1.415, 1.445, 1.47];

/** The tyre voice hangs off the same master as everything else. */
function masterGainForTyres(master: GainNode): GainNode {
  return master;
}

const MAX_VOICES = 12;

/** Master level when unmuted. */
const MASTER_VOLUME = 0.46;

class AudioEngine {
  private context: AudioContext | null = null;
  private started = false;
  private disabled = false;

  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineLow: OscillatorNode | null = null;
  private engineMid: OscillatorNode | null = null;
  private engineHigh: OscillatorNode | null = null;
  private engineMidGain: GainNode | null = null;
  private engineHighGain: GainNode | null = null;
  private engineNoise: AudioBufferSourceNode | null = null;
  private engineNoiseFilter: BiquadFilterNode | null = null;
  private engineNoiseGain: GainNode | null = null;
  /** Sub-octave sine: the body the three-layer engine was missing. */
  private engineBody: OscillatorNode | null = null;
  private engineBodyGain: GainNode | null = null;
  /** Tyre scrub, a separate filtered noise voice driven by cornering load. */
  private tyreNoise: AudioBufferSourceNode | null = null;
  private tyreFilter: BiquadFilterNode | null = null;
  private tyreGain: GainNode | null = null;
  private smoothCornering = 0;

  private muted = false;
  private smoothEngineFrequency = 48;
  private smoothEngineVolume = 0;
  private smoothThrottle = 0;
  private enginePulsePhase = 0;
  private effectDuck = 0;
  private voices: Voice[] = [];
  /** One-shot nodes that decay on their own schedule (the crash noise burst). */
  private transients: Array<{
    nodes: Array<{ stop?: (when: number) => void; disconnect?: () => void }>;
    gain: GainNode;
    elapsed: number;
    duration: number;
    volume: number;
  }> = [];

  ensureStarted(): boolean {
    if (this.disabled) return false;

    if (!this.context) {
      this.context = createCompatibleAudioContext();
      if (!this.context) {
        this.disabled = true;
        return false;
      }
    }

    if (this.context.state === 'suspended' && typeof this.context.resume === 'function') {
      try {
        const resumeResult = this.context.resume();
        if (resumeResult && typeof resumeResult.catch === 'function') resumeResult.catch(() => {});
      } catch (error) {
        /* a later user gesture can retry */
      }
    }

    if (!this.started) {
      try {
        const context = this.context;
        this.masterGain = context.createGain();
        this.engineGain = context.createGain();
        this.engineMidGain = context.createGain();
        this.engineHighGain = context.createGain();
        this.engineNoiseGain = context.createGain();
        this.engineFilter = context.createBiquadFilter();
        this.engineNoiseFilter = context.createBiquadFilter();
        this.engineLow = context.createOscillator();
        this.engineMid = context.createOscillator();
        this.engineHigh = context.createOscillator();
        this.engineNoise = createLoopingNoiseSource(context);
        this.engineBody = context.createOscillator();
        this.engineBodyGain = context.createGain();
        this.tyreNoise = createLoopingNoiseSource(context);
        this.tyreFilter = context.createBiquadFilter();
        this.tyreGain = context.createGain();

        setAudioParam(this.masterGain.gain, this.muted ? 0 : MASTER_VOLUME);
        setAudioParam(this.engineGain.gain, 0.0001);
        setAudioParam(this.engineMidGain.gain, 0.070);
        setAudioParam(this.engineHighGain.gain, 0.018);
        setAudioParam(this.engineNoiseGain.gain, 0.0001);
        setAudioParam(this.engineBodyGain.gain, 0.055);
        setAudioParam(this.tyreGain.gain, 0.0001);
        try { this.tyreFilter.type = 'bandpass'; } catch (error) { /* default filter */ }
        setAudioParam(this.tyreFilter.frequency, 2400);
        setAudioParam(this.tyreFilter.Q, 1.5);
        try { this.engineBody.type = 'sine'; } catch (error) { /* default sine */ }
        setAudioParam(this.engineBody.frequency, this.smoothEngineFrequency * 0.5);

        try { this.engineFilter.type = 'lowpass'; } catch (error) { /* default filter */ }
        setAudioParam(this.engineFilter.frequency, 520);
        setAudioParam(this.engineFilter.Q, 0.72);
        try { this.engineNoiseFilter.type = 'bandpass'; } catch (error) { /* default filter */ }
        setAudioParam(this.engineNoiseFilter.frequency, 720);
        setAudioParam(this.engineNoiseFilter.Q, 0.85);

        // Three detuned mechanical layers plus filtered noise avoid the single-note
        // synthesizer character of V0.9.3.
        try { this.engineLow.type = 'triangle'; } catch (error) { /* default sine */ }
        try { this.engineMid.type = 'sawtooth'; } catch (error) { /* default sine */ }
        try { this.engineHigh.type = 'triangle'; } catch (error) { /* default sine */ }
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
        this.masterGain.connect(context.destination);

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

  private addTone(type: OscillatorType, duration: number, startFrequency: number, endFrequency: number, volume: number): void {
    if (!this.ensureStarted()) return;
    const context = this.context;
    const masterGain = this.masterGain;
    if (!context || !masterGain) return;

    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      try { oscillator.type = type; } catch (error) { /* default sine */ }
      setAudioParam(oscillator.frequency, startFrequency);
      setAudioParam(gain.gain, 0.0001);
      oscillator.connect(gain);
      gain.connect(masterGain);
      safelyStartNode(oscillator);
      // Prevent dense combo sequences from building up a harsh wall of tones.
      while (this.voices.length >= MAX_VOICES) {
        const oldest = this.voices.shift();
        safelyStopNode(oldest?.oscillator);
        safelyStopNode(oldest?.gain);
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
      /* one failed effect must not stop the game */
    }
  }

  /** Silence without tearing anything down, so unmuting is instant. */
  setMuted(muted: boolean): void {
    this.muted = muted;
    setAudioParam(this.masterGain?.gain, muted ? 0 : MASTER_VOLUME);
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** UI tap. Deliberately dry and short: menus should click, not sing. */
  playUiTap(): void {
    this.addTone('triangle', 0.045, 660, 520, 0.05);
  }

  /** Confirmation, one step up from a tap: starting a run, choosing a mode. */
  playUiConfirm(): void {
    this.addTone('triangle', 0.07, 520, 780, 0.055);
    this.addTone('sine', 0.09, 780, 1040, 0.022);
  }

  /** Refusal: a flat, slightly sour pair that reads as "no" without being harsh. */
  playUiDenied(): void {
    this.addTone('sawtooth', 0.09, 220, 180, 0.038);
    this.addTone('triangle', 0.07, 175, 150, 0.022);
  }

  /** Stage or objective cleared: a rising major triad. */
  playFanfare(): void {
    this.effectDuck = Math.max(this.effectDuck, 0.4);
    const root = 392;
    this.addTone('triangle', 0.13, root, root, 0.06);
    this.addTone('triangle', 0.15, root * 1.26, root * 1.26, 0.055);
    this.addTone('triangle', 0.22, root * 1.5, root * 1.5, 0.05);
    this.addTone('sine', 0.3, root * 3, root * 3, 0.016);
  }

  /** Revive: a low swell up into the engine coming back. */
  playRevive(): void {
    this.effectDuck = Math.max(this.effectDuck, 0.5);
    this.addTone('sawtooth', 0.34, 90, 300, 0.07);
    this.addTone('sine', 0.4, 300, 660, 0.03);
  }

  playLaneChange(direction: number): void {
    // Short, soft downward sweep. Direction changes the starting pitch only
    // slightly, so repeated left/right inputs do not become a pair of loud beeps.
    const directionLift = direction > 0 ? 16 : -16;
    this.effectDuck = Math.max(this.effectDuck, 0.22);
    this.addTone('triangle', 0.065, 330 + directionLift, 205 + directionLift, 0.040);
    this.addTone('sine', 0.045, 510 + directionLift, 350 + directionLift, 0.010);
  }

  playOvertake(combo: number, count = 1): void {
    // Ordinary passes are feedback only; they no longer change the permanent speed.
    const withinBlock = Math.max(0, combo - 1) % 10;
    const notePattern = [0, 2, 3, 5, 7, 8, 10, 12, 10, 12];
    const tier = Math.min(7, Math.floor(Math.max(0, combo - 1) / 10));
    const semitones = notePattern[withinBlock] + tier * 0.34;
    const baseFrequency = Math.min(760, 305 * Math.pow(2, semitones / 12));
    const volume = Math.min(0.064, 0.046 + Math.max(0, count - 1) * 0.006);
    this.effectDuck = Math.max(this.effectDuck, 0.25);
    this.addTone('triangle', 0.070, baseFrequency * 0.95, baseFrequency, volume);
    this.addTone('sine', 0.046, baseFrequency * 1.45, baseFrequency * 1.49, volume * 0.12);
  }

  /**
   * Crash. A filtered noise burst plus a low body thud: the noise carries the
   * scrape, the sine carries the mass. Crashes used to be silent, which cost
   * most of the perceived impact.
   */
  playCrash(): void {
    if (!this.ensureStarted()) return;
    const context = this.context;
    const masterGain = this.masterGain;
    if (!context || !masterGain) return;

    this.effectDuck = Math.max(this.effectDuck, 0.85);

    try {
      const noise = createLoopingNoiseSource(context);
      if (noise) {
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        try { filter.type = 'bandpass'; } catch (error) { /* default filter */ }
        setAudioParam(filter.frequency, 1500);
        setAudioParam(filter.Q, 0.7);
        setAudioParam(gain.gain, 0.30);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        safelyStartNode(noise);

        // Hand-rolled decay: the mini game WebAudio surface does not reliably
        // support scheduled ramps, so the update loop tears these down instead.
        this.transients.push({ nodes: [noise, gain], gain, elapsed: 0, duration: 0.55, volume: 0.34 });
      }
    } catch (error) {
      /* the crash must still happen without its sound */
    }

    // Three parts: a low body that drops, a metallic ring, and a short scrape.
    this.addTone('sine', 0.42, 128, 34, 0.40);
    this.addTone('triangle', 0.26, 320, 96, 0.16);
    this.addTone('sawtooth', 0.13, 900, 240, 0.07);
  }

  /** Close call: a short upward whoosh, distinct from the overtake blip. */
  playCloseCall(): void {
    this.effectDuck = Math.max(this.effectDuck, 0.3);
    this.addTone('sine', 0.20, 520, 1500, 0.052);
    this.addTone('triangle', 0.13, 260, 700, 0.028);
  }

  playSpeedTierUp(tier: number): void {
    // A restrained mechanical surge marks x10/x20/... without becoming a melody.
    const start = Math.min(250, 118 + tier * 9);
    const end = Math.min(390, start * 1.42);
    this.effectDuck = Math.max(this.effectDuck, 0.18);
    this.addTone('sawtooth', 0.145, start, end, 0.036);
    this.addTone('triangle', 0.110, start * 1.95, end * 1.74, 0.018);
  }

  update(dt: number, snapshot: EngineSnapshot): void {
    if (!this.started || this.disabled) return;

    // RPM has two layers: throttle produces the immediate rise/fall inside a
    // band, while every ten overtakes raises the whole band slightly. Real road
    // speed still changes continuously, but the long-term engine pitch is stepped.
    const tierMultiplier = TIER_RPM_MULTIPLIER[snapshot.tier];

    const throttleTarget = snapshot.throttle && snapshot.state !== 'CRASHED' ? 1 : 0;
    const throttleResponse = throttleTarget > this.smoothThrottle ? 8.0 : 4.6;
    this.smoothThrottle += (throttleTarget - this.smoothThrottle) * (1 - Math.exp(-dt * throttleResponse));

    const speedInsideBand = clamp(
      (snapshot.speed - snapshot.cruiseSpeed) / Math.max(1, snapshot.throttleMaxSpeed - snapshot.cruiseSpeed),
      0,
      1
    );
    const revAmount = clamp(this.smoothThrottle * 0.74 + speedInsideBand * 0.26, 0, 1);
    let targetFrequency = 48 * tierMultiplier * (1 + revAmount * 0.26);
    if (snapshot.state === 'CRASHED') targetFrequency = 36;
    if (snapshot.state === 'RECOVERING') targetFrequency *= 0.82;

    // About 0.3 s of smoothing makes x10/x20/x30 sound like a change in engine
    // load rather than an abrupt musical note. Throttle itself responds faster.
    const engineResponse = 1 - Math.exp(-dt * 6.6);
    this.smoothEngineFrequency += (targetFrequency - this.smoothEngineFrequency) * engineResponse;

    const speedRatio = clamp(snapshot.speed / snapshot.maxSpeed, 0, 1);
    let targetVolume = 0.016 + snapshot.tier * 0.0010 + revAmount * 0.010 + speedRatio * 0.012;
    if (snapshot.state === 'CRASHED') targetVolume = 0.0035;
    if (snapshot.state === 'RECOVERING') targetVolume *= 0.72;
    this.smoothEngineVolume += (targetVolume - this.smoothEngineVolume) * (1 - Math.exp(-dt * 8));

    const pulseRate = 7.2 + snapshot.tier * 0.72 + revAmount * 6.4;
    this.enginePulsePhase = (this.enginePulsePhase + dt * pulseRate) % 1;
    const pulseWave = Math.max(0, Math.sin(this.enginePulsePhase * Math.PI * 2));
    const pulse = 0.82 + Math.pow(pulseWave, 3.2) * 0.18;
    this.effectDuck = Math.max(0, this.effectDuck - dt * 3.6);
    const duck = 1 - this.effectDuck * 0.28;

    setAudioParam(this.engineLow?.frequency, this.smoothEngineFrequency);
    setAudioParam(this.engineMid?.frequency, this.smoothEngineFrequency * (2.01 + revAmount * 0.035));
    setAudioParam(this.engineHigh?.frequency, this.smoothEngineFrequency * (4.03 + revAmount * 0.11));
    setAudioParam(this.engineMidGain?.gain, 0.052 + revAmount * 0.035 + speedRatio * 0.010);
    setAudioParam(this.engineHighGain?.gain, 0.012 + revAmount * 0.018);
    setAudioParam(this.engineGain?.gain, this.smoothEngineVolume * pulse * duck);
    setAudioParam(this.engineFilter?.frequency, 330 + snapshot.tier * 46 + revAmount * 740 + speedRatio * 260);
    setAudioParam(this.engineNoiseFilter?.frequency, 560 + snapshot.tier * 65 + revAmount * 920 + speedRatio * 380);
    setAudioParam(this.engineNoiseGain?.gain, (0.003 + revAmount * 0.010 + speedRatio * 0.009) * duck);

    // Sub-octave body, detuned a touch so it beats against the main layer
    // instead of sitting exactly on top of it.
    setAudioParam(this.engineBody?.frequency, this.smoothEngineFrequency * 0.503);
    setAudioParam(this.engineBodyGain?.gain, (0.05 + speedRatio * 0.03) * duck);

    // Tyre scrub. Smoothed separately from the engine so it swells into a
    // corner and trails out of it.
    const corneringTarget = snapshot.state === 'CRASHED' ? 0 : snapshot.cornering * speedRatio;
    this.smoothCornering += (corneringTarget - this.smoothCornering) * (1 - Math.exp(-dt * 7));
    setAudioParam(this.tyreFilter?.frequency, 1500 + this.smoothCornering * 2600);
    setAudioParam(this.tyreGain?.gain, Math.max(0.0001, this.smoothCornering * 0.055 * duck));

    for (let index = this.transients.length - 1; index >= 0; index--) {
      const transient = this.transients[index];
      transient.elapsed += dt;
      const t = clamp(transient.elapsed / transient.duration, 0, 1);
      setAudioParam(transient.gain.gain, Math.max(0.0001, transient.volume * Math.pow(1 - t, 2.2)));
      if (t >= 1) {
        for (const node of transient.nodes) safelyStopNode(node);
        this.transients.splice(index, 1);
      }
    }

    for (let index = this.voices.length - 1; index >= 0; index--) {
      const voice = this.voices[index];
      voice.elapsed += dt;
      const t = clamp(voice.elapsed / voice.duration, 0, 1);
      const attack = Math.min(1, t / 0.10);
      const decay = Math.pow(1 - t, 1.7);
      const envelope = attack * decay;
      const frequency = voice.startFrequency + (voice.endFrequency - voice.startFrequency) * t;
      setAudioParam(voice.oscillator.frequency, frequency);
      setAudioParam(voice.gain.gain, Math.max(0.0001, voice.volume * envelope));

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
  stopTransients(): void {
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

  suspend(): void {
    if (!this.context || typeof this.context.suspend !== 'function') return;
    try {
      const result = this.context.suspend();
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch (error) {
      /* lifecycle best effort */
    }
  }

  resume(): void {
    if (!this.started) return;
    this.ensureStarted();
  }
}

export const audio = new AudioEngine();

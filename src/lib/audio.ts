/**
 * Web Audio engine. Every sound in KHIDKI 2004 is synthesised here at runtime —
 * there are no audio files and no samples of anyone's recordings.
 *
 * Graph: voices → master gain → compressor → analyser → destination.
 * The AudioContext is created lazily on the first user gesture (autoplay policy).
 */

import type { Voice } from './music';

class AudioEngine {
  ctx: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  /** UI sounds can be muted independently of music. */
  uiEnabled = true;

  /** Returns the context, creating it if needed. Null when Web Audio is unavailable. */
  ensure(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0.7;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.82;
    master.connect(comp).connect(analyser).connect(ctx.destination);
    // One second of white noise, reused by every percussive voice.
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    Object.assign(this, { ctx, master, analyser, noise: buf });
    return ctx;
  }

  get out(): AudioNode { return this.master!; }

  /** Envelope helper: attack to `peak`, exponential decay to silence. */
  private env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  /** Bell-like tone: sine + inharmonic partial (ratio 2.76, a classic bar/bell mode). */
  bell(f: number, t: number, vol = 0.18, decay = 0.9) {
    const ctx = this.ctx!;
    [1, 2.76, 5.4].forEach((ratio, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f * ratio;
      this.env(g, t, vol / (i * 1.8 + 1), 0.004, decay / (i + 1));
      o.connect(g).connect(this.out);
      o.start(t); o.stop(t + decay + 0.1);
    });
  }

  // ───── UI sound system: one family of glassy bells, pitched by meaning ─────
  ui(kind: 'open' | 'close' | 'click' | 'minimize' | 'error' | 'boot' | 'shutdown' | 'save') {
    if (!this.uiEnabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime + 0.01;
    const sa = 554.37; // C#5, the same Sa the music app uses (one octave up)
    const st = (n: number) => sa * Math.pow(2, n / 12);
    switch (kind) {
      case 'click': this.bell(st(12), t, 0.05, 0.12); break;
      case 'open': this.bell(st(7), t, 0.09, 0.4); this.bell(st(12), t + 0.06, 0.08, 0.5); break;
      case 'close': this.bell(st(12), t, 0.07, 0.3); this.bell(st(7), t + 0.06, 0.06, 0.35); break;
      case 'minimize': this.bell(st(4), t, 0.06, 0.25); break;
      case 'save': this.bell(st(9), t, 0.07, 0.3); this.bell(st(14), t + 0.08, 0.06, 0.45); break;
      case 'error': this.bell(st(1), t, 0.1, 0.3); this.bell(st(0), t + 0.09, 0.1, 0.4); break;
      case 'boot': // rising Yaman phrase: Ni Re Ga Ma# Pa — Sa'
        [-1, 2, 4, 6, 7, 12].forEach((n, i) => this.bell(st(n - 12), t + i * 0.13, 0.11, 1.4));
        break;
      case 'shutdown':
        [12, 7, 4, 0].forEach((n, i) => this.bell(st(n - 12), t + i * 0.18, 0.1, 1.2));
        break;
    }
  }

  // ───── Percussion voices (tabla-inspired, fully synthetic) ─────
  drum(v: Voice, t: number, sa: number, vol = 1) {
    const ctx = this.ensure();
    if (!ctx) return;
    if (v === 'bayan') {
      // Bass drum with the upward-then-down pitch glide associated with the bayan's "ge".
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(70, t);
      o.frequency.linearRampToValueAtTime(96, t + 0.06);
      o.frequency.exponentialRampToValueAtTime(58, t + 0.5);
      this.env(g, t, 0.55 * vol, 0.005, 0.5);
      o.connect(g).connect(this.out);
      o.start(t); o.stop(t + 0.6);
    } else if (v === 'dayan' || v === 'tin') {
      // Tuned treble drum: rings at Sa with a soft noise strike on top.
      const ring = v === 'dayan' ? 0.38 : 0.12;
      [1, 2.01, 3.03].forEach((h, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = i === 0 ? 'triangle' : 'sine';
        o.frequency.value = sa * h;
        this.env(g, t, (0.22 * vol) / (i + 1), 0.002, ring / (i * 0.6 + 1));
        o.connect(g).connect(this.out);
        o.start(t); o.stop(t + ring + 0.1);
      });
      this.noiseHit(t, 3200, 0.06 * vol, 0.03);
    } else {
      this.noiseHit(t, 6000, 0.12 * vol, 0.025);
    }
  }

  private noiseHit(t: number, freq: number, vol: number, decay: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 1.2;
    const g = ctx.createGain();
    this.env(g, t, vol, 0.001, decay);
    src.connect(bp).connect(g).connect(this.out);
    src.start(t, Math.random() * 0.5); src.stop(t + decay + 0.05);
  }

  /** Plucked melody voice: filtered saw with a falling filter sweep, slightly detuned pair. */
  pluck(f: number, t: number, dur: number, vol = 0.12) {
    const ctx = this.ensure();
    if (!ctx) return;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 4;
    lp.frequency.setValueAtTime(f * 8, t);
    lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur);
    const g = ctx.createGain();
    this.env(g, t, vol, 0.004, dur);
    lp.connect(g).connect(this.out);
    [-4, 4].forEach((cents) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cents;
      o.connect(lp); o.start(t); o.stop(t + dur + 0.05);
    });
  }

  /** One tanpura string pluck: buzzy saw through a slowly closing low-pass (the jawari shimmer, roughly). */
  tanpura(f: number, t: number, vol = 0.07) {
    const ctx = this.ensure();
    if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = f;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 6;
    lp.frequency.setValueAtTime(f * 3, t);
    lp.frequency.linearRampToValueAtTime(f * 9, t + 0.5);
    lp.frequency.exponentialRampToValueAtTime(f * 2, t + 2.6);
    const g = ctx.createGain();
    this.env(g, t, vol, 0.03, 2.6);
    o.connect(lp).connect(g).connect(this.out);
    o.start(t); o.stop(t + 2.8);
  }
}

export const audio = new AudioEngine();

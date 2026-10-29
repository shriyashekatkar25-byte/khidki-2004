/**
 * TAAL.FM — a synthesised tabla/tanpura step sequencer with a raga-inspired
 * Markov melody and a rangoli visualiser drawn from the live FFT.
 *
 * Timing uses the look-ahead scheduling pattern: a 25 ms JS timer schedules
 * every step that falls inside the next 120 ms on the AudioContext clock, so
 * rhythm stays sample-accurate even when the main thread stutters.
 */

import { audio } from '../lib/audio';
import { RAGAS, TALAS, VOICES, freq, generateMelody, sargam, talaGrid, type Voice } from '../lib/music';
import { html, type AppDef } from './types';
import './taal.css';

const VOICE_LABEL: Record<Voice, string> = { bayan: 'Bayan · bass', dayan: 'Dayan · ring', tin: 'Tin · muted', tik: 'Ti-ke · click' };
const SA = 138.59; // C#3 — a common tanpura tonic

interface TaalState { raga: string; tala: string; bpm: number; seed: number; drone: boolean; melody: boolean; grid: Record<Voice, boolean[]> }

export const taalApp: AppDef = {
  id: 'taal', title: 'TAAL.FM', deva: 'ताल', blurb: 'synth tabla, tanpura & raga-inspired melodies', icon: 'taal',
  w: 940, h: 580, minW: 340, minH: 380,
  mount(root, ctx) {
    const saved = ctx.store.read<TaalState | null>('taal', null);
    const s: TaalState = saved ?? { raga: 'yaman', tala: 'keherwa', bpm: 96, seed: 2004, drone: true, melody: true, grid: talaGrid(TALAS[0]) };
    const tala = () => TALAS.find((t) => t.id === s.tala)!;
    const raga = () => RAGAS.find((r) => r.id === s.raga)!;
    let melody = generateMelody(raga(), tala(), s.seed);

    const el = html(`
      <div class="taal">
        <div class="taal__stage"><canvas class="taal__viz" role="img" aria-label="Rangoli visualiser reacting to the music"></canvas></div>
        <div class="taal__deck">
          <div class="taal__row">
            <button class="taal__play btn btn--hot" aria-pressed="false" data-act="play">▶ Play</button>
            <label><span class="label">Raga</span>
              <select class="field" data-k="raga">${RAGAS.map((r) => `<option value="${r.id}">${r.name} · ${r.devanagari}</option>`).join('')}</select></label>
            <label><span class="label">Tala</span>
              <select class="field" data-k="tala">${TALAS.map((t) => `<option value="${t.id}">${t.name} · ${t.beats}</option>`).join('')}</select></label>
            <label class="taal__bpm"><span class="label">Laya <output>${s.bpm}</output> bpm</span>
              <input type="range" min="50" max="170" step="1" data-k="bpm"></label>
          </div>
          <div class="taal__row taal__row--small">
            <button class="pill" data-toggle="drone" aria-pressed="${s.drone}">Tanpura drone</button>
            <button class="pill" data-toggle="melody" aria-pressed="${s.melody}">Melody</button>
            <button class="btn" data-act="reseed" title="Generate a new melody">✦ New melody</button>
            <button class="btn" data-act="theka" title="Reset grid to the traditional theka">Reset theka</button>
            <span class="taal__seed">seed <b></b></span>
          </div>
          <div class="taal__grid" role="grid" aria-label="Step sequencer"></div>
          <p class="taal__note"></p>
        </div>
      </div>`);
    root.append(el);
    const $ = <T extends HTMLElement>(q: string) => el.querySelector(q) as T;
    const gridEl = $<HTMLDivElement>('.taal__grid');
    const playBtn = $<HTMLButtonElement>('.taal__play');
    const canvas = $<HTMLCanvasElement>('.taal__viz');
    ($<HTMLSelectElement>('[data-k="raga"]')).value = s.raga;
    ($<HTMLSelectElement>('[data-k="tala"]')).value = s.tala;
    ($<HTMLInputElement>('[data-k="bpm"]')).value = String(s.bpm);

    const persist = () => ctx.store.write('taal', s);

    function renderGrid() {
      const t = tala();
      gridEl.style.setProperty('--steps', String(t.beats));
      const bolRow = `<div class="tg-row tg-bols" role="row"><span class="tg-head" role="rowheader">Bol</span>${t.bols.map((b, i) =>
        `<span class="tg-bol ${t.vibhag.includes(i) ? 'vib' : ''}" role="columnheader">${b}${i === 0 ? '<sup>sam</sup>' : ''}</span>`).join('')}</div>`;
      const rows = VOICES.map((v) => `<div class="tg-row" role="row"><span class="tg-head" role="rowheader">${VOICE_LABEL[v]}</span>${s.grid[v].map((on, i) =>
        `<button class="tg-cell v-${v} ${t.vibhag.includes(i) ? 'vib' : ''}" role="gridcell" aria-pressed="${on}" aria-label="${VOICE_LABEL[v]} beat ${i + 1}" data-v="${v}" data-i="${i}"></button>`).join('')}</div>`).join('');
      const mel = `<div class="tg-row tg-mel" role="row"><span class="tg-head" role="rowheader">Melody</span>${Array.from({ length: t.beats }, (_, i) =>
        `<span class="tg-note">${[melody[i * 2], melody[i * 2 + 1]].map((n) => (n == null ? '·' : sargam(n))).join('\n')}</span>`).join('')}</div>`;
      gridEl.innerHTML = bolRow + rows + mel;
      $<HTMLElement>('.taal__seed b').textContent = String(s.seed);
      const r = raga();
      $<HTMLParagraphElement>('.taal__note').innerHTML =
        `<b>${r.name}</b> <span class="deva">${r.devanagari}</span> — ${r.mood}. Notes: ${r.notes.map(sargam).join(' ')}. ` +
        `Melody: first-order Markov chain favouring stepwise motion, pulled toward Sa/Pa on each vibhag. Raga-<i>inspired</i>: it uses the note set, not the raga's phrases.`;
    }

    // ───── scheduler ─────
    let playing = false, step = 0, nextTime = 0, timer: ReturnType<typeof setInterval> | undefined, droneStep = 0;
    const visual: { step: number; time: number }[] = [];
    const stepDur = () => 60 / s.bpm / 2; // half-beats

    function schedule() {
      const actx = audio.ctx!;
      while (nextTime < actx.currentTime + 0.12) {
        const t = tala();
        const half = step % (t.beats * 2);
        if (half % 2 === 0) {
          const beat = half / 2;
          VOICES.forEach((v) => s.grid[v][beat] && audio.drum(v, nextTime, SA * 2, beat === 0 ? 1.15 : 0.9));
          // Tanpura cycle Pa · Sa' · Sa' · Sa, one string every two beats.
          if (s.drone && beat % 2 === 0) {
            const strings = [7, 12, 12, 0];
            audio.tanpura(freq(SA, strings[droneStep++ % 4]), nextTime);
          }
        }
        const n = melody[half];
        if (s.melody && n != null) audio.pluck(freq(SA * 2, n), nextTime, stepDur() * 1.8);
        visual.push({ step: half, time: nextTime });
        nextTime += stepDur();
        step++;
      }
    }

    function play() {
      const actx = audio.ensure();
      if (!actx) { ctx.toast('Web Audio is not available in this browser.'); return; }
      playing = true; step = 0; nextTime = actx.currentTime + 0.06; droneStep = 0;
      timer = setInterval(schedule, 25); schedule();
      playBtn.textContent = '■ Stop'; playBtn.setAttribute('aria-pressed', 'true');
    }
    function stop() {
      playing = false; clearInterval(timer); visual.length = 0;
      playBtn.textContent = '▶ Play'; playBtn.setAttribute('aria-pressed', 'false');
      gridEl.querySelectorAll('.now').forEach((c) => c.classList.remove('now'));
    }

    el.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const cell = t.closest<HTMLButtonElement>('.tg-cell');
      if (cell) {
        const v = cell.dataset.v as Voice, i = Number(cell.dataset.i);
        s.grid[v][i] = !s.grid[v][i];
        cell.setAttribute('aria-pressed', String(s.grid[v][i]));
        if (s.grid[v][i]) { audio.ensure() && audio.drum(v, audio.ctx!.currentTime + 0.01, SA * 2); }
        persist();
      }
      const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act === 'play') (playing ? stop() : play());
      if (act === 'reseed') { s.seed = Math.floor(Math.random() * 99999); melody = generateMelody(raga(), tala(), s.seed); renderGrid(); persist(); }
      if (act === 'theka') { s.grid = talaGrid(tala()); renderGrid(); persist(); }
      const tog = t.closest<HTMLElement>('[data-toggle]');
      if (tog) { const k = tog.dataset.toggle as 'drone' | 'melody'; s[k] = !s[k]; tog.setAttribute('aria-pressed', String(s[k])); persist(); }
    });
    el.addEventListener('change', (e) => {
      const t = e.target as HTMLSelectElement;
      if (t.dataset.k === 'raga') { s.raga = t.value; melody = generateMelody(raga(), tala(), s.seed); }
      if (t.dataset.k === 'tala') { s.tala = t.value; s.grid = talaGrid(tala()); melody = generateMelody(raga(), tala(), s.seed); step = 0; }
      renderGrid(); persist();
    });
    el.addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.dataset.k === 'bpm') { s.bpm = Number(t.value); $<HTMLOutputElement>('output').textContent = t.value; persist(); }
    });
    // Arrow-key navigation inside the grid.
    gridEl.addEventListener('keydown', (e) => {
      const cell = (e.target as HTMLElement).closest<HTMLButtonElement>('.tg-cell');
      if (!cell) return;
      const v = VOICES.indexOf(cell.dataset.v as Voice), i = Number(cell.dataset.i);
      const d: Record<string, [number, number]> = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
      if (!d[e.key]) return;
      e.preventDefault();
      const nv = VOICES[(v + d[e.key][0] + 4) % 4], ni = (i + d[e.key][1] + tala().beats) % tala().beats;
      gridEl.querySelector<HTMLButtonElement>(`.tg-cell[data-v="${nv}"][data-i="${ni}"]`)?.focus();
    });

    // ───── visualiser: FFT bins → 8-fold mirrored rangoli petals ─────
    const g = canvas.getContext('2d')!;
    let raf = 0, lastStep = -1;
    const bins = new Uint8Array(512);
    const wave = new Uint8Array(1024);
    const styles = getComputedStyle(document.documentElement);

    function frame(now: number) {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const W = canvas.clientWidth, H = canvas.clientHeight;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const accent = styles.getPropertyValue('--accent').trim() || '#e2007a';
      const gold = styles.getPropertyValue('--gold').trim() || '#f4e1bf';
      const an = audio.analyser;
      if (an && playing) { an.getByteFrequencyData(bins); an.getByteTimeDomainData(wave); }
      else for (let i = 0; i < bins.length; i++) bins[i] = ctx.reduced() ? 40 : 40 + 30 * Math.sin(now / 900 + i / 9);

      g.fillStyle = 'rgba(20, 4, 16, 0.32)';
      g.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.46;
      const folds = 8;
      const spin = ctx.reduced() ? 0 : now / 9000;
      g.save(); g.translate(cx, cy);
      for (let f = 0; f < folds * 2; f++) {
        g.save();
        g.rotate((f * Math.PI) / folds + spin);
        if (f % 2) g.scale(1, -1); // mirror every other wedge → dihedral symmetry like a rangoli
        g.beginPath(); g.moveTo(0, 0);
        const N = 48;
        for (let k = 0; k <= N; k++) {
          const a = (k / N) * (Math.PI / folds);
          const amp = bins[Math.floor((k / N) * 180) + 2] / 255;
          const r = R * (0.25 + 0.75 * amp);
          g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        g.closePath();
        g.fillStyle = f % 2 ? accent + '55' : gold + '44';
        g.strokeStyle = f % 2 ? accent : gold;
        g.lineWidth = 1.2; g.fill(); g.stroke();
        g.restore();
      }
      // Waveform ring + kolam dots
      g.beginPath();
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        const v = playing && an ? (wave[i * 8 % wave.length] - 128) / 128 : 0;
        const r = R * 0.22 * (1 + v * 0.8);
        i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 - spin * 2;
        g.beginPath(); g.arc(Math.cos(a) * R * 0.98, Math.sin(a) * R * 0.98, 2.2, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
      }
      g.restore();

      // Playhead: find the most recent step whose time has passed.
      if (playing && audio.ctx) {
        while (visual.length > 1 && visual[1].time <= audio.ctx.currentTime) visual.shift();
        const cur = visual[0];
        if (cur && cur.time <= audio.ctx.currentTime && cur.step !== lastStep) {
          lastStep = cur.step;
          const beat = Math.floor(cur.step / 2);
          gridEl.querySelectorAll('.now').forEach((c) => c.classList.remove('now'));
          gridEl.querySelectorAll(`.tg-row > :nth-child(${beat + 2})`).forEach((c) => c.classList.add('now'));
        }
      }
      raf = requestAnimationFrame(frame);
    }

    renderGrid();
    raf = requestAnimationFrame(frame);
    return () => { stop(); cancelAnimationFrame(raf); };
  },
};

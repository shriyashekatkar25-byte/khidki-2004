/**
 * Music theory + generative melody for TAAL.FM. Pure functions, no audio here.
 *
 * Honesty note: a raga is far more than a scale — it has characteristic phrases
 * (pakad), ascending/descending rules (aaroh/avroh), emphasised notes and a time
 * of day. TAAL.FM uses only each raga's *note set* plus a soft "home note"
 * gravity, and labels itself as "raga-inspired". It is a toy, not a teacher.
 */

export interface Raga { id: string; name: string; devanagari: string; mood: string; /** semitones above Sa */ notes: number[] }

export const RAGAS: Raga[] = [
  { id: 'yaman', name: 'Yaman', devanagari: 'यमन', mood: 'evening, tender', notes: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'bhupali', name: 'Bhupali', devanagari: 'भूपाळी', mood: 'open, devotional', notes: [0, 2, 4, 7, 9] },
  { id: 'bhairavi', name: 'Bhairavi', devanagari: 'भैरवी', mood: 'farewell, bittersweet', notes: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'megh', name: 'Megh', devanagari: 'मेघ', mood: 'monsoon clouds', notes: [0, 2, 5, 7, 10] },
];

/** Tabla syllables (bols) and the synth voices that play each one. */
export type Voice = 'bayan' | 'dayan' | 'tin' | 'tik';
export const BOL_VOICES: Record<string, Voice[]> = {
  Dha: ['bayan', 'dayan'], Dhin: ['bayan', 'tin'], Dhi: ['bayan', 'tin'], Ge: ['bayan'],
  Na: ['dayan'], Ta: ['dayan'], Tin: ['tin'], Ti: ['tik'], Ke: ['tik'], '-': [],
};

export interface Tala { id: string; name: string; beats: number; bols: string[]; /** step indexes of vibhag (section) starts */ vibhag: number[] }

export const TALAS: Tala[] = [
  { id: 'keherwa', name: 'Keherwa', beats: 8, bols: ['Dha', 'Ge', 'Na', 'Ti', 'Na', 'Ke', 'Dhi', 'Na'], vibhag: [0, 4] },
  { id: 'dadra', name: 'Dadra', beats: 6, bols: ['Dha', 'Dhi', 'Na', 'Dha', 'Ti', 'Na'], vibhag: [0, 3] },
  { id: 'teentaal', name: 'Teentaal', beats: 16,
    bols: ['Dha', 'Dhin', 'Dhin', 'Dha', 'Dha', 'Dhin', 'Dhin', 'Dha', 'Dha', 'Tin', 'Tin', 'Ta', 'Ta', 'Dhin', 'Dhin', 'Dha'],
    vibhag: [0, 4, 8, 12] },
];

export const VOICES: Voice[] = ['bayan', 'dayan', 'tin', 'tik'];

/** Convert a tala's bols into a voice × step grid of booleans. */
export function talaGrid(t: Tala): Record<Voice, boolean[]> {
  const grid = Object.fromEntries(VOICES.map((v) => [v, new Array(t.beats).fill(false)])) as Record<Voice, boolean[]>;
  t.bols.forEach((bol, i) => (BOL_VOICES[bol] ?? []).forEach((v) => (grid[v][i] = true)));
  return grid;
}

/** Equal-tempered frequency `semis` above a Sa frequency. */
export const freq = (sa: number, semis: number) => sa * Math.pow(2, semis / 12);

/** mulberry32 — tiny deterministic PRNG so a "seed" reproduces the same melody. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * First-order Markov melody over the raga's degrees spanning two octaves.
 *
 * Transition weight from degree i to j:
 *   w(i→j) = exp(−|i−j| / λ) · (1 + γ·home(j)·strong) · (i==j ? ρ : 1)
 * where λ = 1.3 favours stepwise motion (the common melodic texture), home(j)
 * marks Sa and Pa, `strong` is 1 on vibhag starts (so phrases land on stable
 * notes at the start of each section), γ = 2.5 and ρ = 0.35 discourages
 * repeated notes. A rest is inserted with probability `restP`.
 * Returns semitone offsets from Sa, or null for a rest.
 */
export function generateMelody(raga: Raga, tala: Tala, seed: number, restP = 0.18): (number | null)[] {
  const r = rng(seed);
  const degrees = [...raga.notes, ...raga.notes.map((n) => n + 12), 24];
  const isHome = (semi: number) => semi % 12 === 0 || semi % 12 === 7;
  const out: (number | null)[] = [];
  let cur = degrees.indexOf(12) >= 0 ? degrees.indexOf(12) : 0; // start on upper Sa region
  for (let step = 0; step < tala.beats * 2; step++) {
    // Melody runs in half-beats; a step is strong when it falls on a vibhag start.
    const strong = step % 2 === 0 && tala.vibhag.includes(step / 2) ? 1 : 0;
    if (step > 0 && !strong && r() < restP) { out.push(null); continue; }
    const weights = degrees.map((semi, j) => {
      const dist = Math.abs(j - cur);
      return Math.exp(-dist / 1.3) * (1 + 2.5 * (isHome(semi) ? 1 : 0) * strong) * (j === cur ? 0.35 : 1);
    });
    cur = sampleIndex(weights, r());
    out.push(degrees[cur]);
  }
  // Resolve the cycle on Sa: Indian rhythmic cycles land on sam, so end home.
  out[out.length - 1] = 12;
  return out;
}

export function sampleIndex(weights: number[], u: number): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i] / total;
    if (u < acc) return i;
  }
  return weights.length - 1;
}

/** Western-ish sargam names for display. */
const SARGAM = ['Sa', 're', 'Re', 'ga', 'Ga', 'ma', 'Ma', 'Pa', 'dha', 'Dha', 'ni', 'Ni'];
export const sargam = (semi: number) => SARGAM[((semi % 12) + 12) % 12] + (semi >= 12 ? (semi >= 24 ? "''" : "'") : '');

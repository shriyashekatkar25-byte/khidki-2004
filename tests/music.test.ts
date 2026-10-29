import { describe, it, expect } from 'vitest';
import { RAGAS, TALAS, BOL_VOICES, freq, generateMelody, rng, sampleIndex, talaGrid, sargam } from '../src/lib/music';

describe('talas', () => {
  it('every theka has one bol per beat and known bols', () => {
    for (const t of TALAS) {
      expect(t.bols).toHaveLength(t.beats);
      t.bols.forEach((b) => expect(BOL_VOICES[b]).toBeDefined());
      expect(t.vibhag[0]).toBe(0);
    }
  });
  it('converts a theka into a voice grid', () => {
    const g = talaGrid(TALAS.find((t) => t.id === 'keherwa')!);
    expect(g.bayan[0]).toBe(true); // Dha
    expect(g.dayan[0]).toBe(true);
    expect(g.bayan[2]).toBe(false); // Na
    expect(g.tik[3]).toBe(true); // Ti
  });
});

describe('melody generator', () => {
  it('is deterministic for a seed', () => {
    const r = RAGAS[0], t = TALAS[0];
    expect(generateMelody(r, t, 42)).toEqual(generateMelody(r, t, 42));
    expect(generateMelody(r, t, 42)).not.toEqual(generateMelody(r, t, 43));
  });
  it('only uses notes from the raga and lands on Sa', () => {
    for (const r of RAGAS) for (const t of TALAS) for (let seed = 0; seed < 25; seed++) {
      const m = generateMelody(r, t, seed);
      expect(m).toHaveLength(t.beats * 2);
      m.forEach((n) => { if (n != null) expect(r.notes).toContain(n % 12); });
      expect(m[m.length - 1]).toBe(12);
    }
  });
  it('mostly moves stepwise (mean leap under 2 scale degrees)', () => {
    const r = RAGAS[0];
    const degrees = [...r.notes, ...r.notes.map((n) => n + 12), 24];
    let total = 0, n = 0;
    for (let seed = 0; seed < 50; seed++) {
      const m = generateMelody(r, TALAS[2], seed).filter((x): x is number => x != null);
      for (let i = 1; i < m.length; i++) { total += Math.abs(degrees.indexOf(m[i]) - degrees.indexOf(m[i - 1])); n++; }
    }
    expect(total / n).toBeLessThan(2);
  });
});

describe('helpers', () => {
  it('rng is in [0,1) and sampleIndex follows weights', () => {
    const r = rng(7);
    const counts = [0, 0];
    for (let i = 0; i < 4000; i++) { const u = r(); expect(u).toBeGreaterThanOrEqual(0); expect(u).toBeLessThan(1); counts[sampleIndex([1, 3], u)]++; }
    expect(counts[1] / 4000).toBeGreaterThan(0.7);
    expect(counts[1] / 4000).toBeLessThan(0.8);
  });
  it('freq follows equal temperament and sargam names octaves', () => {
    expect(freq(100, 12)).toBeCloseTo(200);
    expect(freq(100, 7)).toBeCloseTo(149.83, 1);
    expect(sargam(0)).toBe('Sa');
    expect(sargam(19)).toBe("Pa'");
  });
});

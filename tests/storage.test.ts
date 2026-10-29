import { describe, it, expect } from 'vitest';
import { MemoryKV, Store, browserKV } from '../src/lib/storage';
import { Board } from '../src/lib/board';
import { SettingsStore, DEFAULT_SETTINGS } from '../src/lib/settings';

describe('Store', () => {
  it('round-trips versioned JSON', () => {
    const s = new Store(new MemoryKV());
    s.write('k', { a: [1, 2] });
    expect(s.read('k', null)).toEqual({ a: [1, 2] });
  });
  it('falls back on corrupt JSON or version mismatch', () => {
    const kv = new MemoryKV();
    kv.set('khidki2004:bad', '{not json');
    const s = new Store(kv);
    expect(s.read('bad', 'fallback')).toBe('fallback');
    s.write('v', 1, 1);
    expect(s.read('v', 0, 2)).toBe(0);
  });
  it('clear removes a key', () => {
    const s = new Store(new MemoryKV());
    s.write('x', 1); s.clear('x');
    expect(s.read('x', 'gone')).toBe('gone');
  });
  it('browserKV uses localStorage when available (jsdom)', () => {
    const kv = browserKV();
    expect(kv.persistent).toBe(true);
    kv.set('t', 'v');
    expect(localStorage.getItem('t')).toBe('v');
  });
});

describe('SettingsStore', () => {
  it('merges saved values over defaults and persists changes', () => {
    const kv = new MemoryKV();
    const a = new SettingsStore(new Store(kv));
    expect(a.value).toEqual(DEFAULT_SETTINGS);
    let seen = '';
    a.onChange((v) => (seen = v.theme));
    a.set('theme', 'paithani');
    expect(seen).toBe('paithani');
    const b = new SettingsStore(new Store(kv));
    expect(b.value.theme).toBe('paithani');
    expect(b.value.sounds).toBe(true);
  });
});

describe('Board', () => {
  it('adds, clamps moves, rotates, scales and persists', () => {
    const kv = new MemoryKV();
    const b = new Board(new Store(kv));
    const it = b.add('sticker', 'butterfly', 0.5, 0.5);
    b.move(it.id, 1.7, -0.2);
    expect(b.get(it.id)).toMatchObject({ x: 1, y: 0 });
    const r0 = b.get(it.id)!.rot;
    b.rotate(it.id, 360);
    expect(b.get(it.id)!.rot).toBe(r0);
    for (let i = 0; i < 20; i++) b.rescale(it.id, 1.5);
    expect(b.get(it.id)!.scale).toBe(2);
    const reloaded = new Board(new Store(kv));
    expect(reloaded.get(it.id)).toMatchObject({ x: 1, y: 0, scale: 2 });
  });
  it('bringToFront reorders and keeps z contiguous', () => {
    const b = new Board(new Store(new MemoryKV()));
    const a = b.add('note', 'a'); const c = b.add('note', 'c'); const d = b.add('note', 'd');
    b.bringToFront(a.id);
    expect(b.sorted().map((i) => i.id)).toEqual([c.id, d.id, a.id]);
    expect(b.sorted().map((i) => i.z)).toEqual([1, 2, 3]);
  });
  it('uses the seed only when nothing is saved, and reset restores it', () => {
    const kv = new MemoryKV();
    const seed = [{ id: 's', kind: 'swatch' as const, value: '#fff', x: 0.5, y: 0.5, rot: 0, scale: 1, z: 1 }];
    const b = new Board(new Store(kv), seed);
    expect(b.items).toHaveLength(1);
    b.remove('s');
    expect(new Board(new Store(kv), seed).items).toHaveLength(0);
    b.reset(seed);
    expect(new Board(new Store(kv), seed).items).toHaveLength(1);
  });
  it('caps note text at 280 characters', () => {
    const b = new Board(new Store(new MemoryKV()));
    const n = b.add('note', 'x');
    b.setValue(n.id, 'y'.repeat(500));
    expect(b.get(n.id)!.value).toHaveLength(280);
  });
});

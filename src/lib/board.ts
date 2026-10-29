/**
 * Scrapbook / moodboard model. Items live in a normalised 0..1 coordinate
 * space so a board arranged on a laptop keeps its composition on a phone.
 */

import { Store } from './storage';

export type ItemKind = 'sticker' | 'note' | 'swatch';

export interface BoardItem {
  id: string;
  kind: ItemKind;
  /** sticker id, note text, or swatch hex */
  value: string;
  x: number; // 0..1, item centre
  y: number; // 0..1
  rot: number; // degrees
  scale: number; // 0.5..2
  z: number;
}

const KEY = 'board';

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export class Board {
  items: BoardItem[];
  private seq = 0;

  constructor(private store: Store, seed?: BoardItem[]) {
    this.items = store.read<BoardItem[]>(KEY, seed ?? []);
    this.seq = this.items.length;
  }

  add(kind: ItemKind, value: string, x = 0.5, y = 0.5): BoardItem {
    const item: BoardItem = {
      id: `i${Date.now().toString(36)}${++this.seq}`, kind, value,
      x: clamp01(x), y: clamp01(y), rot: Math.round((Math.random() - 0.5) * 16), scale: 1, z: this.topZ() + 1,
    };
    this.items.push(item);
    this.save();
    return item;
  }

  get(id: string) { return this.items.find((i) => i.id === id); }
  topZ() { return this.items.reduce((m, i) => Math.max(m, i.z), 0); }

  move(id: string, x: number, y: number) {
    const it = this.get(id);
    if (!it) return;
    it.x = clamp01(x); it.y = clamp01(y);
    this.save();
  }

  rotate(id: string, deg: number) {
    const it = this.get(id);
    if (!it) return;
    it.rot = ((it.rot + deg + 540) % 360) - 180;
    this.save();
  }

  rescale(id: string, factor: number) {
    const it = this.get(id);
    if (!it) return;
    it.scale = Math.max(0.5, Math.min(2, Math.round(it.scale * factor * 100) / 100));
    this.save();
  }

  bringToFront(id: string) {
    const it = this.get(id);
    if (!it || it.z === this.topZ()) return;
    it.z = this.topZ() + 1;
    this.normalise();
    this.save();
  }

  setValue(id: string, value: string) {
    const it = this.get(id);
    if (!it) return;
    it.value = value.slice(0, 280);
    this.save();
  }

  remove(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
    this.save();
  }

  reset(seed: BoardItem[]) {
    this.items = seed.map((s) => ({ ...s }));
    this.save();
  }

  /** Painter's order for rendering. */
  sorted() { return [...this.items].sort((a, b) => a.z - b.z); }

  /** Re-number z to 1..n, preserving order, so values never grow unbounded. */
  private normalise() { this.sorted().forEach((it, i) => (it.z = i + 1)); }
  private save() { this.store.write(KEY, this.items); }
}

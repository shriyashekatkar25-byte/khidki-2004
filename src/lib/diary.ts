/**
 * Diary model + full-text search.
 *
 * Search is a real ranking function, BM25 (Robertson & Zaragoza), computed in
 * the browser over the visitor's own entries:
 *
 *   score(D, Q) = Σ_q IDF(q) · f(q,D)·(k1+1) / ( f(q,D) + k1·(1 − b + b·|D|/avgdl) )
 *   IDF(q)      = ln( 1 + (N − n(q) + 0.5) / (n(q) + 0.5) )
 *
 * with k1 = 1.4, b = 0.75. Title tokens are counted twice (a cheap field boost).
 * The last query token also matches as a prefix so results update while typing.
 * The tokenizer is Unicode-aware (\p{L}\p{M}\p{N}) so Devanagari words such as
 * "पाऊस" survive intact; vowel signs (matras) are combining marks (\p{M}).
 */

import { Store } from './storage';

export const MOODS = ['glitter', 'monsoon', 'filmi', 'chai', 'blue'] as const;
export type Mood = (typeof MOODS)[number];

export interface Entry {
  id: string;
  title: string;
  body: string;
  mood: Mood;
  tags: string[];
  created: number;
  updated: number;
}

const KEY = 'diary';

export function tokenize(text: string): string[] {
  return (text.toLowerCase().normalize('NFC').match(/[\p{L}\p{M}\p{N}]+/gu) ?? []).filter((t) => t.length > 0);
}

export function parseTags(input: string): string[] {
  return [...new Set(input.split(/[,#\s]+/).map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 8);
}

export class Diary {
  private entries: Entry[];
  constructor(private store: Store, private now: () => number = Date.now) {
    this.entries = store.read<Entry[]>(KEY, []);
  }

  all(): Entry[] { return [...this.entries].sort((a, b) => b.created - a.created); }
  get(id: string) { return this.entries.find((e) => e.id === id); }
  count() { return this.entries.length; }

  create(partial: Partial<Pick<Entry, 'title' | 'body' | 'mood' | 'tags'>> = {}): Entry {
    const t = this.now();
    const e: Entry = {
      id: `e${t.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      title: partial.title ?? '',
      body: partial.body ?? '',
      mood: partial.mood ?? 'glitter',
      tags: partial.tags ?? [],
      created: t,
      updated: t,
    };
    this.entries.push(e);
    this.save();
    return e;
  }

  update(id: string, patch: Partial<Pick<Entry, 'title' | 'body' | 'mood' | 'tags'>>) {
    const e = this.get(id);
    if (!e) return undefined;
    Object.assign(e, patch, { updated: this.now() });
    this.save();
    return e;
  }

  remove(id: string) {
    const before = this.entries.length;
    this.entries = this.entries.filter((e) => e.id !== id);
    if (this.entries.length !== before) this.save();
  }

  moodCounts(): Record<Mood, number> {
    const c = Object.fromEntries(MOODS.map((m) => [m, 0])) as Record<Mood, number>;
    for (const e of this.entries) c[e.mood]++;
    return c;
  }

  search(query: string, filterTag?: string): { entry: Entry; score: number }[] {
    const pool = filterTag ? this.entries.filter((e) => e.tags.includes(filterTag)) : this.entries;
    const q = tokenize(query);
    if (q.length === 0) return pool.map((entry) => ({ entry, score: 0 })).sort((a, b) => b.entry.created - a.entry.created);
    return bm25(pool, q);
  }

  private save() { this.store.write(KEY, this.entries); }
}

function docTokens(e: Entry): string[] {
  const title = tokenize(e.title);
  return [...title, ...title, ...tokenize(e.body), ...e.tags.flatMap(tokenize)];
}

export function bm25(entries: Entry[], query: string[], k1 = 1.4, b = 0.75): { entry: Entry; score: number }[] {
  const docs = entries.map((e) => ({ e, toks: docTokens(e) }));
  const N = docs.length;
  if (N === 0) return [];
  const avgdl = docs.reduce((s, d) => s + d.toks.length, 0) / N || 1;
  const last = query.length - 1;

  // Term frequency of query term i in a doc; the final term also matches as a prefix.
  const tf = (toks: string[], i: number) => {
    const q = query[i];
    let n = 0;
    for (const t of toks) if (t === q || (i === last && q.length >= 2 && t.startsWith(q))) n++;
    return n;
  };

  const df = query.map((_, i) => docs.filter((d) => tf(d.toks, i) > 0).length);
  const idf = df.map((n) => Math.log(1 + (N - n + 0.5) / (n + 0.5)));

  return docs
    .map(({ e, toks }) => {
      let score = 0;
      for (let i = 0; i < query.length; i++) {
        const f = tf(toks, i);
        if (f === 0) continue;
        score += idf[i] * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * toks.length) / avgdl)));
      }
      return { entry: e, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b2) => b2.score - a.score || b2.entry.created - a.entry.created);
}

/** Wraps matched words in <mark>; input is escaped first so diary text can never inject HTML. */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export function highlight(text: string, query: string): string {
  const q = tokenize(query).filter((t) => t.length >= 2);
  if (q.length === 0) return escapeHtml(text);
  const pattern = new RegExp(`(${q.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'giu');
  // split() with a capture group alternates [plain, match, plain, match, …]
  return text.split(pattern).map((part, i) => (i % 2 ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part))).join('');
}

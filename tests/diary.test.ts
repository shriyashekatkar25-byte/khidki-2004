import { describe, it, expect } from 'vitest';
import { Diary, bm25, highlight, parseTags, tokenize, type Entry } from '../src/lib/diary';
import { MemoryKV, Store } from '../src/lib/storage';

const mk = () => { let t = 1_700_000_000_000; return new Diary(new Store(new MemoryKV()), () => (t += 1000)); };

describe('tokenize', () => {
  it('lowercases and splits on punctuation', () => {
    expect(tokenize('Hello, World! 2004')).toEqual(['hello', 'world', '2004']);
  });
  it('keeps Devanagari words intact, including vowel signs', () => {
    expect(tokenize('आज पाऊस, खूप!')).toEqual(['आज', 'पाऊस', 'खूप']);
  });
});

describe('parseTags', () => {
  it('dedupes, lowercases and accepts # , or spaces', () => {
    expect(parseTags('#Monsoon, college monsoon  filmi')).toEqual(['monsoon', 'college', 'filmi']);
  });
});

describe('Diary CRUD', () => {
  it('creates, updates, deletes and persists entries', () => {
    const kv = new MemoryKV();
    const d = new Diary(new Store(kv));
    const e = d.create({ title: 't', body: 'b' });
    d.update(e.id, { body: 'changed', mood: 'monsoon' });
    const d2 = new Diary(new Store(kv));
    expect(d2.get(e.id)).toMatchObject({ body: 'changed', mood: 'monsoon' });
    d2.remove(e.id);
    expect(new Diary(new Store(kv)).count()).toBe(0);
  });
  it('lists newest first and counts moods', () => {
    const d = mk();
    d.create({ title: 'old', mood: 'chai' });
    d.create({ title: 'new', mood: 'chai' });
    expect(d.all()[0].title).toBe('new');
    expect(d.moodCounts().chai).toBe(2);
  });
});

describe('BM25 search', () => {
  it('ranks the more relevant page first', () => {
    const d = mk();
    d.create({ title: 'Grocery list', body: 'rice, dal, chai leaves' });
    const best = d.create({ title: 'Monsoon in Pune', body: 'the monsoon arrived; monsoon smells like wet stone' });
    d.create({ title: 'College', body: 'a short mention of monsoon' });
    const r = d.search('monsoon');
    expect(r[0].entry.id).toBe(best.id);
    expect(r).toHaveLength(2);
    expect(r[0].score).toBeGreaterThan(r[1].score);
  });
  it('rarer terms weigh more than common ones (IDF)', () => {
    const docs: Entry[] = [
      { id: '1', title: '', body: 'chai chai chai', mood: 'chai', tags: [], created: 1, updated: 1 },
      { id: '2', title: '', body: 'chai jhumka', mood: 'chai', tags: [], created: 2, updated: 2 },
      { id: '3', title: '', body: 'chai', mood: 'chai', tags: [], created: 3, updated: 3 },
    ];
    const r = bm25(docs, ['chai', 'jhumka']);
    expect(r[0].entry.id).toBe('2');
  });
  it('matches the last query word as a prefix (search-as-you-type)', () => {
    const d = mk();
    const e = d.create({ title: 'Bollywood nights', body: '' });
    expect(d.search('bolly')[0].entry.id).toBe(e.id);
  });
  it('searches Devanagari text and tags, and filters by tag', () => {
    const d = mk();
    const a = d.create({ title: 'पाऊस', body: 'आज खूप पाऊस पडला', tags: ['monsoon'] });
    d.create({ title: 'other', body: 'nothing', tags: ['misc'] });
    expect(d.search('पाऊस')[0].entry.id).toBe(a.id);
    expect(d.search('monsoon')[0].entry.id).toBe(a.id);
    expect(d.search('', 'misc')).toHaveLength(1);
  });
  it('returns everything (newest first) for an empty query', () => {
    const d = mk();
    d.create({ title: 'a' }); d.create({ title: 'b' });
    expect(d.search('  ').map((r) => r.entry.title)).toEqual(['b', 'a']);
  });
});

describe('highlight', () => {
  it('escapes HTML before marking matches', () => {
    expect(highlight('<b>chai</b> & chai', 'chai')).toBe('&lt;b&gt;<mark>chai</mark>&lt;/b&gt; &amp; <mark>chai</mark>');
  });
  it('never breaks entities when the query looks like one', () => {
    expect(highlight('a & b', 'amp')).toBe('a &amp; b');
  });
});

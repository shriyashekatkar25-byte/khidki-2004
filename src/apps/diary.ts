/** दैनंदिनी · Dainandini — the retro digital diary. Local-only, BM25 search. */

import { Diary, MOODS, escapeHtml, highlight, parseTags, type Entry, type Mood } from '../lib/diary';
import { audio } from '../lib/audio';
import { debounce, html, type AppDef } from './types';
import './diary.css';

const MOOD_LABEL: Record<Mood, string> = { glitter: 'Glitter', monsoon: 'Monsoon', filmi: 'Filmi', chai: 'Chai', blue: 'Blue' };

const fmt = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export const diaryApp: AppDef = {
  id: 'diary', title: 'Dainandini', deva: 'दैनंदिनी', blurb: 'a diary that never leaves this browser', icon: 'diary',
  w: 760, h: 520, minW: 340, minH: 320,
  mount(root, ctx) {
    const diary = new Diary(ctx.store);
    if (diary.count() === 0 && !ctx.store.read('diarySeeded', false)) {
      diary.create({
        title: 'Pehla panna — the first page',
        body: 'This is a sample page written by KHIDKI itself. Delete it, or write over it.\n\nEverything you type here is saved in this browser only — nothing is uploaded. Try the search box: it ranks pages with BM25, the same family of scoring used by real search engines, and it understands Devanagari too: पाऊस, चहा, गाणी.',
        mood: 'glitter', tags: ['sample', 'welcome'],
      });
      ctx.store.write('diarySeeded', true);
    }

    let currentId: string | null = diary.all()[0]?.id ?? null;
    let query = '';
    let tagFilter: string | undefined;
    let confirmDelete = false;

    const el = html(`
      <div class="diary">
        <aside class="diary__side" aria-label="Diary pages">
          <div class="diary__search">
            <label class="sr-only" for="dsearch">Search diary</label>
            <input id="dsearch" class="field" type="search" placeholder="Search pages…" autocomplete="off">
            <button class="btn btn--hot" data-act="new" title="New page (Alt+N)">+ Page</button>
          </div>
          <div class="diary__tags" role="group" aria-label="Filter by tag"></div>
          <ol class="diary__list" role="listbox" aria-label="Pages"></ol>
          <div class="diary__moods" aria-label="Mood ledger"></div>
        </aside>
        <article class="diary__page" aria-live="off">
          <div class="diary__empty empty" hidden>Your diary is empty.<br>Every page you write stays in this browser — nothing is uploaded.<br><br><button class="btn btn--hot" data-act="new">Write the first page</button></div>
          <form class="diary__editor" autocomplete="off">
            <div class="diary__meta">
              <button type="button" class="btn diary__back" data-act="back" aria-label="Back to pages">‹ Pages</button>
              <span class="diary__date"></span>
              <span class="diary__saved" aria-live="polite"></span>
            </div>
            <label class="sr-only" for="dtitle">Title</label>
            <input id="dtitle" class="diary__title" placeholder="Untitled page" maxlength="120">
            <div class="diary__moodpick" role="radiogroup" aria-label="Mood">
              ${MOODS.map((m) => `<button type="button" class="pill mood-${m}" role="radio" data-mood="${m}">${MOOD_LABEL[m]}</button>`).join('')}
            </div>
            <label class="sr-only" for="dbody">Page text</label>
            <textarea id="dbody" class="diary__body" placeholder="Aaj kya hua? What happened today…"></textarea>
            <div class="diary__foot">
              <label class="label" for="dtags">Tags</label>
              <input id="dtags" class="field" placeholder="monsoon, college, filmi">
              <button type="button" class="btn" data-act="delete">Delete</button>
            </div>
          </form>
        </article>
      </div>`);
    root.append(el);

    const $ = <T extends HTMLElement>(s: string) => el.querySelector(s) as T;
    const search = $<HTMLInputElement>('#dsearch');
    const list = $<HTMLOListElement>('.diary__list');
    const tags = $<HTMLDivElement>('.diary__tags');
    const moods = $<HTMLDivElement>('.diary__moods');
    const form = $<HTMLFormElement>('.diary__editor');
    const title = $<HTMLInputElement>('#dtitle');
    const body = $<HTMLTextAreaElement>('#dbody');
    const tagIn = $<HTMLInputElement>('#dtags');
    const saved = $<HTMLSpanElement>('.diary__saved');
    const del = $<HTMLButtonElement>('[data-act="delete"]');

    const saveNow = () => {
      if (!currentId) return;
      diary.update(currentId, { title: title.value, body: body.value, tags: parseTags(tagIn.value) });
      saved.textContent = 'saved ✓';
      renderList();
      renderChrome();
    };
    const save = debounce(saveNow, 450);

    function renderChrome() {
      const allTags = [...new Set(diary.all().flatMap((e) => e.tags))].sort();
      tags.innerHTML = allTags.length
        ? allTags.map((t) => `<button class="pill" aria-pressed="${t === tagFilter}" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</button>`).join('')
        : '';
      const counts = diary.moodCounts();
      const max = Math.max(1, ...Object.values(counts));
      moods.innerHTML = `<span class="label">Mood ledger</span>` + MOODS.map((m) =>
        `<span class="mbar mood-${m}" title="${MOOD_LABEL[m]}: ${counts[m]}"><i style="height:${(counts[m] / max) * 100}%"></i><small>${MOOD_LABEL[m][0]}</small></span>`).join('');
    }

    function renderList() {
      const results = diary.search(query, tagFilter);
      if (results.length === 0) {
        list.innerHTML = `<li class="empty">${query ? `No page mentions “${escapeHtml(query)}”.` : 'No pages yet.'}</li>`;
        return;
      }
      list.innerHTML = results.map(({ entry: e, score }) => {
        const snippetSrc = e.body.replace(/\s+/g, ' ').slice(0, 110);
        return `<li role="option" tabindex="0" aria-selected="${e.id === currentId}" data-id="${e.id}" class="mood-${e.mood}">
          <b>${highlight(e.title || 'Untitled page', query)}</b>
          <small>${fmt(e.created)}${query ? ` · score ${score.toFixed(2)}` : ''}</small>
          <span>${highlight(snippetSrc, query)}</span></li>`;
      }).join('');
    }

    function renderEditor() {
      const e = currentId ? diary.get(currentId) : undefined;
      $<HTMLDivElement>('.diary__empty').hidden = !!e;
      form.hidden = !e;
      if (!e) el.classList.remove('editing');
      if (!e) return;
      title.value = e.title; body.value = e.body; tagIn.value = e.tags.join(', ');
      $<HTMLSpanElement>('.diary__date').textContent = fmt(e.created);
      saved.textContent = '';
      confirmDelete = false; del.textContent = 'Delete'; del.classList.remove('btn--danger');
      el.querySelectorAll<HTMLButtonElement>('[data-mood]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mood === e.mood)));
    }

    const select = (id: string) => { save.flush(); saveNow(); currentId = id; el.classList.add('editing'); renderEditor(); renderList(); };

    function newPage() {
      save.flush(); if (currentId) saveNow();
      const e: Entry = diary.create({ mood: 'glitter' });
      currentId = e.id; query = ''; search.value = ''; tagFilter = undefined; el.classList.add('editing');
      renderAll(); title.focus();
      audio.ui('open');
    }

    function renderAll() { renderChrome(); renderList(); renderEditor(); }

    el.addEventListener('click', (ev) => {
      const t = ev.target as HTMLElement;
      const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act === 'new') newPage();
      if (act === 'back') { el.classList.remove('editing'); }
      if (act === 'delete' && currentId) {
        if (!confirmDelete) { confirmDelete = true; del.textContent = 'Really delete?'; del.classList.add('btn--danger'); return; }
        diary.remove(currentId); audio.ui('close');
        currentId = diary.all()[0]?.id ?? null; renderAll(); ctx.toast('Page deleted.');
      }
      const li = t.closest<HTMLElement>('li[data-id]');
      if (li) select(li.dataset.id!);
      const mood = t.closest<HTMLElement>('[data-mood]')?.dataset.mood as Mood | undefined;
      if (mood && currentId) { diary.update(currentId, { mood }); audio.ui('click'); renderEditor(); renderList(); renderChrome(); }
      const tag = t.closest<HTMLElement>('[data-tag]')?.dataset.tag;
      if (tag) { tagFilter = tagFilter === tag ? undefined : tag; renderChrome(); renderList(); }
    });
    list.addEventListener('keydown', (ev) => {
      const li = (ev.target as HTMLElement).closest<HTMLElement>('li[data-id]');
      if (!li) return;
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(li.dataset.id!); title.focus(); }
      if (ev.key === 'ArrowDown') { ev.preventDefault(); (li.nextElementSibling as HTMLElement | null)?.focus(); }
      if (ev.key === 'ArrowUp') { ev.preventDefault(); (li.previousElementSibling as HTMLElement | null)?.focus(); }
    });
    el.addEventListener('keydown', (ev) => { if (ev.altKey && ev.key.toLowerCase() === 'n') { ev.preventDefault(); newPage(); } });
    search.addEventListener('input', () => { query = search.value; renderList(); });
    [title, body, tagIn].forEach((i) => i.addEventListener('input', () => { saved.textContent = 'typing…'; save(); }));
    form.addEventListener('submit', (e) => e.preventDefault());

    renderAll();
    if (!ctx.persistent) ctx.toast('Storage is blocked in this browser — diary pages will vanish when you close the tab.');
    return () => { save.flush(); if (currentId) saveNow(); };
  },
};

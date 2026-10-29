/** आठवणी · Aathavani — the drag-and-arrange moodboard. */

import { Board, type BoardItem } from '../lib/board';
import { escapeHtml } from '../lib/diary';
import { STICKER_IDS, STICKER_LABELS, sticker } from '../lib/icons';
import { audio } from '../lib/audio';
import { html, type AppDef } from './types';
import './scrapbook.css';

const SWATCHES = ['#e2007a', '#b5122f', '#f4e1bf', '#cfd4de', '#0fb5c2', '#c9b8ff', '#5b2a86', '#0f7b5f', '#e0b44a'];

const SEED: BoardItem[] = [
  { id: 's1', kind: 'note', value: 'monsoon playlist, mogra gajra, silver jhumkas — the 2004 summer edit', x: 0.3, y: 0.3, rot: -4, scale: 1, z: 1 },
  { id: 's2', kind: 'sticker', value: 'butterfly', x: 0.62, y: 0.26, rot: 8, scale: 1.2, z: 2 },
  { id: 's3', kind: 'sticker', value: 'nath', x: 0.78, y: 0.62, rot: -10, scale: 1.1, z: 3 },
  { id: 's4', kind: 'swatch', value: '#e2007a', x: 0.18, y: 0.7, rot: 6, scale: 1, z: 4 },
  { id: 's5', kind: 'swatch', value: '#e0b44a', x: 0.28, y: 0.76, rot: -3, scale: 1, z: 5 },
  { id: 's6', kind: 'sticker', value: 'cassette', x: 0.52, y: 0.66, rot: -6, scale: 1.3, z: 6 },
  { id: 's7', kind: 'sticker', value: 'sparkle', x: 0.86, y: 0.2, rot: 0, scale: 0.8, z: 7 },
];

export const scrapbookApp: AppDef = {
  id: 'board', title: 'Aathavani', deva: 'आठवणी', blurb: 'a scrapbook moodboard you arrange by hand', icon: 'board',
  w: 820, h: 560, minW: 340, minH: 360,
  mount(root, ctx) {
    const board = new Board(ctx.store, SEED);
    let selected: string | null = null;

    const el = html(`
      <div class="scrap">
        <div class="scrap__tray" role="toolbar" aria-label="Add to board">
          <span class="label">Stickers</span>
          <div class="scrap__stickers">${STICKER_IDS.map((id) => `<button class="scrap__add" data-add="sticker" data-v="${id}" title="${STICKER_LABELS[id]}" aria-label="Add ${STICKER_LABELS[id]}">${sticker(id, 34)}</button>`).join('')}</div>
          <span class="label">Swatches</span>
          <div class="scrap__swatches">${SWATCHES.map((c) => `<button class="scrap__sw" style="--c:${c}" data-add="swatch" data-v="${c}" aria-label="Add colour ${c}"></button>`).join('')}</div>
          <button class="btn" data-add="note" data-v="new note">+ Note</button>
          <button class="btn" data-act="reset">Reset board</button>
        </div>
        <div class="scrap__paper" aria-label="Moodboard. Select an item, then use arrow keys to move, R to rotate, + and − to resize, Delete to remove." tabindex="-1"></div>
        <div class="scrap__inspect" role="toolbar" aria-label="Selected item" hidden>
          <input class="field scrap__text" aria-label="Note text" maxlength="280">
          <button class="btn" data-act="rotl" aria-label="Rotate left">⟲</button>
          <button class="btn" data-act="rotr" aria-label="Rotate right">⟳</button>
          <button class="btn" data-act="smaller" aria-label="Smaller">−</button>
          <button class="btn" data-act="bigger" aria-label="Bigger">+</button>
          <button class="btn" data-act="front">To front</button>
          <button class="btn btn--danger" data-act="remove">Remove</button>
        </div>
      </div>`);
    root.append(el);
    const paper = el.querySelector<HTMLDivElement>('.scrap__paper')!;
    const inspect = el.querySelector<HTMLDivElement>('.scrap__inspect')!;
    const text = el.querySelector<HTMLInputElement>('.scrap__text')!;

    const itemHTML = (it: BoardItem) => {
      const inner = it.kind === 'sticker' ? sticker(it.value, 72)
        : it.kind === 'swatch' ? `<span class="sw" style="--c:${it.value}"><b>${it.value}</b></span>`
        : `<span class="note">${escapeHtml(it.value)}</span>`;
      const label = it.kind === 'sticker' ? STICKER_LABELS[it.value] : it.kind === 'swatch' ? `Colour ${it.value}` : `Note: ${it.value}`;
      return `<button class="item item--${it.kind}" data-id="${it.id}" aria-label="${escapeHtml(label)}" aria-pressed="${it.id === selected}"
        style="left:${it.x * 100}%;top:${it.y * 100}%;z-index:${it.z};--rot:${it.rot}deg;--s:${it.scale}">${inner}</button>`;
    };

    function render() {
      paper.innerHTML = board.items.length ? board.sorted().map(itemHTML).join('')
        : `<p class="empty">An empty page. Add stickers, swatches and notes from the tray, then drag them into place.</p>`;
      const it = selected ? board.get(selected) : undefined;
      inspect.hidden = !it;
      if (it) { text.hidden = it.kind !== 'note'; text.value = it.kind === 'note' ? it.value : ''; }
    }
    function select(id: string | null) { selected = id; render(); if (id) paper.querySelector<HTMLElement>(`[data-id="${id}"]`)?.focus(); }

    // Drag with pointer capture; coordinates normalised to the paper's box.
    let drag: { id: string; dx: number; dy: number; moved: boolean } | null = null;
    paper.addEventListener('pointerdown', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('.item');
      if (!b) { if (e.target === paper) select(null); return; }
      const it = board.get(b.dataset.id!)!;
      const r = paper.getBoundingClientRect();
      drag = { id: it.id, dx: (e.clientX - r.left) / r.width - it.x, dy: (e.clientY - r.top) / r.height - it.y, moved: false };
      b.setPointerCapture(e.pointerId);
      b.classList.add('dragging');
      if (selected !== it.id) { selected = it.id; board.bringToFront(it.id); paper.querySelectorAll('.item').forEach((n) => n.setAttribute('aria-pressed', String((n as HTMLElement).dataset.id === it.id))); b.style.zIndex = String(board.get(it.id)!.z); inspect.hidden = false; text.hidden = it.kind !== 'note'; text.value = it.kind === 'note' ? it.value : ''; }
    });
    paper.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const r = paper.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - drag.dx, y = (e.clientY - r.top) / r.height - drag.dy;
      const b = paper.querySelector<HTMLElement>(`[data-id="${drag.id}"]`)!;
      b.style.left = `${Math.max(0, Math.min(1, x)) * 100}%`; b.style.top = `${Math.max(0, Math.min(1, y)) * 100}%`;
      drag.moved = true;
    });
    const endDrag = (e: PointerEvent) => {
      if (!drag) return;
      const r = paper.getBoundingClientRect();
      if (drag.moved) { board.move(drag.id, (e.clientX - r.left) / r.width - drag.dx, (e.clientY - r.top) / r.height - drag.dy); audio.ui('click'); }
      const id = drag.id; drag = null; render(); paper.querySelector<HTMLElement>(`[data-id="${id}"]`)?.focus({ preventScroll: true });
    };
    paper.addEventListener('pointerup', endDrag);
    paper.addEventListener('pointercancel', endDrag);

    paper.addEventListener('keydown', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('.item');
      if (!b) return;
      const id = b.dataset.id!, it = board.get(id)!;
      const step = e.shiftKey ? 0.05 : 0.01;
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[e.key]) { e.preventDefault(); board.move(id, it.x + moves[e.key][0], it.y + moves[e.key][1]); selected = id; render(); }
      else if (e.key === 'r' || e.key === 'R') { board.rotate(id, e.shiftKey ? -15 : 15); render(); }
      else if (e.key === '+' || e.key === '=') { board.rescale(id, 1.1); render(); }
      else if (e.key === '-') { board.rescale(id, 1 / 1.1); render(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { board.remove(id); selected = null; render(); audio.ui('close'); return; }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selected = id; board.bringToFront(id); render(); }
      else return;
      paper.querySelector<HTMLElement>(`[data-id="${id}"]`)?.focus();
    });

    el.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const add = t.closest<HTMLElement>('[data-add]');
      if (add) {
        const it = board.add(add.dataset.add as BoardItem['kind'], add.dataset.v!, 0.35 + Math.random() * 0.3, 0.3 + Math.random() * 0.4);
        audio.ui('open'); select(it.id);
        if (it.kind === 'note') { text.focus(); text.select(); }
      }
      const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
      if (!act) return;
      if (act === 'reset') { board.reset(SEED); selected = null; render(); ctx.toast('Board reset to the sample layout.'); return; }
      if (!selected) return;
      const id = selected;
      if (act === 'rotl') board.rotate(id, -15);
      if (act === 'rotr') board.rotate(id, 15);
      if (act === 'smaller') board.rescale(id, 1 / 1.15);
      if (act === 'bigger') board.rescale(id, 1.15);
      if (act === 'front') board.bringToFront(id);
      if (act === 'remove') { board.remove(id); selected = null; audio.ui('close'); }
      render();
    });
    text.addEventListener('input', () => {
      if (!selected) return;
      board.setValue(selected, text.value || ' ');
      const n = paper.querySelector(`[data-id="${selected}"] .note`);
      if (n) n.textContent = text.value;
    });

    render();
    return () => {};
  },
};

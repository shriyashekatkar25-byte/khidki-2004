/** रंगरूप · Rangroop (appearance settings) and स्वागत · Swagat (about / welcome). */

import { THEMES, WALLPAPERS, type MotionPref } from '../lib/settings';
import { html, type AppDef } from './types';
import './system.css';

export const FOOTER = `Original work by Shriya Shekatkar · SHRIYA.EXE · Synthetic or demo data is labeled as such. Not affiliated with any film, studio or company. · <a href="https://shriyashekatkar25-byte.github.io/shriya-exe/" target="_blank" rel="noopener">Studio gallery ↗</a>`;

export const settingsApp: AppDef = {
  id: 'settings', title: 'Rangroop', deva: 'रंगरूप', blurb: 'themes, wallpaper, sound & motion', icon: 'settings',
  w: 600, h: 540, minW: 320, minH: 340,
  mount(root, ctx) {
    const el = html(`<div class="sys">
      <section><h2>Theme <span class="deva">रंग</span></h2>
        <div class="sys__themes" role="radiogroup" aria-label="Theme">
          ${THEMES.map((t) => `<button class="theme-card" role="radio" data-theme-pick="${t.id}">
            <span class="theme-card__sw">${t.shader.map(([r, g, b]) => `<i style="background:rgb(${r * 255},${g * 255},${b * 255})"></i>`).join('')}</span>
            <b>${t.name}</b><small>${t.tagline}</small></button>`).join('')}
        </div></section>
      <section><h2>Wallpaper <span class="deva">पार्श्वभूमी</span></h2>
        <div class="sys__walls" role="radiogroup" aria-label="Wallpaper">
          ${WALLPAPERS.map((w) => `<button class="pill" role="radio" data-wall="${w.id}" title="${w.note}">${w.name}</button>`).join('')}
        </div><p class="sys__hint" data-wall-note></p></section>
      <section><h2>Sound & motion</h2>
        <div class="sys__rows">
          <label class="sys__switch"><input type="checkbox" data-k="sounds"><span></span> Interface sounds (synthesised bells)</label>
          <label class="sys__switch"><input type="checkbox" data-k="skipBoot"><span></span> Skip the boot sequence</label>
          <label class="sys__sel">Motion
            <select class="field" data-k="motion"><option value="auto">Follow my device</option><option value="full">Full cinematic</option><option value="reduced">Reduced</option></select></label>
        </div></section>
      <section><h2>Storage</h2>
        <p class="sys__hint">${ctx.persistent ? 'Saving to this browser’s local storage. Nothing is sent anywhere.' : 'Local storage is blocked here, so changes last only until you close the tab.'}</p>
        <button class="btn" data-act="wipe">Erase all KHIDKI data…</button></section>
    </div>`);
    root.append(el);
    const sync = () => {
      const v = ctx.settings.value;
      el.querySelectorAll<HTMLElement>('[data-theme-pick]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.themePick === v.theme)));
      el.querySelectorAll<HTMLElement>('[data-wall]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.wall === v.wallpaper)));
      el.querySelector<HTMLElement>('[data-wall-note]')!.textContent = WALLPAPERS.find((w) => w.id === v.wallpaper)!.note + '.';
      el.querySelector<HTMLInputElement>('[data-k="sounds"]')!.checked = v.sounds;
      el.querySelector<HTMLInputElement>('[data-k="skipBoot"]')!.checked = v.skipBoot;
      el.querySelector<HTMLSelectElement>('[data-k="motion"]')!.value = v.motion;
    };
    let wipeArmed = false;
    el.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const th = t.closest<HTMLElement>('[data-theme-pick]')?.dataset.themePick;
      if (th) ctx.settings.set('theme', th as never);
      const w = t.closest<HTMLElement>('[data-wall]')?.dataset.wall;
      if (w) ctx.settings.set('wallpaper', w as never);
      const wipe = t.closest<HTMLButtonElement>('[data-act="wipe"]');
      if (wipe) {
        if (!wipeArmed) { wipeArmed = true; wipe.textContent = 'Click again to erase diary, board & settings'; wipe.classList.add('btn--danger'); return; }
        ['diary', 'diarySeeded', 'board', 'taal', 'settings', 'welcomed'].forEach((k) => ctx.store.clear(k));
        ctx.toast('All local data erased. Restarting…');
        setTimeout(() => location.reload(), 900);
      }
      sync();
    });
    el.addEventListener('change', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.dataset.k === 'sounds' || t.dataset.k === 'skipBoot') ctx.settings.set(t.dataset.k, t.checked);
      if (t.dataset.k === 'motion') ctx.settings.set('motion', t.value as MotionPref);
    });
    sync();
    return () => {};
  },
};

export const aboutApp: AppDef = {
  id: 'about', title: 'Swagat', deva: 'स्वागत', blurb: 'welcome, manifesto & shortcuts', icon: 'about',
  w: 560, h: 560, minW: 320, minH: 320,
  mount(root, ctx) {
    root.append(html(`<div class="about">
      <header class="about__hero">
        <p class="about__kicker">SHRIYA.EXE · drop 001</p>
        <h1>KHIDKI <em>2004</em></h1>
        <p class="deva about__deva">खिडकी — a window</p>
      </header>
      <p class="about__lede">An operating system that never shipped, from an internet that half-existed: the glossy, glitter-dusted
      desi web of 2004 — cybercafé afternoons, ringtone countdowns, diaries kept in password-protected folders — rebuilt with today's tools.</p>
      <h2>What is real here</h2>
      <ul>
        <li><b>Window manager</b> — a tested state machine with an explicit z-order stack, drag, resize, minimise, maximise and keyboard control.</li>
        <li><b>Wallpaper</b> — a WebGL fragment shader (domain-warped noise, a 16-fold rangoli lattice, raindrops on glass) with adaptive resolution.</li>
        <li><b>Dainandini</b> — local-only diary with BM25 full-text search that handles Devanagari.</li>
        <li><b>TAAL.FM</b> — every sound is synthesised live; look-ahead audio scheduling; a Markov-chain melody walking a raga's note set.</li>
        <li><b>Aathavani</b> — a scrapbook in resolution-independent coordinates, saved to your browser.</li>
      </ul>
      <h2>Keyboard</h2>
      <dl class="about__keys">
        <dt>Alt + \`</dt><dd>cycle windows</dd><dt>Alt + Q</dt><dd>close focused window</dd>
        <dt>Alt + M</dt><dd>minimise focused window</dd><dt>Alt + S</dt><dd>open the सुरू menu</dd>
        <dt>Arrows on a title bar</dt><dd>move window (Shift: resize)</dd><dt>Enter on an icon</dt><dd>open app</dd>
      </dl>
      <p class="about__fine">Nothing you write leaves this browser. No cookies, no analytics, no accounts. Every icon, sticker, sound and
      pattern is original procedural work; references used for research are listed in CREDITS.md.</p>
      <footer class="about__foot">${FOOTER}</footer>
      <p><button class="btn btn--hot" data-act="diary">Open the diary</button> <button class="btn" data-act="taal">Play TAAL.FM</button></p>
    </div>`));
    root.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act) ctx.open(act);
    });
    return () => {};
  },
};

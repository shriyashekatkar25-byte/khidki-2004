/**
 * The shell: desktop icons, window chrome, taskbar, start menu, phone launcher
 * and global shortcuts. It renders whatever the WindowManager model says —
 * DOM nodes never own geometry, so tests on the model cover real behaviour.
 */

import { WindowManager, type WinState } from './lib/windowManager';
import { audio } from './lib/audio';
import { icon } from './lib/icons';
import type { AppContext, AppDef } from './apps/types';
import { FOOTER } from './apps/system';

const SVG_MIN = '<svg viewBox="0 0 12 12"><path d="M2 9h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const SVG_MAX = '<svg viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const SVG_CLOSE = '<svg viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const SVG_SOUND = (on: boolean) => `<svg viewBox="0 0 20 20"><path d="M3 8h3l4-3v10l-4-3H3z" fill="currentColor"/>${on ? '<path d="M13 7a4 4 0 0 1 0 6M15 5a7 7 0 0 1 0 10" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>' : '<path d="M13 7l5 6M18 7l-5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'}</svg>`;
const SVG_MOON = '<svg viewBox="0 0 64 64"><path d="M40 8a25 25 0 1 0 0 48 20 20 0 1 1 0-48z" fill="#fff"/></svg>';

const isPhone = () => matchMedia('(max-width: 720px)').matches;
const TASKBAR = 56;

export function mountShell(apps: AppDef[], ctx: Omit<AppContext, 'open'>) {
  const byId = new Map(apps.map((a) => [a.id, a]));
  const wm = new WindowManager({ w: innerWidth, h: innerHeight, bottomInset: isPhone() ? 0 : TASKBAR });
  const mounted = new Map<string, { el: HTMLElement; cleanup: () => void }>();
  const fullCtx: AppContext = { ...ctx, open: (id) => open(id) };
  const deskApps = apps.filter((a) => a.id !== 'power');

  // ───── static chrome ─────
  const desktop = document.createElement('main');
  desktop.className = 'desktop';
  desktop.setAttribute('aria-label', 'KHIDKI 2004 desktop');
  desktop.innerHTML = `
    <ul class="icons" role="listbox" aria-label="Desktop" aria-orientation="vertical">
      ${deskApps.map((a, i) => `<li role="none"><button class="icon" role="option" aria-selected="false" data-app="${a.id}" tabindex="${i ? -1 : 0}"
        aria-label="${a.title} — ${a.blurb}">${icon(a.icon, 52)}<span class="icon__label">${a.title}<span class="icon__deva">${a.deva}</span></span></button></li>`).join('')}
    </ul>
    <div class="desk-mark" aria-hidden="true"><span class="deva">खिडकी</span><b>KHIDKI 2004</b><span>a desktop from a dreamed-up internet</span></div>
    <div class="windows"></div>`;
  const winLayer = desktop.querySelector<HTMLDivElement>('.windows')!;

  const launcher = document.createElement('div');
  launcher.className = 'launcher';
  launcher.innerHTML = `
    <div class="statusbar" aria-hidden="true"><span>KHIDKI mobile</span><span class="m-clock"></span></div>
    <div class="launcher__hero"><span class="deva">खिडकी</span><b>KHIDKI</b><span>2004, in your pocket</span></div>
    <ul class="launcher__grid" aria-label="Apps">${apps.map((a) => `<li><button class="icon" data-app="${a.id}" aria-label="${a.title} — ${a.blurb}">${icon(a.icon, 58)}<span class="icon__label">${a.title}<span class="icon__deva">${a.deva}</span></span></button></li>`).join('')}</ul>
    <p class="launcher__foot">${FOOTER}</p>`;

  const taskbar = document.createElement('nav');
  taskbar.className = 'taskbar';
  taskbar.setAttribute('aria-label', 'Taskbar');
  taskbar.innerHTML = `
    <button class="start" aria-haspopup="menu" aria-expanded="false" aria-controls="startmenu" title="Start (Alt+S)"><span class="orb">${SVG_MOON}</span><span class="deva">सुरू</span></button>
    <div class="tasks" role="toolbar" aria-label="Open windows"></div>
    <div class="tray"><button class="snd" aria-label="Toggle interface sounds"></button><time class="clock" aria-label="Clock"></time></div>`;

  const menu = document.createElement('div');
  menu.className = 'startmenu'; menu.id = 'startmenu'; menu.hidden = true;
  menu.setAttribute('role', 'menu');
  menu.innerHTML = `
    <div class="sm-head"><b>Namaskar, Shriya</b><span>the year is always 2004 here</span></div>
    <ul class="sm-list">${apps.map((a) => `<li role="none"><button class="sm-item" role="menuitem" data-app="${a.id}">${icon(a.icon, 36)}<span><b>${a.title} <span class="deva">${a.deva}</span></b><small>${a.blurb}</small></span></button></li>`).join('')}</ul>
    <div class="sm-foot"><span>${FOOTER}</span></div>`;

  const toastEl = document.createElement('div');
  toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');

  document.body.append(desktop, launcher, taskbar, menu, toastEl);
  const tasks = taskbar.querySelector<HTMLDivElement>('.tasks')!;
  const startBtn = taskbar.querySelector<HTMLButtonElement>('.start')!;

  // ───── windows ─────
  function open(appId: string) {
    const app = byId.get(appId);
    if (!app) return;
    if (app.id === 'power') { closeMenu(); ctx.shutdown(); return; }
    const existing = wm.findByApp(appId);
    if (existing) { wm.focus(existing.id); return; }
    const w = wm.open({ appId, title: app.title, w: app.w, h: app.h, minW: app.minW, minH: app.minH, singleton: true });
    if (isPhone()) wm.toggleMaximize(w.id);
    audio.ui('open');
    closeMenu();
  }

  function createWindowEl(w: WinState, app: AppDef) {
    const el = document.createElement('section');
    el.className = 'win';
    el.dataset.id = w.id;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-labelledby', `${w.id}-t`);
    el.innerHTML = `
      <header class="titlebar" tabindex="0" aria-label="${app.title} title bar. Arrow keys move, Shift plus arrows resize.">
        <span class="titlebar__icon" aria-hidden="true">${icon(app.icon, 22)}</span>
        <span class="titlebar__title" id="${w.id}-t">${app.title}<span class="deva">${app.deva}</span></span>
        <button class="wbtn wbtn--min" aria-label="Minimise">${SVG_MIN}</button>
        <button class="wbtn wbtn--max" aria-label="Maximise">${SVG_MAX}</button>
        <button class="wbtn wbtn--close" aria-label="Close">${SVG_CLOSE}</button>
      </header>
      <div class="win-body"></div>
      <div class="resize resize--e" data-edge="e" aria-hidden="true"></div>
      <div class="resize resize--s" data-edge="s" aria-hidden="true"></div>
      <div class="resize resize--se" data-edge="se" aria-hidden="true"></div>`;
    const body = el.querySelector<HTMLDivElement>('.win-body')!;
    const bar = el.querySelector<HTMLElement>('.titlebar')!;

    el.addEventListener('pointerdown', () => wm.focused()?.id !== w.id && wm.focus(w.id), true);
    el.querySelector('.wbtn--min')!.addEventListener('click', () => { wm.minimize(w.id); audio.ui('minimize'); });
    el.querySelector('.wbtn--max')!.addEventListener('click', () => { wm.toggleMaximize(w.id); audio.ui('click'); });
    el.querySelector('.wbtn--close')!.addEventListener('click', () => closeWin(w.id));
    bar.addEventListener('dblclick', (e) => { if (!(e.target as HTMLElement).closest('.wbtn')) wm.toggleMaximize(w.id); });

    // Drag by title bar. Pointer capture keeps the drag alive outside the window.
    bar.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.wbtn') || isPhone() || e.button !== 0) return;
      const s = wm.get(w.id)!;
      if (s.maximized) return;
      const ox = e.clientX - s.x, oy = e.clientY - s.y;
      bar.setPointerCapture(e.pointerId);
      const move = (ev: PointerEvent) => wm.moveTo(w.id, ev.clientX - ox, ev.clientY - oy);
      const up = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); };
      bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up);
    });
    el.querySelectorAll<HTMLElement>('.resize').forEach((h) => h.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const s = wm.get(w.id)!; const edge = h.dataset.edge!;
      const sx = e.clientX, sy = e.clientY, sw = s.w, sh = s.h;
      h.setPointerCapture(e.pointerId);
      const move = (ev: PointerEvent) => wm.resizeTo(w.id, edge.includes('e') ? sw + ev.clientX - sx : sw, edge.includes('s') ? sh + ev.clientY - sy : sh);
      const up = () => { h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); };
      h.addEventListener('pointermove', move); h.addEventListener('pointerup', up);
    }));
    bar.addEventListener('keydown', (e) => {
      const d: Record<string, [number, number]> = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] };
      if (!d[e.key]) return;
      e.preventDefault();
      const s = wm.get(w.id)!;
      if (e.shiftKey) wm.resizeTo(w.id, s.w + d[e.key][0], s.h + d[e.key][1]); else wm.moveBy(w.id, d[e.key][0], d[e.key][1]);
    });

    const cleanup = app.mount(body, fullCtx);
    return { el, cleanup };
  }

  function closeWin(id: string) {
    const m = mounted.get(id);
    audio.ui('close');
    if (m && !ctx.reduced()) {
      m.el.classList.add('closing');
      setTimeout(() => wm.close(id), 130);
    } else wm.close(id);
  }

  let taskSig = '';
  function render() {
    const live = new Set(wm.list().map((w) => w.id));
    for (const [id, m] of mounted) if (!live.has(id)) { m.cleanup(); m.el.remove(); mounted.delete(id); }
    const focused = wm.focused();
    wm.list().forEach((w, i) => {
      let m = mounted.get(w.id);
      if (!m) { m = createWindowEl(w, byId.get(w.appId)!); mounted.set(w.id, m); winLayer.append(m.el); }
      const el = m.el;
      el.style.setProperty('--tx', `${w.x}px`); el.style.setProperty('--ty', `${w.y}px`);
      el.style.transform = `translate(${w.x}px, ${w.y}px)`;
      el.style.width = `${w.w}px`; el.style.height = `${w.h}px`;
      el.style.zIndex = String(100 + i);
      el.classList.toggle('focused', focused?.id === w.id);
      el.classList.toggle('minimized', w.minimized);
      el.classList.toggle('maximized', w.maximized);
      el.querySelector('.wbtn--max')!.setAttribute('aria-label', w.maximized ? 'Restore' : 'Maximise');
    });
    // Taskbar keeps launch order, not z-order, so buttons don't jump around.
    const ordered = [...wm.list()].sort((a, b) => Number(a.id.slice(4)) - Number(b.id.slice(4)));
    const sig = ordered.map((w) => `${w.id}:${w.minimized}:${focused?.id === w.id}`).join('|');
    if (sig !== taskSig) tasks.innerHTML = ordered.map((w) => {
      const app = byId.get(w.appId)!;
      return `<button class="task ${w.minimized ? 'min' : ''}" data-win="${w.id}" aria-pressed="${focused?.id === w.id}">${icon(app.icon, 22)}<span>${app.title}</span></button>`;
    }).join('');
    taskSig = sig;
    launcher.classList.toggle('covered', isPhone() && !!focused);
  }
  wm.onChange(render);

  // ───── start menu ─────
  function openMenu() { menu.hidden = false; startBtn.setAttribute('aria-expanded', 'true'); menu.querySelector<HTMLElement>('.sm-item')?.focus(); audio.ui('click'); }
  function closeMenu() { if (menu.hidden) return; menu.hidden = true; startBtn.setAttribute('aria-expanded', 'false'); }
  startBtn.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));
  menu.addEventListener('keydown', (e) => {
    const items = [...menu.querySelectorAll<HTMLElement>('.sm-item')];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    if (e.key === 'Escape') { closeMenu(); startBtn.focus(); }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!menu.hidden && !menu.contains(e.target as Node) && !startBtn.contains(e.target as Node)) closeMenu();
  });

  // ───── icon + task clicks ─────
  document.body.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const appBtn = t.closest<HTMLElement>('[data-app]');
    if (appBtn && (appBtn.closest('.sm-list') || appBtn.closest('.launcher'))) open(appBtn.dataset.app!);
    else if (appBtn?.closest('.icons')) selectIcon(appBtn);
    const task = t.closest<HTMLElement>('[data-win]');
    if (task) { wm.toggleFromTaskbar(task.dataset.win!); audio.ui('click'); }
  });
  const iconsEl = desktop.querySelector<HTMLElement>('.icons')!;
  const iconBtns = [...iconsEl.querySelectorAll<HTMLButtonElement>('.icon')];
  function selectIcon(b: HTMLElement) {
    iconBtns.forEach((x) => { x.setAttribute('aria-selected', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
    b.focus();
  }
  iconsEl.addEventListener('dblclick', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-app]'); if (b) open(b.dataset.app!); });
  iconsEl.addEventListener('keydown', (e) => {
    const i = iconBtns.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(iconBtns[i].dataset.app!); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); selectIcon(iconBtns[(i + 1) % iconBtns.length]); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); selectIcon(iconBtns[(i - 1 + iconBtns.length) % iconBtns.length]); }
  });
  // Touch: one tap opens on coarse pointers (no double-click on tablets).
  iconsEl.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-app]'); if (b) open(b.dataset.app!); } });

  // ───── global shortcuts ─────
  addEventListener('keydown', (e) => {
    if (!e.altKey) return;
    const k = e.key.toLowerCase();
    const f = wm.focused();
    if (k === '`' || e.code === 'Backquote') { e.preventDefault(); wm.cycle(); }
    else if (k === 'q' && f) { e.preventDefault(); closeWin(f.id); }
    else if (k === 'm' && f) { e.preventDefault(); wm.minimize(f.id); }
    else if (k === 's') { e.preventDefault(); menu.hidden ? openMenu() : closeMenu(); }
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && isPhone() && wm.focused() && !(e.target as HTMLElement).closest('input,textarea,select')) wm.minimize(wm.focused()!.id); });

  // ───── tray ─────
  const snd = taskbar.querySelector<HTMLButtonElement>('.snd')!;
  const syncSound = () => { snd.innerHTML = SVG_SOUND(ctx.settings.value.sounds); snd.setAttribute('aria-pressed', String(ctx.settings.value.sounds)); };
  snd.addEventListener('click', () => ctx.settings.set('sounds', !ctx.settings.value.sounds));
  ctx.settings.onChange(syncSound); syncSound();
  const clocks = [taskbar.querySelector<HTMLElement>('.clock')!, launcher.querySelector<HTMLElement>('.m-clock')!];
  const tick = () => { const s = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); clocks.forEach((c) => (c.textContent = s)); };
  tick(); setInterval(tick, 15000);

  // In phone mode the "minimise" button reads as Back.
  const relabel = () => document.querySelectorAll('.wbtn--min').forEach((b) => b.setAttribute('aria-label', isPhone() ? 'Back to home' : 'Minimise'));
  addEventListener('resize', () => { wm.setViewport({ w: innerWidth, h: innerHeight, bottomInset: isPhone() ? 0 : TASKBAR }); relabel(); });
  wm.onChange(relabel);

  return { wm, open, toast: ctx.toast, elements: { desktop, taskbar, launcher, menu } };
}

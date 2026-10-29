import './styles/main.css';
import { browserKV, Store } from './lib/storage';
import { SettingsStore, THEMES, reducedMotion } from './lib/settings';
import { mountWallpaper } from './lib/wallpaper';
import { audio } from './lib/audio';
import { runBoot } from './boot';
import { mountShell } from './shell';
import { diaryApp } from './apps/diary';
import { taalApp } from './apps/taal';
import { scrapbookApp } from './apps/scrapbook';
import { aboutApp, settingsApp, FOOTER } from './apps/system';
import type { AppDef } from './apps/types';

const kv = browserKV();
const store = new Store(kv);
const settings = new SettingsStore(store);
const reduced = () => reducedMotion(settings.value.motion);

const canvas = document.getElementById('wall') as HTMLCanvasElement;
const wallpaper = mountWallpaper(canvas);
if (!wallpaper.ok) document.body.classList.add('no-webgl');

function apply() {
  const v = settings.value;
  document.documentElement.dataset.theme = v.theme;
  wallpaper.setPalette(THEMES.find((t) => t.id === v.theme)!.shader);
  wallpaper.setMode(v.wallpaper);
  wallpaper.setReduced(reduced());
  document.documentElement.classList.toggle('reduce-motion', reduced());
  audio.uiEnabled = v.sounds;
}
settings.onChange(apply);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', apply);
apply();

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function toast(msg: string) {
  const el = document.querySelector<HTMLElement>('.toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3800);
}

function shutdown() {
  audio.ui('shutdown');
  const o = document.createElement('div');
  o.className = 'shutdown';
  o.innerHTML = `<div><p>It is now safe to switch off your dil.</p><p class="deva">आता संगणक बंद करणे सुरक्षित आहे.</p>
    <button class="btn btn--hot">Start KHIDKI again</button></div>`;
  document.body.append(o);
  const btn = o.querySelector('button')!;
  btn.focus();
  btn.addEventListener('click', async () => { o.remove(); await runBoot(reduced(), FOOTER); });
}

const powerApp: AppDef = {
  id: 'power', title: 'Band karaa', deva: 'बंद करा', blurb: 'shut down (gently)', icon: 'power',
  w: 300, h: 200, mount: () => () => {},
};

const apps = [diaryApp, taalApp, scrapbookApp, settingsApp, aboutApp, powerApp];

async function start() {
  if (!settings.value.skipBoot) {
    wallpaper.setReduced(true); // the boot screen is opaque: don't animate the shader underneath
    await runBoot(reduced(), FOOTER);
    wallpaper.setReduced(reduced());
  }
  const shell = mountShell(apps, { store, settings, persistent: kv.persistent, toast, shutdown, reduced });
  if (!store.read('welcomed', false)) {
    shell.open('about');
    store.write('welcomed', true);
  }
  // Unlock audio on the first gesture anywhere (browsers block autoplay).
  addEventListener('pointerdown', () => audio.ensure(), { once: true });
}

void start();

import type { Store } from '../lib/storage';
import type { SettingsStore } from '../lib/settings';

export interface AppContext {
  store: Store;
  settings: SettingsStore;
  persistent: boolean;
  toast(msg: string): void;
  open(appId: string): void;
  shutdown(): void;
  reduced(): boolean;
}

export interface AppDef {
  id: string;
  title: string;
  deva: string;
  blurb: string;
  icon: string;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  /** Renders into `root`; returns a cleanup function called when the window closes. */
  mount(root: HTMLElement, ctx: AppContext): () => void;
}

/** Tiny helper: parse an HTML string into an element. Callers escape user text. */
export function html<T extends HTMLElement = HTMLElement>(s: string): T {
  const t = document.createElement('template');
  t.innerHTML = s.trim();
  return t.content.firstElementChild as T;
}

export function debounce<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  const d = (...a: A) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.flush = () => { clearTimeout(t); };
  return d;
}

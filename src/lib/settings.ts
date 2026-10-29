/** Personalisation: themes, wallpaper mode, sound and motion preferences. */

import { Store } from './storage';

export type ThemeId = 'rani' | 'monsoon' | 'paithani';
export type WallpaperMode = 'silk' | 'rangoli' | 'rain';
export type MotionPref = 'auto' | 'reduced' | 'full';

export interface Settings { theme: ThemeId; wallpaper: WallpaperMode; sounds: boolean; motion: MotionPref; skipBoot: boolean }

export const DEFAULT_SETTINGS: Settings = { theme: 'rani', wallpaper: 'silk', sounds: true, motion: 'auto', skipBoot: false };

/** Shader palette: three colours mixed by the wallpaper plus a highlight. Linear-ish 0..1 RGB. */
export interface Theme { id: ThemeId; name: string; tagline: string; shader: [number, number, number][] }

const hex = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];

export const THEMES: Theme[] = [
  { id: 'rani', name: 'Rani Chrome', tagline: 'rani pink · cherry · champagne · silver',
    shader: [hex('#3a0a26'), hex('#e2007a'), hex('#f4e1bf'), hex('#cfd4de')] },
  { id: 'monsoon', name: 'Monsoon Modem', tagline: 'turquoise · icy blue · lavender · indigo',
    shader: [hex('#0a1838'), hex('#0fb5c2'), hex('#c9b8ff'), hex('#e6f7ff')] },
  { id: 'paithani', name: 'Paithani Midnight', tagline: 'paithani purple · emerald · zari gold',
    shader: [hex('#1b0b2e'), hex('#5b2a86'), hex('#0f7b5f'), hex('#e0b44a')] },
];

export const WALLPAPERS: { id: WallpaperMode; name: string; note: string }[] = [
  { id: 'silk', name: 'Silk', note: 'domain-warped noise shaded like thin-film silk' },
  { id: 'rangoli', name: 'Rangoli', note: '8-fold polar symmetry, a procedural kolam-like lattice' },
  { id: 'rain', name: 'Monsoon Glass', note: 'procedural raindrops sliding on a window pane' },
];

export class SettingsStore {
  value: Settings;
  private listeners = new Set<(s: Settings) => void>();
  constructor(private store: Store) {
    this.value = { ...DEFAULT_SETTINGS, ...store.read<Partial<Settings>>('settings', {}) };
  }
  set<K extends keyof Settings>(k: K, v: Settings[K]) {
    this.value = { ...this.value, [k]: v };
    this.store.write('settings', this.value);
    this.listeners.forEach((fn) => fn(this.value));
  }
  onChange(fn: (s: Settings) => void) { this.listeners.add(fn); }
}

/** Resolve the motion preference against the OS-level media query. */
export function reducedMotion(pref: MotionPref): boolean {
  if (pref === 'reduced') return true;
  if (pref === 'full') return false;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

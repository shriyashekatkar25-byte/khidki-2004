/**
 * Window manager model — pure, DOM-free state so it can be unit tested.
 *
 * Z-order is an explicit stack (`order`, bottom → top) rather than ever-growing
 * z-index counters, so focus changes are O(n) and z values stay small and
 * contiguous (they are rewritten as `base + index` when rendered).
 */

export interface Rect { x: number; y: number; w: number; h: number }

export interface WinState extends Rect {
  id: string;
  appId: string;
  title: string;
  minimized: boolean;
  maximized: boolean;
  /** Geometry to return to when un-maximizing. */
  restore: Rect | null;
  minW: number;
  minH: number;
}

export interface Viewport { w: number; h: number; /** height reserved for the taskbar */ bottomInset: number }

export interface OpenOptions { appId: string; title: string; w?: number; h?: number; minW?: number; minH?: number; singleton?: boolean }

type Listener = (wm: WindowManager) => void;

export class WindowManager {
  private wins = new Map<string, WinState>();
  /** Stacking order, bottom → top. Minimized windows stay in the stack. */
  private order: string[] = [];
  private seq = 0;
  private listeners = new Set<Listener>();
  /** Cascade offset so new windows do not open exactly on top of each other. */
  private cascade = 0;

  constructor(public viewport: Viewport) {}

  onChange(fn: Listener): () => void { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private emit() { this.listeners.forEach((fn) => fn(this)); }

  get(id: string) { return this.wins.get(id); }
  list(): WinState[] { return this.order.map((id) => this.wins.get(id)!); }
  /** Topmost window that is not minimized, i.e. the focused one. */
  focused(): WinState | undefined {
    for (let i = this.order.length - 1; i >= 0; i--) {
      const w = this.wins.get(this.order[i])!;
      if (!w.minimized) return w;
    }
    return undefined;
  }
  zIndexOf(id: string) { return this.order.indexOf(id); }
  findByApp(appId: string) { return this.list().find((w) => w.appId === appId); }

  open(opts: OpenOptions): WinState {
    if (opts.singleton) {
      const existing = this.findByApp(opts.appId);
      if (existing) { this.focus(existing.id); return existing; }
    }
    const usableH = this.viewport.h - this.viewport.bottomInset;
    const w = Math.min(opts.w ?? 560, this.viewport.w - 16);
    const h = Math.min(opts.h ?? 420, usableH - 16);
    const off = (this.cascade++ % 6) * 28;
    const x = Math.max(8, Math.round((this.viewport.w - w) / 2 - 84 + off));
    const y = Math.max(8, Math.round((usableH - h) / 2 - 56 + off));
    const id = `win-${++this.seq}`;
    const state: WinState = {
      id, appId: opts.appId, title: opts.title, x, y, w, h,
      minimized: false, maximized: false, restore: null,
      minW: opts.minW ?? 280, minH: opts.minH ?? 200,
    };
    this.wins.set(id, state);
    this.order.push(id);
    this.clamp(state);
    this.emit();
    return state;
  }

  close(id: string) {
    if (!this.wins.delete(id)) return;
    this.order = this.order.filter((o) => o !== id);
    this.emit();
  }

  /** Raise to top and un-minimize. */
  focus(id: string) {
    const w = this.wins.get(id);
    if (!w) return;
    w.minimized = false;
    this.order = this.order.filter((o) => o !== id);
    this.order.push(id);
    this.emit();
  }

  minimize(id: string) {
    const w = this.wins.get(id);
    if (!w) return;
    w.minimized = true;
    this.emit();
  }

  /** Taskbar behaviour: focused → minimize, otherwise → focus. */
  toggleFromTaskbar(id: string) {
    const w = this.wins.get(id);
    if (!w) return;
    if (this.focused()?.id === id) this.minimize(id); else this.focus(id);
  }

  toggleMaximize(id: string) {
    const w = this.wins.get(id);
    if (!w) return;
    if (w.maximized) {
      Object.assign(w, w.restore ?? {});
      w.restore = null;
      w.maximized = false;
    } else {
      w.restore = { x: w.x, y: w.y, w: w.w, h: w.h };
      Object.assign(w, { x: 0, y: 0, w: this.viewport.w, h: this.viewport.h - this.viewport.bottomInset });
      w.maximized = true;
    }
    this.focus(id);
  }

  moveTo(id: string, x: number, y: number) {
    const w = this.wins.get(id);
    if (!w || w.maximized) return;
    w.x = Math.round(x); w.y = Math.round(y);
    this.clamp(w);
    this.emit();
  }

  moveBy(id: string, dx: number, dy: number) {
    const w = this.wins.get(id);
    if (w) this.moveTo(id, w.x + dx, w.y + dy);
  }

  resizeTo(id: string, width: number, height: number) {
    const w = this.wins.get(id);
    if (!w || w.maximized) return;
    const maxW = this.viewport.w - w.x;
    const maxH = this.viewport.h - this.viewport.bottomInset - w.y;
    w.w = Math.round(Math.max(w.minW, Math.min(width, maxW)));
    w.h = Math.round(Math.max(w.minH, Math.min(height, maxH)));
    this.emit();
  }

  /** Alt+Tab style: bring the bottom-most visible window to the top. */
  cycle() {
    const visible = this.order.filter((id) => !this.wins.get(id)!.minimized);
    const candidates = visible.length > 1 ? visible : this.order;
    if (candidates.length === 0) return;
    this.focus(candidates[0]);
  }

  setViewport(v: Viewport) {
    this.viewport = v;
    for (const w of this.wins.values()) {
      if (w.maximized) Object.assign(w, { x: 0, y: 0, w: v.w, h: v.h - v.bottomInset });
      else this.clamp(w);
    }
    this.emit();
  }

  /** Keep at least a grabbable strip of the title bar on screen. */
  private clamp(w: WinState) {
    const usableH = this.viewport.h - this.viewport.bottomInset;
    w.w = Math.min(w.w, this.viewport.w);
    w.h = Math.min(w.h, usableH);
    const grab = 96;
    w.x = Math.max(grab - w.w, Math.min(w.x, this.viewport.w - grab));
    w.y = Math.max(0, Math.min(w.y, usableH - 36));
  }
}

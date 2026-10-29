import { describe, it, expect, beforeEach } from 'vitest';
import { WindowManager } from '../src/lib/windowManager';

describe('WindowManager', () => {
  let wm: WindowManager;
  beforeEach(() => { wm = new WindowManager({ w: 1280, h: 800, bottomInset: 56 }); });

  it('opens windows on top and focuses the newest', () => {
    const a = wm.open({ appId: 'a', title: 'A' });
    const b = wm.open({ appId: 'b', title: 'B' });
    expect(wm.focused()?.id).toBe(b.id);
    expect(wm.zIndexOf(a.id)).toBeLessThan(wm.zIndexOf(b.id));
  });

  it('focus raises a window to the top of the z-order', () => {
    const a = wm.open({ appId: 'a', title: 'A' });
    const b = wm.open({ appId: 'b', title: 'B' });
    const c = wm.open({ appId: 'c', title: 'C' });
    wm.focus(a.id);
    expect(wm.list().map((w) => w.id)).toEqual([b.id, c.id, a.id]);
  });

  it('singleton apps reuse their window instead of opening a second', () => {
    const a1 = wm.open({ appId: 'diary', title: 'D', singleton: true });
    wm.open({ appId: 'x', title: 'X' });
    const a2 = wm.open({ appId: 'diary', title: 'D', singleton: true });
    expect(a2.id).toBe(a1.id);
    expect(wm.list()).toHaveLength(2);
    expect(wm.focused()?.id).toBe(a1.id);
  });

  it('minimize hides from focus; taskbar toggle restores then minimizes', () => {
    const a = wm.open({ appId: 'a', title: 'A' });
    const b = wm.open({ appId: 'b', title: 'B' });
    wm.minimize(b.id);
    expect(wm.focused()?.id).toBe(a.id);
    wm.toggleFromTaskbar(b.id);
    expect(wm.get(b.id)!.minimized).toBe(false);
    expect(wm.focused()?.id).toBe(b.id);
    wm.toggleFromTaskbar(b.id);
    expect(wm.get(b.id)!.minimized).toBe(true);
  });

  it('maximize fills the viewport above the taskbar and restore returns geometry', () => {
    const a = wm.open({ appId: 'a', title: 'A', w: 500, h: 300 });
    const before = { x: a.x, y: a.y, w: a.w, h: a.h };
    wm.toggleMaximize(a.id);
    expect(wm.get(a.id)).toMatchObject({ x: 0, y: 0, w: 1280, h: 744, maximized: true });
    wm.moveTo(a.id, 300, 300); // ignored while maximized
    expect(wm.get(a.id)!.x).toBe(0);
    wm.toggleMaximize(a.id);
    expect(wm.get(a.id)).toMatchObject({ ...before, maximized: false });
  });

  it('clamps moves so the title bar stays reachable', () => {
    const a = wm.open({ appId: 'a', title: 'A', w: 400, h: 300 });
    wm.moveTo(a.id, 5000, 5000);
    const s = wm.get(a.id)!;
    expect(s.x).toBeLessThanOrEqual(1280 - 96);
    expect(s.y).toBeLessThanOrEqual(744 - 36);
    wm.moveTo(a.id, -5000, -50);
    expect(wm.get(a.id)!.x).toBe(96 - 400);
    expect(wm.get(a.id)!.y).toBe(0);
  });

  it('enforces minimum and maximum size on resize', () => {
    const a = wm.open({ appId: 'a', title: 'A', minW: 300, minH: 220 });
    wm.resizeTo(a.id, 10, 10);
    expect(wm.get(a.id)).toMatchObject({ w: 300, h: 220 });
    wm.resizeTo(a.id, 99999, 99999);
    const s = wm.get(a.id)!;
    expect(s.x + s.w).toBeLessThanOrEqual(1280);
    expect(s.y + s.h).toBeLessThanOrEqual(744);
  });

  it('close removes from the stack and focus falls to the next window', () => {
    const a = wm.open({ appId: 'a', title: 'A' });
    const b = wm.open({ appId: 'b', title: 'B' });
    wm.close(b.id);
    expect(wm.get(b.id)).toBeUndefined();
    expect(wm.focused()?.id).toBe(a.id);
    wm.close('nope'); // no-op
    expect(wm.list()).toHaveLength(1);
  });

  it('cycle brings the bottom visible window to the top', () => {
    const a = wm.open({ appId: 'a', title: 'A' });
    wm.open({ appId: 'b', title: 'B' });
    wm.open({ appId: 'c', title: 'C' });
    wm.cycle();
    expect(wm.focused()?.id).toBe(a.id);
  });

  it('keeps maximized windows fitted when the viewport changes', () => {
    const a = wm.open({ appId: 'a', title: 'A' });
    wm.toggleMaximize(a.id);
    wm.setViewport({ w: 375, h: 700, bottomInset: 0 });
    expect(wm.get(a.id)).toMatchObject({ w: 375, h: 700 });
  });

  it('emits change events', () => {
    let n = 0;
    wm.onChange(() => n++);
    const a = wm.open({ appId: 'a', title: 'A' });
    wm.moveBy(a.id, 10, 10);
    expect(n).toBe(2);
  });
});

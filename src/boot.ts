/**
 * Boot sequence: ~2,000 glitter particles fly in from a ring and settle into
 * the logotype (sampled from text rasterised to an offscreen canvas), while a
 * row of bangles fills like a progress bar. Damped spring per particle:
 *   v ← (v + k·(target − p)) · damping,  p ← p + v     (k = 0.045, damping = 0.86)
 * Any key or click skips. Reduced motion → a short static title card.
 */

import { audio } from './lib/audio';

const MESSAGES = ['Weaving zari threads…', 'Tuning tanpura to C#…', 'Polishing chrome…', 'Dialing 56k modem…', 'Swagat. Welcome home.'];

export function runBoot(reduced: boolean, footer: string): Promise<void> {
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.className = 'boot';
    root.setAttribute('role', 'status');
    root.setAttribute('aria-label', 'KHIDKI 2004 is starting');
    root.innerHTML = `<canvas aria-hidden="true"></canvas>
      <div class="boot__ui"><div class="boot__bar">${'<i></i>'.repeat(8)}</div>
      <div class="boot__msg" aria-live="polite"></div>
      <button class="boot__skip">Press any key to skip</button></div>
      <p class="boot__foot">${footer}</p>`;
    document.body.append(root);
    const canvas = root.querySelector('canvas')!;
    const g = canvas.getContext('2d')!;
    const bangles = [...root.querySelectorAll<HTMLElement>('.boot__bar i')];
    const msg = root.querySelector<HTMLElement>('.boot__msg')!;
    let done = false, raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf); timers.forEach(clearTimeout);
      root.classList.add('done');
      setTimeout(() => root.remove(), 600);
      removeEventListener('keydown', finish); root.removeEventListener('pointerdown', finish);
      resolve();
    };
    addEventListener('keydown', finish);
    root.addEventListener('pointerdown', finish);

    const total = reduced ? 1400 : 4200;
    bangles.forEach((b, i) => timers.push(setTimeout(() => b.classList.add('on'), (total * 0.85 * (i + 1)) / bangles.length)));
    MESSAGES.forEach((m, i) => timers.push(setTimeout(() => (msg.textContent = m), (total * 0.9 * i) / MESSAGES.length)));
    timers.push(setTimeout(finish, total));

    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = innerWidth, H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    g.scale(dpr, dpr);

    const fontsReady = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 900))]);
    void fontsReady.then(() => {
      if (done) return;
      const size = Math.min(W * 0.15, 150);
      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const o = off.getContext('2d')!;
      o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle';
      o.font = `800 ${size}px Unbounded, 'Arial Black', sans-serif`;
      o.fillText('KHIDKI', W / 2, H * 0.4);
      o.font = `${size * 0.36}px 'Tiro Devanagari Marathi', serif`;
      o.fillText('खिडकी · २००४', W / 2, H * 0.4 + size * 0.78);

      if (reduced) { // Static card: just show the rasterised title, tinted.
        g.drawImage(off, 0, 0, W, H);
        g.globalCompositeOperation = 'source-atop';
        const grad = g.createLinearGradient(0, H * 0.3, 0, H * 0.6);
        grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.5, '#ff7cc0'); grad.addColorStop(1, '#cfd4de');
        g.fillStyle = grad; g.fillRect(0, 0, W, H);
        return;
      }

      const data = o.getImageData(0, 0, W, H).data;
      const gap = Math.max(3, Math.round(size / 26));
      const targets: [number, number][] = [];
      for (let y = 0; y < H; y += gap) for (let x = 0; x < W; x += gap) if (data[(y * W + x) * 4 + 3] > 140) targets.push([x, y]);
      const step = Math.max(1, Math.ceil(targets.length / 3200));
      const palette = ['#ffffff', '#ffd1e8', '#ff4fa3', '#e2007a', '#f4e1bf', '#cfd4de'];
      const ps = targets.filter((_, i) => i % step === 0).map(([tx, ty]) => {
        const a = Math.random() * Math.PI * 2, r = Math.max(W, H) * (0.6 + Math.random() * 0.4);
        return { x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r, vx: 0, vy: 0, tx, ty,
          c: palette[Math.min(palette.length - 1, Math.floor(((ty - H * 0.3) / (H * 0.3)) * palette.length + Math.random() * 1.5))] ?? '#fff',
          s: 0.6 + Math.random() * 1.4, ph: Math.random() * 6.28, delay: Math.random() * 500 };
      });
      try { audio.ui('boot'); } catch { /* autoplay may block; silence is fine */ }
      const t0 = performance.now();
      let prev = t0;
      const frame = (now: number) => {
        const t = now - t0;
        // Fixed 60 Hz physics substeps so slow devices still converge on time.
        const sub = Math.min(4, Math.max(1, Math.round((now - prev) / 16.7)));
        prev = now;
        const sheenX = t > 1700 ? ((t - 1700) / 1300) * (W * 1.4) - W * 0.2 : null;
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = 'rgba(7, 2, 10, 0.28)';
        g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = 'lighter';
        for (const p of ps) {
          if (t > p.delay) for (let k = 0; k < sub; k++) {
            p.vx = (p.vx + (p.tx - p.x) * 0.045) * 0.86;
            p.vy = (p.vy + (p.ty - p.y) * 0.045) * 0.86;
            p.x += p.vx; p.y += p.vy;
          }
          const tw = 0.55 + 0.45 * Math.sin(t / 140 + p.ph);
          // Chrome sheen: a slanted band of light sweeps across once the type has formed.
          const lit = sheenX !== null && Math.abs(p.x - sheenX - (p.y - H / 2) * 0.45) < 46;
          g.globalAlpha = lit ? 1 : tw;
          g.fillStyle = lit ? '#ffffff' : p.c;
          g.fillRect(p.x, p.y, p.s * gap * 0.55, p.s * gap * 0.55);
        }
        g.globalAlpha = 1;
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    });
  });
}

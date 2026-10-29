# KHIDKI 2004 — Architecture

## Stack

TypeScript (strict) + Vite, no UI framework. WebGL 1 for the wallpaper, Canvas 2D for boot and visualiser, Web Audio for all sound, SVG for icons. Vitest + jsdom for unit tests; Python Playwright for end-to-end checks. Deployed as a static site from `docs/` on GitHub Pages.

## Structure

```
index.html            fonts, wallpaper canvas, module entry
src/main.ts           composition root: storage → settings → wallpaper → boot → shell
src/boot.ts           particle logotype, progress bangles, skip handling
src/shell.ts          renders the WindowManager model: windows, taskbar, start menu, launcher, shortcuts
src/lib/
  windowManager.ts    pure window state machine (geometry, z-order, focus, min/max)
  storage.ts          KV interface, localStorage adapter with memory fallback, versioned JSON Store
  diary.ts            Diary model, tokenizer, BM25, highlighter
  board.ts            scrapbook model in normalised coordinates
  music.ts            talas, raga note sets, theka → grid, seeded Markov melody
  audio.ts            AudioEngine: UI bells, drum voices, pluck, tanpura; master compressor + analyser
  wallpaper.ts        GLSL shader + adaptive render loop
  settings.ts         themes, wallpapers, preferences store, reduced-motion resolution
  icons.ts            SVG icon and sticker generators
src/apps/             diary · taal · scrapbook · system (settings, about) — each an AppDef with mount()
src/styles/main.css   design tokens and shell styles; app CSS lives beside each app
tests/                unit tests for lib modules
```

## Data flow

```
user input ──► app / shell handler ──► model method (WindowManager, Diary, Board, SettingsStore)
                                         │                     │
                                         ▼                     ▼
                                    onChange listeners     Store.write → localStorage
                                         │
                                         ▼
                                 render (DOM reflects model)
```

- **WindowManager** owns geometry and stacking. The shell never stores positions; on every change it writes `transform`, size and `z-index = 100 + stack index`. The taskbar is rebuilt only when its signature (ids, minimised, focused) changes, so dragging does not churn the DOM.
- **Apps** implement `AppDef.mount(root, ctx) → cleanup`. `ctx` exposes storage, settings, toast, open-app and reduced-motion. Cleanup flushes pending saves and stops audio / animation frames.
- **SettingsStore** broadcasts changes; `main.ts` applies the theme (`data-theme` on `<html>`), shader palette and mode, reduced-motion class and sound flag.

## Rendering

- **Wallpaper:** one full-screen triangle; fragment shader branches on `uMode`. Render scale starts at `0.7 × min(dpr, 1.5)` and is adjusted every 90 frames from an exponential moving average of frame time. Paused when the tab is hidden and while the opaque boot screen is up; falls back to a CSS gradient if WebGL is unavailable or the context is lost.
- **Windows:** absolutely positioned `<section role="dialog">` elements with CSS backdrop blur. App layouts respond to *their window's* width with CSS container queries, so a narrow window on a desktop behaves like a phone.
- **Phone mode (≤ 720px):** CSS turns windows into full-screen sheets and shows the launcher; the WindowManager runs with no taskbar inset and maximises on open.

## Audio

Lazily created `AudioContext` (resumed on first gesture). Graph: voices → master gain → compressor → analyser → destination. TAAL.FM schedules half-beat steps with a 25 ms timer and 120 ms look-ahead on the audio clock; the playhead UI reads a queue of scheduled step times in `requestAnimationFrame`, so visuals follow audio time, not timer time.

## Storage

Keys are namespaced `khidki2004:*` and wrapped as `{ v, data }`. Unknown versions or corrupt JSON fall back to defaults. If localStorage throws, an in-memory KV is used and the UI warns that work will not persist. "Erase all" in settings clears every key.

## Security & privacy

No network calls besides Google Fonts. All user text rendered into HTML passes through `escapeHtml` (the highlighter escapes each segment separately so search terms can never form entities or tags).

## Accessibility

Roles and labels on desktop (listbox of icons), windows (dialog), start menu (menu), sequencer (grid), diary list (listbox), toggles (`aria-pressed` / `aria-checked`). Keyboard: global Alt shortcuts, arrow navigation in icons, menu, diary list, sequencer and scrapbook; title-bar move/resize with arrows. Visible focus rings in the accent colour.

## Testing strategy

- **Unit (Vitest):** window manager behaviour (stacking, singleton, min/max, clamping, resize limits, cycle, viewport), storage versioning and fallback, settings persistence, board model (clamp, rotate wrap, scale bounds, z normalisation, seed/reset), tokenizer (incl. Devanagari), BM25 ranking/IDF/prefix, highlight escaping, tala grids, melody determinism, scale membership and stepwise motion, PRNG and weighted sampling.
- **End-to-end (Playwright, Python):** built site served locally at 1280×800 and 375×812; scripted flows across all apps; console errors captured; screenshots reviewed.

## Deployment

`npm run build` removes the previous `docs/assets` + `docs/index.html`, type-checks, and builds with `base: '/khidki-2004/'` into `docs/` (hand-written docs and screenshots are kept). GitHub Pages serves `main` → `/docs`.

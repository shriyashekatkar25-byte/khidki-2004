# KHIDKI 2004 — Art direction

## Creative thesis

A desktop from a parallel 2004 in which the personal computer was designed in Maharashtra: glossy, romantic and a little theatrical, like a film's title sequence, but disciplined like a good tool. Nostalgia is the *material*, not the subject — every chrome bevel and glitter fleck sits on top of software that really works.

## Moodboard (described)

- Chrome lettering and lacquered pink plastic of early-2000s gadgets; flip phones; CD faces with rainbow sheen.
- Woven Paithani borders: peacocks in profile, lotus, gold zari outlines on deep purple and green.
- Monsoon evenings seen through a rain-streaked window, city lights out of focus.
- Rangoli at a threshold — drawn ring by ring outward from the centre, dots first.
- Glitter title cards; the slow sweep of light over metallic type.

## Colour tokens

| Token | Rani Chrome | Monsoon Modem | Paithani Midnight |
|---|---|---|---|
| `--night` | `#1a0614` | `#071a2b` | `#12071f` |
| `--ink` (body text) | `#2a0e25` | `#10233a` | `#1d0f2a` |
| `--ink-soft` | `#6b3a5c` | `#3b5068` | `#5c4a63` |
| `--pearl` (surfaces) | `#fff4f8` | `#eef9ff` | `#fbf3e4` |
| `--accent` | `#e2007a` | `#0fb5c2` | `#7a3bb0` |
| `--accent-strong` (text-bearing fills) | `#c2006a` | `#0b7280` | `#5b2a86` |
| `--accent-2` | `#b5122f` | `#6d4fd6` | `#0f7b5f` |
| `--gold` | `#f4e1bf` | `#c9b8ff` | `#e0b44a` |

**Contrast (WCAG 2.1, computed):** ink on pearl 16.4:1 / 14.8:1 / 16.5:1; ink-soft on pearl 8.2:1 / 7.8:1 / 7.3:1; white on accent-strong 6.0:1 / 5.6:1 / 9.9:1; white on emerald `#0f7b5f` 5.2:1. All text pairs pass AA. Plain `--accent` is used only for non-text fills, outlines and glows.

## Typography

- **Unbounded** (geometric, wide) — UI chrome, labels, the KHIDKI wordmark. Weights 600–800.
- **Bodoni Moda** (high-contrast didone, italic) — editorial voice: diary pages, blurbs, the welcome text. The fashion-magazine half of the brand.
- **VT323** (pixel) — clocks, dates, seeds, readouts: the 2004 machine voice, used sparingly.
- **Tiro Devanagari Marathi** — every Devanagari string. Chosen because it is drawn for Marathi orthography, and set at ~1.15× the Latin size so the two scripts feel equal.

## Composition

Icons in a left column; the wordmark anchored bottom-right like a film's end-card; windows open slightly up-and-left of centre and cascade. Inside apps: one dominant surface (paper, grid, board) and one thin control rail. On phones: a centred hero, a 3-column icon grid and full-screen sheets.

## Interaction philosophy

Direct manipulation everywhere (drag windows, drag stickers, toggle steps), with a keyboard path for each. Destructive actions are two-step buttons, never browser dialogs. Everything saves automatically and says so quietly ("saved ✓").

## Motion

- Easing: `--ease-out` `cubic-bezier(.22,1,.36,1)` for UI; `--ease-spring` `cubic-bezier(.34,1.56,.64,1)` for things that "pop" (windows opening, icons on hover, stickers).
- Timing: 140 ms (hover, press), 280 ms (window open, menus), 520 ms (fades).
- Windows grow from their bottom edge (towards the taskbar), shrink when closing.
- Reduced motion (OS setting or in-app choice): the wallpaper renders one still frame; the boot becomes a 1.4 s static card; CSS animations collapse to 1 ms.

## Graphic assets

All original code: 6 app icons and 12 stickers as SVG with shared gradients (chrome, candy pink, cherry, zari gold, turquoise, Paithani purple, emerald) and a 1.5 px plum outline; the WebGL wallpaper; the Canvas boot and visualiser. No bitmaps ship with the app.

## Sound

One family of glassy bells (sine + inharmonic partials at 2.76× and 5.4×), tuned to the same Sa (C#) as TAAL.FM. Open rises (Pa → Sa'), close falls, errors use a semitone (Re komal → Sa). Can be switched off from the tray or settings.

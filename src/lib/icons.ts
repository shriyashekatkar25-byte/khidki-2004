/**
 * Original SVG icon + sticker set, drawn by hand in code.
 * Shared language: chrome (silver gradient + hard white specular), candy gloss
 * (a white ellipse highlight at 45% opacity across the top third) and a 1.5px
 * plum outline so icons read on any wallpaper.
 * Gradient ids are made unique per call so many copies can share a page.
 */

let uid = 0;
const OUT = '#3a0a26';

function defs(id: string) {
  return `<defs>
    <linearGradient id="chr${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#c9ced8"/>
      <stop offset=".55" stop-color="#8d93a3"/><stop offset="1" stop-color="#eef0f5"/></linearGradient>
    <linearGradient id="pk${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff7cc0"/><stop offset=".6" stop-color="#e2007a"/><stop offset="1" stop-color="#9b0052"/></linearGradient>
    <linearGradient id="rd${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff5a6e"/><stop offset="1" stop-color="#a50e2b"/></linearGradient>
    <linearGradient id="gd${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff1c4"/><stop offset=".5" stop-color="#e0b44a"/><stop offset="1" stop-color="#9a6b12"/></linearGradient>
    <linearGradient id="tq${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9ff3f5"/><stop offset="1" stop-color="#0b8f9c"/></linearGradient>
    <linearGradient id="pp${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a86ad6"/><stop offset="1" stop-color="#3f1864"/></linearGradient>
    <linearGradient id="em${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#53d1a4"/><stop offset="1" stop-color="#0b5e48"/></linearGradient>
  </defs>`;
}

const gloss = (cx: number, cy: number, rx: number, ry: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".45"/>`;

type Draw = (i: string) => string;

const ICONS: Record<string, Draw> = {
  // Diary: a padded pink book with a chrome heart clasp.
  diary: (i) => `
    <rect x="12" y="8" width="40" height="50" rx="6" fill="url(#pk${i})" stroke="${OUT}" stroke-width="1.5"/>
    <rect x="12" y="8" width="7" height="50" rx="3" fill="#9b0052" opacity=".6"/>
    <path d="M24 16h22M24 21h16" stroke="#ffd0e8" stroke-width="2" stroke-linecap="round" opacity=".8"/>
    <rect x="44" y="28" width="12" height="12" rx="3" fill="url(#chr${i})" stroke="${OUT}" stroke-width="1.2"/>
    <path d="M36 40c-5-4-9-7-9-11a4 4 0 0 1 9-1.5A4 4 0 0 1 45 29c0 4-4 7-9 11z" fill="url(#chr${i})" stroke="${OUT}" stroke-width="1.2"/>
    ${gloss(31, 15, 15, 4)}`,
  // TAAL.FM: a glossy CD with a tabla-skin centre (the black syahi dot).
  taal: (i) => `
    <circle cx="32" cy="32" r="25" fill="url(#chr${i})" stroke="${OUT}" stroke-width="1.5"/>
    <circle cx="32" cy="32" r="25" fill="url(#tq${i})" opacity=".35"/>
    <path d="M32 7a25 25 0 0 1 22 13" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>
    <path d="M10 42a25 25 0 0 0 10 10" stroke="#ff7cc0" stroke-width="3" fill="none" opacity=".7"/>
    <circle cx="32" cy="32" r="10" fill="#f4e1bf" stroke="${OUT}" stroke-width="1.2"/>
    <circle cx="32" cy="32" r="5" fill="#2a0e25"/><circle cx="30.5" cy="30.5" r="1.4" fill="#fff" opacity=".7"/>`,
  // Scrapbook: polaroid with a butterfly sticker and washi tape.
  board: (i) => `
    <rect x="10" y="12" width="40" height="44" rx="2" fill="#fff8fb" stroke="${OUT}" stroke-width="1.5" transform="rotate(-6 30 34)"/>
    <rect x="15" y="16" width="30" height="27" fill="url(#pp${i})" transform="rotate(-6 30 34)"/>
    <rect x="22" y="7" width="20" height="8" fill="#9ff3f5" opacity=".85" transform="rotate(8 32 11)"/>
    <g transform="translate(30 30) rotate(-6)">
      <path d="M0 0C-8-10-15-6-12 2-9 7-3 5 0 0zM0 0C8-10 15-6 12 2 9 7 3 5 0 0z" fill="url(#pk${i})" stroke="${OUT}" stroke-width="1"/>
      <path d="M0 0c-6 5-8 10-4 11 2 0 3-4 4-11zM0 0c6 5 8 10 4 11-2 0-3-4-4-11z" fill="#f4e1bf" stroke="${OUT}" stroke-width="1"/>
    </g>
    <path d="M50 44l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="url(#gd${i})" stroke="${OUT}" stroke-width=".8"/>`,
  // Settings: chrome gear around a crescent (chandrakor).
  settings: (i) => `
    <g stroke="${OUT}" stroke-width="1.5">
      <path d="M32 6l4 6 7-2 1 7 7 2-3 6 5 5-6 4 2 7-7 1-2 7-6-3-5 5-4-6-7 2-1-7-7-2 3-6-5-5 6-4-2-7 7-1 2-7 6 3z" fill="url(#chr${i})"/>
      <circle cx="32" cy="32" r="12" fill="url(#pk${i})"/>
    </g>
    <path d="M36 25a8 8 0 1 0 0 14 6.5 6.5 0 1 1 0-14z" fill="#f4e1bf"/>
    ${gloss(28, 16, 10, 3)}`,
  // About: a glossy chrome star "info" badge.
  about: (i) => `
    <path d="M32 5l7.5 15.5 17 2.3-12.4 12 3 16.9L32 43.6l-15.1 8.1 3-16.9-12.4-12 17-2.3z" fill="url(#gd${i})" stroke="${OUT}" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="32" cy="22" r="2.6" fill="${OUT}"/><rect x="29.6" y="27" width="4.8" height="13" rx="2.4" fill="${OUT}"/>
    ${gloss(30, 15, 9, 3)}`,
  // Shut down: chrome power bead.
  power: (i) => `
    <circle cx="32" cy="32" r="24" fill="url(#rd${i})" stroke="${OUT}" stroke-width="1.5"/>
    <path d="M24 22a14 14 0 1 0 16 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M32 16v14" stroke="#fff" stroke-width="4" stroke-linecap="round"/>${gloss(32, 18, 14, 5)}`,
};

/** Stickers for the scrapbook. */
const STICKERS: Record<string, Draw> = {
  butterfly: (i) => `
    <path d="M32 32C18 8 2 16 8 30c4 9 16 8 24 2zM32 32C46 8 62 16 56 30c-4 9-16 8-24 2z" fill="url(#pk${i})" stroke="${OUT}" stroke-width="1.5"/>
    <path d="M32 32c-12 6-16 18-8 20 4 1 7-6 8-20zM32 32c12 6 16 18 8 20-4 1-7-6-8-20z" fill="url(#tq${i})" stroke="${OUT}" stroke-width="1.5"/>
    <circle cx="18" cy="24" r="3" fill="#fff" opacity=".7"/><circle cx="46" cy="24" r="3" fill="#fff" opacity=".7"/>
    <path d="M32 20v26" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/>`,
  star: (i) => `<path d="M32 4l7.5 17 18.5 2-14 12.5 4 18.5L32 44.5 16 54l4-18.5L6 23l18.5-2z" fill="url(#chr${i})" stroke="${OUT}" stroke-width="1.5" stroke-linejoin="round"/>${gloss(30, 18, 10, 4)}`,
  heart: (i) => `<path d="M32 56C14 42 6 32 6 21a12 12 0 0 1 26-6 12 12 0 0 1 26 6c0 11-8 21-26 35z" fill="url(#rd${i})" stroke="${OUT}" stroke-width="1.5"/>${gloss(20, 18, 7, 4)}${gloss(44, 18, 7, 4)}`,
  chandrakor: (i) => `<path d="M40 8a25 25 0 1 0 0 48 20 20 0 1 1 0-48z" fill="url(#gd${i})" stroke="${OUT}" stroke-width="1.5"/><circle cx="46" cy="18" r="2" fill="#fff"/><circle cx="52" cy="30" r="1.4" fill="#fff"/>`,
  // Nath: the Maharashtrian nose ring — a paisley-curved hoop dressed with pearls around a stone.
  nath: (i) => `
    <path d="M14 40C10 22 26 8 42 12c10 3 12 14 6 20" fill="none" stroke="url(#gd${i})" stroke-width="5" stroke-linecap="round"/>
    ${[[14, 40], [12, 30], [16, 21], [23, 14], [32, 11], [41, 12], [48, 18], [50, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fffaf0" stroke="${OUT}" stroke-width=".8"/>`).join('')}
    <path d="M26 30l6-6 6 6-6 6z" fill="url(#pk${i})" stroke="${OUT}" stroke-width="1"/>
    <circle cx="20" cy="45" r="2.4" fill="url(#em${i})" stroke="${OUT}" stroke-width=".8"/>
    <circle cx="32" cy="42" r="2.4" fill="#fffaf0" stroke="${OUT}" stroke-width=".8"/>`,
  bangles: (i) => [0, 1, 2, 3, 4].map((k) => `<ellipse cx="32" cy="${18 + k * 7}" rx="22" ry="7" fill="none" stroke="url(#${['pk', 'gd', 'em', 'gd', 'rd'][k]}${i})" stroke-width="4.5"/>`).join('') + gloss(24, 16, 8, 2),
  cassette: (i) => `
    <rect x="6" y="14" width="52" height="36" rx="4" fill="url(#pp${i})" stroke="${OUT}" stroke-width="1.5"/>
    <rect x="12" y="19" width="40" height="11" rx="2" fill="#f4e1bf"/>
    <text x="32" y="27.5" font-size="7" text-anchor="middle" font-family="VT323, monospace" fill="${OUT}">MIX '04</text>
    <rect x="16" y="33" width="32" height="11" rx="5" fill="#2a0e25"/>
    <circle cx="23" cy="38.5" r="3.5" fill="url(#chr${i})"/><circle cx="41" cy="38.5" r="3.5" fill="url(#chr${i})"/>`,
  // Mor (peacock), stylised the way woven Paithani borders simplify it: profile, crest, scrolled tail.
  peacock: (i) => `
    <path d="M30 50c-12 0-20-8-18-18 2-8 10-10 14-6" fill="none" stroke="url(#em${i})" stroke-width="5" stroke-linecap="round"/>
    <path d="M26 26c4-8 14-8 16 0 2 8-4 14-12 14" fill="url(#tq${i})" stroke="${OUT}" stroke-width="1.5"/>
    <path d="M40 26c2-6 2-12 6-16" stroke="url(#tq${i})" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="46" cy="10" r="3" fill="url(#gd${i})"/><circle cx="42" cy="7" r="2" fill="url(#gd${i})"/><circle cx="49" cy="14" r="2" fill="url(#gd${i})"/>
    <circle cx="44" cy="20" r="1.5" fill="${OUT}"/><path d="M47 22l5 1-5 1z" fill="url(#gd${i})"/>
    ${[[14, 44], [12, 34], [20, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="url(#gd${i})" stroke="${OUT}" stroke-width=".8"/><circle cx="${x}" cy="${y}" r="1.6" fill="url(#pp${i})"/>`).join('')}`,
  lotus: (i) => `
    <path d="M32 50C20 44 16 30 32 12c16 18 12 32 0 38z" fill="url(#pk${i})" stroke="${OUT}" stroke-width="1.5"/>
    <path d="M32 50C18 50 6 40 8 26c12 4 20 12 24 24zM32 50c14 0 26-10 24-24-12 4-20 12-24 24z" fill="url(#pk${i})" stroke="${OUT}" stroke-width="1.5" opacity=".9"/>
    <path d="M14 54h36" stroke="url(#em${i})" stroke-width="4" stroke-linecap="round"/>`,
  flipphone: (i) => `
    <rect x="18" y="4" width="28" height="26" rx="6" fill="url(#chr${i})" stroke="${OUT}" stroke-width="1.5"/>
    <rect x="23" y="9" width="18" height="15" rx="2" fill="url(#tq${i})"/>
    <rect x="18" y="32" width="28" height="28" rx="6" fill="url(#pk${i})" stroke="${OUT}" stroke-width="1.5"/>
    ${[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => `<rect x="${23 + c * 7}" y="${37 + r * 7}" width="5" height="4" rx="1.5" fill="#fff" opacity=".8"/>`)).join('')}
    ${gloss(32, 8, 10, 2)}`,
  // Kairi (mango) — the buta shape found across Indian textiles.
  kairi: (i) => `
    <path d="M40 8c14 10 16 34-2 44-14 8-30 0-28-14 2-12 18-10 20-20 1-4 0-8 10-10z" fill="url(#em${i})" stroke="${OUT}" stroke-width="1.5"/>
    <path d="M38 14c8 8 10 26-4 32-10 4-20-2-18-10" fill="none" stroke="url(#gd${i})" stroke-width="2.5"/>
    <circle cx="30" cy="34" r="4" fill="url(#gd${i})"/>`,
  sparkle: (i) => `<path d="M32 2c3 20 10 27 30 30-20 3-27 10-30 30-3-20-10-27-30-30 20-3 27-10 30-30z" fill="url(#chr${i})" stroke="${OUT}" stroke-width="1.5"/>`,
};

export const STICKER_IDS = Object.keys(STICKERS);
export const STICKER_LABELS: Record<string, string> = {
  butterfly: 'Butterfly', star: 'Chrome star', heart: 'Candy heart', chandrakor: 'Chandrakor (crescent)',
  nath: 'Nath (nose ring)', bangles: 'Bangles', cassette: "Mixtape '04", peacock: 'Mor (peacock)',
  lotus: 'Lotus', flipphone: 'Flip phone', kairi: 'Kairi (mango buta)', sparkle: 'Sparkle',
};

function wrap(body: Draw, size: number, label: string) {
  const i = `k${++uid}`;
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${defs(i)}${body(i)}</svg>`;
}

export const icon = (name: string, size = 48) => wrap(ICONS[name] ?? ICONS.about, size, name);
export const sticker = (name: string, size = 64) => wrap(STICKERS[name] ?? STICKERS.star, size, STICKER_LABELS[name] ?? name);

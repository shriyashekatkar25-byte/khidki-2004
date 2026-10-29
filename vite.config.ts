import { defineConfig } from 'vite';

// GitHub Pages serves the site from /<repo>/ and from the docs/ folder on main.
// emptyOutDir is false because docs/ also holds DESIGN.md, ARCHITECTURE.md and
// screenshots; scripts-clean.mjs removes only the previous build output.
export default defineConfig({
  base: '/khidki-2004/',
  build: { outDir: 'docs', emptyOutDir: false, assetsDir: 'assets', target: 'es2020' },
  test: { environment: 'jsdom', include: ['tests/**/*.test.ts'] },
} as any);

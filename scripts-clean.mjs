// Removes the previous Vite build from docs/ without touching hand-written docs.
import { rmSync } from 'node:fs';
rmSync('docs/assets', { recursive: true, force: true });
rmSync('docs/index.html', { force: true });

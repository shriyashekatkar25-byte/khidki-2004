# Case study · KHIDKI 2004

## The question

What would a personal computer have felt like if it had been designed in Mumbai or Pune in 2004 — for a twenty-year-old who kept a diary in a locked folder, burned mixtapes, and decorated everything in rani pink — and then quietly kept being maintained, with today's engineering, for twenty more years?

It is half artistic question, half product question: **can nostalgia be a working interface rather than a costume?** Most "Y2K" web projects are screenshots of an aesthetic. KHIDKI tries to be a place you can actually *use*: write, make rhythm, arrange a moodboard.

## User and need

- **Primary:** people who grew up on the early-2000s South Asian internet (cybercafés, Orkut-era scrapbooks, ringtone charts) and want a private, playful space to write and make things — without an account or a feed.
- **Secondary:** recruiters, hiring managers and design peers evaluating Shriya's range: systems engineering, interaction design, algorithms, cultural fluency.

The need underneath: a **private creative space with personality.** Mainstream note apps are neutral and cloud-first; social apps are public by default. KHIDKI is local-only by design.

## Value proposition

A complete, delightful, private desktop in a browser tab: a diary that never leaves your device, a rhythm toy that teaches you what a theka is by letting you poke at one, and a scrapbook that remembers your arrangement.

## Differentiation

- **Not a clone.** No existing OS chrome, icons or wallpapers. The visual language (capsule chrome buttons, plum outlines, champagne/rani palette, Devanagari as a co-equal script) is original.
- **Culturally specific, not decorative.** Marathi names that mean what the apps do; tabla thekas and raga note sets used correctly and labelled honestly; the nath, kairi and Paithani-style peacock appear as stickers a user chooses, not as ornament stamped on everything.
- **Real computation.** Ranking, synthesis, scheduling, procedural graphics and state management all run in the browser and are tested.

## Core workflow

1. Boot (skippable) → desktop with *Swagat* welcome on first visit.
2. Open **Dainandini**, write a page; it autosaves. Tag it, pick a mood. Search later — results rank by relevance as you type.
3. Open **TAAL.FM**, press play: Keherwa at 96 bpm with a tanpura drone and a generated melody. Toggle steps, switch tala or raga, reseed.
4. Arrange **Aathavani** — drag stickers and notes, rotate, layer.
5. Change the mood of the whole machine in **Rangroop** (theme + wallpaper).
6. On a phone, the same apps open as full-screen sheets from a launcher.

## Technical moat (what is hard here)

- **A window manager as a pure state machine** with an explicit stacking order, clamping, singleton apps, maximise/restore geometry and viewport changes — tested independently of the DOM (11 tests).
- **BM25 search** with field boosting, prefix matching on the last term and a Unicode-aware tokenizer that keeps Devanagari vowel signs attached, plus an XSS-safe highlighter (12 tests).
- **Sample-accurate rhythm** using look-ahead scheduling on the AudioContext clock, and an all-synthesised drum/drone/pluck palette.
- **One fragment shader, three worlds**: domain-warped fbm silk with normals and iridescence; an analytically drawn rangoli mandala with anti-aliased rings; lensing raindrops. Adaptive resolution keeps it smooth.

## Creative decisions

- **Window = khidki.** The OS's name is the literal Marathi word for its core metaphor, which also avoids using anyone's trademark.
- **One sound family.** All UI sounds are glassy bells tuned to the same Sa (C#) as TAAL.FM, so the computer and its music share a key.
- **Two scripts, one hierarchy.** Every app title carries its Devanagari name at equal visual weight to the Latin, set in Tiro Devanagari Marathi — not as a subtitle in a fallback font.
- **Glitter with discipline.** Sparkle lives in the shader and the boot only; working surfaces (diary paper, sequencer) are calm and high-contrast.

## Engineering trade-offs and exclusions

- **No framework.** The UI is small and event-driven; vanilla TypeScript keeps the bundle at ~27 kB gzipped and makes rendering order explicit. The cost is more manual DOM code.
- **localStorage over IndexedDB.** Data volume is tiny (text + coordinates); synchronous reads simplify boot. A storage adapter keeps IndexedDB a drop-in later. Falls back to memory with a visible warning if storage is blocked.
- **No LLM.** Nothing here needs one. The "intelligence" is classical: probabilistic ranking (BM25) and a Markov melody. Excluded: AI journaling prompts, which would require sending private diary text to a server.
- **No samples or songs.** Every sound is synthesised, so there are no licensing questions and the bundle stays small. Trade-off: the tabla is an impression, not a recording.
- **Excluded for scope:** file explorer, multiple diary notebooks, export/import, multi-touch rotate.

## Statistical / algorithmic logic

- **BM25:** `score = Σ IDF(q) · f(q,D)(k1+1) / (f(q,D) + k1(1 − b + b|D|/avgdl))`, with `k1 = 1.4`, `b = 0.75`, title tokens counted twice. The UI shows each result's score so the ranking is inspectable.
- **Markov melody:** transition weight `exp(−|i−j|/1.3) · (1 + 2.5·home·strong) · (repeat ? 0.35 : 1)` over two octaves of the raga's notes; `home` marks Sa/Pa, `strong` marks vibhag starts; the cycle resolves on Sa. Seeded PRNG (mulberry32) makes melodies reproducible. Tests check scale membership over 300 generated melodies and that the mean leap stays below two scale degrees.
- **Adaptive rendering:** rolling frame-time average (EMA, α = 0.05) moves the shader's render scale between 0.35× and 1×.

## Proposed metrics (none collected — no analytics are installed)

If this were a product, I would want to learn:
- *Activation:* share of first visits that create a diary page or press Play within 3 minutes.
- *Return:* share of browsers with data that come back within 7 days (measurable only with consent; locally countable).
- *Depth:* pages per returning user; sequencer edits per session; theme changes.
- *Quality:* search success (a result clicked after a query); frame time p95 on low-end devices.

## Limitations

- Data lives in one browser; clearing site data deletes it. No sync, no backup (yet).
- The tabla voices are synthetic approximations; ragas are represented by note sets only.
- Tested in headless Chromium only; Safari's Web Audio and backdrop-filter behaviour not verified.
- Screen-reader support is designed in (roles, labels, keyboard paths) but not audited with real assistive technology.

## Roadmap

1. Export/import a `.khidki` backup file; optional encrypted sync.
2. IndexedDB storage + multiple notebooks.
3. TAAL.FM: more talas (Rupak, Jhaptaal), per-step velocity, raga *pakad* phrases as melodic constraints.
4. A "Cybercafé" app: a fictional 2004 web browser with an original, procedurally generated early web.
5. Accessibility audit with NVDA/VoiceOver; high-contrast theme.

---

Original work by Shriya Shekatkar · SHRIYA.EXE · Synthetic or demo data is labeled as such. Not affiliated with any film, studio or company. · [Studio gallery](https://shriyashekatkar25-byte.github.io/shriya-exe/)

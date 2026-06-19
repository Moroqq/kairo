# Kairo Design System

> Terminal-first task management. Black ground, neon-green code, monospace everything.

Kairo (Russian-language UI) is a personal task manager that dresses everyday productivity — kanban board, daily focus, ruled-paper to-do "листок", calendar, expenses, logs — in a **Matrix-terminal aesthetic**: a falling code-rain backdrop, scanline vignette, neon glow, sharp corners and one monospace typeface. It ships **8 swappable themes** that change both the palette *and* the interface's vocabulary, ranging from the hacker-green default to a soft cream "Claude" mode.

This design system extracts Kairo's foundations, components and a full app recreation so you can design new Kairo surfaces — screens, slides, mocks, marketing — that look and read exactly like the product.

The tagline, verbatim from the app: **«терминал для управления задачами»** (a terminal for managing tasks).

---

## Sources

Built by reading the product's own source. Explore these to go deeper:

- **App codebase** — GitHub: [`Moroqq/kairo`](https://github.com/Moroqq/kairo) (React + Vite + Tauri desktop PWA; Supabase backend; Anthropic SDK for AI task capture; `framer-motion`, `lucide-react`, `@dnd-kit`, `zustand`). Key files lifted: `src/styles/globals.css`, `src/themes/themes.ts`, `src/components/ui/*`, `src/components/layout/*`, `src/components/board/*`, `src/components/task/*`, `public/logo.png`, `promo/src/components/LogoK.tsx`.

Access requires permission from the repo owner; nothing here assumes the reader has it.

---

## Content fundamentals

How Kairo writes. Match this voice in any new copy.

- **Language: Russian, lowercase.** Almost all UI copy is lowercase Russian — `новая задача`, `поиск задач...`, `дописать…`, `перенести незавершённое`. Capitalization is reserved for column headers and the wordmark.
- **Terminal lexicon.** The UI talks like a shell. Commands in the sidebar are prefixed `$ ` (`$ focus`, `$ board`). Empty states are comments: `// пусто`. Drop hints are prompts: `> бросьте сюда`. Status/results come in brackets: `[ок]`, `[ошибка]`, `[инфо]`, `[error]`. The titlebar is a literal prompt: `[kairo@matrix:~]$ task_manager --status=работает`.
- **Numbers are padded & bracketed.** Counts read like registers: column badges `[02]`, status-bar totals `003`. This monospace zero-padding is a signature — keep it.
- **Uppercase for structure only.** Column names and section labels go UPPERCASE with wide tracking: `ОЧЕРЕДЬ`, `АКТИВНЫЕ`, `БЛОК`, `ВЫПОЛНЕНО`, `В СЕТИ`, `ПРОСРОЧЕНО`. The wordmark is `KAIRO` (tracking 2px).
- **Terse, system-voiced.** Messages are short and impersonal, as if printed by a daemon: `перенесено: 3`, `нечего переносить`, `разбор…`. No marketing fluff, no exclamation, rarely a full sentence. Neither "I" nor "you" — the system just reports.
- **Theme-aware vocabulary.** Each theme rewrites labels to fit its world. The same column is `ОЧЕРЕДЬ` (Matrix), `Backlog` (Command), `ПРИКАЗЫ` (Samurai), `Входящие` (Paper/Claude). The titlebar shifts from a shell prompt to `KAIRO 侍 — свитки приказов` to a plain `Kairo`. When you add copy, write it in the register of the active theme.
- **Emoji: none.** No emoji anywhere. "Icons" in text are ASCII/Unicode terminal glyphs — `›`, `▸`, `●`, `▊`, `$`, `+`, `✕`, `│`, `//`, `»`. Use these, not emoji.

---

## Visual foundations

- **Palette (MATRIX default).** Pure-black ground (`#000000`), barely-there surfaces stepping `#0A0A0A → #0D110D → #121A12`, recessed inputs at `#050805`. The whole UI is carried by one accent: **neon green `#00FF41`** (`--accent`). Text is a contrast pyramid of greens — `#D6F5D6` body down to `#2E5A2E` hints, with bright `#00FF41` for headings/numbers. Semantics: success green, warning `#FFD400`, danger `#FF003C`, info `#00E5FF`. Priority scale A→D = red / amber / blue / muted-green.
- **Borders, not fills.** Surfaces are defined by 1px translucent-accent borders at three weights (`rgba(0,255,65,.08/.18/.45)`), not by background contrast. Danger borders are translucent red.
- **Typography.** One family runs everything: **JetBrains Mono** (→ Fira Code → IBM Plex Mono → Consolas). No display/body split — hierarchy is size + weight + color + tracking. Dense by design: 12px base, 11px for most labels/mono, down to 9px meta; up to 22px for hero numerals. Ligatures are **off** (`font-feature-settings: "calt" 0`) for the raw terminal look. Labels run wide (tracking 1–2px, often UPPERCASE); numerals and the wordmark run tight (`-0.02em`).
- **Corners: per-theme shape.** `--radius` is the single shape knob and **each theme sets its own**: MATRIX `0px` (sharp terminal), SAMURAI `2px`, NORD `5px`, COMMAND/PAPER `6px`, OBSIDIAN `9px`, Claude/Claude Noir `10px`. It cascades to `--radius-sm` and `--radius-card`, so one value rounds buttons, inputs, cards, modals and task cards together; `--radius-pill` goes `999px` in rounded themes. Soft themes (Claude / Claude Noir) also switch `--font-ui` to a sans stack and drop the neon + matrix effects.
- **Elevation = glow, not shadow.** Cards are flat (`box-shadow: 0 0 0 1px var(--border)`). "Raised" state is a neon ring + bloom: `0 0 0 1px var(--accent), 0 0 12px var(--accent-glow)`. The big elevated shadow stacks an accent ring, a 32px green bloom and a deep black drop. Soft themes replace all of this with conventional faint drop shadows.
- **Backgrounds & texture.** The desktop is pure black overlaid with two effects: a **Matrix code-rain canvas** (`.matrix-canvas`, katakana + digits + symbols, ~24fps, `mix-blend-mode: screen`, opacity .55) and a **scanline + vignette** overlay (`repeating-linear-gradient` 2–3px + radial darkening). No gradients-as-decoration, no photography, no illustration. Soft themes drop both effects entirely.
- **Motion.** Fast and mechanical. Transitions are `160ms ease-out` (`120ms` for buttons). Signature loops: blinking cursor (`▊`, 1s steps), blinking LEDs (1.2s steps), three-dot pulse loader (`разбор…`), and a red `deadline-pulse` ring on urgent cards. Modals/drawers use framer-motion in-app (short fades/slides, 120–200ms); the recreations use plain CSS.
- **Interaction states.** *Hover* = border goes to `--accent` + glow ring + faint `--accent-dim` fill (rows tint to `rgba(0,255,65,.06)`). *Primary hover* inverts to solid green on black. *Press* = `translateY(1px)`. *Focus* = neon ring (`0 0 0 1px accent, 0 0 16px glow`); soft themes use a calm 2px dim ring. *Disabled* = 40% opacity.
- **Layout.** A windowed shell: a `bevel-raised` panel with a **terminal title bar** (● + prompt + `_ □ ✕` window buttons) holds a collapsible **sidebar** (logo + `$ command` nav, 180px → 44px), a **header** (prompt-style search `поиск »`, theme + lock buttons), a **sunken main well**, and a **status bar** (blinking `● В СЕТИ`, padded counts, live clock). Mobile swaps the sidebar for a bottom nav + FAB. Density is high; spacing rides a 4px grid; control heights are 28/32/40px with a 44px touch floor.
- **Imagery vibe.** Cool, dark, high-contrast, faintly phosphorescent — like a CRT terminal. When you need imagery, lean monochrome-green or theme-tinted with grain/scanlines rather than full-color photography.

---

## Iconography

- **System: [Lucide](https://lucide.dev)** (`lucide-react` v0.511 in-app), thin 2px stroke, square line icons — a clean match for the terminal look. Used at small sizes (10–18px), colored via `currentColor` so they inherit the accent/text token.
- **No icon font, no sprite, no bundled SVG set** in the repo — Lucide is pulled from the package. In these recreations, link Lucide from CDN (`unpkg.com/lucide@0.511.0`) and either use `lucide-react` (in React builds) or drop `<i data-lucide="name">` placeholders and call `lucide.createIcons()` (see `ui_kits/kairo/data.js`'s `Icon` helper). Keep the 2px stroke; don't substitute a filled or heavier set.
- **Common glyphs in use:** `target` (focus), `layout-dashboard` (board), `calendar-days` (plan), `notebook-pen` (листок), `bar-chart-3` (итоги), `wallet` (траты), `scroll-text` (события), plus `search`, `palette`, `lock`, `plus`, `chevron-right/left`, `check`, `x`, `clock`, `message-square`.
- **Text glyphs do real work.** Much "iconography" is typed terminal characters, not SVG: `›` field labels, `▸` column markers, `●` titlebar dot, `▊` cursor, `$`/`+`/`✕`/`│`, `//` and `>` prefixes. Prefer these for inline marks.
- **Emoji are never used.** (Theme flavor like `侍` in the Samurai titlebar is intentional CJK text, not emoji.)
- **Logo.** A glowing lowercase **`k`** in neon green on a transparent ground (`assets/kairo-mark.png`) — works on any theme background. A type-set variant `[K]` with a blinking cursor appears in promo/loading contexts. The wordmark is the mono family in 700 weight, tracked +2px.k is `KAIRO`, mono, bold, tracking 2px, with a green glow.

---

## Index / manifest

Root files:
| Path | What |
|------|------|
| `styles.css` | **Entry point** — `@import` manifest only. Consumers link this. |
| `tokens/colors.css` | Surfaces, borders, text pyramid, accent, semantic, priority, shell surfaces |
| `tokens/typography.css` | Mono family vars, size/weight/leading/tracking scales |
| `tokens/spacing.css` | 4px spacing scale, radii, control sizes, shadows/glow, motion |
| `tokens/fonts.css` | Google-Fonts `@import` for JetBrains Mono / Fira Code / IBM Plex Mono |
| `tokens/themes.css` | All 8 themes as `[data-theme="…"]` scopes (default = MATRIX on `:root`) |
| `base.css` | Reset, body, scrollbars, selection |
| `effects.css` | Utility classes: `.titlebar`, `.neon-text`, `.led`, `.cursor-blink`, `.bevel-*`, `.btn-flat`, matrix/scanline helpers, keyframes |
| `assets/kairo-mark.png` | Logomark (glowing green k, transparent ground) |

**Components** (`window.KairoDesignSystem_6fc2cc.*` after loading `_ds_bundle.js`):
- `components/core/` — `Button`, `Input` + `Textarea`, `Badge`, `Card`
- `components/feedback/` — `Toast`, `Spinner` + `LoadingDots`, `Modal`
- `components/task/` — `PriorityBadge` + `PriorityStripe`, `TaskCard`, `KanbanColumn`

**UI kit:** `ui_kits/kairo/` — interactive desktop-app recreation (board, focus, sheet, capture, theme switcher). Start at `ui_kits/kairo/index.html`.

**Foundations:** specimen cards live in `guidelines/foundations/` and populate the Design System tab (Colors, Type, Spacing, Brand, Components).

### Using a theme
The default (no attribute) is MATRIX. Apply another by setting `data-theme` on any container, and `data-soft` for the two soft themes:
```html
<div data-theme="command"> … </div>
<div data-theme="claude" data-soft> … </div>
```

### Note on fonts
Webfonts load via Google Fonts `@import` (the same families the app links). The two **soft** themes call for **Söhne** (Claude's typeface), which is proprietary and not bundled — the stack falls back to a system sans until a licensed Söhne file is added. See *Caveats* if you have access to it.

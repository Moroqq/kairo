---
name: kairo-design
description: Use this skill to generate well-branded interfaces and assets for Kairo, either for production or throwaway prototypes/mocks/etc. Kairo is a terminal-styled (Matrix/hacker) task manager with a Russian-language UI, neon-green-on-black palette, monospace type and 8 swappable themes. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Fast orientation
- **`README.md`** — full guide: content voice, visual foundations, iconography, file manifest.
- **`styles.css`** — the only stylesheet to link; it `@import`s tokens, themes, base and effects.
- **`tokens/`** — CSS custom properties (colors, type, spacing, fonts, the 8 themes).
- **`effects.css`** — utility classes that carry the look: `.titlebar`, `.neon-text`, `.led`, `.cursor-blink`, `.bevel-*`, `.btn-flat`, matrix-rain/scanline helpers.
- **`components/`** — React primitives (`Button`, `Input`, `Badge`, `Card`, `Modal`, `Toast`, `Spinner`, `TaskCard`, `KanbanColumn`, `PriorityBadge`). Each has a `.prompt.md` with usage.
- **`ui_kits/kairo/`** — a full interactive app recreation to copy patterns from.

## Non-negotiables (get these right)
- **Monospace only** (JetBrains Mono), **ligatures off**, **sharp 0px corners**, **neon-green `#00FF41` on black**.
- **Russian, lowercase** copy; terminal lexicon (`$ cmd`, `// пусто`, `[ок]`, `> бросьте сюда`); **zero-padded bracketed numbers** (`[02]`, `003`); UPPERCASE only for column/section labels and `KAIRO`.
- **No emoji.** Use terminal glyphs (`› ▸ ● ▊ $ + ✕ │ //`) and Lucide icons (2px stroke).
- Elevation is **glow, not shadow**; hover/focus = accent border + neon ring.
- For non-default looks, set `data-theme="…"` (and `data-soft` for `claude`/`clay`) on a container.

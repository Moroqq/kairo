# Kairo — UI Kit

High-fidelity, interactive recreation of the **Kairo** desktop app: a terminal-styled task manager. Composes the design-system primitives (`Button`, `Input`, `TaskCard`, `KanbanColumn`, `PriorityBadge`, `Modal`) inside a faithful app shell.

## Run it
Open `index.html`. It loads `../../styles.css`, the compiled `../../_ds_bundle.js`, lucide icons (CDN), then the kit scripts.

## What's interactive
- **Sidebar nav** — switch between `focus`, `board`, `листок` (todo); other routes show a placeholder.
- **Board** — kanban with four columns (ОЧЕРЕДЬ / АКТИВНЫЕ / БЛОК / ВЫПОЛНЕНО). The `›` advance button moves a task to its next column.
- **Focus** — today's priority list; click a row to toggle done.
- **Листок (Sheet)** — ruled-paper daily list with a red margin line; click to strike through, type in the `+` line to add.
- **новая задача** (FAB / header) — capture modal with title, category, priority picker.
- **тема** — theme picker; switches all 8 palettes live (matrix rain only renders on MATRIX).
- **Status bar** — live clock + zero-padded counts; **titlebar** prompt changes per theme.

## Files
| File | Role |
|------|------|
| `index.html`  | App boot + top-level `App` (routing, state, theme) |
| `shell.jsx`   | `MatrixRain`, `Sidebar`, `Header`, `StatusBar`, `Clock` |
| `screens.jsx` | `BoardScreen`, `FocusScreen`, `SheetScreen`, `CaptureModal`, `ThemePicker` |
| `data.js`     | Fake tasks/nav/themes + the `Icon` (lucide) helper |

State is local React + fake data — no backend. Icons are lucide, rendered as real SVG directly inside React (built from `window.lucide.icons` data) so there's no out-of-band DOM mutation.

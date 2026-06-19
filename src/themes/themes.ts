import type { KanbanColumnId } from '@/types';

export type ThemeId =
  | 'matrix' | 'command' | 'obsidian' | 'paper' | 'nord' | 'samurai'
  | 'claude' | 'clay';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  tagline: string;
  /** Матричный дождь + scanlines (только для matrix). */
  fx: boolean;
  /** «Мягкий» визуальный язык: сан-сериф-шрифт, скруглённые углы, без неон-свечения. */
  soft?: boolean;
  /** CSS custom properties — полный набор, чтобы переключение туда-обратно было чистым. */
  vars: Record<string, string>;
  /** «Личность» интерфейса: лексика меняется вместе с темой. */
  vocab: {
    titlebar: string;
    titlebarShort: string;
    columns: Record<KanbanColumnId, string>;
  };
  /** Свотчи для пикера: [фон, акцент, текст]. */
  preview: [string, string, string];
}

/* ── База = Matrix (текущие значения globals.css) ─────────────── */
const matrixVars: Record<string, string> = {
  '--bg-base':        '#000000',
  '--bg-surface':     '#0A0A0A',
  '--bg-card':        '#0D110D',
  '--bg-elevated':    '#121A12',
  '--bg-input':       '#050805',

  '--border':         'rgba(0, 255, 65, 0.18)',
  '--border-strong':  'rgba(0, 255, 65, 0.45)',
  '--border-subtle':  'rgba(0, 255, 65, 0.08)',
  '--border-danger':  'rgba(255, 0, 60, 0.5)',

  '--text-primary':   '#D6F5D6',
  '--text-secondary': '#8FCC8F',
  '--text-muted':     '#4A8A4A',
  '--text-dim':       '#2E5A2E',
  '--text-bright':    '#00FF41',

  '--accent':         '#00FF41',
  '--accent-soft':    '#00B82E',
  '--accent-glow':    'rgba(0, 255, 65, 0.55)',
  '--accent-dim':     'rgba(0, 255, 65, 0.10)',

  '--success':        '#00FF41',
  '--warning':        '#FFD400',
  '--danger':         '#FF003C',
  '--info':           '#00E5FF',

  '--shadow-card':    '0 0 0 1px var(--border)',
  '--shadow-elevated':'0 0 0 1px var(--border-strong), 0 0 32px rgba(0,255,65,0.18), 0 8px 32px rgba(0,0,0,0.8)',

  /* Форма и шрифт — базовые (MATRIX острый, моно). Темы переопределяют.
     Заданы в базе, чтобы переключение тем всегда сбрасывало значение. */
  '--radius':       '0px',
  '--radius-pill':  '0px',
  '--font-ui':      '"JetBrains Mono", "Fira Code", "IBM Plex Mono", "Lucida Console", "Consolas", monospace',

  /* Поверхности оболочки */
  '--desktop-bg':     '#000000',
  '--shell-bg':       'rgba(5, 5, 5, 0.92)',
  '--panel-bg':       'rgba(8, 12, 8, 0.7)',
  '--statusbar-bg':   '#020402',
  '--overlay-bg':     'rgba(8, 12, 8, 0.97)',
  '--titlebar-bg':    'linear-gradient(180deg, #0A0A0A 0%, #050505 100%)',
  '--well-bg':        'rgba(0, 0, 0, 0.45)',
};

export const THEMES: Record<ThemeId, ThemeDef> = {
  matrix: {
    id: 'matrix',
    name: 'MATRIX',
    tagline: 'терминал · хакер · зелёный код',
    fx: true,
    vars: matrixVars,
    vocab: {
      titlebar: '[kairo@matrix:~]$ task_manager --status=работает',
      titlebarShort: '[kairo@matrix:~]$',
      columns: { todo: 'ОЧЕРЕДЬ', inprogress: 'АКТИВНЫЕ', blocked: 'БЛОК', done: 'ВЫПОЛНЕНО' },
    },
    preview: ['#000000', '#00FF41', '#D6F5D6'],
  },

  command: {
    id: 'command',
    name: 'COMMAND',
    tagline: 'тёмно-синий · бизнес · Linear-вайб',
    fx: false,
    vars: {
      ...matrixVars,
      '--bg-base': '#0B1220', '--bg-surface': '#101A2C', '--bg-card': '#15223C',
      '--bg-elevated': '#1A2A45', '--bg-input': '#0D1626',
      '--border': 'rgba(120,160,255,0.18)', '--border-strong': 'rgba(120,160,255,0.45)',
      '--border-subtle': 'rgba(120,160,255,0.08)', '--border-danger': 'rgba(248,81,73,0.5)',
      '--text-primary': '#E6EDF7', '--text-secondary': '#A7B6CC', '--text-muted': '#5D7290',
      '--text-dim': '#3A4A63', '--text-bright': '#4DA3FF',
      '--accent': '#4DA3FF', '--accent-soft': '#2E7CD6',
      '--accent-glow': 'rgba(77,163,255,0.45)', '--accent-dim': 'rgba(77,163,255,0.12)',
      '--success': '#3FB950', '--warning': '#D29922', '--danger': '#F85149', '--info': '#58A6FF',
      '--shadow-elevated': '0 0 0 1px var(--border-strong), 0 8px 32px rgba(0,0,0,0.6)',
      '--desktop-bg': '#060A12', '--shell-bg': 'rgba(13,19,33,0.95)',
      '--panel-bg': 'rgba(16,26,44,0.8)', '--statusbar-bg': '#0A111E',
      '--overlay-bg': 'rgba(13,19,33,0.97)', '--titlebar-bg': '#0D1626',
      '--well-bg': 'rgba(4,8,16,0.5)',
      '--radius': '6px', '--radius-pill': '999px',
    },
    vocab: {
      titlebar: 'KAIRO — Task Command',
      titlebarShort: 'KAIRO',
      columns: { todo: 'Backlog', inprogress: 'In Progress', blocked: 'Blocked', done: 'Done' },
    },
    preview: ['#0B1220', '#4DA3FF', '#E6EDF7'],
  },

  obsidian: {
    id: 'obsidian',
    name: 'OBSIDIAN',
    tagline: 'графит · фиолетовый · премиум',
    fx: false,
    vars: {
      ...matrixVars,
      '--bg-base': '#0C0C10', '--bg-surface': '#131318', '--bg-card': '#17171E',
      '--bg-elevated': '#1D1D26', '--bg-input': '#0E0E13',
      '--border': 'rgba(167,139,250,0.16)', '--border-strong': 'rgba(167,139,250,0.42)',
      '--border-subtle': 'rgba(167,139,250,0.07)', '--border-danger': 'rgba(244,63,94,0.5)',
      '--text-primary': '#E8E6F0', '--text-secondary': '#B3AEC6', '--text-muted': '#6B6680',
      '--text-dim': '#44405A', '--text-bright': '#C4B5FD',
      '--accent': '#A78BFA', '--accent-soft': '#8B6CF0',
      '--accent-glow': 'rgba(167,139,250,0.45)', '--accent-dim': 'rgba(167,139,250,0.12)',
      '--success': '#4ADE80', '--warning': '#FACC15', '--danger': '#F43F5E', '--info': '#38BDF8',
      '--shadow-elevated': '0 0 0 1px var(--border-strong), 0 0 32px rgba(167,139,250,0.15), 0 8px 32px rgba(0,0,0,0.7)',
      '--desktop-bg': '#08080B', '--shell-bg': 'rgba(15,15,20,0.94)',
      '--panel-bg': 'rgba(19,19,24,0.8)', '--statusbar-bg': '#0A0A0E',
      '--overlay-bg': 'rgba(19,19,24,0.97)', '--titlebar-bg': '#101016',
      '--well-bg': 'rgba(5,5,8,0.5)',
      '--radius': '9px', '--radius-pill': '999px',
    },
    vocab: {
      titlebar: 'KAIRO // OBSIDIAN',
      titlebarShort: 'KAIRO',
      columns: { todo: 'Очередь', inprogress: 'В работе', blocked: 'Блок', done: 'Готово' },
    },
    preview: ['#0C0C10', '#A78BFA', '#E8E6F0'],
  },

  paper: {
    id: 'paper',
    name: 'PAPER',
    tagline: 'светлая · чистая · для дневной работы',
    fx: false,
    vars: {
      ...matrixVars,
      '--bg-base': '#F6F6F3', '--bg-surface': '#FFFFFF', '--bg-card': '#FFFFFF',
      '--bg-elevated': '#EFEFEA', '--bg-input': '#FFFFFF',
      '--border': 'rgba(0,0,0,0.16)', '--border-strong': 'rgba(0,0,0,0.34)',
      '--border-subtle': 'rgba(0,0,0,0.08)', '--border-danger': 'rgba(220,38,38,0.5)',
      '--text-primary': '#1A1A1A', '--text-secondary': '#454545', '--text-muted': '#757575',
      '--text-dim': '#A8A8A8', '--text-bright': '#111111',
      '--accent': '#2563EB', '--accent-soft': '#1D4ED8',
      '--accent-glow': 'rgba(37,99,235,0.25)', '--accent-dim': 'rgba(37,99,235,0.08)',
      '--success': '#16A34A', '--warning': '#D97706', '--danger': '#DC2626', '--info': '#0284C7',
      '--shadow-card': '0 1px 3px rgba(0,0,0,0.08)',
      '--shadow-elevated': '0 0 0 1px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.14)',
      '--desktop-bg': '#EDEDE8', '--shell-bg': 'rgba(255,255,255,0.96)',
      '--panel-bg': 'rgba(250,250,248,0.9)', '--statusbar-bg': '#F0F0EC',
      '--overlay-bg': 'rgba(255,255,255,0.98)', '--titlebar-bg': '#FAFAF8',
      '--well-bg': 'rgba(0,0,0,0.04)',
      '--radius': '6px', '--radius-pill': '999px',
    },
    vocab: {
      titlebar: 'KAIRO — планировщик',
      titlebarShort: 'KAIRO',
      columns: { todo: 'Входящие', inprogress: 'В работе', blocked: 'Ожидание', done: 'Готово' },
    },
    preview: ['#F6F6F3', '#2563EB', '#1A1A1A'],
  },

  nord: {
    id: 'nord',
    name: 'NORD',
    tagline: 'скандинавия · спокойный контраст',
    fx: false,
    vars: {
      ...matrixVars,
      '--bg-base': '#2E3440', '--bg-surface': '#3B4252', '--bg-card': '#434C5E',
      '--bg-elevated': '#4C566A', '--bg-input': '#2E3440',
      '--border': 'rgba(216,222,233,0.14)', '--border-strong': 'rgba(216,222,233,0.36)',
      '--border-subtle': 'rgba(216,222,233,0.07)', '--border-danger': 'rgba(191,97,106,0.55)',
      '--text-primary': '#ECEFF4', '--text-secondary': '#D8DEE9', '--text-muted': '#8C99B3',
      '--text-dim': '#5E6A82', '--text-bright': '#88C0D0',
      '--accent': '#88C0D0', '--accent-soft': '#6FA8BC',
      '--accent-glow': 'rgba(136,192,208,0.35)', '--accent-dim': 'rgba(136,192,208,0.12)',
      '--success': '#A3BE8C', '--warning': '#EBCB8B', '--danger': '#BF616A', '--info': '#81A1C1',
      '--shadow-elevated': '0 0 0 1px var(--border-strong), 0 8px 28px rgba(0,0,0,0.45)',
      '--desktop-bg': '#242933', '--shell-bg': 'rgba(46,52,64,0.96)',
      '--panel-bg': 'rgba(59,66,82,0.85)', '--statusbar-bg': '#272C36',
      '--overlay-bg': 'rgba(46,52,64,0.98)', '--titlebar-bg': '#2E3440',
      '--well-bg': 'rgba(30,34,43,0.5)',
      '--radius': '5px', '--radius-pill': '999px',
    },
    vocab: {
      titlebar: 'KAIRO — nord',
      titlebarShort: 'KAIRO',
      columns: { todo: 'Очередь', inprogress: 'В работе', blocked: 'Блок', done: 'Готово' },
    },
    preview: ['#2E3440', '#88C0D0', '#ECEFF4'],
  },

  samurai: {
    id: 'samurai',
    name: 'SAMURAI',
    tagline: 'чёрный · алый · золото · бусидо',
    fx: false,
    vars: {
      ...matrixVars,
      '--bg-base': '#0A0606', '--bg-surface': '#140C0A', '--bg-card': '#190F0C',
      '--bg-elevated': '#221410', '--bg-input': '#0D0807',
      '--border': 'rgba(229,72,77,0.2)', '--border-strong': 'rgba(229,72,77,0.48)',
      '--border-subtle': 'rgba(229,72,77,0.08)', '--border-danger': 'rgba(255,85,85,0.55)',
      '--text-primary': '#F2E8DC', '--text-secondary': '#C9B8A3', '--text-muted': '#8A7560',
      '--text-dim': '#57493B', '--text-bright': '#E8B54A',
      '--accent': '#E5484D', '--accent-soft': '#C13338',
      '--accent-glow': 'rgba(229,72,77,0.5)', '--accent-dim': 'rgba(229,72,77,0.12)',
      '--success': '#7FB069', '--warning': '#E8B54A', '--danger': '#FF5555', '--info': '#6FA8DC',
      '--shadow-elevated': '0 0 0 1px var(--border-strong), 0 0 32px rgba(229,72,77,0.18), 0 8px 32px rgba(0,0,0,0.8)',
      '--desktop-bg': '#070404', '--shell-bg': 'rgba(16,9,8,0.94)',
      '--panel-bg': 'rgba(20,12,10,0.8)', '--statusbar-bg': '#0B0606',
      '--overlay-bg': 'rgba(20,12,10,0.97)', '--titlebar-bg': '#120A08',
      '--well-bg': 'rgba(6,3,3,0.5)',
      '--radius': '2px', '--radius-pill': '999px',
    },
    vocab: {
      titlebar: 'KAIRO 侍 — свитки приказов',
      titlebarShort: 'KAIRO 侍',
      columns: { todo: 'ПРИКАЗЫ', inprogress: 'В БОЮ', blocked: 'ЗАСАДА', done: 'ИСПОЛНЕНО' },
    },
    preview: ['#0A0606', '#E5484D', '#E8B54A'],
  },

  claude: {
    id: 'claude',
    name: 'CLAUDE',
    tagline: 'тёплый крем · глина · сан-сериф',
    fx: false,
    soft: true,
    vars: {
      ...matrixVars,
      '--bg-base': '#F5F4EE', '--bg-surface': '#FAF9F5', '--bg-card': '#FFFFFF',
      '--bg-elevated': '#EFEDE4', '--bg-input': '#FFFFFF',
      '--border': 'rgba(60,55,45,0.14)', '--border-strong': 'rgba(60,55,45,0.30)',
      '--border-subtle': 'rgba(60,55,45,0.07)', '--border-danger': 'rgba(192,57,43,0.45)',
      '--text-primary': '#3D3D3A', '--text-secondary': '#5C5A52', '--text-muted': '#8A8578',
      '--text-dim': '#B6B0A2', '--text-bright': '#1F1E1D',
      '--accent': '#D97757', '--accent-soft': '#C25E3F',
      '--accent-glow': 'rgba(217,119,87,0.28)', '--accent-dim': 'rgba(217,119,87,0.10)',
      '--success': '#5B8A4E', '--warning': '#C8821E', '--danger': '#C0392B', '--info': '#3B7EA1',
      '--shadow-card': '0 1px 2px rgba(0,0,0,0.06)',
      '--shadow-elevated': '0 1px 3px rgba(0,0,0,0.10), 0 12px 32px rgba(0,0,0,0.12)',
      '--desktop-bg': '#ECEAE1', '--shell-bg': '#FAF9F5',
      '--panel-bg': 'rgba(245,244,238,0.92)', '--statusbar-bg': '#F0EEE6',
      '--overlay-bg': '#FFFFFF', '--titlebar-bg': '#FAF9F5',
      '--well-bg': 'rgba(60,55,45,0.04)',
      '--font-ui': "'Söhne', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      '--radius': '10px', '--radius-pill': '999px',
    },
    vocab: {
      titlebar: 'Kairo',
      titlebarShort: 'Kairo',
      columns: { todo: 'Входящие', inprogress: 'В работе', blocked: 'Ожидание', done: 'Готово' },
    },
    preview: ['#F5F4EE', '#D97757', '#3D3D3A'],
  },

  clay: {
    id: 'clay',
    name: 'CLAUDE NOIR',
    tagline: 'тёмная тема Claude · графит · глина',
    fx: false,
    soft: true,
    vars: {
      ...matrixVars,
      // Тёплый графит как в тёмной теме claude.ai
      '--bg-base': '#262624', '--bg-surface': '#30302E', '--bg-card': '#353532',
      '--bg-elevated': '#3D3C39', '--bg-input': '#1F1E1D',
      '--border': 'rgba(235,230,220,0.10)', '--border-strong': 'rgba(235,230,220,0.24)',
      '--border-subtle': 'rgba(235,230,220,0.06)', '--border-danger': 'rgba(232,107,90,0.5)',
      '--text-primary': '#ECEAE3', '--text-secondary': '#C2BFB6', '--text-muted': '#908D83',
      '--text-dim': '#5E5B52', '--text-bright': '#FAF9F5',
      '--accent': '#D97757', '--accent-soft': '#C96442',
      '--accent-glow': 'rgba(217,119,87,0.35)', '--accent-dim': 'rgba(217,119,87,0.13)',
      '--success': '#7FB069', '--warning': '#D9A441', '--danger': '#E86B5A', '--info': '#6FA8DC',
      '--shadow-card': '0 1px 2px rgba(0,0,0,0.3)',
      '--shadow-elevated': '0 1px 3px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.5)',
      '--desktop-bg': '#1A1916', '--shell-bg': '#262624',
      '--panel-bg': '#30302E', '--statusbar-bg': '#1F1E1D',
      '--overlay-bg': '#30302E', '--titlebar-bg': '#262624',
      '--well-bg': 'rgba(0,0,0,0.20)',
      '--font-ui': "'Söhne', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      '--radius': '10px', '--radius-pill': '999px',
    },
    vocab: {
      titlebar: 'Kairo',
      titlebarShort: 'Kairo',
      columns: { todo: 'Входящие', inprogress: 'В работе', blocked: 'Ожидание', done: 'Готово' },
    },
    preview: ['#262624', '#D97757', '#ECEAE3'],
  },
};

export const THEME_LIST: ThemeDef[] = Object.values(THEMES);

/** Применить тему: проставить переменные на :root и флаг отключения фоновых эффектов. */
export function applyTheme(t: ThemeDef): void {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(t.vars)) root.style.setProperty(k, v);
  root.classList.toggle('no-fx', !t.fx);
  root.classList.toggle('soft', !!t.soft);
}

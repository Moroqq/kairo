import type { KanbanColumnId } from '@/types';

export type ThemeId =
  | 'paper' | 'nord' | 'samurai'
  | 'claude' | 'clay'
  | 'liquid' | 'material'
  | 'void' | 'snow';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  tagline: string;
  /** Матричный дождь + scanlines. */
  fx: boolean;
  /** «Мягкий» визуальный язык: сан-сериф-шрифт, скруглённые углы, без неон-свечения. */
  soft?: boolean;
  /** Светлая тема — статус-бар на мобиле получает тёмные иконки вместо светлых. */
  light?: boolean;
  /**
   * Дизайн-семейство для структурных CSS-оверрайдов.
   * 'apple'    → html.apple: нет bevel-границ, iOS nav bar, subtle shadows, SF Pro
   * 'material' → html.material: Material You elevation system (будущее)
   */
  family?: 'apple' | 'material';
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

  paper: {
    id: 'paper',
    name: 'PAPER',
    tagline: 'светлая · чистая · для дневной работы',
    fx: false,
    light: true,
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
    tagline: 'скандинавия · спокойный контраст · без свечения',
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
      '--accent-glow': 'transparent', '--accent-dim': 'rgba(136,192,208,0.12)',
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
    name: 'IVORY',
    tagline: 'тёплый крем · Anthropic-вайб · сан-сериф',
    fx: false,
    soft: true,
    light: true,
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
    name: 'COCO',
    tagline: 'тёмная глина · тёплый графит · сан-сериф',
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

  liquid: {
    id: 'liquid',
    name: 'LIQUID',
    tagline: 'Apple Design · тёмное стекло · iOS 27 Dark',
    fx: false,
    soft: true,
    family: 'apple',
    vars: {
      ...matrixVars,
      '--bg-base':        '#000000',
      '--bg-surface':     'rgba(28,28,30,0.90)',
      '--bg-card':        '#1C1C1E',
      '--bg-elevated':    '#2C2C2E',
      '--bg-input':       'rgba(28,28,30,0.80)',
      '--border':         'rgba(255,255,255,0.10)',
      '--border-strong':  'rgba(255,255,255,0.20)',
      '--border-subtle':  'rgba(255,255,255,0.05)',
      '--border-danger':  'rgba(255,69,58,0.45)',
      '--text-primary':   '#FFFFFF',
      '--text-secondary': 'rgba(235,235,245,0.72)',
      '--text-muted':     'rgba(235,235,245,0.40)',
      '--text-dim':       'rgba(235,235,245,0.20)',
      '--text-bright':    '#FFFFFF',
      '--accent':         '#0A84FF',
      '--accent-soft':    '#409CFF',
      '--accent-glow':    'rgba(10,132,255,0.28)',
      '--accent-dim':     'rgba(10,132,255,0.14)',
      '--success':        '#30D158',
      '--warning':        '#FF9F0A',
      '--danger':         '#FF453A',
      '--info':           '#64D2FF',
      '--shadow-card':    '0 2px 8px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.06)',
      '--shadow-elevated':'0 8px 30px rgba(0,0,0,0.50), 0 0 0 0.5px rgba(255,255,255,0.08)',
      '--desktop-bg':     '#000000',
      '--shell-bg':       'rgba(18,18,18,0.92)',
      '--panel-bg':       'rgba(28,28,30,0.88)',
      '--statusbar-bg':   'rgba(10,10,10,0.96)',
      '--overlay-bg':     'rgba(28,28,30,0.96)',
      '--titlebar-bg':    'rgba(18,18,18,0.92)',
      '--well-bg':        'rgba(255,255,255,0.04)',
      '--font-ui':        "system-ui, -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      '--radius':         '14px',
      '--radius-pill':    '999px',
    },
    vocab: {
      titlebar: 'Kairo',
      titlebarShort: 'Kairo',
      columns: { todo: 'Входящие', inprogress: 'В работе', blocked: 'Ожидание', done: 'Готово' },
    },
    preview: ['#000000', '#0A84FF', '#FFFFFF'],
  },

  material: {
    id: 'material',
    name: 'MATERIAL',
    tagline: 'Material You · Android · без свечения',
    fx: false,
    soft: true,
    vars: {
      ...matrixVars,
      '--bg-base':        '#141218',
      '--bg-surface':     '#1C1B1F',
      '--bg-card':        '#211F26',
      '--bg-elevated':    '#2B2930',
      '--bg-input':       '#141218',
      '--border':         'rgba(204,194,220,0.12)',
      '--border-strong':  'rgba(204,194,220,0.28)',
      '--border-subtle':  'rgba(204,194,220,0.06)',
      '--border-danger':  'rgba(242,184,181,0.45)',
      '--text-primary':   '#E6E1E5',
      '--text-secondary': '#CAC4D0',
      '--text-muted':     '#938F99',
      '--text-dim':       '#49454F',
      '--text-bright':    '#FFFFFF',
      '--accent':         '#D0BCFF',
      '--accent-soft':    '#9A82DB',
      '--accent-glow':    'rgba(208,188,255,0.12)',
      '--accent-dim':     'rgba(208,188,255,0.10)',
      '--success':        '#6DD07A',
      '--warning':        '#E8D44D',
      '--danger':         '#F2B8B5',
      '--info':           '#82CDF2',
      '--shadow-card':    '0 1px 2px rgba(0,0,0,0.30)',
      '--shadow-elevated':'0 2px 8px rgba(0,0,0,0.40), 0 0 0 1px rgba(204,194,220,0.08)',
      '--desktop-bg':     '#0F0D13',
      '--shell-bg':       '#1C1B1F',
      '--panel-bg':       '#211F26',
      '--statusbar-bg':   '#141218',
      '--overlay-bg':     '#2B2930',
      '--titlebar-bg':    '#1C1B1F',
      '--well-bg':        'rgba(0,0,0,0.25)',
      '--font-ui':        "'Google Sans', 'Roboto', system-ui, -apple-system, sans-serif",
      '--radius':         '16px',
      '--radius-pill':    '999px',
    },
    vocab: {
      titlebar: 'Kairo',
      titlebarShort: 'Kairo',
      columns: { todo: 'Входящие', inprogress: 'В работе', blocked: 'Ожидание', done: 'Готово' },
    },
    preview: ['#1C1B1F', '#D0BCFF', '#E6E1E5'],
  },

  void: {
    id: 'void',
    name: 'VOID',
    tagline: 'тёмная · минимал · без свечения',
    fx: false,
    soft: true,
    vars: {
      ...matrixVars,
      '--bg-base':        '#0A0A0A',
      '--bg-surface':     '#141414',
      '--bg-card':        '#1A1A1A',
      '--bg-elevated':    '#222222',
      '--bg-input':       '#111111',
      '--border':         'rgba(255,255,255,0.10)',
      '--border-strong':  'rgba(255,255,255,0.22)',
      '--border-subtle':  'rgba(255,255,255,0.05)',
      '--border-danger':  'rgba(239,68,68,0.45)',
      '--text-primary':   '#E8E8E8',
      '--text-secondary': '#B0B0B0',
      '--text-muted':     '#707070',
      '--text-dim':       '#404040',
      '--text-bright':    '#FFFFFF',
      '--accent':         '#FFFFFF',
      '--accent-soft':    '#D0D0D0',
      '--accent-glow':    'transparent',
      '--accent-dim':     'rgba(255,255,255,0.08)',
      '--success':        '#4ADE80',
      '--warning':        '#FACC15',
      '--danger':         '#EF4444',
      '--info':           '#60A5FA',
      '--shadow-card':    '0 1px 3px rgba(0,0,0,0.5)',
      '--shadow-elevated':'0 4px 20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)',
      '--desktop-bg':     '#050505',
      '--shell-bg':       '#0A0A0A',
      '--panel-bg':       '#141414',
      '--statusbar-bg':   '#0A0A0A',
      '--overlay-bg':     '#1A1A1A',
      '--titlebar-bg':    '#111111',
      '--well-bg':        'rgba(255,255,255,0.03)',
      '--font-ui':        "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      '--radius':         '10px',
      '--radius-pill':    '999px',
    },
    vocab: {
      titlebar: 'Kairo',
      titlebarShort: 'Kairo',
      columns: { todo: 'Входящие', inprogress: 'В работе', blocked: 'Ожидание', done: 'Готово' },
    },
    preview: ['#0A0A0A', '#FFFFFF', '#E8E8E8'],
  },

  snow: {
    id: 'snow',
    name: 'SNOW',
    tagline: 'светлая · минимал · без свечения',
    fx: false,
    soft: true,
    light: true,
    vars: {
      ...matrixVars,
      '--bg-base':        '#F8F8F8',
      '--bg-surface':     '#FFFFFF',
      '--bg-card':        '#FFFFFF',
      '--bg-elevated':    '#F0F0F0',
      '--bg-input':       '#FFFFFF',
      '--border':         'rgba(0,0,0,0.12)',
      '--border-strong':  'rgba(0,0,0,0.28)',
      '--border-subtle':  'rgba(0,0,0,0.06)',
      '--border-danger':  'rgba(220,38,38,0.45)',
      '--text-primary':   '#141414',
      '--text-secondary': '#444444',
      '--text-muted':     '#888888',
      '--text-dim':       '#BBBBBB',
      '--text-bright':    '#000000',
      '--accent':         '#111111',
      '--accent-soft':    '#333333',
      '--accent-glow':    'transparent',
      '--accent-dim':     'rgba(0,0,0,0.06)',
      '--success':        '#16A34A',
      '--warning':        '#D97706',
      '--danger':         '#DC2626',
      '--info':           '#2563EB',
      '--shadow-card':    '0 1px 3px rgba(0,0,0,0.08)',
      '--shadow-elevated':'0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
      '--desktop-bg':     '#EFEFEF',
      '--shell-bg':       '#FFFFFF',
      '--panel-bg':       'rgba(248,248,248,0.95)',
      '--statusbar-bg':   '#F0F0F0',
      '--overlay-bg':     '#FFFFFF',
      '--titlebar-bg':    '#F8F8F8',
      '--well-bg':        'rgba(0,0,0,0.03)',
      '--font-ui':        "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      '--radius':         '10px',
      '--radius-pill':    '999px',
    },
    vocab: {
      titlebar: 'Kairo',
      titlebarShort: 'Kairo',
      columns: { todo: 'Входящие', inprogress: 'В работе', blocked: 'Ожидание', done: 'Готово' },
    },
    preview: ['#F8F8F8', '#111111', '#141414'],
  },
};

export const THEME_LIST: ThemeDef[] = Object.values(THEMES);

/** Применить тему: проставить переменные на :root и классы дизайн-семейства. */
export function applyTheme(t: ThemeDef): void {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(t.vars)) root.style.setProperty(k, v);
  root.classList.toggle('no-fx',    !t.fx);
  root.classList.toggle('soft',     !!t.soft);
  root.classList.toggle('apple',    t.family === 'apple');
  root.classList.toggle('material', t.family === 'material');

  // Статус-бар должен красится под тему, а не оставаться всегда чёрным
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', t.vars['--statusbar-bg'] ?? t.vars['--bg-base']);

  // На Android иконки статус-бара (время/батарея) переключаются между
  // светлыми и тёмными в зависимости от темы — мост из MainActivity.kt
  (window as any).AndroidStatusBar?.setLight?.(!!t.light);
}

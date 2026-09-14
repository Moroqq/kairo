import type { KanbanColumnId } from '@/types';

export type ThemeId = 'nord' | 'void' | 'snow';

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
  /* Контраст поверх заливки --accent. Обязателен в КАЖДОЙ теме: раньше везде
     был зашит #000, из-за чего в SNOW (акцент #111111) кнопка получалась
     чёрным-по-чёрному. Значение подбирается под конкретный акцент. */
  '--on-accent':      '#000000',

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
      '--on-accent': '#2E3440',
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
      '--on-accent':      '#0A0A0A',
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
      '--on-accent':      '#FFFFFF',
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

  // Статус-бар должен красится под тему, а не оставаться всегда чёрным
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', t.vars['--statusbar-bg'] ?? t.vars['--bg-base']);

  // На Android иконки статус-бара (время/батарея) переключаются между
  // светлыми и тёмными в зависимости от темы — мост из MainActivity.kt
  (window as any).AndroidStatusBar?.setLight?.(!!t.light);
}

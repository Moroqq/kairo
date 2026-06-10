/** Палитры — копии тем приложения (src/themes/themes.ts): matrix / claude / clay. */

export interface Palette {
  id: 'matrix' | 'claude' | 'clay';
  name: string;
  bg: string;          // фон сцены
  surface: string;     // панели
  card: string;        // карточки/бумага
  border: string;
  borderSubtle: string;
  text: string;
  textMuted: string;
  textDim: string;
  accent: string;
  accentDim: string;
  glow: string;        // text-shadow / box-shadow цвет
  danger: string;
  radius: number;
  soft: boolean;       // мягкий дизайн (без неона)
}

export const MATRIX: Palette = {
  id: 'matrix', name: 'MATRIX',
  bg: '#000000', surface: '#0A0A0A', card: '#0D110D',
  border: 'rgba(0,255,65,0.18)', borderSubtle: 'rgba(0,255,65,0.08)',
  text: '#D6F5D6', textMuted: '#4A8A4A', textDim: '#2E5A2E',
  accent: '#00FF41', accentDim: 'rgba(0,255,65,0.10)', glow: 'rgba(0,255,65,0.55)',
  danger: '#FF003C', radius: 0, soft: false,
};

export const CLAUDE: Palette = {
  id: 'claude', name: 'CLAUDE',
  bg: '#F5F4EE', surface: '#FAF9F5', card: '#FFFFFF',
  border: 'rgba(60,55,45,0.14)', borderSubtle: 'rgba(60,55,45,0.07)',
  text: '#3D3D3A', textMuted: '#8A8578', textDim: '#B6B0A2',
  accent: '#D97757', accentDim: 'rgba(217,119,87,0.10)', glow: 'rgba(217,119,87,0.28)',
  danger: '#C0392B', radius: 10, soft: true,
};

export const CLAY: Palette = {
  id: 'clay', name: 'CLAUDE NOIR',
  bg: '#262624', surface: '#30302E', card: '#353532',
  border: 'rgba(235,230,220,0.10)', borderSubtle: 'rgba(235,230,220,0.06)',
  text: '#ECEAE3', textMuted: '#908D83', textDim: '#5E5B52',
  accent: '#D97757', accentDim: 'rgba(217,119,87,0.13)', glow: 'rgba(217,119,87,0.35)',
  danger: '#E86B5A', radius: 10, soft: true,
};

export const PALETTES: Palette[] = [MATRIX, CLAUDE, CLAY];

/** Цвета приоритетов (PRIORITY_CONFIG приложения). */
export const PRIO = { A: '#FF1744', B: '#FF9100', C: '#00B0FF', D: '#B388FF' } as const;

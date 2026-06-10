import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { THEMES, type ThemeId, type ThemeDef } from '@/themes/themes';

interface ThemeState {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: 'matrix',
      setTheme: (id) => set({ themeId: id }),
    }),
    { name: 'kairo_theme' },
  ),
);

/** Текущая тема целиком (с fallback на matrix, если в storage мусор). */
export function useTheme(): ThemeDef {
  const id = useThemeStore((s) => s.themeId);
  return THEMES[id] ?? THEMES.matrix;
}

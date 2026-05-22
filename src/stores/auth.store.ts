import { create } from 'zustand';

interface AuthState {
  isUnlocked: boolean;
  unlockedAt: Date | null;
  unlock: () => void;
  lock: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isUnlocked: false,
  unlockedAt: null,
  unlock: () => set({ isUnlocked: true, unlockedAt: new Date() }),
  lock: () => set({ isUnlocked: false, unlockedAt: null }),
}));

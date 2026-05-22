import { create } from 'zustand';

interface UIState {
  activeTaskId: string | null;
  isCaptureOpen: boolean;
  sidebarCollapsed: boolean;
  searchQuery: string;
  filterPriority: string | null;
  filterCategory: string | null;

  setActiveTaskId: (id: string | null) => void;
  openCapture: () => void;
  closeCapture: () => void;
  toggleSidebar: () => void;
  setSearch: (q: string) => void;
  setFilterPriority: (p: string | null) => void;
  setFilterCategory: (c: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTaskId: null,
  isCaptureOpen: false,
  sidebarCollapsed: false,
  searchQuery: '',
  filterPriority: null,
  filterCategory: null,

  setActiveTaskId: (id) => set({ activeTaskId: id }),
  openCapture:     ()   => set({ isCaptureOpen: true }),
  closeCapture:    ()   => set({ isCaptureOpen: false }),
  toggleSidebar:   ()   => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSearch:       (q)  => set({ searchQuery: q }),
  setFilterPriority: (p) => set({ filterPriority: p }),
  setFilterCategory: (c) => set({ filterCategory: c }),
}));

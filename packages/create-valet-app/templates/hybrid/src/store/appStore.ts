import { create } from "zustand";

interface AppState {
  count: number;
  inc: () => void;
  dec: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
  dec: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}));

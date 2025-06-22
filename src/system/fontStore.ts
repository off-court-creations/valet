// ─────────────────────────────────────────────────────────────
// src/system/fontStore.ts | valet
// tracks Google font loading state
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';

interface FontState {
  loading: number;
  ready: boolean;
  start: () => void;
  finish: () => void;
}

export const useFonts = create<FontState>((set) => ({
  loading: 0,
  ready: false,
  start: () =>
    set((s) => ({ loading: s.loading + 1, ready: false })),
  finish: () =>
    set((s) => {
      const loading = Math.max(0, s.loading - 1);
      return { loading, ready: loading === 0 };
    }),
}));


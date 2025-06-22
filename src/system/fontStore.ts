// ─────────────────────────────────────────────────────────────
// src/system/fontStore.ts | valet
// tracks Google font loading state
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';

interface FontState {
  ready: boolean;
  setReady: (ready: boolean) => void;
}

export const useFonts = create<FontState>((set) => ({
  ready: false,
  setReady: (ready) => set({ ready }),
}));


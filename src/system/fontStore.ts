// ─────────────────────────────────────────────────────────────
// src/system/fontStore.ts | valet
// tracks Google font loading state
// ─────────────────────────────────────────────────────────────
import { createWithEqualityFn as create } from 'zustand/traditional';

interface FontState {
  loading: number;
  ready: boolean;
  /**
   * Latches true the first time a font load begins. Lets consumers (Surface's
   * never-block grace) tell "no load has ever started" (`started === false`)
   * apart from "a load is in flight" (`started === true && loading > 0`) — the
   * initial `ready: false` state is ambiguous between the two without it.
   * Never reset by finish(): a settled pipeline stays `started === true`.
   */
  started: boolean;
  start: () => void;
  finish: () => void;
}

export const useFonts = create<FontState>((set) => ({
  loading: 0,
  ready: false,
  started: false,
  start: () => set((s) => ({ loading: s.loading + 1, ready: false, started: true })),
  finish: () =>
    set((s) => {
      const loading = Math.max(0, s.loading - 1);
      return { loading, ready: loading === 0 };
    }),
}));

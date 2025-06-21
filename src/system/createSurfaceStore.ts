// ─────────────────────────────────────────────────────────────
// src/system/createSurfaceStore.ts  | valet
// per-Surface Zustand store tracking viewport and child sizes
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import type { Breakpoint } from './themeStore';

interface Size {
  width: number;
  height: number;
}

export interface SurfaceStore {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  hasScrollbar: boolean;
  children: Record<string, Size>;
  setSize: (w: number, h: number, bp: Breakpoint, scroll: boolean) => void;
  register: (id: string, size: Size) => void;
  update: (id: string, size: Size) => void;
  unregister: (id: string) => void;
}

export function createSurfaceStore() {
  return create<SurfaceStore>((set) => ({
    width: 0,
    height: 0,
    breakpoint: 'xs',
    hasScrollbar: false,
    children: {},
    setSize: (w, h, bp, scroll) =>
      set({ width: w, height: h, breakpoint: bp, hasScrollbar: scroll }),
    register: (id, size) =>
      set((s) => ({ children: { ...s.children, [id]: size } })),
    update: (id, size) =>
      set((s) => ({ children: { ...s.children, [id]: size } })),
    unregister: (id) =>
      set((s) => {
        const { [id]: _, ...rest } = s.children;
        return { children: rest };
      }),
  }));
}

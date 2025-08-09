// src/system/surfaceStore.ts | valet
// per-surface Zustand store tracking size & children

import { createContext, useContext } from 'react';
import { createWithEqualityFn as create } from 'zustand/traditional';
import type { Breakpoint } from './themeStore';

export interface ChildMetrics {
  width: number;
  height: number;
  top: number;
  left: number;
}

export interface SurfaceState {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  hasScrollbar: boolean;
  element: HTMLDivElement | null;
  children: Map<string, ChildMetrics>;
  registerChild: (id: string, node: HTMLElement, cb?: (metrics: ChildMetrics) => void) => void;
  unregisterChild: (id: string) => void;
}

export const createSurfaceStore = () =>
  create<SurfaceState>((set, get) => {
    const nodes = new Map<string, { node: HTMLElement; cb?: (m: ChildMetrics) => void }>();

    const ro = new ResizeObserver((entries) => {
      const surfEl = get().element;
      const sRect = surfEl ? surfEl.getBoundingClientRect() : { top: 0, left: 0 };
      const scrollTop = surfEl ? surfEl.scrollTop : 0;
      const scrollLeft = surfEl ? surfEl.scrollLeft : 0;

      for (const entry of entries) {
        for (const [id, meta] of nodes) {
          if (meta.node === entry.target) {
            const rect = entry.target.getBoundingClientRect();
            const metrics: ChildMetrics = {
              width: rect.width,
              height: Math.round(rect.height),
              top: rect.top - sRect.top + scrollTop,
              left: rect.left - sRect.left + scrollLeft,
            };
            set((s) => {
              const next = new Map(s.children);
              next.set(id, metrics);
              return { children: next };
            });
            meta.cb?.(metrics);
            break;
          }
        }
      }
    });

    return {
      width: 0,
      height: 0,
      breakpoint: 'xs',
      hasScrollbar: false,
      element: null,
      children: new Map(),
      registerChild: (id, node, cb) => {
        nodes.set(id, { node, cb });
        ro.observe(node);

        const surfEl = get().element;
        const sRect = surfEl ? surfEl.getBoundingClientRect() : { top: 0, left: 0 };
        const scrollTop = surfEl ? surfEl.scrollTop : 0;
        const scrollLeft = surfEl ? surfEl.scrollLeft : 0;

        const rect = node.getBoundingClientRect();
        const metrics: ChildMetrics = {
          width: rect.width,
          height: Math.round(rect.height),
          top: rect.top - sRect.top + scrollTop,
          left: rect.left - sRect.left + scrollLeft,
        };

        set((s) => {
          const next = new Map(s.children);
          next.set(id, metrics);
          return { children: next };
        });

        cb?.(metrics);
      },
      unregisterChild: (id) => {
        const entry = nodes.get(id);
        if (entry) {
          ro.unobserve(entry.node);
          nodes.delete(id);
        }
        set((s) => {
          const next = new Map(s.children);
          next.delete(id);
          return { children: next };
        });
      },
    };
  });

export type SurfaceStore = ReturnType<typeof createSurfaceStore>;

export const SurfaceCtx = createContext<SurfaceStore | null>(null);

// Overloads provide precise types without `any`
export function useSurface(): SurfaceState;
export function useSurface<U>(
  selector: (state: SurfaceState) => U,
  equality?: (a: U, b: U) => boolean,
): U;
export function useSurface<U>(
  selector?: (state: SurfaceState) => U,
  equality?: (a: U, b: U) => boolean,
): U | SurfaceState {
  const store = useContext(SurfaceCtx);
  if (!store) {
    throw new Error('useSurface must be used within a <Surface> component');
  }

  // Call signature is different depending on whether a selector was passed.
  if (selector) {
    return store(selector, equality);
  }
  return store();
}

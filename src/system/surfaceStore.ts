// src/system/surfaceStore.ts | valet
// per-surface Zustand store tracking size & children
// perf: O(1) registerChild, microtask-batched children commits

import { createContext, useContext } from 'react';
import { createWithEqualityFn as create } from 'zustand/traditional';
import { valetError } from './devErrors';
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
  /**
   * Registry of child metrics keyed by registration id. The Map is
   * replaced wholesale on each batched commit, so subscribing to it
   * re-notifies for *any* child change — prefer the `cb` argument of
   * `registerChild` for per-element metrics.
   * @deprecated Kept for compatibility (do not remove — veto register);
   * slated to leave the public surface in a future major.
   */
  children: Map<string, ChildMetrics>;
  registerChild: (id: string, node: HTMLElement, cb?: (metrics: ChildMetrics) => void) => void;
  unregisterChild: (id: string) => void;
}

export const createSurfaceStore = () =>
  create<SurfaceState>((set, get) => {
    const nodes = new Map<string, { node: HTMLElement; cb?: (m: ChildMetrics) => void }>();
    // Fast reverse lookup to avoid O(n^2) scans on ResizeObserver callbacks
    const byNode = new WeakMap<HTMLElement, { id: string; cb?: (m: ChildMetrics) => void }>();

    /* Pending registry mutations — flushed once per microtask so that
       n mounts (or unmounts) produce a single store notification. */
    const pendingSet = new Map<string, ChildMetrics>();
    const pendingDelete = new Set<string>();
    let flushQueued = false;

    const flush = () => {
      flushQueued = false;
      if (!pendingSet.size && !pendingDelete.size) return;
      const prev = get().children;
      const next = new Map(prev);
      let mutated = false;
      for (const id of pendingDelete) {
        if (next.delete(id)) mutated = true;
      }
      pendingDelete.clear();
      for (const [id, m] of pendingSet) {
        const cur = next.get(id);
        if (
          cur &&
          cur.width === m.width &&
          cur.height === m.height &&
          cur.top === m.top &&
          cur.left === m.left
        )
          continue;
        next.set(id, m);
        mutated = true;
      }
      pendingSet.clear();
      if (mutated) set({ children: next });
    };

    const queueFlush = () => {
      if (flushQueued) return;
      flushQueued = true;
      queueMicrotask(flush);
    };

    /* Lazy ResizeObserver — created on first registration so importing /
       rendering in environments without RO (SSR) cannot crash. */
    let ro: ResizeObserver | null = null;
    const getRO = () => {
      if (ro) return ro;
      if (typeof ResizeObserver === 'undefined') return null;
      ro = new ResizeObserver((entries) => {
        const surfEl = get().element;
        const sRect = surfEl ? surfEl.getBoundingClientRect() : { top: 0, left: 0 };
        const scrollTop = surfEl ? surfEl.scrollTop : 0;
        const scrollLeft = surfEl ? surfEl.scrollLeft : 0;

        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          const meta = byNode.get(target);
          if (!meta) continue;
          const rect = target.getBoundingClientRect();
          // Round ALL four (not just height) so subpixel RO jitter can't defeat
          // the `===` dirty-check in queueFlush and force redundant notifies.
          const metrics: ChildMetrics = {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            top: Math.round(rect.top - sRect.top + scrollTop),
            left: Math.round(rect.left - sRect.left + scrollLeft),
          };
          pendingSet.set(meta.id, metrics);
          meta.cb?.(metrics);
        }

        queueFlush();
      });
      return ro;
    };

    return {
      width: 0,
      height: 0,
      breakpoint: 'xs',
      hasScrollbar: false,
      element: null,
      children: new Map(),
      registerChild: (id, node, cb) => {
        // If `id` was already bound to a DIFFERENT node, release the old one
        // first — otherwise its ResizeObserver subscription + byNode mapping
        // leak forever (unregisterChild only ever unobserves the current node).
        const prev = nodes.get(id);
        if (prev && prev.node !== node) {
          ro?.unobserve(prev.node);
          byNode.delete(prev.node);
        }
        nodes.set(id, { node, cb });
        byNode.set(node, { id, cb });
        // Re-registration in the same tick (e.g. StrictMode remount)
        // cancels the pending delete instead of churning the Map.
        pendingDelete.delete(id);
        // No synchronous getBoundingClientRect here: the ResizeObserver's
        // initial delivery supplies the first metrics before paint.
        getRO()?.observe(node);
      },
      unregisterChild: (id) => {
        const entry = nodes.get(id);
        if (entry) {
          ro?.unobserve(entry.node);
          byNode.delete(entry.node);
          nodes.delete(id);
        }
        pendingSet.delete(id);
        pendingDelete.add(id);
        queueFlush();
      },
    };
  });

export type SurfaceStore = ReturnType<typeof createSurfaceStore>;

export const SurfaceCtx = createContext<SurfaceStore | null>(null);

/* Best-effort caller lookup for the missing-Surface throw. ~22 components
   reach useSurface indirectly (most via Typography), so the raw hook name
   alone sends consumers hunting through valet internals. In dev stacks the
   component that invoked the hook is the first PascalCase frame after
   `useSurface` (V8 `at Name (…)` or SpiderMonkey `Name@…`); intermediate
   custom hooks are camelCase and skipped. Minified production stacks just
   yield null and the message falls back to the hook name. */
function callerComponent(): string | null {
  const stack = new Error().stack;
  if (!stack) return null;
  let pastHook = false;
  for (const line of stack.split('\n')) {
    const frame =
      /^\s*at (?:[\w$.]+\.)?([\w$]+)/.exec(line) ?? /^(?:[\w$.]+\.)?([\w$]+)@/.exec(line);
    if (!frame) continue;
    const name = frame[1];
    if (name === 'useSurface') {
      pastHook = true;
      continue;
    }
    if (pastHook && /^[A-Z]/.test(name)) return name;
  }
  return null;
}

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
    const caller = callerComponent();
    throw valetError(
      caller ?? 'useSurface',
      `${
        caller
          ? `<${caller}> reads surface state (via useSurface) and`
          : 'useSurface reads surface state and'
      } must be rendered inside a <Surface>. Every valet screen mounts exactly one <Surface> at its root — wrap your route's top-level element in <Surface>.`,
      'surface',
    );
  }

  // Call signature is different depending on whether a selector was passed.
  if (selector) {
    return store(selector, equality);
  }
  return store();
}

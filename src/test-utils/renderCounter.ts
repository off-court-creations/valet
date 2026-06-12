// ─────────────────────────────────────────────────────────────
// src/test-utils/renderCounter.ts | valet
// Shared render-count harness for the PERF render-count regression
// suites (plan §3.7 S10). React's <Profiler onRender> fires once per
// committed render of its subtree, so wrapping a component in one and
// counting commits is the canonical "did this re-render?" probe — the
// same shape Surface.dom.test.tsx pioneered inline; centralised here so
// the Table/List/Surface render-count tests share one definition instead
// of re-deriving it (drift is what this whole overhaul fights).
//
// Usage:
//   const counter = makeRenderCounter();
//   root.render(counter.wrap(<Thing />));   // counter.count grows per commit
//   const base = counter.count;             // snapshot, then drive an update
//   expect(counter.count).toBe(base);       // proved it did NOT re-render
//
// Notes:
//   • <Profiler> counts *committed* renders of its whole subtree, so put
//     it as tight around the component under test as the assertion needs.
//   • Under <StrictMode> React intentionally double-invokes render in dev;
//     commit counts therefore double too. Assert relative deltas (grew /
//     did-not-grow), never absolute counts, when StrictMode is in play.
//   • createElement-based (no JSX) so this stays a plain .ts util usable
//     from both .ts and .tsx suites without a JSX pragma.
// ─────────────────────────────────────────────────────────────
import { Profiler, createElement, type ReactNode } from 'react';

export interface RenderCounter {
  /** Total committed renders of the wrapped subtree so far. */
  readonly count: number;
  /** Wrap a node so its commits are counted. Stable `id` keeps Profiler happy. */
  wrap: (node: ReactNode) => ReactNode;
  /** Reset the counter to 0 (e.g. to ignore mount commits before driving). */
  reset: () => void;
}

let seq = 0;

/** Create an independent commit counter with its own <Profiler> wrapper. */
export function makeRenderCounter(id = `render-counter-${(seq += 1)}`): RenderCounter {
  const state = { n: 0 };
  return {
    get count() {
      return state.n;
    },
    reset() {
      state.n = 0;
    },
    wrap(node: ReactNode) {
      return createElement(
        Profiler,
        {
          id,
          onRender: () => {
            state.n += 1;
          },
        },
        node,
      );
    },
  };
}

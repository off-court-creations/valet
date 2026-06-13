// ─────────────────────────────────────────────────────────────
// src/system/resolveTabAction.test.ts  | valet
// Exhaustive unit matrix for the pure Tab focus-trap decision
// (first/middle/last/escaped × shift/no-shift × 0/1/n focusables)
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { resolveTabAction, type TabAction } from './overlay';

// Rows: [label, activeIndex, shiftKey, focusableCount, expected]
const matrix: Array<[string, number, boolean, number, TabAction]> = [
  // 0 focusables — never browser default, hold focus on the container
  ['0 focusables · no active · Tab', -1, false, 0, 'refocus-first'],
  ['0 focusables · no active · Shift+Tab', -1, true, 0, 'refocus-first'],
  ['0 focusables · stale index · Tab', 0, false, 0, 'refocus-first'],
  ['0 focusables · stale index · Shift+Tab', 0, true, 0, 'refocus-first'],

  // 1 focusable — the single node is both first and last; trap holds
  ['1 focusable · on node · Tab', 0, false, 1, 'wrap-to-first'],
  ['1 focusable · on node · Shift+Tab', 0, true, 1, 'wrap-to-last'],
  ['1 focusable · escaped · Tab', -1, false, 1, 'refocus-first'],
  ['1 focusable · escaped · Shift+Tab', -1, true, 1, 'refocus-first'],
  ['1 focusable · out-of-range · Tab', 1, false, 1, 'refocus-first'],
  ['1 focusable · out-of-range · Shift+Tab', 1, true, 1, 'refocus-first'],

  // n focusables (n = 3) — wraps only at the boundaries
  ['n · first · Tab', 0, false, 3, 'allow-default'],
  ['n · first · Shift+Tab', 0, true, 3, 'wrap-to-last'],
  // The audit-critical case: mid-dialog Tab must NOT be swallowed
  ['n · middle · Tab', 1, false, 3, 'allow-default'],
  ['n · middle · Shift+Tab', 1, true, 3, 'allow-default'],
  ['n · last · Tab', 2, false, 3, 'wrap-to-first'],
  ['n · last · Shift+Tab', 2, true, 3, 'allow-default'],
  ['n · escaped · Tab', -1, false, 3, 'refocus-first'],
  ['n · escaped · Shift+Tab', -1, true, 3, 'refocus-first'],
  ['n · out-of-range · Tab', 3, false, 3, 'refocus-first'],
  ['n · out-of-range · Shift+Tab', 3, true, 3, 'refocus-first'],
];

describe('resolveTabAction matrix', () => {
  it.each(matrix)('%s', (_label, activeIndex, shiftKey, count, expected) => {
    expect(resolveTabAction(activeIndex, shiftKey, count)).toBe(expected);
  });
});

describe('resolveTabAction invariants', () => {
  it('with ≥2 focusables, suppresses default only at the wrap boundaries', () => {
    for (let count = 2; count <= 6; count++) {
      for (let index = 0; index < count; index++) {
        for (const shiftKey of [false, true]) {
          const action = resolveTabAction(index, shiftKey, count);
          const atWrapBoundary = (!shiftKey && index === count - 1) || (shiftKey && index === 0);
          if (atWrapBoundary) {
            expect(action).toBe(shiftKey ? 'wrap-to-last' : 'wrap-to-first');
          } else {
            // Every in-range, non-boundary press falls through to the browser
            expect(action).toBe('allow-default');
          }
        }
      }
    }
  });

  it('always refocuses (never allows default) when focus escaped the dialog', () => {
    for (let count = 0; count <= 6; count++) {
      for (const escapedIndex of [-1, count, count + 1]) {
        for (const shiftKey of [false, true]) {
          expect(resolveTabAction(escapedIndex, shiftKey, count)).toBe('refocus-first');
        }
      }
    }
  });
});

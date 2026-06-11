// ─────────────────────────────────────────────────────────────
// src/system/resolveOutsideClick.test.ts  | valet
// OVERLAY S3 regression — pure decision core for stack-aware
// outside-click dismissal: clicking a lower layer (or the page)
// closes every dismissible layer ABOVE the deepest layer that
// contains the click, top-most first.
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { resolveOutsideClick, type OutsideClickLayer } from './overlay';

const layer = (containsTarget: boolean, dismissible = true): OutsideClickLayer => ({
  containsTarget,
  dismissible,
});

describe('resolveOutsideClick — stack-aware dismissal core', () => {
  it('empty stack closes nothing', () => {
    expect(resolveOutsideClick([])).toEqual([]);
  });

  it('page click with a single dismissible layer closes it', () => {
    expect(resolveOutsideClick([layer(false)])).toEqual([0]);
  });

  it('click inside the only layer closes nothing', () => {
    expect(resolveOutsideClick([layer(true)])).toEqual([]);
  });

  it('non-dismissible layer never closes on a page click', () => {
    expect(resolveOutsideClick([layer(false, false)])).toEqual([]);
  });

  it('click on the page closes every dismissible layer, top-most first', () => {
    expect(resolveOutsideClick([layer(false), layer(false), layer(false)])).toEqual([2, 1, 0]);
  });

  it('click on a LOWER layer closes every dismissible layer above it', () => {
    // [Modal (clicked), Select menu, Tooltip] — menu + tooltip close, Modal stays
    expect(resolveOutsideClick([layer(true), layer(false), layer(false)])).toEqual([2, 1]);
  });

  it('click on the top-most layer closes nothing', () => {
    expect(resolveOutsideClick([layer(false), layer(false), layer(true)])).toEqual([]);
  });

  it('non-dismissible layers above the click stay open without shielding dismissible ones', () => {
    // clicked layer 0; layer 1 is non-dismissible, layer 2 dismissible
    expect(resolveOutsideClick([layer(true), layer(false, false), layer(false)])).toEqual([2]);
  });

  it('uses the DEEPEST containing layer when the target sits inside several', () => {
    // e.g. a Tooltip anchored inside a Modal — target inside both 0 and 1 of 3
    expect(resolveOutsideClick([layer(true), layer(true), layer(false)])).toEqual([2]);
    // target inside bottom AND top — nothing above the deepest, nothing closes
    expect(resolveOutsideClick([layer(true), layer(false), layer(true)])).toEqual([]);
  });

  it('registry-v1 regression: lower-layer clicks no longer shield the layers above', () => {
    // v1 returned early when the target was inside ANY layer, so clicking a
    // background Modal left an open Tooltip stranded. v2 closes the Tooltip.
    expect(resolveOutsideClick([layer(true), layer(false)])).toEqual([1]);
  });

  it('invariant: result is strictly descending (top-most first) and above the deepest hit', () => {
    for (let n = 0; n <= 4; n++) {
      for (let mask = 0; mask < 1 << n; mask++) {
        for (let dmask = 0; dmask < 1 << n; dmask++) {
          const layers: OutsideClickLayer[] = Array.from({ length: n }, (_, i) =>
            layer(!!(mask & (1 << i)), !!(dmask & (1 << i))),
          );
          const result = resolveOutsideClick(layers);
          let deepest = -1;
          for (let i = n - 1; i >= 0; i--) {
            if (layers[i].containsTarget) {
              deepest = i;
              break;
            }
          }
          for (let k = 0; k < result.length; k++) {
            const idx = result[k];
            expect(idx).toBeGreaterThan(deepest);
            expect(layers[idx].dismissible).toBe(true);
            if (k > 0) expect(idx).toBeLessThan(result[k - 1]);
          }
          // completeness: every dismissible layer above the deepest hit is closed
          const expected = [];
          for (let i = n - 1; i > deepest; i--) if (layers[i].dismissible) expected.push(i);
          expect(result).toEqual(expected);
        }
      }
    }
  });
});

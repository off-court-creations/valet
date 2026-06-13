// ─────────────────────────────────────────────────────────────
// src/components/fields/sliderMath.test.ts | valet
// computeKeyStep — audit repro plus boundary / snap / precision matrix
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { computeKeyStep } from './sliderMath';

/** Mirror of Slider's commit-path rounding (`roundTo`, Slider.tsx). */
const roundTo = (val: number, p: number) => parseFloat(val.toFixed(p));

describe('computeKeyStep', () => {
  it('audit repro: min=0 max=10 precision=0 — 5 + keyStep commits to 6, not back to 5', () => {
    const ks = computeKeyStep({ min: 0, max: 10, step: 1, snap: 'none', precision: 0 });
    expect(ks).toBe(1);
    expect(roundTo(5 + ks, 0)).toBe(6);
  });

  it('keeps the 1%-of-range step for wide ranges', () => {
    expect(computeKeyStep({ min: 0, max: 1000, step: 1, snap: 'none', precision: 0 })).toBe(10);
    // at exactly range=100 the two candidates tie at 1
    expect(computeKeyStep({ min: 0, max: 100, step: 1, snap: 'none', precision: 0 })).toBe(1);
  });

  it('floors at 10**-precision whenever 1% of range would round away', () => {
    expect(computeKeyStep({ min: 0, max: 49, step: 1, snap: 'none', precision: 0 })).toBe(1);
    // negative bounds: range matters, not the sign of min/max
    expect(computeKeyStep({ min: -5, max: 5, step: 1, snap: 'none', precision: 0 })).toBe(1);
  });

  it('snap="step" returns the configured step verbatim', () => {
    expect(computeKeyStep({ min: 0, max: 10, step: 2, snap: 'step', precision: 0 })).toBe(2);
    // even below the precision floor — step snapping owns the result there
    expect(computeKeyStep({ min: 0, max: 10, step: 0.5, snap: 'step', precision: 0 })).toBe(0.5);
  });

  it('snap="presets" uses the same floored step as snap="none"', () => {
    expect(computeKeyStep({ min: 0, max: 10, step: 1, snap: 'presets', precision: 0 })).toBe(1);
  });

  it('fractional precision lowers the floor accordingly', () => {
    // 1% of range (0.01) survives roundTo(…, 2), so it wins the max()
    expect(computeKeyStep({ min: 0, max: 1, step: 1, snap: 'none', precision: 2 })).toBe(0.01);
    // tiny range: the 10**-2 floor beats 0.005
    expect(computeKeyStep({ min: 0, max: 0.5, step: 1, snap: 'none', precision: 2 })).toBe(0.01);
    // and the resulting step survives the commit-path rounding
    const ks = computeKeyStep({ min: 0, max: 1, step: 1, snap: 'none', precision: 1 });
    expect(roundTo(0.5 + ks, 1)).toBe(0.6);
  });

  it('boundaries: commit-path clamp keeps max/min reachable without overshoot', () => {
    const clamp = (v: number) => Math.min(Math.max(v, 0), 10);
    const ks = computeKeyStep({ min: 0, max: 10, step: 1, snap: 'none', precision: 0 });
    expect(roundTo(clamp(9 + ks), 0)).toBe(10); // max reachable
    expect(roundTo(clamp(10 + ks), 0)).toBe(10); // no overshoot past max
    expect(roundTo(clamp(0 - ks), 0)).toBe(0); // no undershoot past min
  });

  it('degenerate range (max === min) still returns a positive step', () => {
    expect(computeKeyStep({ min: 5, max: 5, step: 1, snap: 'none', precision: 0 })).toBe(1);
  });
});

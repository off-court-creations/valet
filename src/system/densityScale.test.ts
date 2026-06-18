// ─────────────────────────────────────────────────────────────
// src/system/densityScale.test.ts | valet
// Pins the density → spacing-scale multipliers (the freshest, riskiest
// retune). These three numbers are magic constants frozen for 1.0 —
// a regression to any tier must fail here, not ship silently.
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { densityScale } from './densityScale';

describe('densityScale (1.0 contract)', () => {
  it('pins the three tiers: tight 0.8 / standard 0.9 / comfortable 1.0', () => {
    expect(densityScale('tight')).toBe(0.8);
    expect(densityScale('standard')).toBe(0.9);
    expect(densityScale('comfortable')).toBe(1.0);
  });

  it('degrades an unexpected value to the standard default (0.9), never to tight', () => {
    // A stale/persisted bad density (bypassing the TS union) must not silently
    // resolve to the tightest tier.
    expect(densityScale('cozy' as unknown as Parameters<typeof densityScale>[0])).toBe(0.9);
  });
});

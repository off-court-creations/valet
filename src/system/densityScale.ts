// ─────────────────────────────────────────────────────────────
// src/system/densityScale.ts | valet
// Single source of truth for the density → spacing-scale multiplier.
// Previously copy-pasted across Surface/Grid/Panel/Stack/Tabs.
// ─────────────────────────────────────────────────────────────
import type { Density } from './themeStore';

/**
 * Density → `--valet-space` multiplier (the spacing SCALE; never zeroed —
 * that is `compact`'s job).
 *
 * Evenly stepped (0.1) and tightened at 1.0: `comfortable` sits at the design
 * unit (1.0) and the tiers step DOWN from there —
 *   tight 0.8 · standard 0.9 · comfortable 1.0
 * — so every density reads a touch tighter than the legacy 0.9 / 1.0 / 1.15
 * scale while staying visibly distinct and evenly spaced.
 *
 * Only `tight` maps to 0.8; any unexpected value degrades to the `standard`
 * default (0.9), never silently to the tightest tier.
 */
export const densityScale = (d: Density): number =>
  d === 'comfortable' ? 1.0 : d === 'tight' ? 0.8 : 0.9;

export default densityScale;

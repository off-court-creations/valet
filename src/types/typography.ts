// ─────────────────────────────────────────────────────────────
// src/types/typography.ts  | valet
// shared typography types (variants, weights, tokens)
// ─────────────────────────────────────────────────────────────

export type Variant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'subtitle' | 'button';

export type WeightAlias = 'regular' | 'medium' | 'semibold' | 'bold';

export interface FluidSize {
  min: string; // e.g. '1rem'
  max: string; // e.g. '2rem'
  vwFrom: number; // px viewport start
  vwTo: number; // px viewport end
}

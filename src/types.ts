// ─────────────────────────────────────────────────────────────
// src/types.ts  | valet
// shared types: presets and spacing ergonomics
// ─────────────────────────────────────────────────────────────

export interface Presettable {
  /** One or many style-preset names registered via `definePreset()` */
  preset?: string | string[];
}

/** Numeric values are mapped via theme.spacing(n); strings pass through. */
export type Space = number | string;

/** Common spacing props shared across layout components. */
export interface SpacingProps {
  /** Inter-child spacing as units or CSS length. */
  gap?: Space;
  /** Container padding as units or CSS length. */
  pad?: Space;
  /** Compact mode zeros gap and pad where supported. */
  compact?: boolean;
}

/** Sx prop: inline CSS with support for CSS custom properties (e.g. --valet-*) */
export type Sx = React.CSSProperties & { [key: `--${string}`]: string | number };

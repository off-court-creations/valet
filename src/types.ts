// ─────────────────────────────────────────────────────────────
// src/types.ts  | valet
// shared types: presets, spacing ergonomics, and field base props
// ─────────────────────────────────────────────────────────────
import type React from 'react';

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

/**
 * Base props shared by value field components (TextField, Checkbox, Select, Slider, Switch, etc.).
 * Attach these to ensure consistent behavior and documentation across fields.
 *
 * Note: `name` is optional here. Components that require a name can refine their
 * prop type with `& { name: string }` to enforce it at the component level.
 */
export interface FieldBaseProps extends Presettable {
  /**
   * Field identifier used for FormControl binding and forwarded to the underlying control
   * when applicable. Components can require `name` locally if they depend on it.
   */
  name?: string;

  /** Visual label rendered by the component or its wrapper. Accepts string or node. */
  label?: React.ReactNode;

  /** Supplemental hint or validation content typically rendered under the control. */
  helperText?: React.ReactNode;

  /** Marks the field invalid; components may adjust visuals and helper text color. */
  error?: boolean;

  /** Stretches the field wrapper to occupy the full available width. */
  fullWidth?: boolean;

  /** Inline styles (with CSS var support). */
  sx?: Sx;
}

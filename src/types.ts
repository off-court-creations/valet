// ─────────────────────────────────────────────────────────────
// src/types.ts  | valet
// shared types: presets, spacing ergonomics, and field base props
// ─────────────────────────────────────────────────────────────
import type React from 'react';
import type { Breakpoint } from './system/themeStore';

export interface Presettable {
  /** One or many style-preset names registered via `definePreset()` */
  preset?: string | string[];
}

/** Numeric values are mapped via theme.spacing(n); strings pass through. */
export type Space = number | string;

/**
 * A value that can vary by breakpoint. Either a single value applied at all
 * widths, or a partial breakpoint map (`{ xs, sm, md, lg, xl }`) whose entries
 * each apply from that breakpoint's `min-width` upward (mobile-first).
 *
 * Breakpoint maps compile to CSS `@media (min-width: …)` rules **inside the
 * `styled()` template** (via `utils/responsive`) — there is no JS resolution,
 * no `<Surface>` dependency, and no first-paint reflow, so a responsive layout
 * is correct on the server's first paint. Keep breakpoint maps to enumerable
 * values; binding one to continuously-varying state (e.g. a slider) mints a
 * permanent CSS rule per value (see the engine's rule-cardinality tripwire).
 */
export type Responsive<T> = T | Partial<Record<Breakpoint, T>>;

/** Common spacing props shared across layout components. */
export interface SpacingProps {
  /** Inter-child spacing as units or CSS length. */
  gap?: Space;
  /** Container padding as units or CSS length. */
  pad?: Space;
  /**
   * Zeros all layout spacing (pad, gap, and spacing-margins) where supported and
   * cascades to spacing-aware descendants. Does not touch control insets,
   * structural geometry, border-radius, glyph sizes, or alignment. `compact={false}`
   * opts a subtree back out of an inherited compact.
   */
  compact?: boolean;
  /** Density override for the spacing scale; defaults from nearest Surface. */
  density?: 'tight' | 'standard' | 'comfortable';
}

/** Sx prop: inline CSS with support for CSS custom properties (e.g. --valet-*) */
export type Sx = React.CSSProperties & { [key: `--${string}`]: string | number };

/**
 * Semantic colour intent shared by every intent-driven component
 * (Button, IconButton, Chip, Panel, AppBar). The seven named tokens map to
 * theme colours; the `(string & {})` member keeps the union open so a caller
 * can pass an arbitrary theme-token name or CSS colour while preserving
 * autocomplete on the canonical names.
 *
 * Canonical single source of truth (API-TYPES S12): the five components above
 * each declared this union verbatim — a copy-paste that drifts on edit. They
 * now alias this type instead.
 */
export type Intent =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | (string & {});

/**
 * Unified selection vocabulary shared by collection components (Table, List,
 * Tree) — API-TYPES S11, ruling Q11(a)/R12. Before this, each collection spoke
 * a different dialect: Table used `selectable: 'single' | 'multi'` with a
 * row-array `onSelectionChange`, List used a single `selected: T | null` + a
 * `getKey` identity, and Tree used `selected: string` ids. The three now share
 * one keyed vocabulary so the same name means the same thing everywhere.
 *
 * `K` is the **selection unit** each component exposes:
 * - Table — `K = T` (the row type; identity is keyed internally by `getItemKey`/`rowKey`).
 * - List  — `K = T` (the item type; selection is by reference, `getItemKey` standardizes reorder identity).
 * - Tree  — `K = string` (the node id).
 *
 * Components adopt the subset they support and re-document the generic in their
 * own prop types. `selected`/`defaultSelected` are always **arrays** so the
 * single- and multiple-selection shapes share one type; a single-selection
 * component simply ignores all but the last entry. Each component carries the
 * pre-S11 names as one-minor deprecated aliases (`deprecate.ts`), removed at 1.0.
 */
export interface SelectionProps<K> {
  /**
   * How many items may be selected at once.
   * - `'none'` — selection is disabled (the default for components that gate it).
   * - `'single'` — at most one item is selected.
   * - `'multiple'` — any number of items may be selected.
   *
   * Canonical replacement for the per-component flags (Table's `selectable`).
   */
  selectionMode?: 'none' | 'single' | 'multiple';

  /** Controlled selection as an array of selection units (`K`). */
  selected?: K[];

  /** Uncontrolled initial selection as an array of selection units (`K`). */
  defaultSelected?: K[];

  /**
   * Fired when the selection changes (user interaction only — never on mount
   * or on a derived prune that merely keeps the array in sync). Receives the
   * full next selection as an array of selection units.
   */
  onSelectionChange?: (selected: K[]) => void;

  /**
   * Stable identity for each item — a property name or a function of the item
   * and its index. Canonical, cross-component replacement for Table's `rowKey`
   * and List's `getKey`. When omitted, components fall back to reference/index
   * identity exactly as before.
   */
  getItemKey?: keyof K | ((item: K, index: number) => string | number);
}

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

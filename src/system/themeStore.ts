// ─────────────────────────────────────────────────────────────
// src/system/themeStore.ts | valet
// mode/density store on the overlay theme model: every setTheme
// patch folds into a cumulative overlay and setMode/toggleMode
// recompose base + overlay (custom themes survive mode toggles)
// ─────────────────────────────────────────────────────────────
import { createWithEqualityFn as create } from 'zustand/traditional';
import type { Variant, FluidSize, WeightAlias } from '../types/typography';
import { baseTheme, composeTheme, mergeThemePatch } from './themeUtils';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ThemeMode = 'light' | 'dark';
export type Density = 'tight' | 'standard' | 'comfortable';

export interface Theme {
  colors: Record<string, string>;
  /** Human-readable names for color tokens */
  colorNames: Record<string, string>;
  /** Returns a CSS length for the given number of spacing units */
  spacing: (units: number) => string;
  /** Base unit used by the spacing helper */
  spacingUnit: string;
  /** Returns a CSS length for border radii using a relative base */
  radius: (units: number) => string;
  /** Base unit used by the radius helper */
  radiusUnit: string;
  /** Returns a CSS length for strokes/borders using a relative base */
  stroke: (units: number) => string;
  /** Base unit used by the stroke helper */
  strokeUnit: string;
  /**
   * Motion and animation tokens: common durations, easing curves,
   * and a small set of tuned values for reusable interactions.
   */
  motion: {
    /** Canonical durations to keep motion consistent across components */
    duration: {
      /** e.g. micro feedback, tap highlights */
      xshort: string; // ~120 ms
      /** e.g. tooltip fade, small nudge */
      short: string; // ~140 ms
      /** e.g. color or small position transitions */
      medium: string; // ~180 ms
      /** e.g. base UI enters/exits (snackbars, toasts) */
      base: string; // ~200 ms
      /** e.g. larger layout shifts or content settles */
      long: string; // ~420 ms
      /** e.g. exaggerated distances or elastic UI sweeps */
      xlong: string; // ~760 ms
    };
    /** Named cubic-bezier curves for consistent feel */
    easing: {
      /** Crisp ease-out; good general-purpose settle */
      standard: string; // cubic-bezier(0.2, 0.7, 0.1, 1)
      /** Slightly punchier ease for emphasized motion */
      emphasized: string; // cubic-bezier(0.22, 0.8, 0.2, 1)
      /** Gentle overshoot for micro pulses */
      overshoot: string; // cubic-bezier(0.2, 0.8, 0.2, 1.05)
      /** Pass-throughs for convenience */
      linear: string;
      ease: string;
    };
    /** Default hover interaction tokens */
    hover: {
      duration: string;
      easing: string;
    };
    /** Tuned values for tab/underline-style follow animations */
    underline: {
      stretch: { baseMs: number; distanceCoef: number; minMs: number; maxMs: number };
      settle: { baseMs: number; distanceCoef: number; minMs: number; maxMs: number };
    };
  };
  breakpoints: Record<Breakpoint, number>;
  /** Fixed sizes per breakpoint for semantic text variants */
  typography: Record<Variant, Record<Breakpoint, string>>;
  /** Optional fluid sizes compiled to clamp(); falls back to breakpoint sizes */
  typographyFluid?: Partial<Record<Variant, FluidSize>>;
  /** Optional unitless line-height per variant */
  lineHeight?: Partial<Record<Variant, number>>;
  /** Optional letter-spacing per variant (px/em) */
  letterSpacing?: Partial<Record<Variant, string | number>>;
  /** Optional allowed weights per variant (either list or min/max range) */
  weights?: Partial<Record<Variant, number[] | { min: number; max: number }>>;
  /** Aliases for common weights */
  weightAliases?: Partial<Record<WeightAlias, number>>;
  /**
   * Optional per-family defaults for line-height and letter-spacing.
   * Use either a base value (applies to all variants mapped to that family)
   * or a per-variant map for fine control.
   */
  typographyFamilies?: Partial<
    Record<
      'heading' | 'body' | 'mono' | 'button',
      {
        lineHeight?: number | Partial<Record<Variant, number>>;
        letterSpacing?: string | number | Partial<Record<Variant, string | number>>;
      }
    >
  >;
  fonts: {
    heading: string;
    body: string;
    mono: string;
    button: string;
  };
  /** Default optical sizing behavior for variable fonts */
  fontOpticalSizing?: 'auto' | 'none';
}

interface ThemeStore {
  mode: ThemeMode;
  theme: Theme;
  /** Cumulative user patches; re-applied on top of the base on every mode change */
  overlay: Partial<Theme>;
  density: Density;

  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
  setTheme: (patch: Partial<Theme>) => void;
  /** Clear all setTheme customisations and return to the built-in theme */
  resetTheme: () => void;
  setDensity: (d: Density) => void;
}

/*───────────────────────────────────────────────────────────*/
export const useTheme = create<ThemeStore>((set, get) => ({
  mode: 'dark',
  theme: baseTheme('dark'),
  overlay: {},
  density: 'standard',

  // Recompose base + overlay instead of resetting — custom colors,
  // spacing, motion, typography etc. survive dark/light toggles.
  setMode: (mode) =>
    set((state) => ({
      mode,
      theme: composeTheme(mode, state.overlay),
    })),

  toggleMode: () => get().setMode(get().mode === 'dark' ? 'light' : 'dark'),

  setTheme: (patch) =>
    set((state) => {
      const overlay = mergeThemePatch(state.overlay, patch);
      return { overlay, theme: composeTheme(state.mode, overlay) };
    }),

  resetTheme: () =>
    set((state) => ({
      overlay: {},
      theme: baseTheme(state.mode),
    })),

  setDensity: (density) => set(() => ({ density })),
}));

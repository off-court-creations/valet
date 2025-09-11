// ─────────────────────────────────────────────────────────────
// src/system/themeStore.ts | valet
// add density + var-based spacing unit + radius/stroke helpers
// ─────────────────────────────────────────────────────────────
import { createWithEqualityFn as create } from 'zustand/traditional';
import type { Variant, FluidSize, WeightAlias } from '../types/typography';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ThemeMode = 'light' | 'dark';
export type Density = 'comfortable' | 'compact' | 'tight' | 'zero';

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
  density: Density;

  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
  setTheme: (patch: Partial<Theme>) => void;
  setDensity: (d: Density) => void;
}

const spacingUnit = '0.5rem';

/* ── theme object with the fixed spacing helper ────────────── */
const common: Omit<Theme, 'colors' | 'colorNames'> = {
  // Spacing is expressed in terms of a CSS custom property so density
  // can be adjusted per-Surface. The var defaults to spacingUnit.
  // Example: spacing(4) → `calc(var(--valet-space, 0.5rem) * 4)`
  spacing: (u: number) => `calc(var(--valet-space, ${spacingUnit}) * ${u})`,
  spacingUnit: spacingUnit,
  // Radius defaults to a fraction of the spacing unit so it scales with density
  // Example: radius(2) → `calc(var(--valet-radius, calc(var(--valet-space, 0.5rem) * 0.75)) * 2)`
  radius: (u: number) =>
    `calc(var(--valet-radius, calc(var(--valet-space, ${spacingUnit}) * 0.75)) * ${u})`,
  radiusUnit: `calc(var(--valet-space, ${spacingUnit}) * 0.75)`,
  // Stroke defaults to a thin thickness derived from spacing (≈1px at 16px base)
  // Example: stroke(2) → `calc(var(--valet-stroke, calc(var(--valet-space, 0.5rem) * 0.125)) * 2)`
  stroke: (u: number) =>
    `calc(var(--valet-stroke, calc(var(--valet-space, ${spacingUnit}) * 0.125)) * ${u})`,
  strokeUnit: `calc(var(--valet-space, ${spacingUnit}) * 0.125)`,
  motion: {
    duration: {
      xshort: '100ms',
      short: '140ms',
      medium: '180ms',
      base: '200ms',
      long: '380ms',
      xlong: '760ms',
    },
    easing: {
      standard: 'cubic-bezier(0.2, 0.7, 0.1, 1)',
      emphasized: 'cubic-bezier(0.22, 0.8, 0.2, 1)',
      overshoot: 'cubic-bezier(0.2, 0.8, 0.2, 1.05)',
      linear: 'linear',
      ease: 'ease',
    },
    /** Default hover interactions */
    hover: {
      duration: '120ms',
      easing: 'cubic-bezier(0.2, 0.7, 0.1, 1)', // align with standard
    },
    underline: {
      // Phase 1: near-edge stretch
      stretch: { baseMs: 100, distanceCoef: 0.9, minMs: 90, maxMs: 420 },
      // Phase 2: far-edge settle/shrink
      settle: { baseMs: 120, distanceCoef: 0.45, minMs: 140, maxMs: 420 },
    },
  },
  breakpoints: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
  typography: {
    h1: { xs: '2rem', sm: '2.5rem', md: '3rem', lg: '3.5rem', xl: '4rem' },
    h2: { xs: '1.5rem', sm: '2rem', md: '2.5rem', lg: '3rem', xl: '3.5rem' },
    h3: { xs: '1.25rem', sm: '1.5rem', md: '2rem', lg: '2.5rem', xl: '3rem' },
    h4: { xs: '1rem', sm: '1.25rem', md: '1.5rem', lg: '2rem', xl: '2.5rem' },
    h5: { xs: '0.875rem', sm: '1rem', md: '1.25rem', lg: '1.5rem', xl: '2rem' },
    h6: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '1.5rem',
    },
    body: { xs: '0.875rem', sm: '1rem', md: '1rem', lg: '1rem', xl: '1rem' },
    subtitle: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '0.875rem',
      lg: '1rem',
      xl: '1rem',
    },
    button: {
      xs: '0.875rem',
      sm: '0.875rem',
      md: '0.875rem',
      lg: '1rem',
      xl: '1rem',
    },
  },
  weightAliases: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fonts: {
    heading: 'Kumbh Sans',
    body: 'Inter',
    mono: 'JetBrains Mono',
    button: 'Kumbh Sans',
  },
  fontOpticalSizing: 'auto',
};

const lightColors = {
  // primary — Euro Blue (refined cobalt) as primary accent
  primary: '#2C5CC5',
  // primaryText — Porcelain Off-White (text on Euro Blue)
  primaryText: '#F7F7F7',
  // secondary — Signal Orange (promoted from error)
  secondary: '#D16701',
  // secondaryText — Graphite (text on Signal Orange)
  secondaryText: '#1b1b1b',
  // tertiary — Ice Blue (very light accent)
  tertiary: '#E5F6F6',
  // tertiaryText — Graphite (text on Ice Blue)
  tertiaryText: '#1b1b1b',
  // error — Signal Red (new error intent)
  error: '#D32F2F',
  // errorText — Porcelain Off-White (text on Signal Red)
  errorText: '#F7F7F7',
  // Button text mapping mirrors the above text-on-accent logic
  // primaryButtonText — Porcelain Off-White
  primaryButtonText: '#F7F7F7',
  // secondaryButtonText — Graphite
  secondaryButtonText: '#1b1b1b',
  // tertiaryButtonText — Graphite
  tertiaryButtonText: '#1b1b1b',
  // background — Ice Blue (base surface in light mode)
  background: '#E5F6F6',
  // backgroundAlt — Cool Grey (elevated/alt surface)
  backgroundAlt: '#47484d',
  // text — Ink Black (default foreground)
  text: '#090909',
} as const;

const lightColorNames: Record<keyof typeof lightColors, string> = {
  primary: 'Euro Blue',
  primaryText: 'Porcelain Off-White',
  secondary: 'Signal Orange',
  secondaryText: 'Graphite',
  tertiary: 'Ice Blue',
  tertiaryText: 'Graphite',
  error: 'Signal Red',
  errorText: 'Porcelain Off-White',
  primaryButtonText: 'Porcelain Off-White',
  secondaryButtonText: 'Graphite',
  tertiaryButtonText: 'Graphite',
  background: 'Ice Blue',
  backgroundAlt: 'Cool Grey',
  text: 'Ink Black',
};

const darkColors = {
  // primary — Euro Blue (refined cobalt)
  primary: '#2C5CC5',
  // primaryText — Porcelain Off-White (text on Euro Blue)
  primaryText: '#F7F7F7',
  // secondary — Signal Orange
  secondary: '#D16701',
  // secondaryText — Graphite (text on Signal Orange)
  secondaryText: '#1b1b1b',
  // tertiary — Ice Blue
  tertiary: '#E5F6F6',
  // tertiaryText — Graphite (text on Ice Blue)
  tertiaryText: '#1b1b1b',
  // error — Signal Red
  error: '#D32F2F',
  // errorText — Porcelain Off-White (text on Signal Red)
  errorText: '#F7F7F7',
  // Button text mapping for contained variants
  // primaryButtonText — Porcelain Off-White
  primaryButtonText: '#F7F7F7',
  // secondaryButtonText — Graphite
  secondaryButtonText: '#1b1b1b',
  // tertiaryButtonText — Graphite
  tertiaryButtonText: '#1b1b1b',
  // background — Carbon (base surface in dark mode)
  background: '#242424',
  // backgroundAlt — Cool Grey (elevated/alt surface)
  backgroundAlt: '#47484d',
  // text — Porcelain Off-White (default foreground)
  text: '#F7F7F7',
} as const;

const darkColorNames: Record<keyof typeof darkColors, string> = {
  primary: 'Euro Blue',
  primaryText: 'Porcelain Off-White',
  secondary: 'Signal Orange',
  secondaryText: 'Graphite',
  tertiary: 'Ice Blue',
  tertiaryText: 'Graphite',
  error: 'Signal Red',
  errorText: 'Porcelain Off-White',
  primaryButtonText: 'Porcelain Off-White',
  secondaryButtonText: 'Graphite',
  tertiaryButtonText: 'Graphite',
  background: 'Carbon',
  backgroundAlt: 'Cool Grey',
  text: 'Porcelain Off-White',
};

/*───────────────────────────────────────────────────────────*/
export const useTheme = create<ThemeStore>((set, get) => ({
  mode: 'dark',
  theme: {
    ...common,
    colors: darkColors,
    colorNames: { ...darkColorNames },
  },
  density: 'comfortable',

  setMode: (mode) =>
    set((state) => ({
      mode,
      theme: {
        ...common,
        colors: mode === 'dark' ? darkColors : lightColors,
        colorNames: mode === 'dark' ? { ...darkColorNames } : { ...lightColorNames },
        fonts: state.theme.fonts,
      },
    })),

  toggleMode: () => get().setMode(get().mode === 'dark' ? 'light' : 'dark'),

  setTheme: (patch) =>
    set((state) => {
      const nextColors = patch.colors
        ? { ...state.theme.colors, ...patch.colors }
        : state.theme.colors;
      const providedNames = (patch as Partial<Theme>).colorNames || {};
      const nextNamesBase = { ...state.theme.colorNames, ...providedNames };

      // Generate names for any provided color tokens missing a name
      const genName = (hex: string) => `Custom ${hex?.toUpperCase?.() ?? ''}`.trim();
      if (patch.colors) {
        for (const k of Object.keys(patch.colors)) {
          if (!nextNamesBase[k])
            nextNamesBase[k] = genName((patch.colors as Record<string, string>)[k]);
        }
      }

      const nextTheme: Theme = {
        ...state.theme,
        ...patch,
        colors: nextColors,
        colorNames: nextNamesBase,
      } as Theme;
      return { theme: nextTheme };
    }),

  setDensity: (density) => set(() => ({ density })),
}));

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
  // Conservative defaults; can be overridden via setTheme/useInitialTheme
  typographyFamilies: {
    heading: {
      lineHeight: { h1: 1.15, h2: 1.15, h3: 1.15, h4: 1.2, h5: 1.2, h6: 1.2 },
      letterSpacing: { h1: '-0.02em', h2: '-0.015em', h3: '-0.01em' },
    },
    body: {
      lineHeight: { body: 1.5, subtitle: 1.35 },
      letterSpacing: { body: '0em', subtitle: '0em' },
    },
    mono: {
      lineHeight: { body: 1.45 },
      letterSpacing: { body: '0em' },
    },
    button: {
      lineHeight: { button: 1 },
      letterSpacing: { button: '0.02em' },
    },
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
  primary: '#0E65C0',
  primaryText: '#F7F7F7',
  secondary: '#45706C',
  secondaryText: '#F7F7F7',
  tertiary: '#C0E6FF',
  tertiaryText: '#1b1b1b',
  error: '#D32F2F',
  errorText: '#F7F7F7',
  primaryButtonText: '#F7F7F7',
  secondaryButtonText: '#F7F7F7',
  tertiaryButtonText: '#1b1b1b',
  background: '#f4f4f4',
  backgroundAlt: '#D6D6D6',
  text: '#090909',
} as const;

const lightColorNames: Record<keyof typeof lightColors, string> = {
  primary: 'Euro Blue',
  primaryText: 'Porcelain Off-White',
  secondary: 'Deep Teal',
  secondaryText: 'Porcelain Off-White',
  tertiary: 'Ice Blue',
  tertiaryText: 'Graphite',
  error: 'Signal Red',
  errorText: 'Porcelain Off-White',
  primaryButtonText: 'Porcelain Off-White',
  secondaryButtonText: 'Porcelain Off-White',
  tertiaryButtonText: 'Graphite',
  background: 'Porcelain Off-White',
  backgroundAlt: 'Cool Grey',
  text: 'Ink Black',
};

const darkColors = {
  primary: '#0E65C0',
  primaryText: '#F7F7F7',
  secondary: '#45706C',
  secondaryText: '#F7F7F7',
  tertiary: '#C0E6FF',
  tertiaryText: '#1b1b1b',
  error: '#D32F2F',
  errorText: '#F7F7F7',
  primaryButtonText: '#F7F7F7',
  secondaryButtonText: '#F7F7F7',
  tertiaryButtonText: '#1b1b1b',
  background: '#161616',
  backgroundAlt: '#363636',
  text: '#F7F7F7',
} as const;

const darkColorNames: Record<keyof typeof darkColors, string> = {
  primary: 'Euro Blue',
  primaryText: 'Porcelain Off-White',
  secondary: 'Deep Teal',
  secondaryText: 'Porcelain Off-White',
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

      // Deep-merge for typographyFamilies
      const mergeTypographyFamilies = (
        base: Theme['typographyFamilies'] | undefined,
        incoming: Theme['typographyFamilies'] | undefined,
      ): Theme['typographyFamilies'] => {
        if (!incoming) return base;

        type Families = NonNullable<Theme['typographyFamilies']>;
        type FamilyKey = keyof Families;
        type FamilyConfig = {
          lineHeight?: number | Partial<Record<Variant, number>>;
          letterSpacing?: string | number | Partial<Record<Variant, string | number>>;
        };

        const out: Families = { ...(base || {}) } as Families;
        const baseFamilies = (base || {}) as Partial<Record<FamilyKey, FamilyConfig>>;
        const incFamilies = (incoming || {}) as Partial<Record<FamilyKey, FamilyConfig>>;

        for (const fam of Object.keys(incFamilies) as FamilyKey[]) {
          const b = baseFamilies[fam] || ({} as FamilyConfig);
          const inc = incFamilies[fam] || ({} as FamilyConfig);

          const mergeEntry = <T>(curr: T | undefined, add: T | undefined): T | undefined => {
            if (add == null) return curr;
            if (typeof add !== 'object' || Array.isArray(add)) return add;
            if (typeof curr !== 'object' || Array.isArray(curr) || curr == null)
              return { ...(add as object) } as T;
            return { ...(curr as object), ...(add as object) } as T;
          };

          (out as Record<FamilyKey, FamilyConfig>)[fam] = {
            lineHeight: mergeEntry(b.lineHeight, inc.lineHeight),
            letterSpacing: mergeEntry(b.letterSpacing, inc.letterSpacing),
          } as FamilyConfig;
        }
        return out as Theme['typographyFamilies'];
      };

      const nextTypographyFamilies = mergeTypographyFamilies(
        state.theme.typographyFamilies,
        patch.typographyFamilies,
      );

      const nextTheme: Theme = {
        ...state.theme,
        ...patch,
        colors: nextColors,
        colorNames: nextNamesBase,
        typographyFamilies: nextTypographyFamilies,
      } as Theme;
      return { theme: nextTheme };
    }),

  setDensity: (density) => set(() => ({ density })),
}));

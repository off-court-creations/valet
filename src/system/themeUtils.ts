// ─────────────────────────────────────────────────────────────
// src/system/themeUtils.ts | valet
// pure theme composition: baseTheme(mode) + mergeThemePatch +
// composeTheme(mode, overlay) — the overlay model that lets user
// customisations survive mode toggles
// ─────────────────────────────────────────────────────────────
import type { Theme, ThemeMode } from './themeStore';

const spacingUnit = '0.5rem';

/* ── mode-independent tokens (helpers, motion, typography…) ── */
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

/* ── built-in palettes ───────────────────────────────────────── */
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
  divider: '#BDBDBD',
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
  divider: 'Keyline Grey',
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
  divider: '#5A5A5A',
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
  // #F7F7F7 — was mislabelled 'Graphite' (the name for #1b1b1b)
  secondaryButtonText: 'Porcelain Off-White',
  tertiaryButtonText: 'Graphite',
  background: 'Carbon',
  // #363636 — was 'Cool Grey' (the light palette's #D6D6D6)
  backgroundAlt: 'Charcoal',
  // #5A5A5A — was 'Keyline Grey' (the light palette's #BDBDBD)
  divider: 'Slate Grey',
  text: 'Porcelain Off-White',
};

/* ── helpers ─────────────────────────────────────────────────── */
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Deep-copy plain objects/arrays; primitives and functions pass through. */
const cloneTokens = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(cloneTokens) as unknown as T;
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value)) out[k] = cloneTokens(value[k]);
    return out as T;
  }
  return value;
};

/** Matches setTheme's historical auto-naming for unnamed colour tokens */
const genColorName = (hex: string) => `Custom ${hex?.toUpperCase?.() ?? ''}`.trim();

/*───────────────────────────────────────────────────────────────*/
/**
 * Fresh built-in theme for the given mode. Every call returns newly
 * cloned objects so mutating one composed theme can never leak into
 * the module-level palettes or another mode (themeStore.ts:307/317 bug).
 */
export const baseTheme = (mode: ThemeMode): Theme => ({
  ...cloneTokens(common),
  colors: { ...(mode === 'dark' ? darkColors : lightColors) },
  colorNames: { ...(mode === 'dark' ? darkColorNames : lightColorNames) },
});

/**
 * Pure deep merge of a theme patch onto a base. Plain objects merge
 * recursively (so partial `motion`, `typographyFamilies`, `colors`, …
 * patches are additive); arrays, functions and primitives replace.
 * Neither input is mutated.
 */
export const mergeThemePatch = <T extends Partial<Theme>>(base: T, patch: Partial<Theme>): T => {
  const merge = (b: unknown, p: unknown): unknown => {
    if (isPlainObject(b) && isPlainObject(p)) {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(b)) out[k] = cloneTokens(b[k]);
      for (const k of Object.keys(p)) {
        // Explicitly-undefined keys mean "no change", never "delete" — the
        // legacy setTheme guarded colors/colorNames/typographyFamilies this
        // way, and `setTheme({ colors: cond ? {…} : undefined })` type-checks
        // (no exactOptionalPropertyTypes). Without the skip such a patch
        // would wipe theme.colors and poison the cumulative overlay.
        if (p[k] === undefined) continue;
        out[k] = k in out ? merge(out[k], p[k]) : cloneTokens(p[k]);
      }
      return out;
    }
    return cloneTokens(p);
  };
  return merge(base, patch) as T;
};

/**
 * Compose the effective theme: built-in base for `mode` with the user's
 * cumulative overlay merged on top. Overlay colour tokens that end up
 * without a human-readable name receive a generated one.
 */
export const composeTheme = (mode: ThemeMode, overlay: Partial<Theme>): Theme => {
  const merged = mergeThemePatch(baseTheme(mode), overlay);
  if (overlay.colors) {
    for (const k of Object.keys(overlay.colors)) {
      if (!merged.colorNames[k]) merged.colorNames[k] = genColorName(overlay.colors[k]);
    }
  }
  return merged;
};

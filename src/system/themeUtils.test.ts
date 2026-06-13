// ─────────────────────────────────────────────────────────────
// src/system/themeUtils.test.ts | valet
// overlay theme model: setMode no longer wipes customisations;
// resetTheme; palette isolation; deep merge incl. motion
// ─────────────────────────────────────────────────────────────
import { describe, it, expect, beforeEach } from 'vitest';
import { baseTheme, mergeThemePatch, composeTheme } from './themeUtils';
import { useTheme } from './themeStore';
import type { Theme } from './themeStore';

beforeEach(() => {
  // The store is a module singleton — restore built-in dark defaults
  useTheme.getState().setMode('dark');
  useTheme.getState().resetTheme();
});

/* ── the audit's Node repro (themeStore.ts:312 brand-wipe) ──── */
describe('setMode/toggleMode keeps custom theme state', () => {
  it('custom colors, new tokens, spacing and motion survive a mode toggle', () => {
    const { setTheme, toggleMode } = useTheme.getState();

    setTheme({
      colors: { primary: '#FF00AA', brand: '#00FF00' },
      spacingUnit: '0.25rem',
      // Partial motion patches are deep-merged
      motion: { duration: { base: '999ms' } } as unknown as Theme['motion'],
    });

    // sanity: patch applied in dark mode
    expect(useTheme.getState().theme.colors.primary).toBe('#FF00AA');

    toggleMode(); // dark → light

    const { mode, theme } = useTheme.getState();
    expect(mode).toBe('light');
    // customisations survive…
    expect(theme.colors.primary).toBe('#FF00AA');
    expect(theme.colors.brand).toBe('#00FF00');
    expect(theme.spacingUnit).toBe('0.25rem');
    expect(theme.motion.duration.base).toBe('999ms');
    // …deep merge kept the untouched motion siblings…
    expect(theme.motion.duration.short).toBe('140ms');
    expect(theme.motion.easing.standard).toBe('cubic-bezier(0.2, 0.7, 0.1, 1)');
    // …while mode-dependent tokens actually swapped
    expect(theme.colors.background).toBe('#f4f4f4');

    toggleMode(); // light → dark
    const back = useTheme.getState().theme;
    expect(back.colors.background).toBe('#161616');
    expect(back.colors.primary).toBe('#FF00AA');
    expect(back.spacingUnit).toBe('0.25rem');
    expect(back.motion.duration.base).toBe('999ms');
  });

  it('patches accumulate across multiple setTheme calls and survive toggles', () => {
    const { setTheme, toggleMode } = useTheme.getState();

    setTheme({ colors: { brand: '#111111' } });
    setTheme({ spacingUnit: '1rem' });
    setTheme({
      fonts: { heading: 'Brand Sans', body: 'Inter', mono: 'JetBrains Mono', button: 'Brand Sans' },
    });

    toggleMode();

    const { theme } = useTheme.getState();
    expect(theme.colors.brand).toBe('#111111');
    expect(theme.spacingUnit).toBe('1rem');
    expect(theme.fonts.heading).toBe('Brand Sans');
  });
});

/* ── resetTheme ──────────────────────────────────────────────── */
describe('resetTheme', () => {
  it('drops the overlay and returns the built-in theme for the current mode', () => {
    const { setTheme, resetTheme } = useTheme.getState();

    setTheme({ colors: { primary: '#FF00AA', brand: '#00FF00' }, spacingUnit: '0.25rem' });
    resetTheme();

    const { theme, overlay, mode } = useTheme.getState();
    expect(mode).toBe('dark');
    expect(overlay).toEqual({});
    expect(theme.colors.primary).toBe('#0E65C0');
    expect('brand' in theme.colors).toBe(false);
    expect(theme.spacingUnit).toBe('0.5rem');

    // a later toggle stays on built-in defaults
    useTheme.getState().toggleMode();
    expect(useTheme.getState().theme.colors.primary).toBe('#0E65C0');
    expect(useTheme.getState().theme.colors.background).toBe('#f4f4f4');
  });
});

/* ── palette isolation (themeStore.ts:307/317 shared refs) ──── */
describe('palette isolation', () => {
  it('mutating the live theme palette cannot leak into the other mode', () => {
    const { theme } = useTheme.getState();
    theme.colors.primary = '#BADBAD';
    theme.colorNames.primary = 'Vandalised';

    useTheme.getState().setMode('light');
    expect(useTheme.getState().theme.colors.primary).toBe('#0E65C0');
    expect(useTheme.getState().theme.colorNames.primary).toBe('Euro Blue');

    useTheme.getState().setMode('dark');
    expect(useTheme.getState().theme.colors.primary).toBe('#0E65C0');
    expect(useTheme.getState().theme.colorNames.primary).toBe('Euro Blue');
  });

  it('baseTheme returns fresh objects on every call', () => {
    const a = baseTheme('dark');
    const b = baseTheme('dark');
    expect(a.colors).not.toBe(b.colors);
    expect(a.colorNames).not.toBe(b.colorNames);
    expect(a.motion).not.toBe(b.motion);

    a.colors.primary = '#BADBAD';
    a.motion.duration.base = '1ms';
    expect(b.colors.primary).toBe('#0E65C0');
    expect(b.motion.duration.base).toBe('200ms');
    expect(baseTheme('light').colors.primary).toBe('#0E65C0');
  });
});

/* ── darkColorNames data fixes (themeStore.ts:284–300) ──────── */
describe('built-in palette names', () => {
  it('dark names no longer mislabel hexes with light-palette names', () => {
    const dark = baseTheme('dark');
    // #F7F7F7 was labelled 'Graphite' (the name for #1b1b1b)
    expect(dark.colorNames.secondaryButtonText).toBe('Porcelain Off-White');
    // #363636 / #5A5A5A no longer reuse the light greys' names
    expect(dark.colorNames.backgroundAlt).not.toBe('Cool Grey');
    expect(dark.colorNames.divider).not.toBe('Keyline Grey');
    // unchanged correct entries
    expect(dark.colorNames.tertiaryButtonText).toBe('Graphite');
    expect(dark.colorNames.background).toBe('Carbon');
  });
});

/* ── mergeThemePatch / composeTheme units ────────────────────── */
describe('mergeThemePatch', () => {
  it('deep-merges nested groups without dropping siblings and without mutating inputs', () => {
    const base = baseTheme('dark');
    const patch: Partial<Theme> = {
      motion: { duration: { long: '500ms' } } as unknown as Theme['motion'],
      typographyFamilies: { heading: { lineHeight: { h1: 1.05 } } },
    };

    const merged = mergeThemePatch(base, patch);

    expect(merged.motion.duration.long).toBe('500ms');
    expect(merged.motion.duration.base).toBe('200ms');
    expect(merged.motion.hover.duration).toBe('120ms');
    expect(merged.typographyFamilies?.heading?.lineHeight).toMatchObject({ h1: 1.05, h2: 1.15 });
    expect(merged.typographyFamilies?.body?.lineHeight).toMatchObject({ body: 1.5 });

    // inputs untouched
    expect(base.motion.duration.long).toBe('380ms');
    expect(patch.motion?.duration.long).toBe('500ms');
    // helpers (functions) pass through intact
    expect(merged.spacing(4)).toBe(base.spacing(4));
  });

  it('folds partial overlays together (Partial base)', () => {
    const a: Partial<Theme> = { colors: { brand: '#111111' } };
    const b = mergeThemePatch(a, { spacingUnit: '1rem' });
    expect(b).toEqual({ colors: { brand: '#111111' }, spacingUnit: '1rem' });
    expect(a).toEqual({ colors: { brand: '#111111' } }); // not mutated
  });

  it('treats explicitly-undefined patch keys as "no change", not deletion', () => {
    // `{ colors: cond ? {…} : undefined }` type-checks without
    // exactOptionalPropertyTypes; legacy setTheme kept the current tokens.
    const base = baseTheme('dark');
    const merged = mergeThemePatch(base, {
      colors: undefined,
      motion: { duration: undefined } as unknown as Theme['motion'],
    });
    expect(merged.colors).toEqual(base.colors);
    expect(merged.motion.duration.base).toBe('200ms');

    // store-level: an undefined patch key cannot wipe the composed theme
    // (or poison the cumulative overlay until resetTheme)
    useTheme.getState().setTheme({ colors: undefined });
    expect(useTheme.getState().theme.colors).toBeDefined();
    expect(useTheme.getState().theme.colors.background).toBe('#161616');
    useTheme.getState().toggleMode(); // overlay not poisoned either
    expect(useTheme.getState().theme.colors.background).toBe('#f4f4f4');
    useTheme.getState().toggleMode();
  });
});

describe('composeTheme', () => {
  it('generates names for unnamed overlay tokens, keeps built-in names for re-hexed tokens', () => {
    const theme = composeTheme('dark', { colors: { accent: '#abc123', primary: '#FF00AA' } });
    expect(theme.colorNames.accent).toBe('Custom #ABC123');
    expect(theme.colorNames.primary).toBe('Euro Blue');
    expect(theme.colors.primary).toBe('#FF00AA');
  });

  it('respects caller-provided names over generated ones', () => {
    const theme = composeTheme('light', {
      colors: { accent: '#abc123' },
      colorNames: { accent: 'Lichen' },
    });
    expect(theme.colorNames.accent).toBe('Lichen');
  });
});

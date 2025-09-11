// ─────────────────────────────────────────────────────────────
// src/system/createInitialTheme.ts | valet
// helper for setting the initial theme and loading fonts
// ─────────────────────────────────────────────────────────────
import type { Theme } from './themeStore';
import { useTheme } from './themeStore';
import { useFonts } from './fontStore';
import { useEffect } from 'react';
import { injectFontLinks, waitForFonts, GoogleFontOptions, Font } from '../helpers/fontLoader';

// Infer keys from Theme so this stays in sync if you add/remove slots later
type FontKeys = keyof Theme['fonts'];
type ThemeFonts = Theme['fonts'];

// Normalize a Font union to its family/name string
const fontToName = (f: Font): string => {
  if (typeof f === 'string') return f;
  if ('name' in f) return f.name;
  if ('family' in f) return f.family;
  return '';
};

export async function createInitialTheme(
  patch: Partial<
    Omit<Theme, 'fonts'> & {
      fonts?: Partial<Record<FontKeys, Font>>;
    }
  >,
  extras: Font[] = [],
  options?: GoogleFontOptions,
): Promise<void> {
  // Read current theme once to help build a complete fonts object
  const { setTheme, theme: currentTheme } = useTheme.getState();

  // Destructure fonts away so the rest of the patch is cleanly typed as Omit<Theme, 'fonts'>
  const { fonts: incomingFonts, ...rest } = patch;

  // Start with the non-font parts of the patch
  const themePatch: Partial<Theme> = { ...rest };

  // If fonts are provided, convert to a proper Theme['fonts'] object
  if (incomingFonts) {
    const mappedFonts: Partial<Record<FontKeys, string>> = {};
    for (const [k, v] of Object.entries(incomingFonts) as [FontKeys, Font][]) {
      if (v) mappedFonts[k] = fontToName(v);
    }

    // Merge onto current fonts so we pass a complete object (Theme['fonts']), not partial
    const fullFonts: ThemeFonts = {
      ...(currentTheme?.fonts as ThemeFonts),
      ...(mappedFonts as Partial<ThemeFonts>),
    };
    themePatch.fonts = fullFonts;
  }

  // Apply the theme patch
  setTheme(themePatch);

  // Now resolve the effective theme (after patch) to know which fonts to load
  const { theme } = useTheme.getState();

  // Build a unique list of Font entries to load (overrides win; extras appended)
  const fontsToLoad = (() => {
    // Prefer any explicit overrides from the original patch if present; otherwise use theme values
    const base: Font[] = [
      patch.fonts?.heading ?? theme.fonts.heading,
      patch.fonts?.body ?? theme.fonts.body,
      patch.fonts?.mono ?? theme.fonts.mono,
      patch.fonts?.button ?? theme.fonts.button,
      ...extras,
    ];

    const uniq = new Map<string, Font>();
    for (const f of base) {
      const key = fontToName(f);
      if (key) uniq.set(key, f);
    }
    return Array.from(uniq.values());
  })();

  injectFontLinks(fontsToLoad, options);

  const { start, finish } = useFonts.getState();
  start();
  await waitForFonts(fontsToLoad);
  finish();
}

export function useInitialTheme(
  patch: Partial<
    Omit<Theme, 'fonts'> & {
      fonts?: Partial<Record<FontKeys, Font>>;
    }
  >,
  extras: Font[] = [],
  options?: GoogleFontOptions,
) {
  useEffect(() => {
    createInitialTheme(patch, extras, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

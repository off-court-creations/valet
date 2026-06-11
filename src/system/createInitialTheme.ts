// ─────────────────────────────────────────────────────────────
// src/system/createInitialTheme.ts | valet
// helper for setting the initial theme and loading fonts
// ─────────────────────────────────────────────────────────────
import type { Theme, ThemeMode } from './themeStore';
import { useTheme } from './themeStore';
import { useFonts } from './fontStore';
import { useEffect } from 'react';
import { injectFontLinks, waitForFonts, GoogleFontOptions, Font } from '../helpers/fontLoader';
import {
  getSystemMode,
  readStoredMode,
  resolveInitialMode,
  writeStoredMode,
} from './modePreference';

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
  try {
    await waitForFonts(fontsToLoad);
  } finally {
    // A rejected font load must never leave fontStore stuck in loading —
    // finish() always runs so `blockUntilFonts` Surfaces can't wedge.
    finish();
  }
}

/** Options accepted by useInitialTheme (font options + THEMING S8 mode opts). */
export interface UseInitialThemeOptions extends GoogleFontOptions {
  /**
   * Initial color mode. 'light'/'dark' apply directly; 'system' reads
   * prefers-color-scheme once at boot (no live `change` listener yet —
   * deferred). Omitted → valet's boot default ('dark') stands.
   */
  mode?: ThemeMode | 'system';
  /**
   * Persist real user mode changes (setMode/toggleMode) to localStorage
   * under 'valet-mode' and restore the stored choice at boot.
   * Boot precedence: stored > requested > system > fallback('dark').
   */
  persistMode?: boolean;
}

/* True while useInitialTheme applies the boot-resolved mode: the persist
   subscription must not record a system/stored-derived initial as if the
   user chose it (veto register: applyingSystem flag). */
let applyingSystem = false;

export function useInitialTheme(
  patch: Partial<
    Omit<Theme, 'fonts'> & {
      fonts?: Partial<Record<FontKeys, Font>>;
    }
  >,
  extras: Font[] = [],
  options?: UseInitialThemeOptions,
) {
  useEffect(() => {
    const { mode: requestedMode, persistMode = false } = options ?? {};

    /* THEMING S8 persistence — install the subscription BEFORE the boot
       apply so ordering can never hide a user toggle; the applyingSystem
       flag filters the boot apply itself. Persisting lives here, not in
       themeStore: stores stay storage-free. */
    let unsubscribe: (() => void) | undefined;
    if (persistMode) {
      unsubscribe = useTheme.subscribe((state, prev) => {
        if (applyingSystem) return;
        if (state.mode !== prev.mode) writeStoredMode(state.mode);
      });
    }

    /* THEMING S8 mode preference — resolved exactly once at boot.
       stored > requested > system > fallback('dark'). 'system' is a
       one-shot prefers-color-scheme read; live follow is deferred. */
    if (requestedMode !== undefined || persistMode) {
      const { mode } = resolveInitialMode({
        stored: persistMode ? readStoredMode() : null,
        requested: requestedMode === 'system' ? null : (requestedMode ?? null),
        system: requestedMode === 'system' ? getSystemMode() : null,
        fallback: 'dark',
      });
      applyingSystem = true;
      try {
        useTheme.getState().setMode(mode);
      } finally {
        applyingSystem = false;
      }
    }

    // Catch the floating promise: a failed font load should warn in dev,
    // never surface as an unhandled rejection or block the UI.
    createInitialTheme(patch, extras, options).catch((err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('valet useInitialTheme: font loading failed; continuing without fonts.', err);
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ─────────────────────────────────────────────────────────────
// src/system/createInitialTheme.ts | valet
// helper for setting the initial theme and loading fonts
// ─────────────────────────────────────────────────────────────
import type { Theme } from './themeStore';
import { useTheme } from './themeStore';
import { useFonts } from './fontStore';
import { useEffect } from 'react';
import {
  injectGoogleFontLinks,
  waitForGoogleFonts,
  GoogleFontOptions,
} from '../helpers/fontLoader';

export async function createInitialTheme(
  patch: Partial<Theme>,
  extras: string[] = [],
  options?: GoogleFontOptions
): Promise<void> {
  const { setTheme } = useTheme.getState();
  const { start, finish } = useFonts.getState();
  setTheme(patch);
  const { theme } = useTheme.getState();
  const fonts = Array.from(
    new Set([
      theme.fonts.heading,
      theme.fonts.body,
      theme.fonts.mono,
      ...extras,
    ])
  );
  injectGoogleFontLinks(fonts, options);
  start();
  await waitForGoogleFonts(fonts);
  finish();
}

export function useInitialTheme(
  patch: Partial<Theme>,
  extras: string[] = [],
  options?: GoogleFontOptions
) {
  useEffect(() => {
    createInitialTheme(patch, extras, options);
  }, []);
}

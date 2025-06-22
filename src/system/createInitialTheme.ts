// ─────────────────────────────────────────────────────────────
// src/system/createInitialTheme.ts | valet
// helper for setting the initial theme and loading fonts
// ─────────────────────────────────────────────────────────────
import type { Theme } from './themeStore';
import { useTheme } from './themeStore';
import { useFonts } from './fontStore';
import { useInsertionEffect } from 'react';
import { useGoogleFonts } from '../hooks/useGoogleFonts';
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
  const { setTheme, theme } = useTheme.getState();
  const { setReady } = useFonts.getState();
  setTheme(patch);
  const fonts = Array.from(
    new Set([
      theme.fonts.heading,
      theme.fonts.body,
      theme.fonts.mono,
      ...extras,
    ])
  );
  injectGoogleFontLinks(fonts, options);
  setReady(false);
  await waitForGoogleFonts(fonts);
  setReady(true);
}

export function useInitialTheme(
  patch: Partial<Theme>,
  extras: string[] = [],
  options?: GoogleFontOptions
) {
  useInsertionEffect(() => {
    useTheme.getState().setTheme(patch);
  }, []);
  useGoogleFonts(extras, options);
}

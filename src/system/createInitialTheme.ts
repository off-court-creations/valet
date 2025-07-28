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
  injectLocalFontFaces,
  waitForLocalFonts,
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
      theme.fonts.button,
      ...extras,
    ])
  );
  injectGoogleFontLinks(fonts, options);
  injectLocalFontFaces(options?.local || []);
  start();
  await Promise.all([
    waitForGoogleFonts(fonts),
    waitForLocalFonts(options?.local || []),
  ]);
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

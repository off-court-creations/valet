// ─────────────────────────────────────────────────────────────
// src/hooks/useGoogleFonts.ts  | valet
// hook for dynamically loading Google Fonts once
// ─────────────────────────────────────────────────────────────
import { useInsertionEffect, useEffect, useMemo } from 'react';
import { useFonts } from '../system/fontStore';
import { useTheme } from '../system/themeStore';
import {
  injectGoogleFontLinks,
  waitForGoogleFonts,
  GoogleFontOptions,
} from '../helpers/fontLoader';

export function useGoogleFonts(extras: string[] = [], options?: GoogleFontOptions) {
  const setReady = useFonts((s) => s.setReady);
  const themeFonts = useTheme((s) => s.theme.fonts);
  const fonts = useMemo(
    () => Array.from(new Set([
      themeFonts.heading,
      themeFonts.body,
      themeFonts.mono,
      ...extras,
    ])),
    [themeFonts.heading, themeFonts.body, themeFonts.mono, extras.join(',')]
  );
  useInsertionEffect(() => {
    return injectGoogleFontLinks(fonts, options);
  }, [fonts.join(','), options?.preload]);

  useEffect(() => {
    let active = true;
    setReady(false);
    (async () => {
      try {
        await waitForGoogleFonts(fonts);
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [fonts.join(','), setReady]);
}

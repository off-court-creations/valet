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
  injectLocalFontFaces,
  waitForLocalFonts,
  GoogleFontOptions,
} from '../helpers/fontLoader';

export function useGoogleFonts(extras: string[] = [], options?: GoogleFontOptions) {
  const start = useFonts((s) => s.start);
  const finish = useFonts((s) => s.finish);
  const themeFonts = useTheme((s) => s.theme.fonts);
  const fonts = useMemo(
    () =>
      Array.from(
        new Set([
          themeFonts.heading,
          themeFonts.body,
          themeFonts.mono,
          ...extras,
        ])
      ),
    [themeFonts.heading, themeFonts.body, themeFonts.mono, extras.join(',')]
  );
  useInsertionEffect(() => {
    start();
    const removeGoogle = injectGoogleFontLinks(fonts, options);
    const removeLocal = injectLocalFontFaces(options?.local || []);
    return () => {
      removeGoogle();
      removeLocal();
    };
  }, [fonts.join(','), options?.preload, JSON.stringify(options?.local), start]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await Promise.all([
          waitForGoogleFonts(fonts),
          waitForLocalFonts(options?.local || []),
        ]);
      } finally {
        if (active) finish();
      }
    })();
    return () => {
      active = false;
    };
  }, [fonts.join(','), JSON.stringify(options?.local), finish]);
}

// ─────────────────────────────────────────────────────────────
// src/hooks/useGoogleFonts.ts  | valet
// hook for dynamically loading Google and custom fonts once
// ─────────────────────────────────────────────────────────────
import { useInsertionEffect, useEffect, useMemo } from 'react';
import { useFonts } from '../system/fontStore';
import { useTheme } from '../system/themeStore';
import {
  injectFontLinks,
  waitForFonts,
  GoogleFontOptions,
  Font,
} from '../helpers/fontLoader';

export function useGoogleFonts(extras: Font[] = [], options?: GoogleFontOptions) {
  const start = useFonts((s) => s.start);
  const finish = useFonts((s) => s.finish);
  const themeFonts = useTheme((s) => s.theme.fonts);
  const fonts = useMemo(() => {
    const all: Font[] = [
      themeFonts.heading,
      themeFonts.body,
      themeFonts.mono,
      ...extras,
    ];
    const map = new Map<string, Font>();
    all.forEach((f) => {
      const key = typeof f === 'string' ? f : f.name;
      if (!map.has(key)) map.set(key, f);
    });
    return Array.from(map.values());
  }, [themeFonts.heading, themeFonts.body, themeFonts.mono, JSON.stringify(extras)]);
  useInsertionEffect(() => {
    start();
    return injectFontLinks(fonts, options);
  }, [fonts.join(','), options?.preload, start]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await waitForFonts(fonts);
      } finally {
        if (active) finish();
      }
    })();
    return () => {
      active = false;
    };
  }, [fonts.join(','), finish]);
}

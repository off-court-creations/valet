// ─────────────────────────────────────────────────────────────
// src/hooks/useGoogleFonts.ts  | valet
// hook for dynamically loading Google and custom fonts once
// ─────────────────────────────────────────────────────────────
import { useInsertionEffect, useEffect, useMemo } from 'react';
import { useFonts } from '../system/fontStore';
import { useTheme } from '../system/themeStore';
import { injectFontLinks, waitForFonts, GoogleFontOptions, Font } from '../helpers/fontLoader';

const fontToName = (f: Font) => (typeof f === 'string' ? f : f.name);

export function useGoogleFonts(extras: Font[] = [], options?: GoogleFontOptions) {
  const start = useFonts((s) => s.start);
  const finish = useFonts((s) => s.finish);
  const themeFonts = useTheme((s) => s.theme.fonts);

  // Build a de-duplicated, stable array of fonts to load
  const fonts = useMemo(() => {
    const all: Font[] = [themeFonts.heading, themeFonts.body, themeFonts.mono, ...extras];
    const seen = new Set<string>();
    const out: Font[] = [];
    for (const f of all) {
      const name = fontToName(f);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push(f);
    }
    return out;
  }, [themeFonts.heading, themeFonts.body, themeFonts.mono, extras]);

  // Inject <link>s as soon as possible; clean them up on change/unmount
  useInsertionEffect(() => {
    start();
    return injectFontLinks(fonts, options);
  }, [fonts, options, start]);

  // Wait for fonts to load, then mark finished
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
  }, [fonts, finish]);
}

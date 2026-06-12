// ─────────────────────────────────────────────────────────────
// src/hooks/useGoogleFonts.ts  | valet
// hook for dynamically loading Google and custom fonts once
// THEMING S4 (ruling R20): start() lives in a passive effect (not
// useInsertionEffect — store writes there schedule renders from the
// wrong phase); start/finish are balanced inside one effect so an
// unmount between them can never leave the fontStore loading forever;
// effects key on stable string deps so a fresh `extras`/`options`
// identity never re-runs the pipeline.
// ─────────────────────────────────────────────────────────────
import { useInsertionEffect, useEffect, useMemo } from 'react';
import { useFonts } from '../system/fontStore';
import { useTheme } from '../system/themeStore';
import { injectFontLinks, waitForFonts, GoogleFontOptions, Font } from '../helpers/fontLoader';

const fontToName = (f: Font) => {
  if (typeof f === 'string') return f;
  if ('name' in f) return f.name;
  if ('family' in f) return f.family;
  return '';
};

/* Stable identity for a font in the request key: the name plus the
   shape that actually changes what gets injected/loaded. Two render
   passes that build an equal-but-fresh `extras` array therefore yield
   the same string and never re-run the effects. */
const fontToKey = (f: Font): string => {
  if (typeof f === 'string') return `s:${f}`;
  if ('family' in f) return `g:${JSON.stringify(f)}`;
  return `c:${f.name}:${f.src}`;
};

export function useGoogleFonts(extras: Font[] = [], options?: GoogleFontOptions) {
  const start = useFonts((s) => s.start);
  const finish = useFonts((s) => s.finish);
  const themeFonts = useTheme((s) => s.theme.fonts);

  // Build a de-duplicated, stable array of fonts to load. Keyed on the
  // serialized inputs (below) rather than `extras`/`options` identity.
  const extrasKey = useMemo(() => extras.map(fontToKey).join('|'), [extras]);
  const optionsKey = useMemo(() => (options ? JSON.stringify(options) : ''), [options]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on stable strings, not array identity
  }, [themeFonts.heading, themeFonts.body, themeFonts.mono, extrasKey]);

  /* A single stable string that changes iff the work to do changes.
     Drives every effect below so neither a new `extras` array nor a new
     `options` object can re-run the pipeline. */
  const fontsKey = useMemo(
    () => fonts.map(fontToKey).join('|') + '#' + optionsKey,
    [fonts, optionsKey],
  );

  // Inject <link>s as soon as possible; clean them up on change/unmount.
  // Pure DOM injection before paint — no store writes here.
  useInsertionEffect(() => {
    return injectFontLinks(fonts, options);
  }, [fontsKey]);

  // Track loading state and wait for fonts to resolve. start() and
  // finish() are bound to the SAME effect: start() runs synchronously on
  // mount, finish() runs in cleanup — so they always balance, including
  // an unmount that races the async wait (the leak this slice fixes).
  useEffect(() => {
    start();
    let finished = false;
    const settle = () => {
      if (finished) return;
      finished = true;
      finish();
    };
    void (async () => {
      try {
        await waitForFonts(fonts);
      } finally {
        settle();
      }
    })();
    return () => {
      // Unmount (or a deps change) before the wait resolves still
      // decrements exactly once — never leaves the store loading.
      settle();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fontsKey captures fonts; start/finish are stable store actions
  }, [fontsKey]);
}

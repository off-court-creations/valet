// ─────────────────────────────────────────────────────────────
// src/system/createInitialTheme.ts | valet
// helper for setting the initial theme and loading fonts
// ─────────────────────────────────────────────────────────────
import type { Theme } from './themeStore';
import { useTheme } from './themeStore';
import { useFonts } from './fontStore';
import { useEffect } from 'react';
import {
  injectFontLinks,
  waitForFonts,
  GoogleFontOptions,
  Font,
} from '../helpers/fontLoader';

export async function createInitialTheme(
  patch: Partial<Omit<Theme, 'fonts'> & { fonts?: Partial<Record<'heading' | 'body' | 'mono' | 'button', Font>> }>,
  extras: Font[] = [],
  options?: GoogleFontOptions
): Promise<void> {
  const { setTheme } = useTheme.getState();
  const { start, finish } = useFonts.getState();
  const themePatch: Partial<Theme> = { ...patch } as any;
  if (patch.fonts) {
    themePatch.fonts = Object.fromEntries(
      Object.entries(patch.fonts).map(([k, v]) => [k, typeof v === 'string' ? v : v.name])
    ) as any;
  }
  setTheme(themePatch);
  const { theme } = useTheme.getState();
  const fonts = (() => {
    const all: Font[] = [
      patch.fonts?.heading || theme.fonts.heading,
      patch.fonts?.body || theme.fonts.body,
      patch.fonts?.mono || theme.fonts.mono,
      patch.fonts?.button || theme.fonts.button,
      ...extras,
    ];
    const map = new Map<string, Font>();
    all.forEach((f) => {
      const key = typeof f === 'string' ? f : f.name;
      if (key) map.set(key, f);
    });
    return Array.from(map.values());
  })();
  injectFontLinks(fonts, options);
  start();
  await waitForFonts(fonts);
  finish();
}

export function useInitialTheme(
  patch: Partial<Omit<Theme, 'fonts'> & { fonts?: Partial<Record<'heading' | 'body' | 'mono' | 'button', Font>> }>,
  extras: Font[] = [],
  options?: GoogleFontOptions
) {
  useEffect(() => {
    createInitialTheme(patch, extras, options);
  }, []);
}

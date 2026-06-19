// ─────────────────────────────────────────────────────────────
// src/utils/responsive.test.ts | valet
// responsive() — scalar passthrough, breakpoint-map → @media blocks,
// xs/min-0 base unwrapping, fallback below the smallest breakpoint,
// and the undefined/empty branches.
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import type { Theme } from '../system/themeStore';
import responsiveDefault, { responsive } from './responsive';

/** Minimal Theme stub — responsive() only reads `breakpoints`. */
const theme = {
  breakpoints: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
} as unknown as Theme;

const dir = (d: string) => `flex-direction:${d};`;

describe('responsive', () => {
  it('emits a scalar declaration with no media query', () => {
    expect(responsive('row', theme, dir)).toBe('flex-direction:row;');
  });

  it('default export is the same function', () => {
    expect(responsiveDefault).toBe(responsive);
  });

  it('emits nothing for undefined with no fallback', () => {
    expect(responsive(undefined, theme, dir)).toBe('');
  });

  it('emits the fallback declaration for undefined when a fallback is given', () => {
    expect(responsive(undefined, theme, dir, 'column')).toBe('flex-direction:column;');
  });

  it('treats xs as the unwrapped base (min-width 0 → no media query)', () => {
    expect(responsive({ xs: 'column', md: 'row' }, theme, dir)).toBe(
      'flex-direction:column;@media (min-width:960px){flex-direction:row;}',
    );
  });

  it('prepends the fallback as the base when a map omits xs', () => {
    expect(responsive({ md: 'row' }, theme, dir, 'column')).toBe(
      'flex-direction:column;@media (min-width:960px){flex-direction:row;}',
    );
  });

  it('emits only media blocks when a map omits xs and no fallback is given', () => {
    expect(responsive({ sm: 'row', lg: 'column' }, theme, dir)).toBe(
      '@media (min-width:600px){flex-direction:row;}@media (min-width:1280px){flex-direction:column;}',
    );
  });

  it('orders blocks smallest→largest regardless of key order', () => {
    expect(responsive({ lg: 'column', sm: 'row', xs: 'column' }, theme, dir)).toBe(
      'flex-direction:column;' +
        '@media (min-width:600px){flex-direction:row;}' +
        '@media (min-width:1280px){flex-direction:column;}',
    );
  });

  it('supports multi-declaration builders (e.g. per-axis gap)', () => {
    const gap = (g: string) => `column-gap:${g};row-gap:${g};`;
    expect(responsive({ xs: '8px', md: '16px' }, theme, gap)).toBe(
      'column-gap:8px;row-gap:8px;@media (min-width:960px){column-gap:16px;row-gap:16px;}',
    );
  });
});

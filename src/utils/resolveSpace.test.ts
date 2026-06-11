// ─────────────────────────────────────────────────────────────
// src/utils/resolveSpace.test.ts | valet
// resolveSpace — compact short-circuit, number/string/undefined
// branches, fallback handling
// ─────────────────────────────────────────────────────────────
import { describe, expect, it, vi } from 'vitest';
import type { Theme } from '../system/themeStore';
import resolveSpaceDefault, { resolveSpace } from './resolveSpace';

/** Minimal Theme stub — resolveSpace only touches `spacing`. */
const makeTheme = () => {
  const spacing = vi.fn((u: number) => `calc(var(--valet-space, 0.5rem) * ${u})`);
  return { theme: { spacing } as unknown as Theme, spacing };
};

describe('resolveSpace', () => {
  it('maps numbers through theme.spacing', () => {
    const { theme, spacing } = makeTheme();
    expect(resolveSpace(2, theme)).toBe('calc(var(--valet-space, 0.5rem) * 2)');
    expect(spacing).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('treats 0 as a real number — spacing(0), not the fallback', () => {
    const { theme, spacing } = makeTheme();
    expect(resolveSpace(0, theme)).toBe('calc(var(--valet-space, 0.5rem) * 0)');
    expect(spacing).toHaveBeenCalledExactlyOnceWith(0);
  });

  it('passes negative and fractional unit counts straight to spacing', () => {
    const { theme, spacing } = makeTheme();
    resolveSpace(-1, theme);
    resolveSpace(0.5, theme);
    expect(spacing).toHaveBeenNthCalledWith(1, -1);
    expect(spacing).toHaveBeenNthCalledWith(2, 0.5);
  });

  it('returns string values verbatim without consulting spacing', () => {
    const { theme, spacing } = makeTheme();
    expect(resolveSpace('1.5rem', theme)).toBe('1.5rem');
    expect(resolveSpace('8px', theme)).toBe('8px');
    expect(resolveSpace('calc(100% - 8px)', theme)).toBe('calc(100% - 8px)');
    expect(spacing).not.toHaveBeenCalled();
  });

  it('returns the empty string verbatim (current behavior — not the fallback)', () => {
    const { theme, spacing } = makeTheme();
    expect(resolveSpace('', theme)).toBe('');
    expect(spacing).not.toHaveBeenCalled();
  });

  it('undefined resolves to spacing(fallback), defaulting to 1 unit', () => {
    const { theme, spacing } = makeTheme();
    expect(resolveSpace(undefined, theme)).toBe('calc(var(--valet-space, 0.5rem) * 1)');
    expect(spacing).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('honors a custom fallback, including 0', () => {
    const { theme, spacing } = makeTheme();
    expect(resolveSpace(undefined, theme, false, 3)).toBe('calc(var(--valet-space, 0.5rem) * 3)');
    expect(resolveSpace(undefined, theme, false, 0)).toBe('calc(var(--valet-space, 0.5rem) * 0)');
    expect(spacing).toHaveBeenNthCalledWith(1, 3);
    expect(spacing).toHaveBeenNthCalledWith(2, 0);
  });

  it("compact short-circuits every branch to '0' and never calls spacing", () => {
    const { theme, spacing } = makeTheme();
    expect(resolveSpace(4, theme, true)).toBe('0');
    expect(resolveSpace('2rem', theme, true)).toBe('0');
    expect(resolveSpace(undefined, theme, true)).toBe('0');
    expect(resolveSpace(undefined, theme, true, 5)).toBe('0');
    expect(spacing).not.toHaveBeenCalled();
  });

  it('compact=false behaves exactly like compact omitted', () => {
    const { theme } = makeTheme();
    expect(resolveSpace(2, theme, false)).toBe(resolveSpace(2, theme));
    expect(resolveSpace('7px', theme, false)).toBe(resolveSpace('7px', theme));
    expect(resolveSpace(undefined, theme, false)).toBe(resolveSpace(undefined, theme));
  });

  it('default export is the named export', () => {
    expect(resolveSpaceDefault).toBe(resolveSpace);
  });
});

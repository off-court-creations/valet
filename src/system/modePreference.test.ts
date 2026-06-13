// ─────────────────────────────────────────────────────────────
// src/system/modePreference.test.ts | valet
// THEMING S8 — resolveInitialMode precedence matrix plus the
// guarded matchMedia/localStorage wrappers (SSR-safe, throw-safe
// in sandboxed iframes). Runs in plain Node: `window` is absent
// unless a test stubs it.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MODE_STORAGE_KEY,
  getSystemMode,
  readStoredMode,
  resolveInitialMode,
  writeStoredMode,
} from './modePreference';

afterEach(() => {
  vi.unstubAllGlobals();
});

/*───────────────────────────────────────────────────────────*/
describe('resolveInitialMode — pure precedence (stored > requested > system > fallback)', () => {
  it('stored beats requested, system and fallback', () => {
    expect(
      resolveInitialMode({ stored: 'light', requested: 'dark', system: 'dark', fallback: 'dark' }),
    ).toEqual({ mode: 'light', source: 'stored' });
  });

  it('requested beats system and fallback', () => {
    expect(
      resolveInitialMode({ stored: null, requested: 'light', system: 'dark', fallback: 'dark' }),
    ).toEqual({ mode: 'light', source: 'requested' });
  });

  it('system beats fallback', () => {
    expect(resolveInitialMode({ stored: null, requested: null, system: 'light' })).toEqual({
      mode: 'light',
      source: 'system',
    });
  });

  it("falls back to 'dark' when every input is absent (boot default stays dark)", () => {
    expect(resolveInitialMode({})).toEqual({ mode: 'dark', source: 'fallback' });
    expect(resolveInitialMode()).toEqual({ mode: 'dark', source: 'fallback' });
  });

  it('honors an explicit fallback', () => {
    expect(resolveInitialMode({ fallback: 'light' })).toEqual({
      mode: 'light',
      source: 'fallback',
    });
  });

  it('treats garbage inputs as absent (only literal light/dark count)', () => {
    expect(
      resolveInitialMode({
        stored: 'banana' as never,
        requested: '' as never,
        system: undefined,
      }),
    ).toEqual({ mode: 'dark', source: 'fallback' });
    // garbage stored does not shadow a valid requested mode
    expect(resolveInitialMode({ stored: 'banana' as never, requested: 'light' })).toEqual({
      mode: 'light',
      source: 'requested',
    });
  });
});

/*───────────────────────────────────────────────────────────*/
describe('getSystemMode — guarded matchMedia', () => {
  it('returns null without a window (SSR)', () => {
    expect(typeof window).toBe('undefined');
    expect(getSystemMode()).toBeNull();
  });

  it('returns null when matchMedia is missing', () => {
    vi.stubGlobal('window', {});
    expect(getSystemMode()).toBeNull();
  });

  it('returns null when matchMedia throws (sandboxed iframe)', () => {
    vi.stubGlobal('window', {
      matchMedia: () => {
        throw new Error('SecurityError');
      },
    });
    expect(getSystemMode()).toBeNull();
  });

  it("reads 'dark', 'light', and no-preference from prefers-color-scheme", () => {
    const stub = (matching: string | null) => ({
      matchMedia: (q: string) => ({ matches: matching !== null && q.includes(matching) }),
    });
    vi.stubGlobal('window', stub('dark'));
    expect(getSystemMode()).toBe('dark');
    vi.stubGlobal('window', stub('light'));
    expect(getSystemMode()).toBe('light');
    vi.stubGlobal('window', stub(null));
    expect(getSystemMode()).toBeNull();
  });
});

/*───────────────────────────────────────────────────────────*/
describe('readStoredMode / writeStoredMode — guarded localStorage', () => {
  it('read returns null and write no-ops without a window (SSR)', () => {
    expect(readStoredMode()).toBeNull();
    expect(() => writeStoredMode('light')).not.toThrow();
  });

  it('read/write swallow storage that throws (sandboxed iframe SecurityError)', () => {
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new Error('SecurityError');
      },
    });
    expect(readStoredMode()).toBeNull();
    expect(() => writeStoredMode('dark')).not.toThrow();
  });

  it('read returns null for garbage stored values', () => {
    vi.stubGlobal('window', {
      localStorage: { getItem: () => 'banana', setItem: () => {} },
    });
    expect(readStoredMode()).toBeNull();
  });

  it("round-trips a mode under the 'valet-mode' key", () => {
    const store = new Map<string, string>();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
      },
    });
    writeStoredMode('light');
    expect(store.get(MODE_STORAGE_KEY)).toBe('light');
    expect(MODE_STORAGE_KEY).toBe('valet-mode');
    expect(readStoredMode()).toBe('light');
  });
});

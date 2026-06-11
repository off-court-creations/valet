// ─────────────────────────────────────────────────────────────
// src/system/createInitialTheme.test.ts | valet
// fail-safe font loading: finish() always runs, hook never throws
// + THEMING S8: mode:'system' / persistMode wiring on useInitialTheme
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialTheme, useInitialTheme } from './createInitialTheme';
import { useFonts } from './fontStore';
import { useTheme } from './themeStore';
import { injectFontLinks, waitForFonts } from '../helpers/fontLoader';

// Stub the DOM-bound font pipeline so these tests run in plain Node
vi.mock('../helpers/fontLoader', () => ({
  injectFontLinks: vi.fn(),
  waitForFonts: vi.fn(),
}));

// Run effects synchronously so the hook is callable as a plain function;
// returned cleanups are collected and drained after each test so persist
// subscriptions never leak across tests.
const effectCleanups = vi.hoisted(() => [] as Array<() => void>);
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useEffect: (fn: () => void | (() => void)) => {
      const cleanup = fn();
      if (typeof cleanup === 'function') effectCleanups.push(cleanup);
    },
  };
});

const mockedWaitForFonts = vi.mocked(waitForFonts);
const mockedInjectFontLinks = vi.mocked(injectFontLinks);

beforeEach(() => {
  useFonts.setState({ loading: 0, ready: false });
  mockedWaitForFonts.mockReset();
  mockedInjectFontLinks.mockReset();
});

afterEach(() => {
  while (effectCleanups.length) effectCleanups.pop()!();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createInitialTheme', () => {
  it('balances start/finish when fonts resolve', async () => {
    mockedWaitForFonts.mockResolvedValue(undefined);

    await createInitialTheme({});

    expect(mockedInjectFontLinks).toHaveBeenCalledTimes(1);
    expect(useFonts.getState().loading).toBe(0);
    expect(useFonts.getState().ready).toBe(true);
  });

  it('still runs finish() when waitForFonts rejects — fontStore never wedges', async () => {
    mockedWaitForFonts.mockRejectedValue(new Error('FontFace 404'));

    await expect(createInitialTheme({})).rejects.toThrow('FontFace 404');

    // Without the try/finally this stayed at loading=1 / ready=false forever
    expect(useFonts.getState().loading).toBe(0);
    expect(useFonts.getState().ready).toBe(true);
  });
});

describe('useInitialTheme', () => {
  it('catches the floating promise and dev-warns instead of throwing', async () => {
    mockedWaitForFonts.mockRejectedValue(new Error('offline'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => useInitialTheme({})).not.toThrow();

    await vi.waitFor(() => {
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('useInitialTheme'),
        expect.any(Error),
      );
    });
    expect(useFonts.getState().loading).toBe(0);
  });

  it('does not warn when fonts load cleanly', async () => {
    mockedWaitForFonts.mockResolvedValue(undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    useInitialTheme({});

    await vi.waitFor(() => {
      expect(useFonts.getState().ready).toBe(true);
    });
    expect(warn).not.toHaveBeenCalled();
  });
});

/*───────────────────────────────────────────────────────────*/
describe('useInitialTheme mode & persistMode (THEMING S8)', () => {
  /** In-memory localStorage stub with spyable getItem/setItem. */
  const makeStorage = (initial: Record<string, string> = {}) => {
    const map = new Map<string, string>(Object.entries(initial));
    return {
      getItem: vi.fn((k: string) => map.get(k) ?? null),
      setItem: vi.fn((k: string, v: string) => void map.set(k, v)),
    };
  };

  beforeEach(() => {
    // Reset mode without notifying any (already-drained) subscribers
    useTheme.setState({ mode: 'dark' });
  });

  it("boot default stays 'dark' when no mode options are passed (veto register)", () => {
    useInitialTheme({});
    expect(useTheme.getState().mode).toBe('dark');
  });

  it("mode:'system' resolves via prefers-color-scheme once at boot", () => {
    vi.stubGlobal('window', {
      matchMedia: (q: string) => ({ matches: q.includes('light') }),
    });
    useInitialTheme({}, [], { mode: 'system' });
    expect(useTheme.getState().mode).toBe('light');
  });

  it("mode:'system' without any window (SSR) safely falls back to 'dark'", () => {
    expect(typeof window).toBe('undefined');
    expect(() => useInitialTheme({}, [], { mode: 'system' })).not.toThrow();
    expect(useTheme.getState().mode).toBe('dark');
  });

  it("mode:'system' with matchMedia absent safely falls back to 'dark' (no throw)", () => {
    vi.stubGlobal('window', {}); // sandboxed/legacy embedder: no matchMedia
    expect(() => useInitialTheme({}, [], { mode: 'system' })).not.toThrow();
    expect(useTheme.getState().mode).toBe('dark');
  });

  it('an explicit requested mode applies at boot', () => {
    useInitialTheme({}, [], { mode: 'light' });
    expect(useTheme.getState().mode).toBe('light');
  });

  it('persistMode: a stored choice beats the system preference (stored > requested > system > fallback)', () => {
    vi.stubGlobal('window', {
      localStorage: makeStorage({ 'valet-mode': 'light' }),
      matchMedia: (q: string) => ({ matches: q.includes('dark') }), // system says dark
    });
    useInitialTheme({}, [], { mode: 'system', persistMode: true });
    expect(useTheme.getState().mode).toBe('light');
  });

  it('persistMode: writes only on real mode changes — never the boot apply (applyingSystem flag)', () => {
    const ls = makeStorage();
    vi.stubGlobal('window', {
      localStorage: ls,
      matchMedia: (q: string) => ({ matches: q.includes('light') }),
    });

    useInitialTheme({}, [], { mode: 'system', persistMode: true });
    // The boot apply flipped dark→light with the subscription already
    // installed — the applyingSystem flag must keep it out of storage.
    expect(useTheme.getState().mode).toBe('light');
    expect(ls.setItem).not.toHaveBeenCalled();

    useTheme.getState().toggleMode(); // real user change → dark
    expect(ls.setItem).toHaveBeenCalledTimes(1);
    expect(ls.setItem).toHaveBeenCalledWith('valet-mode', 'dark');

    useTheme.getState().setMode('dark'); // redundant set — mode unchanged
    expect(ls.setItem).toHaveBeenCalledTimes(1);

    useTheme.getState().setMode('light'); // real change again
    expect(ls.setItem).toHaveBeenCalledTimes(2);
    expect(ls.setItem).toHaveBeenLastCalledWith('valet-mode', 'light');
  });

  it('persistMode: effect cleanup removes the subscription', () => {
    const ls = makeStorage();
    vi.stubGlobal('window', { localStorage: ls });

    useInitialTheme({}, [], { persistMode: true });
    while (effectCleanups.length) effectCleanups.pop()!(); // simulate unmount

    useTheme.getState().toggleMode();
    expect(ls.setItem).not.toHaveBeenCalled();
  });
});

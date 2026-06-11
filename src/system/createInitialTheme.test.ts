// ─────────────────────────────────────────────────────────────
// src/system/createInitialTheme.test.ts | valet
// fail-safe font loading: finish() always runs, hook never throws
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialTheme, useInitialTheme } from './createInitialTheme';
import { useFonts } from './fontStore';
import { injectFontLinks, waitForFonts } from '../helpers/fontLoader';

// Stub the DOM-bound font pipeline so these tests run in plain Node
vi.mock('../helpers/fontLoader', () => ({
  injectFontLinks: vi.fn(),
  waitForFonts: vi.fn(),
}));

// Run effects synchronously so the hook is callable as a plain function
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useEffect: (fn: () => void) => fn() };
});

const mockedWaitForFonts = vi.mocked(waitForFonts);
const mockedInjectFontLinks = vi.mocked(injectFontLinks);

beforeEach(() => {
  useFonts.setState({ loading: 0, ready: false });
  mockedWaitForFonts.mockReset();
  mockedInjectFontLinks.mockReset();
});

afterEach(() => {
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

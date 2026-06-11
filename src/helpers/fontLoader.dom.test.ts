// ─────────────────────────────────────────────────────────────
// src/helpers/fontLoader.dom.test.ts | valet
// THEMING S3 regression — waitForFonts fail-safety:
// • per-load never-rejects wrappers (one bad font ≠ rejected batch)
// • rejected-inflight eviction (failures stay retryable in-session)
// • 5000ms resolve-on-timeout (never rejects) + dev warn naming
//   the unresolved fonts
// jsdom has no document.fonts / FontFace — controllable stubs below.
// NOTE: fontLoader's in-flight cache is module-level state, so every
// test uses unique family names to stay independent.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { waitForFonts, DEFAULT_FONT_WAIT_TIMEOUT_MS } from './fontLoader';

/* Controllable FontFaceSet stub --------------------------------------- */
let fontsLoad: Mock;
let fontsDelete: Mock;

class FakeFontFace {
  family: string;
  source: string;
  static constructed: FakeFontFace[] = [];
  /** When set, the next constructed face's load() rejects once. */
  static failNextLoad = false;
  private shouldFail: boolean;
  constructor(family: string, source: string) {
    this.family = family;
    this.source = source;
    this.shouldFail = FakeFontFace.failNextLoad;
    FakeFontFace.failNextLoad = false;
    FakeFontFace.constructed.push(this);
  }
  load(): Promise<FakeFontFace> {
    if (this.shouldFail) return Promise.reject(new Error('bad src'));
    return Promise.resolve(this);
  }
}

beforeEach(() => {
  fontsLoad = vi.fn(() => Promise.resolve([]));
  fontsDelete = vi.fn();
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: {
      ready: Promise.resolve(),
      load: fontsLoad,
      add: vi.fn(),
      delete: fontsDelete,
    },
  });
  FakeFontFace.constructed = [];
  FakeFontFace.failNextLoad = false;
  vi.stubGlobal('FontFace', FakeFontFace);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/* Advance through the post-load settle tail (2 rAF frames + 200ms) */
const settleTail = () => vi.advanceTimersByTimeAsync(300);

describe('waitForFonts — resolve-on-timeout (S3)', () => {
  it('resolves (never rejects) after the 5000ms default timeout and dev-warns naming the unresolved fonts', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fontsLoad.mockReturnValue(new Promise(() => {})); // hangs forever

    let settled = false;
    const p = waitForFonts(['Hung Family']).then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(DEFAULT_FONT_WAIT_TIMEOUT_MS - 1);
    expect(settled).toBe(false); // still blocked just before the deadline

    await vi.advanceTimersByTimeAsync(1);
    await p; // resolves — never rejects
    expect(settled).toBe(true);

    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0]![0]);
    expect(message).toContain('timed out after 5000ms');
    expect(message).toContain('Hung Family');
  });

  it('honors a caller-supplied timeoutMs', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fontsLoad.mockReturnValue(new Promise(() => {}));

    const p = waitForFonts(['Hung Custom Deadline'], { timeoutMs: 100 });
    await vi.advanceTimersByTimeAsync(100);
    await p;

    expect(String(warn.mock.calls[0]![0])).toContain('timed out after 100ms');
  });

  it('resolves without warning when fonts load before the deadline', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const p = waitForFonts(['Prompt Family']);
    await settleTail();
    await p;

    expect(warn).not.toHaveBeenCalled();
  });
});

describe('waitForFonts — never-rejects wrappers + rejected-inflight eviction (S3)', () => {
  it('a rejected in-flight load never rejects the batch and is evicted so the next call retries', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fontsLoad.mockReturnValueOnce(Promise.reject(new Error('404')));

    const first = waitForFonts(['Evict Me']);
    await settleTail();
    await first; // resolves despite the rejection

    expect(fontsLoad).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Evict Me'));

    fontsLoad.mockReturnValueOnce(Promise.resolve([]));
    const second = waitForFonts(['Evict Me']);
    await settleTail();
    await second;

    // Pre-fix, the rejected promise stayed cached forever and load() was
    // never re-invoked for the session (audit: "failures unretryable").
    expect(fontsLoad).toHaveBeenCalledTimes(2);
  });

  it('one failing font does not reject a batch that contains healthy fonts', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fontsLoad.mockImplementation((spec: string) =>
      spec.includes('Bad Apple') ? Promise.reject(new Error('CSP')) : Promise.resolve([]),
    );

    const p = waitForFonts(['Bad Apple', 'Good Egg']);
    await settleTail();
    await expect(p).resolves.toBeUndefined();

    const messages = warn.mock.calls.map((c) => String(c[0]));
    expect(messages.some((m) => m.includes('Bad Apple'))).toBe(true);
    expect(messages.some((m) => m.includes('Good Egg'))).toBe(false);
  });

  it('a failed custom FontFace is dropped so a retry constructs a fresh face', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const font = { name: 'Flaky Face', src: 'https://example.test/flaky.woff2' };

    FakeFontFace.failNextLoad = true;
    const first = waitForFonts([font]);
    await settleTail();
    await first; // resolves despite the failed face

    expect(FakeFontFace.constructed).toHaveLength(1);
    expect(fontsDelete).toHaveBeenCalledTimes(1); // dead face removed from the set

    const second = waitForFonts([font]);
    await settleTail();
    await second;

    // A FontFace whose load failed is status 'error' forever — the retry
    // must construct a fresh face rather than reuse the cached dead one.
    expect(FakeFontFace.constructed).toHaveLength(2);
  });
});

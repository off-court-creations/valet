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
import { injectFontLinks, waitForFonts, DEFAULT_FONT_WAIT_TIMEOUT_MS } from './fontLoader';
import { resetWarnOnce } from '../system/devErrors';

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

/* ───────────────────────────────────────────────────────────────────────
 * injectFontLinks — injectRemote option (THEMING S7, Q13)
 *
 * Default true (preconnect + googleapis stylesheet links, once-per-session
 * privacy notice). injectRemote:false skips ALL remote Google resources and
 * reinterprets Google-shaped entries as local families; self-hosted
 * CustomFont entries still construct a FontFace. Module-level state
 * (activeLinks/loadedFonts/the preconnect node/the warnOnce memo) persists
 * across tests, so each test uses a unique family and scrubs <head>.
 * ─────────────────────────────────────────────────────────────────────── */
describe('injectFontLinks — injectRemote (S7)', () => {
  const headLinks = () => Array.from(document.head.querySelectorAll('link'));
  const stylesheetTo = (host: string) =>
    headLinks().filter((l) => l.rel === 'stylesheet' && l.href.includes(host));

  beforeEach(() => {
    resetWarnOnce();
    document.head.querySelectorAll('link').forEach((l) => l.remove());
  });

  afterEach(() => {
    document.head.querySelectorAll('link').forEach((l) => l.remove());
  });

  it('default (injectRemote omitted) appends preconnect + googleapis stylesheet links', () => {
    const cleanup = injectFontLinks(['Remote Default Family']);
    expect(document.getElementById('valet-fonts-preconnect')).not.toBeNull();
    expect(document.getElementById('valet-fonts-preconnect-gstatic')).not.toBeNull();
    expect(stylesheetTo('fonts.googleapis.com')).toHaveLength(1);
    cleanup();
  });

  it('injectRemote:false appends NO preconnect and NO googleapis links (Google entry → local family)', () => {
    const cleanup = injectFontLinks(['Local Only Family'], { injectRemote: false });
    expect(document.getElementById('valet-fonts-preconnect')).toBeNull();
    expect(document.getElementById('valet-fonts-preconnect-gstatic')).toBeNull();
    expect(stylesheetTo('fonts.googleapis.com')).toHaveLength(0);
    // No remote links of any kind for a Google-shaped entry treated as local.
    expect(headLinks()).toHaveLength(0);
    cleanup();
  });

  it('injectRemote:false also suppresses object {family} requests (not just string shorthand)', () => {
    const cleanup = injectFontLinks(
      [{ family: 'Local Object Family', axes: { wght: [400, 700] } }],
      { injectRemote: false },
    );
    expect(headLinks()).toHaveLength(0);
    cleanup();
  });

  it('injectRemote:false still self-hosts CustomFont entries (FontFace constructed, no remote links)', () => {
    FakeFontFace.constructed = [];
    const font = { name: 'Self Hosted Face', src: 'https://example.test/self.woff2' };
    const cleanup = injectFontLinks([font], { injectRemote: false });

    // The self-hosted face is constructed and added — only Google entries are
    // reinterpreted as local; CustomFonts are unaffected by the opt-out.
    expect(FakeFontFace.constructed).toHaveLength(1);
    expect(FakeFontFace.constructed[0]!.family).toBe('Self Hosted Face');
    // The only link is the self-host preload (rel=preload, as=font) — nothing remote.
    expect(stylesheetTo('fonts.googleapis.com')).toHaveLength(0);
    expect(headLinks().every((l) => !l.href.includes('googleapis'))).toBe(true);
    cleanup();
  });

  it("injectRemote:false teardown is a clean no-op for Google entries (doesn't throw / removes nothing it didn't add)", () => {
    const cleanup = injectFontLinks(['Teardown Local Family'], { injectRemote: false });
    expect(headLinks()).toHaveLength(0);
    expect(() => cleanup()).not.toThrow();
    expect(headLinks()).toHaveLength(0);
  });
});

describe('injectFontLinks — remote-injection privacy notice (S7)', () => {
  beforeEach(() => {
    resetWarnOnce();
    document.head.querySelectorAll('link').forEach((l) => l.remove());
  });

  afterEach(() => {
    document.head.querySelectorAll('link').forEach((l) => l.remove());
  });

  it('warns once per session, pointing at the privacy docs, when remote injection happens', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const c1 = injectFontLinks(['Notice Family One']);
    const c2 = injectFontLinks(['Notice Family Two']); // second remote inject, same session

    expect(warn).toHaveBeenCalledTimes(1); // warnOnce — not per call
    const message = String(warn.mock.calls[0]![0]);
    expect(message).toContain('injectRemote: false');
    expect(message).toContain('fonts.googleapis.com');
    expect(message).toContain('/fonts-privacy');

    c1();
    c2();
  });

  it('does NOT warn when injectRemote:false (no remote request leaves the page)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cleanup = injectFontLinks(['Silent Local Family'], { injectRemote: false });
    expect(warn).not.toHaveBeenCalled();
    cleanup();
  });

  it('does NOT warn for a custom-font-only batch (no Google entries → no remote request)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cleanup = injectFontLinks([
      { name: 'Notice Custom Only', src: 'https://example.test/custom.woff2' },
    ]);
    expect(warn).not.toHaveBeenCalled();
    cleanup();
  });
});

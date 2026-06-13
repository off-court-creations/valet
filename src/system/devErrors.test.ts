// ─────────────────────────────────────────────────────────────
// src/system/devErrors.test.ts | valet
// node-env coverage for valetError enrichment + the warnOnce core
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VALET_DOCS_BASE, resetWarnOnce, valetError, warnOnce } from './devErrors';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  resetWarnOnce();
});

describe('valetError', () => {
  it('returns an Error named ValetError carrying component + fix hint', () => {
    const err = valetError('Surface', 'Nested <Surface> components are not allowed');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ValetError');
    expect(err.message).toBe('valet: Surface: Nested <Surface> components are not allowed');
  });

  it('resolves a relative docsHint against VALET_DOCS_BASE', () => {
    const err = valetError('Tabs', 'Tabs.Tab must be inside <Tabs>', 'components/layout/tabs');
    expect(err.message).toBe(
      `valet: Tabs: Tabs.Tab must be inside <Tabs>\nDocs: ${VALET_DOCS_BASE}/components/layout/tabs`,
    );
  });

  it('normalises leading slashes in relative docsHints', () => {
    const err = valetError('Accordion', 'msg', '/components/layout/accordion');
    expect(err.message.endsWith(`\nDocs: ${VALET_DOCS_BASE}/components/layout/accordion`)).toBe(
      true,
    );
  });

  it('passes absolute http(s) docsHints through verbatim', () => {
    const url = 'https://example.com/custom/page';
    const err = valetError('RadioGroup', 'msg', url);
    expect(err.message.endsWith(`\nDocs: ${url}`)).toBe(true);
  });

  it('omits the docs line when no hint is given', () => {
    const err = valetError('FormControl', 'useForm must be used inside a <FormControl>');
    expect(err.message).not.toContain('\nDocs:');
  });
});

describe('warnOnce', () => {
  it('logs a key exactly once', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnOnce('field:flip', 'TextField: flipped controlled state');
    warnOnce('field:flip', 'TextField: flipped controlled state');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('TextField: flipped controlled state');
  });

  it('memoises keys independently', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnOnce('key-a', 'message a');
    warnOnce('key-b', 'message b');
    warnOnce('key-a', 'message a');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, 'message a');
    expect(spy).toHaveBeenNthCalledWith(2, 'message b');
  });

  it('is silent in production and does not memoise the key', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    warnOnce('prod-key', 'hidden in production');
    expect(spy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
    warnOnce('prod-key', 'visible in dev');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('visible in dev');
  });

  it('resetWarnOnce clears memoised keys', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnOnce('reset-key', 'first');
    resetWarnOnce();
    warnOnce('reset-key', 'second');
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

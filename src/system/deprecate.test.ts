// ─────────────────────────────────────────────────────────────
// src/system/deprecate.test.ts | valet
// node-env coverage for the deprecation shim (R30): deprecateProp
// warns once per rename; resolveDeprecatedProp picks canonical-wins
// and warns whenever the deprecated alias is supplied.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import { deprecateProp, resolveDeprecatedProp } from './deprecate';
import { resetWarnOnce } from './devErrors';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  resetWarnOnce();
});

describe('deprecateProp', () => {
  it('warns once naming the old prop, the new prop and the removal point', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    deprecateProp('Accordion', 'open', 'expanded');
    deprecateProp('Accordion', 'open', 'expanded');
    expect(spy).toHaveBeenCalledTimes(1);
    const msg = String(spy.mock.calls[0][0]);
    expect(msg).toContain('valet: Accordion:');
    expect(msg).toContain('`open`');
    expect(msg).toContain('`expanded`');
    expect(msg).toContain('removed at 1.0');
  });

  it('keys by component + both names — different renames warn independently', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    deprecateProp('Accordion', 'open', 'expanded');
    deprecateProp('Accordion', 'onOpenChange', 'onExpandedChange');
    deprecateProp('Pagination', 'onChange', 'onPageChange');
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('is silent in production', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    deprecateProp('Accordion', 'open', 'expanded');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('resolveDeprecatedProp', () => {
  it('returns the canonical value silently when only it is given', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const v = resolveDeprecatedProp('Accordion', 'expanded', 1, 'open', undefined);
    expect(v).toBe(1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns the deprecated value and warns when only the alias is given', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const v = resolveDeprecatedProp('Accordion', 'expanded', undefined, 'open', 2);
    expect(v).toBe(2);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toContain('`open`');
  });

  it('canonical wins when both are given, and still warns about the alias', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const v = resolveDeprecatedProp('Accordion', 'expanded', 1, 'open', 9);
    expect(v).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('honours falsy-but-defined canonical values (0 wins, no flip to the alias)', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const v = resolveDeprecatedProp('Accordion', 'expanded', 0, 'open', 5);
    // 0 !== undefined ⇒ the canonical 0 is used, not the alias 5.
    expect(v).toBe(0);
    expect(spy).toHaveBeenCalledTimes(1); // alias still present ⇒ one warn
  });

  it('returns undefined and stays silent when neither is given', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const v = resolveDeprecatedProp('Accordion', 'expanded', undefined, 'open', undefined);
    expect(v).toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
  });
});

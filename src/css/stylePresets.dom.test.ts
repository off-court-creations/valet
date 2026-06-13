// ─────────────────────────────────────────────────────────────
// src/css/stylePresets.dom.test.ts | valet
// jsdom coverage: theme updates re-insert the FULL preset rule text
// (nested rules survive and re-theme), redefine swaps the live rule
// in place at the same sheet index (cascade order preserved), and
// preset specificity (ENGINE S11): every preset rule carries the
// DOUBLED `.zp-x.zp-x` selector so it beats single-class styled()
// base rules in the cascade regardless of insertion order.
// jsdom's getComputedStyle IS specificity-aware for flat class
// rules (verified below), so the cascade win is asserted for real;
// what jsdom CANNOT simulate is pseudo-state/nested-rule cascade
// (preset `&:hover` vs component `&:hover`) — that stays on the
// phase-gate real-browser checklist.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import { definePreset, preset } from './stylePresets';
import * as sheet from './sheet';
import { resetWarnOnce } from '../system/devErrors';
import { useTheme } from '../system/themeStore';

/* Live rules in the global sheet whose selector targets `cls` ---------
   Preset selectors are doubled (`.cls.cls`, ENGINE S11). */
function rulesFor(cls: string): CSSStyleRule[] {
  const all = Array.from(sheet.getGlobalSheet()?.cssRules ?? []);
  return all.filter((r): r is CSSStyleRule => r.cssText.startsWith(`.${cls}.${cls} `));
}

function indexFor(cls: string): number {
  const all = Array.from(sheet.getGlobalSheet()?.cssRules ?? []);
  return all.findIndex((r) => r.cssText.startsWith(`.${cls}.${cls} `));
}

afterEach(() => {
  vi.restoreAllMocks();
  resetWarnOnce();
  useTheme.getState().resetTheme();
});

describe('preset specificity (ENGINE S11, jsdom)', () => {
  it('preset rules are inserted with a doubled selector (.cls.cls)', () => {
    definePreset('spec-shape', () => 'color: rgb(101, 101, 101);');
    const cls = preset('spec-shape');
    const rules = rulesFor(cls);
    expect(rules).toHaveLength(1);
    expect(rules[0].selectorText).toBe(`.${cls}.${cls}`);
    /* preset() hands components ONE class — only the rule text doubles */
    expect(cls).not.toContain(' ');
    expect(cls).toMatch(/^zp-spec-shape-[0-9a-z]+-[0-9a-z]+$/);
  });

  it('an app-init preset beats a later-inserted component base rule (the audit repro)', () => {
    /* Audit stylePresets.ts:54: presets register at app init, styled()
       base rules insert at first render. Pre-fix both were 0-1-0, so
       the LATER component rule always won the tie and the preset could
       never override. Reproduce that exact order with the engine's own
       insertion path and assert the preset now wins the cascade. */
    definePreset('spec-cascade', () => 'background-color: rgb(9, 9, 9); color: rgb(8, 8, 8);');
    const presetCls = preset('spec-cascade');

    /* Component-shaped single-class rule, inserted AFTER the preset —
       exactly what styled() emits on first render. */
    const componentCls = 'z-div-speccascadeprobe';
    sheet.insertRuleText(
      `.${componentCls}{background-color: rgb(1, 1, 1); color: rgb(2, 2, 2); padding: 4px;}`,
    );

    const el = document.createElement('div');
    el.className = `${componentCls} ${presetCls}`;
    document.body.appendChild(el);
    try {
      const computed = getComputedStyle(el);
      /* Pre-fix: rgb(1, 1, 1) / rgb(2, 2, 2) — the component rule won. */
      expect(computed.backgroundColor).toBe('rgb(9, 9, 9)');
      expect(computed.color).toBe('rgb(8, 8, 8)');
      /* Properties the preset does NOT set still come from the component */
      expect(computed.padding).toBe('4px');
    } finally {
      el.remove();
    }
  });

  it('the doubled selector survives theme re-registration (the in-place rule swap)', () => {
    useTheme.getState().setTheme({ colors: { specTheme: 'rgb(110, 110, 110)' } });
    definePreset('spec-retheme', (t) => `background-color: ${t.colors.specTheme};`);
    const cls = preset('spec-retheme');
    expect(rulesFor(cls)[0].selectorText).toBe(`.${cls}.${cls}`);

    useTheme.getState().setTheme({ colors: { specTheme: 'rgb(120, 120, 120)' } });

    const after = rulesFor(cls);
    expect(after).toHaveLength(1);
    expect(after[0].selectorText).toBe(`.${cls}.${cls}`); // still doubled
    expect(after[0].cssText).toContain('rgb(120, 120, 120)');
  });

  it('the doubled selector survives redefine (HMR path)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    definePreset('spec-redef', () => 'color: rgb(130, 130, 130);');
    const cls = preset('spec-redef');
    definePreset('spec-redef', () => 'color: rgb(140, 140, 140);');
    const rules = rulesFor(cls);
    expect(rules).toHaveLength(1);
    expect(rules[0].selectorText).toBe(`.${cls}.${cls}`);
    expect(rules[0].cssText).toContain('rgb(140, 140, 140)');
  });
});

describe('stylePresets (jsdom)', () => {
  it('theme updates re-insert the full rule text so nested rules re-theme', () => {
    useTheme.getState().setTheme({
      colors: { probeBase: 'rgb(1, 1, 1)', probeHover: 'rgb(2, 2, 2)' },
    });
    definePreset(
      'nested-probe',
      (t) => `
        color: ${t.colors.probeBase};
        &:hover { color: ${t.colors.probeHover}; }
      `,
    );
    const cls = preset('nested-probe');
    const idx = indexFor(cls);
    expect(rulesFor(cls)).toHaveLength(1);
    expect(rulesFor(cls)[0].cssText).toContain('rgb(2, 2, 2)');

    useTheme.getState().setTheme({
      colors: { probeBase: 'rgb(3, 3, 3)', probeHover: 'rgb(4, 4, 4)' },
    });

    const after = rulesFor(cls);
    expect(after).toHaveLength(1); // swapped, not duplicated
    expect(indexFor(cls)).toBe(idx); // same sheet index ⇒ cascade order kept
    expect(after[0].cssText).toContain('rgb(3, 3, 3)');
    /* Pre-overhaul `rule.style.cssText = next` updated only the top-level
       declarations — the nested &:hover kept the stale rgb(2, 2, 2). */
    expect(after[0].cssText).toContain('&:hover');
    expect(after[0].cssText).toContain('rgb(4, 4, 4)');
    expect(after[0].cssText).not.toContain('rgb(2, 2, 2)');
  });

  it('redefine replaces the live rule in place — one rule, same index, same class', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    definePreset('dom-redef', () => 'color: rgb(10, 10, 10);');
    const cls = preset('dom-redef');
    const idx = indexFor(cls);

    definePreset('dom-redef', () => 'color: rgb(20, 20, 20);');

    expect(preset('dom-redef')).toBe(cls); // class stays stable
    const rules = rulesFor(cls);
    expect(rules).toHaveLength(1); // replaced, never appended
    expect(indexFor(cls)).toBe(idx);
    expect(rules[0].cssText).toContain('rgb(20, 20, 20)');
    expect(rules[0].cssText).not.toContain('rgb(10, 10, 10)');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('identical-content redefine keeps class and live rule text unchanged', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    definePreset('dom-stable', () => 'color: rgb(30, 30, 30);');
    const cls = preset('dom-stable');
    const textBefore = rulesFor(cls)[0].cssText;
    const insert = vi.spyOn(CSSStyleSheet.prototype, 'insertRule');

    definePreset('dom-stable', () => 'color: rgb(30, 30, 30);'); // new fn, same CSS

    expect(preset('dom-stable')).toBe(cls);
    expect(rulesFor(cls)[0].cssText).toBe(textBefore);
    expect(insert).not.toHaveBeenCalled(); // no sheet churn
  });

  it('a failed rule swap keeps the old CSS cached so the next theme tick retries', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    useTheme.getState().setTheme({ colors: { failProbe: 'rgb(70, 70, 70)' } });
    definePreset('fail-probe', (t) => `color: ${t.colors.failProbe};`);
    const cls = preset('fail-probe');

    vi.spyOn(CSSStyleSheet.prototype, 'insertRule').mockImplementationOnce(() => {
      throw new Error('refused');
    });
    useTheme.getState().setTheme({ colors: { failProbe: 'rgb(80, 80, 80)' } });
    expect(rulesFor(cls)[0].cssText).toContain('rgb(70, 70, 70)'); // old rule kept
    expect(error).toHaveBeenCalledTimes(1);

    /* Identical recompute: were the failed text cached, this tick would be
       skipped (nextCSS === entry.css) and the stale rule would persist. */
    useTheme.getState().setTheme({ colors: { failProbe: 'rgb(80, 80, 80)' } });
    const rules = rulesFor(cls);
    expect(rules).toHaveLength(1);
    expect(rules[0].cssText).toContain('rgb(80, 80, 80)');
  });

  it('a failed redefine swap does not poison the cache — re-registering retries', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    definePreset('redef-fail', () => 'color: rgb(90, 90, 90);');
    const cls = preset('redef-fail');

    vi.spyOn(CSSStyleSheet.prototype, 'insertRule').mockImplementationOnce(() => {
      throw new Error('refused');
    });
    definePreset('redef-fail', () => 'color: rgb(100, 100, 100);'); // swap fails
    expect(rulesFor(cls)[0].cssText).toContain('rgb(90, 90, 90)'); // old rule kept
    expect(error).toHaveBeenCalledTimes(1);

    definePreset('redef-fail', () => 'color: rgb(100, 100, 100);'); // same text again
    const rules = rulesFor(cls);
    expect(rules).toHaveLength(1); // swapped in place, never appended
    expect(rules[0].cssText).toContain('rgb(100, 100, 100)');
  });

  it('after a redefine, theme updates use the NEW cssFn (HMR rationale)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    definePreset('hmr-probe', () => 'color: rgb(40, 40, 40);');
    const cls = preset('hmr-probe');
    definePreset('hmr-probe', (t) => `color: ${t.colors.hmrProbe ?? 'rgb(50, 50, 50)'};`);

    useTheme.getState().setTheme({ colors: { hmrProbe: 'rgb(60, 60, 60)' } });

    const rules = rulesFor(cls);
    expect(rules).toHaveLength(1);
    /* Warn-and-keep semantics would still serve rgb(40, 40, 40) here. */
    expect(rules[0].cssText).toContain('rgb(60, 60, 60)');
  });
});

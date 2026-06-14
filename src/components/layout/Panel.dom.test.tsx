// ─────────────────────────────────────────────────────────────
// src/components/layout/Panel.dom.test.tsx | valet
// ENGINE S11 — the `presetHas` workaround is retired: Panel renders
// its default filled background unconditionally and a background-
// bearing preset overrides it purely via the cascade (doubled
// `.zp-x.zp-x` preset selectors out-specifify the single-class
// styled() base rule). jsdom's getComputedStyle is specificity-aware
// for flat class rules, so the override is asserted end-to-end with
// the real engine. Real-browser checklist item: pseudo-state preset
// overrides (e.g. preset `&:hover` vs component `&:hover`) — jsdom
// does not cascade nested/pseudo rules.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Panel } from './Panel';
import { definePreset, preset } from '../../css/stylePresets';
import { useTheme } from '../../system/themeStore';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; surfaceStore constructs one ----------- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
const g = globalThis as { ResizeObserver?: unknown };
if (!g.ResizeObserver) g.ResizeObserver = ResizeObserverStub;

/* App-init order (the audit's losing order): presets register at module
   scope, BEFORE any styled() base rule is inserted at first render. */
definePreset('panel-bg-probe', () => 'background: rgb(9, 99, 9);');

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(node);
  });
  return container;
}

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  useTheme.getState().resetTheme();
});

describe('Panel preset background (ENGINE S11, jsdom)', () => {
  it('filled Panel without a preset renders the theme default background', () => {
    useTheme.getState().setTheme({ colors: { backgroundAlt: 'rgb(21, 22, 23)' } });
    const container = render(<Panel data-testid='plain'>x</Panel>);
    const el = container.querySelector('[data-valet-component="Panel"]') as HTMLElement;
    expect(el).toBeTruthy();
    expect(getComputedStyle(el).backgroundColor).toBe('rgb(21, 22, 23)');
  });

  it('a background-bearing preset overrides the default via the cascade (presetHas retired)', () => {
    useTheme.getState().setTheme({ colors: { backgroundAlt: 'rgb(21, 22, 23)' } });
    const container = render(<Panel preset='panel-bg-probe'>x</Panel>);
    const el = container.querySelector('[data-valet-component="Panel"]') as HTMLElement;
    expect(el).toBeTruthy();
    /* The preset class is on the element alongside the styled class */
    expect(el.classList.contains(preset('panel-bg-probe'))).toBe(true);
    /* Panel emits its default background unconditionally now… */
    const styledRule = Array.from(
      (document.querySelector('style')?.sheet?.cssRules ?? []) as Iterable<CSSRule>,
    ).find((r) => el.classList.contains((r as CSSStyleRule).selectorText?.slice(1) ?? ''));
    expect(styledRule?.cssText).toContain('rgb(21, 22, 23)');
    /* …and the preset still wins the cascade (pre-fix: equal specificity,
       later-inserted component rule won and the preset never applied). */
    expect(getComputedStyle(el).backgroundColor).toBe('rgb(9, 99, 9)');
  });

  it('an explicit color prop still beats the preset default path on the component side', () => {
    /* Explicit color routes through the SAME styled rule (single class) —
       the preset still out-specifies it. This pins the precedence story:
       preset (cascade) > component-computed background of any flavor;
       consumers wanting a one-off override use sx (inline style). */
    const container = render(
      <Panel
        preset='panel-bg-probe'
        color='rgb(50, 60, 70)'
      >
        x
      </Panel>,
    );
    const el = container.querySelector('[data-valet-component="Panel"]') as HTMLElement;
    expect(getComputedStyle(el).backgroundColor).toBe('rgb(9, 99, 9)');
    /* sx (inline style) beats everything, preset included */
    const container2 = render(
      <Panel
        preset='panel-bg-probe'
        sx={{ background: 'rgb(80, 80, 80)' }}
      >
        x
      </Panel>,
    );
    const el2 = container2.querySelector('[data-valet-component="Panel"]') as HTMLElement;
    expect(getComputedStyle(el2).backgroundColor).toBe('rgb(80, 80, 80)');
  });
});

describe('Panel default padding (1.0, jsdom)', () => {
  /** The styled rule cssText for the Panel element. */
  const styledRule = (el: HTMLElement) =>
    Array.from((document.querySelector('style')?.sheet?.cssRules ?? []) as Iterable<CSSRule>).find(
      (r) => el.classList.contains((r as CSSStyleRule).selectorText?.slice(1) ?? ''),
    )?.cssText ?? '';

  it('defaults pad to 2 spacing units (~16px) — role-aware card-surface default', () => {
    // "Beautiful by default": a Panel is a bordered card, so its content gets
    // 2× the spacing unit of padding by default (was 1×). Pinned against drift.
    const container = render(<Panel>x</Panel>);
    const el = container.querySelector('[data-valet-component="Panel"]') as HTMLElement;
    expect(styledRule(el)).toMatch(/padding:\s*calc\(var\(--valet-space[^)]*\)\s*\*\s*2\)/);
  });

  it('an explicit pad overrides the default (e.g. tight pad={1})', () => {
    const container = render(<Panel pad={1}>x</Panel>);
    const el = container.querySelector('[data-valet-component="Panel"]') as HTMLElement;
    expect(styledRule(el)).toMatch(/padding:\s*calc\(var\(--valet-space[^)]*\)\s*\*\s*1\)/);
  });

  it('width respects --valet-panel-width so a Grid can equalize card widths', () => {
    // Standalone fallback is the fullWidth-derived value (auto here); a Grid
    // sets --valet-panel-width: 100% on its children to fill the cell.
    const container = render(<Panel>x</Panel>);
    const el = container.querySelector('[data-valet-component="Panel"]') as HTMLElement;
    expect(styledRule(el)).toContain('width: var(--valet-panel-width');
  });
});

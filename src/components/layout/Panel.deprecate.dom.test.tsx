// ─────────────────────────────────────────────────────────────
// src/components/layout/Panel.deprecate.dom.test.tsx | valet
// API-TYPES S12 (Q12, ruling R30) — Panel's `normalizeRowHeight` prop was
// renamed to the canonical plural `normalizeRowHeights`. The old singular
// ships as an additive alias through 0.x: it keeps toggling Grid row-height
// normalization but dev-warns once, and the canonical plural wins when both
// are supplied. Removed at 1.0.
//
// Behaviour is observable through the generated styled rule: opting out
// (`false`) emits `--valet-panel-align-self: flex-start;`; the default
// (normalize) omits it. So the alias is proven to drive the same rule text
// the canonical produces, and warn-once is asserted off console.warn.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Panel } from './Panel';
import { useTheme } from '../../system/themeStore';
import { resetWarnOnce } from '../../system/devErrors';

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

const panelOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-valet-component="Panel"]')!;

/**
 * True when the Panel opted OUT of normalization. Opting out emits
 * `--valet-panel-align-self: flex-start;` into the styled rule; normalizing
 * omits the var entirely. getComputedStyle resolves the var through the real
 * cascade, so this is the cascade-accurate behavioural signal.
 */
const optsOut = (el: HTMLElement) =>
  getComputedStyle(el).getPropertyValue('--valet-panel-align-self').trim() === 'flex-start';

let warnSpy: ReturnType<typeof vi.spyOn>;
const deprecationWarns = () =>
  (warnSpy.mock.calls as unknown[][])
    .map((c) => String(c[0]))
    .filter((m) => m.includes('is deprecated'));

beforeEach(() => {
  resetWarnOnce();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  warnSpy.mockRestore();
  useTheme.getState().resetTheme();
});

/* ─────────────────────────────────────────────────────────────
   Canonical `normalizeRowHeights` — works silently
   ───────────────────────────────────────────────────────────── */
describe('Panel canonical `normalizeRowHeights` (jsdom)', () => {
  it('default (omitted) normalizes — no opt-out var, no warning', () => {
    const container = render(<Panel>x</Panel>);
    expect(optsOut(panelOf(container))).toBe(false);
    expect(deprecationWarns()).toEqual([]);
  });

  it('`normalizeRowHeights={false}` opts out via the align-self var, no warning', () => {
    const container = render(<Panel normalizeRowHeights={false}>x</Panel>);
    expect(optsOut(panelOf(container))).toBe(true);
    expect(deprecationWarns()).toEqual([]);
  });
});

/* ─────────────────────────────────────────────────────────────
   Deprecated singular `normalizeRowHeight` — works, but warns once
   ───────────────────────────────────────────────────────────── */
describe('Panel deprecated `normalizeRowHeight` alias (jsdom)', () => {
  it('`normalizeRowHeight={false}` opts out exactly like the plural and warns once', () => {
    const container = render(<Panel normalizeRowHeight={false}>x</Panel>);
    expect(optsOut(panelOf(container))).toBe(true);
    const warns = deprecationWarns();
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('`normalizeRowHeight`');
    expect(warns[0]).toContain('`normalizeRowHeights`');
  });

  it('warns once across re-renders that keep passing the alias', () => {
    const ui = (v: boolean) => <Panel normalizeRowHeight={v}>x</Panel>;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push({ root, container });
    act(() => root.render(ui(false)));
    act(() => root.render(ui(false)));
    expect(deprecationWarns()).toHaveLength(1);
  });
});

/* ─────────────────────────────────────────────────────────────
   Both given — canonical wins, alias still warns
   ───────────────────────────────────────────────────────────── */
describe('Panel `normalizeRowHeights` + `normalizeRowHeight` together (jsdom)', () => {
  it('the plural wins (normalize), the singular still warns once', () => {
    const container = render(
      // plural=true normalizes; the stale singular=false is ignored.
      <Panel
        normalizeRowHeights={true}
        normalizeRowHeight={false}
      >
        x
      </Panel>,
    );
    expect(optsOut(panelOf(container))).toBe(false);
    const warns = deprecationWarns();
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('`normalizeRowHeight`');
  });
});

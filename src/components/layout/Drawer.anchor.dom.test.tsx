// ─────────────────────────────────────────────────────────────
// src/components/layout/Drawer.anchor.dom.test.tsx | valet
// A11Y S12 regression — Drawer's additive logical 'start'/'end'
// anchors resolve to a PHYSICAL side per the active writing
// direction (via the pure resolveAnchor), while explicit physical
// anchors stay put under RTL.
//
// jsdom has no layout, but the styled engine resolves the physical
// $anchor math into the injected CSS rule for the panel's class, so
// we read that rule text to assert which side the panel paints on.
// CSSOM normalizes the edge-pin to `left: 0px` / `right: 0px`:
//   • anchor='start' + dir=ltr → left edge   (left: 0px,  border-right)
//   • anchor='start' + dir=rtl → RIGHT edge  (right: 0px, border-left)
//   • anchor='left'  + dir=rtl → left edge   (never flips)
// (Assert on the `0px` edge-pin, not a bare `right: 0`, so the
//  `border-right: 0.25rem` accent never collides with the check.)
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Surface } from './Surface';
import { Drawer } from './Drawer';
import { ValetLocaleProvider } from '../../system/locale';
import { overlayStackSize } from '../../system/overlay';
import * as sheet from '../../css/sheet';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  if (!window.matchMedia) {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
    }));
  }
});

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(node);
  });
  return { root, container };
}

const overlayRoot = () => document.getElementById('valet-overlay-root');
const panelEl = () => overlayRoot()?.querySelector<HTMLElement>('[data-valet-component="Drawer"]');

/** The injected CSS rule text for an element's first (styled) class. */
const ruleTextOf = (el: Element): string => {
  const cls = el.className.split(' ').find((c) => c.startsWith('z-div-')) ?? '';
  const rules = Array.from(sheet.getGlobalSheet()?.cssRules ?? [], (r) => r.cssText);
  return rules.find((t) => t.startsWith(`.${cls}`)) ?? '';
};

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  expect(overlayStackSize()).toBe(0);
});

describe('Drawer logical anchors under RTL (A11Y S12, jsdom)', () => {
  it("anchor='start' under rtl paints on the RIGHT side", () => {
    render(
      <ValetLocaleProvider locale='ar-EG'>
        <Surface>
          <Drawer
            open
            anchor='start'
            aria-label='Nav'
          >
            contents
          </Drawer>
        </Surface>
      </ValetLocaleProvider>,
    );
    const rule = ruleTextOf(panelEl()!);
    // Right edge-pinned + right-anchor accent (border-left), no left pinning.
    expect(rule).toContain('right: 0px');
    expect(rule).toContain('border-left');
    expect(rule).not.toContain('left: 0px');
  });

  it("anchor='start' under ltr paints on the LEFT side", () => {
    render(
      <ValetLocaleProvider locale='en-US'>
        <Surface>
          <Drawer
            open
            anchor='start'
            aria-label='Nav'
          >
            contents
          </Drawer>
        </Surface>
      </ValetLocaleProvider>,
    );
    const rule = ruleTextOf(panelEl()!);
    expect(rule).toContain('left: 0px');
    expect(rule).toContain('border-right');
    expect(rule).not.toContain('right: 0px');
  });

  it("anchor='end' under rtl paints on the LEFT side", () => {
    render(
      <ValetLocaleProvider locale='ar-EG'>
        <Surface>
          <Drawer
            open
            anchor='end'
            aria-label='Nav'
          >
            contents
          </Drawer>
        </Surface>
      </ValetLocaleProvider>,
    );
    const rule = ruleTextOf(panelEl()!);
    expect(rule).toContain('left: 0px');
    expect(rule).toContain('border-right');
  });

  it("explicit anchor='left' under rtl NEVER flips (stays on the left)", () => {
    render(
      <ValetLocaleProvider locale='ar-EG'>
        <Surface>
          <Drawer
            open
            anchor='left'
            aria-label='Nav'
          >
            contents
          </Drawer>
        </Surface>
      </ValetLocaleProvider>,
    );
    const rule = ruleTextOf(panelEl()!);
    expect(rule).toContain('left: 0px');
    expect(rule).toContain('border-right');
    expect(rule).not.toContain('right: 0px');
  });

  it("explicit anchor='right' under ltr stays on the right (control)", () => {
    render(
      <Surface>
        <Drawer
          open
          anchor='right'
          aria-label='Nav'
        >
          contents
        </Drawer>
      </Surface>,
    );
    const rule = ruleTextOf(panelEl()!);
    expect(rule).toContain('right: 0px');
    expect(rule).toContain('border-left');
  });
});

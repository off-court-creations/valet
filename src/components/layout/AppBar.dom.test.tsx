// ─────────────────────────────────────────────────────────────
// src/components/layout/AppBar.dom.test.tsx | valet
// API-TYPES S13 regression — AppBar's intent CSS variables now come
// from the shared computeIntentVars helper. The old hover/active maths
// concatenated a hex-alpha suffix onto the base colour (`base + 'F0'`),
// which is INVALID CSS the moment the theme colour is rgb()/hsl()/named.
// This suite proves the hover/active/disabled vars are valid #rrggbb
// for an rgb() colour, and that a hex theme colour still works.
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Surface } from './Surface';
import { AppBar } from './AppBar';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

const roots: Array<{ root: Root; container: HTMLElement }> = [];

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(node);
  });
  return { container };
}

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

const HEX6 = /^#[0-9a-f]{6}$/;
const bar = (): HTMLElement =>
  document.querySelector("[data-valet-component='AppBar']") as HTMLElement;

describe('AppBar intent vars (API-TYPES S13)', () => {
  it('produces VALID #rrggbb hover/active/disabled vars for an rgb() theme colour', () => {
    // Pre-S13 this was `'rgb(14, 101, 192)' + 'F0'` → invalid CSS.
    render(
      <Surface>
        <AppBar
          fixed={false}
          portal={false}
          color='rgb(14, 101, 192)'
        />
      </Surface>,
    );
    const s = bar().style;
    expect(s.getPropertyValue('--valet-intent-bg-hover')).toMatch(HEX6);
    expect(s.getPropertyValue('--valet-intent-bg-active')).toMatch(HEX6);
    expect(s.getPropertyValue('--valet-intent-fg-disabled')).toMatch(HEX6);
    // and the contract base vars carry the caller's colour through unchanged
    expect(s.getPropertyValue('--valet-intent-bg')).toBe('rgb(14, 101, 192)');
    // the broken hex-concat suffix is gone
    expect(s.getPropertyValue('--valet-intent-bg-hover')).not.toContain('rgb');
    expect(s.getPropertyValue('--valet-intent-bg-hover').toUpperCase()).not.toMatch(/F0$/);
  });

  it('produces valid #rrggbb hover/active/disabled vars for a hex theme colour', () => {
    render(
      <Surface>
        <AppBar
          fixed={false}
          portal={false}
          color='#0E65C0'
        />
      </Surface>,
    );
    const s = bar().style;
    expect(s.getPropertyValue('--valet-intent-bg-hover')).toMatch(HEX6);
    expect(s.getPropertyValue('--valet-intent-bg-active')).toMatch(HEX6);
    expect(s.getPropertyValue('--valet-intent-fg-disabled')).toMatch(HEX6);
  });
});

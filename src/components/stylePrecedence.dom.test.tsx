// ─────────────────────────────────────────────────────────────
// src/components/stylePrecedence.dom.test.tsx | valet
// API-TYPES S8 regression — uniform style/sx precedence.
// For every component that accepts BOTH a caller `style` prop and an
// `sx` prop, sx must win on conflicting keys (caller style < sx). This
// suite pins the flip for the three sites S8 reordered: Tooltip,
// SpeedDial and Drawer (all previously merged `style` AFTER `sx`).
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Tooltip from './widgets/Tooltip';
import SpeedDial from './widgets/SpeedDial';
import Drawer from './layout/Drawer';
import { Surface } from './layout/Surface';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; Surface + Drawer observe in effects. */
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
  document.body.innerHTML = '';
});

/* sx wins on conflict; caller style survives on non-conflicting keys. */
const STYLE = { marginTop: '3px', marginRight: '7px' } as React.CSSProperties;
const SX = { marginTop: '9px' };

const find = (component: string): HTMLElement =>
  document.querySelector(`[data-valet-component='${component}']`) as HTMLElement;

describe('style/sx precedence (API-TYPES S8)', () => {
  it('Tooltip: sx wins over caller style; caller style otherwise preserved', () => {
    render(
      <Tooltip
        title='hi'
        style={STYLE}
        sx={SX}
      >
        <button type='button'>trigger</button>
      </Tooltip>,
    );
    const el = find('Tooltip');
    expect(el).toBeTruthy();
    expect(el.style.getPropertyValue('margin-top')).toBe('9px'); // sx wins
    expect(el.style.getPropertyValue('margin-right')).toBe('7px'); // caller style kept
  });

  it('SpeedDial: sx wins over caller style; caller style otherwise preserved', () => {
    render(
      <SpeedDial
        icon={<span>+</span>}
        actions={[{ icon: <span>a</span>, label: 'Add', onClick: () => {} }]}
        style={STYLE}
        sx={SX}
      />,
    );
    const el = find('SpeedDial');
    expect(el).toBeTruthy();
    expect(el.style.getPropertyValue('margin-top')).toBe('9px'); // sx wins
    expect(el.style.getPropertyValue('margin-right')).toBe('7px'); // caller style kept
  });

  it('Drawer: sx wins over caller style; component layout still applied', () => {
    render(
      <Surface>
        <Drawer
          open
          anchor='left'
          aria-label='nav'
          style={STYLE}
          sx={SX}
        >
          <div>contents</div>
        </Drawer>
      </Surface>,
    );
    const el = find('Drawer');
    expect(el).toBeTruthy();
    expect(el.style.getPropertyValue('margin-top')).toBe('9px'); // sx wins
    expect(el.style.getPropertyValue('margin-right')).toBe('7px'); // caller style kept
    // component-owned layout for a left anchor still lands (top offset)
    expect(el.style.getPropertyValue('top')).not.toBe('');
  });
});

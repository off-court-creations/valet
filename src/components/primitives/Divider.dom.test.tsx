// ─────────────────────────────────────────────────────────────
// src/components/primitives/Divider.dom.test.tsx | valet
// Divider — the line carries role="separator" with an aria-orientation
// that tracks the `orientation` prop, and the orientation drives the
// height/width split in the injected styled rule.
//
// Divider reads only the global theme + compact context, so no Surface
// wrapper is required.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Divider } from './Divider';
import * as sheet from '../../css/sheet';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(<React.StrictMode>{node}</React.StrictMode>);
  });
  return container;
}

const line = (c: HTMLElement) => c.querySelector('[role="separator"]') as HTMLElement;

/** The CSS rule text for the element's first (styled) class. */
const ruleFor = (el: Element) => {
  const cls = el.className.split(' ').find(Boolean) ?? '';
  const rules = Array.from(sheet.getGlobalSheet()?.cssRules ?? [], (r) => r.cssText);
  return rules.find((t) => t.startsWith(`.${cls}`)) ?? '';
};

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* Suite ----------------------------------------------------------------- */
describe('Divider (jsdom)', () => {
  it('renders a separator with horizontal orientation by default', () => {
    const el = line(render(<Divider />));
    expect(el).not.toBeNull();
    expect(el.getAttribute('role')).toBe('separator');
    expect(el.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('reflects orientation=vertical on aria-orientation', () => {
    const el = line(render(<Divider orientation='vertical' />));
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('a horizontal divider sets its height (thickness) and full width', () => {
    const el = line(render(<Divider orientation='horizontal' />));
    const rule = ruleFor(el);
    expect(rule).toContain('width: 100%');
    expect(rule).toContain('height:');
  });

  it('a vertical divider sets its width (thickness) and full height', () => {
    const el = line(render(<Divider orientation='vertical' />));
    const rule = ruleFor(el);
    expect(rule).toContain('height: 100%');
    expect(rule).toContain('width:');
  });

  it('an explicit length is applied along the main axis', () => {
    const el = line(render(<Divider length={120} />));
    expect(ruleFor(el)).toContain('width: 120px');
  });

  it('forwards a passthrough attribute onto the line', () => {
    const el = line(render(<Divider data-testid='sep' />));
    expect(el.getAttribute('data-testid')).toBe('sep');
  });
});

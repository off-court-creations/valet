// ─────────────────────────────────────────────────────────────
// src/components/layout/Accordion.a11y.dom.test.tsx | valet
// A11Y S6 (plan §3.6 / ruling R14) — header/panel DOM ids are
// namespaced per <Accordion> instance via useId() so id /
// aria-controls / aria-labelledby never collide when two
// Accordions render on the same page (audit Accordion.tsx:580–581 —
// the items minted index-only `acc-btn-${i}` / `acc-panel-${i}` ids
// that collided across instances despite useId() being available).
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Surface } from './Surface';
import { Accordion } from './Accordion';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
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

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

const sample = () => (
  <Accordion>
    <Accordion.Item header='First'>one</Accordion.Item>
    <Accordion.Item header='Second'>two</Accordion.Item>
  </Accordion>
);

const headers = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>('button[aria-expanded]'));
const regions = (c: HTMLElement) => Array.from(c.querySelectorAll('[role="region"]'));

describe('Accordion ARIA id namespacing (A11Y S6, jsdom)', () => {
  it('wires each header to its panel via aria-controls / aria-labelledby', () => {
    const { container } = render(<Surface>{sample()}</Surface>);
    const hs = headers(container);
    const rs = regions(container);
    expect(hs).toHaveLength(2);
    expect(rs).toHaveLength(2);
    hs.forEach((h, i) => {
      expect(h.getAttribute('aria-controls')).toBe(rs[i].getAttribute('id'));
      expect(rs[i].getAttribute('aria-labelledby')).toBe(h.getAttribute('id'));
    });
  });

  it('namespaces ids per instance — two Accordions on one page never collide', () => {
    const { container } = render(
      <Surface>
        {sample()}
        {sample()}
      </Surface>,
    );
    const headerIds = headers(container).map((h) => h.id);
    const panelIds = regions(container).map((r) => r.id);
    // Four headers / four panels across two instances, every id unique
    // (pre-fix both instances minted acc-btn-0/acc-btn-1).
    expect(headerIds).toHaveLength(4);
    expect(new Set(headerIds).size).toBe(4);
    expect(new Set(panelIds).size).toBe(4);
    // ids are valid CSS selector tokens (no `:` from useId leaked through).
    for (const id of [...headerIds, ...panelIds]) expect(id).not.toContain(':');
    // The two instances carry distinct useId prefixes.
    const prefixes = new Set(headerIds.map((id) => id.replace(/-btn-\d+$/, '')));
    expect(prefixes.size).toBe(2);
  });

  it('every panel aria-labelledby resolves to an existing header in the document', () => {
    const { container } = render(
      <Surface>
        {sample()}
        {sample()}
      </Surface>,
    );
    for (const region of regions(container)) {
      const labelledBy = region.getAttribute('aria-labelledby')!;
      expect(document.getElementById(labelledBy)).not.toBeNull();
    }
  });
});

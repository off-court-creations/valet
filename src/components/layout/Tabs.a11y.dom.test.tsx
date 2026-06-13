// ─────────────────────────────────────────────────────────────
// src/components/layout/Tabs.a11y.dom.test.tsx | valet
// A11Y S6 (plan §3.6 / ruling R13) — ARIA structure for Tabs:
//   • the tab strip exposes role='tablist' + aria-orientation that
//     tracks the `orientation` prop (audit Tabs.tsx:702 — no
//     role='tablist' anywhere previously);
//   • tab/panel DOM ids are namespaced per <Tabs> instance via
//     useId() so id / aria-controls / aria-labelledby never collide
//     when two Tabs render on the same page (audit Tabs.tsx:702 —
//     index-only ids collide across instances).
// House style: createRoot + act, no @testing-library. Rendered
// WITHOUT StrictMode (mirrors the sibling first-render suite).
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Surface } from './Surface';
import { Tabs } from './Tabs';

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

const sample = (extra?: { value?: string; orientation?: 'horizontal' | 'vertical' }) => (
  <Tabs {...extra}>
    <Tabs.Tab
      value='a'
      label='Alpha'
    />
    <Tabs.Tab
      value='b'
      label='Beta'
    />
    <Tabs.Panel>panel-a</Tabs.Panel>
    <Tabs.Panel>panel-b</Tabs.Panel>
  </Tabs>
);

describe('Tabs ARIA structure (A11Y S6, jsdom)', () => {
  it('renders a role="tablist" strip with aria-orientation matching orientation', () => {
    const { container } = render(<Surface>{sample({ orientation: 'horizontal' })}</Surface>);
    const list = container.querySelector('[role="tablist"]');
    expect(list).not.toBeNull();
    expect(list!.getAttribute('aria-orientation')).toBe('horizontal');
    // The tabs live inside the tablist.
    expect(list!.querySelectorAll('[role="tab"]')).toHaveLength(2);
  });

  it('aria-orientation follows a vertical orientation', () => {
    const { container } = render(<Surface>{sample({ orientation: 'vertical' })}</Surface>);
    const list = container.querySelector('[role="tablist"]');
    expect(list!.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('wires each tab to its panel via aria-controls / aria-labelledby', () => {
    const { container } = render(<Surface>{sample({ value: 'a' })}</Surface>);
    const activeTab = container.querySelector('[role="tab"][aria-selected="true"]')!;
    const panel = container.querySelector('[role="tabpanel"]')!;
    // The active tab controls the mounted panel and the panel points back.
    expect(activeTab.getAttribute('aria-controls')).toBe(panel.getAttribute('id'));
    expect(panel.getAttribute('aria-labelledby')).toBe(activeTab.getAttribute('id'));
  });

  it('namespaces ids per instance — two Tabs on one page never collide', () => {
    const { container } = render(
      <Surface>
        {sample()}
        {sample()}
      </Surface>,
    );
    const tabIds = Array.from(container.querySelectorAll('[role="tab"]')).map((el) => el.id);
    // Four tabs total, every id unique (pre-fix they were tab-0/tab-1 ×2).
    expect(tabIds).toHaveLength(4);
    expect(new Set(tabIds).size).toBe(4);
    // The two instances carry distinct useId prefixes.
    const prefixOf = (id: string) => id.replace(/-tab-\d+$/, '');
    const prefixes = new Set(tabIds.map(prefixOf));
    expect(prefixes.size).toBe(2);
    // ids are valid CSS selector tokens (no `:` from useId leaked through).
    for (const id of tabIds) expect(id).not.toContain(':');
  });

  it('keeps panel ids namespaced and matching their controlling tab across instances', () => {
    const { container } = render(
      <Surface>
        {sample({ value: 'a' })}
        {sample({ value: 'b' })}
      </Surface>,
    );
    const panels = Array.from(container.querySelectorAll('[role="tabpanel"]'));
    const panelIds = panels.map((p) => p.id);
    expect(new Set(panelIds).size).toBe(panelIds.length); // all unique
    for (const panel of panels) {
      const labelledBy = panel.getAttribute('aria-labelledby')!;
      // The referenced tab actually exists in the document.
      expect(document.getElementById(labelledBy)).not.toBeNull();
    }
  });
});

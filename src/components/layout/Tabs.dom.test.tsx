// ─────────────────────────────────────────────────────────────
// src/components/layout/Tabs.dom.test.tsx | valet
// FIELDS S3 regression — value/defaultValue must resolve on the
// FIRST committed paint. The original bug read tabValuesRef during
// render before it was populated, so the first render always showed
// tab 0. StrictMode's dev-only double render re-read the by-then
// populated ref and masked the bug, so these suites deliberately
// render WITHOUT StrictMode to reproduce the production single-pass
// render. No state update follows the initial commit in these
// scenarios, so the DOM asserted on IS the first committed paint.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Surface } from './Surface';
import { Tabs } from './Tabs';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; Surface + Tabs observe in effects. */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render WITHOUT StrictMode (see header) into a fresh container. */
function renderPlain(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(node);
  });
  return { root, container };
}

const tabsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'));

const selectedOf = (container: HTMLElement) =>
  tabsOf(container).map((el) => el.getAttribute('aria-selected'));

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* Suite ----------------------------------------------------------------- */
describe('Tabs first-render value (jsdom, no StrictMode)', () => {
  it('controlled `value` puts aria-selected on the matching tab in the first committed paint', () => {
    const { container } = renderPlain(
      <Surface>
        <Tabs value='b'>
          <Tabs.Tab
            value='a'
            label='Alpha'
          />
          <Tabs.Tab
            value='b'
            label='Beta'
          />
          <Tabs.Tab
            value='c'
            label='Gamma'
          />
          <Tabs.Panel>panel-a</Tabs.Panel>
          <Tabs.Panel>panel-b</Tabs.Panel>
          <Tabs.Panel>panel-c</Tabs.Panel>
        </Tabs>
      </Surface>,
    );
    expect(selectedOf(container)).toEqual(['false', 'true', 'false']);
    /* The matching panel — and only it — is mounted. */
    const panels = Array.from(container.querySelectorAll('[role="tabpanel"]'));
    expect(panels).toHaveLength(1);
    expect(panels[0].textContent).toBe('panel-b');
  });

  it('uncontrolled `defaultValue` puts aria-selected on the matching tab in the first committed paint', () => {
    const { container } = renderPlain(
      <Surface>
        <Tabs defaultValue='c'>
          <Tabs.Tab
            value='a'
            label='Alpha'
          />
          <Tabs.Tab
            value='b'
            label='Beta'
          />
          <Tabs.Tab
            value='c'
            label='Gamma'
          />
        </Tabs>
      </Surface>,
    );
    expect(selectedOf(container)).toEqual(['false', 'false', 'true']);
  });

  it('clicking another tab still works after the ref-sync moved into an effect', () => {
    const onValueChange = vi.fn();
    const { container } = renderPlain(
      <Surface>
        <Tabs
          defaultValue='b'
          onValueChange={onValueChange}
        >
          <Tabs.Tab
            value='a'
            label='Alpha'
          />
          <Tabs.Tab
            value='b'
            label='Beta'
          />
        </Tabs>
      </Surface>,
    );
    expect(selectedOf(container)).toEqual(['false', 'true']);
    act(() => {
      tabsOf(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(selectedOf(container)).toEqual(['true', 'false']);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('a', { previousValue: 'b', phase: 'input' });
  });

  it('controlled Tabs follow the `value` prop across re-renders', () => {
    const ui = (value: string) => (
      <Surface>
        <Tabs value={value}>
          <Tabs.Tab
            value='a'
            label='Alpha'
          />
          <Tabs.Tab
            value='b'
            label='Beta'
          />
        </Tabs>
      </Surface>
    );
    const { root, container } = renderPlain(ui('a'));
    expect(selectedOf(container)).toEqual(['true', 'false']);
    act(() => {
      root.render(ui('b'));
    });
    expect(selectedOf(container)).toEqual(['false', 'true']);
  });
});

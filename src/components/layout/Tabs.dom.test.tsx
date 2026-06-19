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
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Surface } from './Surface';
import { Tabs } from './Tabs';
import { resetWarnOnce } from '../../system/devErrors';
import { getGlobalSheet } from '../../css/sheet';

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
      // detail: 1 => a genuine pointer click (ruling R10 / API-TYPES S4).
      tabsOf(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    });
    expect(selectedOf(container)).toEqual(['true', 'false']);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    // Canonical ChangeInfo payload now includes the honest `source`.
    expect(onValueChange).toHaveBeenCalledWith('a', {
      previousValue: 'b',
      phase: 'input',
      source: 'pointer',
    });
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

/* ─────────────────────────────────────────────────────────────
   FIELDS S10 (ruling R9/R13) — Tabs now tracks its value through
   the shared `useControlledState` hook instead of a hand-rolled
   guard. The hook is the single definition of "controlled":
   latched at mount, dev-warn-once (via warnOnce → console.warn,
   not the old console.error) on a post-mount flip. These lock that
   contract onto Tabs.
   ───────────────────────────────────────────────────────────── */
describe('Tabs controlled-state hook integration (jsdom)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  const valetWarns = () =>
    warnSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .filter((m: string) => m.startsWith('valet:'));

  beforeEach(() => {
    resetWarnOnce();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warnSpy.mockRestore());

  const ui = (props: { value?: string; defaultValue?: string }) => (
    <Surface>
      <Tabs {...props}>
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

  it('a controlled→uncontrolled flip warns once and keeps the mode latched', () => {
    const { root, container } = renderPlain(ui({ value: 'b' }));
    expect(selectedOf(container)).toEqual(['false', 'true']);

    /* Drop the `value` prop after mount. The mode is latched: the hook
       does NOT adopt internal state, so the latched-controlled value
       (now undefined ⇒ defaultValue undefined ⇒ index 0) is rendered,
       and a single valet warning is emitted. */
    act(() => root.render(ui({})));
    expect(valetWarns()).toEqual([expect.stringContaining('controlled to uncontrolled')]);

    /* warnOnce — re-rendering still uncontrolled does not warn again. */
    act(() => root.render(ui({})));
    expect(valetWarns()).toHaveLength(1);
  });

  it('an uncontrolled mount ignores a `value` prop appearing later — warns once', () => {
    const { root, container } = renderPlain(ui({ defaultValue: 'a' }));
    expect(selectedOf(container)).toEqual(['true', 'false']);

    /* Click to move internal state to 'b'. */
    act(() => {
      tabsOf(container)[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(selectedOf(container)).toEqual(['false', 'true']);

    /* A late `value` prop is ignored for reading (mode latched uncontrolled). */
    act(() => root.render(ui({ value: 'a' })));
    expect(selectedOf(container)).toEqual(['false', 'true']); // still internal 'b'
    expect(valetWarns()).toEqual([expect.stringContaining('uncontrolled to controlled')]);
  });

  it('a stable controlled Tabs emits no controlled-state warning', () => {
    const { root, container } = renderPlain(ui({ value: 'a' }));
    act(() => root.render(ui({ value: 'b' })));
    expect(selectedOf(container)).toEqual(['false', 'true']);
    expect(valetWarns()).toEqual([]);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Mobile hardening — touch target + chrome kit                   */

describe('Tabs — mobile hardening', () => {
  const tree = (
    <Surface>
      <Tabs>
        <Tabs.Tab
          value='a'
          label='Alpha'
        />
        <Tabs.Tab
          value='b'
          label='Beta'
        />
        <Tabs.Panel>a</Tabs.Panel>
        <Tabs.Panel>b</Tabs.Panel>
      </Tabs>
    </Surface>
  );

  it('sets a coarse-pointer hit-size var on the root (44px default)', () => {
    const { container } = renderPlain(tree);
    const root = container.querySelector('[data-valet-component="Tabs"]') as HTMLElement;
    expect(root.style.getPropertyValue('--valet-tab-hit')).toBe('44px');
  });

  it('tab buttons ship the chrome kit + a coarse >=44px floor in the styled rule', () => {
    const { container } = renderPlain(tree);
    const tab = tabsOf(container)[0];
    const cls = tab.className.split(/\s+/).find(Boolean)!;
    const rule =
      Array.from(getGlobalSheet()!.cssRules, (r) => r.cssText).find((t) =>
        t.startsWith(`.${cls}`),
      ) ?? '';
    expect(rule).toContain('touch-action: manipulation');
    expect(rule).toContain('user-select: none');
    expect(rule).toContain('@media (pointer: coarse)');
    expect(rule).toContain('--valet-tab-hit'); // the floor reads the hit var
  });
});

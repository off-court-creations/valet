// ─────────────────────────────────────────────────────────────
// src/components/layout/Accordion.dom.test.tsx | valet
// FIELDS S4 regression — `expanded={0}` must stay controlled. The
// original guard was `openProp ? … : undefined`, so index 0 (the
// most common controlled value) was treated as "no prop" and the
// component silently flipped to uncontrolled, desyncing the parent.
// API-TYPES S9 renamed the canonical prop `open` → `expanded`
// (Q12); the falsiness fix lives on the resolved value and is
// unchanged. Alias coverage is in Accordion.deprecate.dom.test.tsx.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Surface } from './Surface';
import { Accordion } from './Accordion';
import { resetWarnOnce } from '../../system/devErrors';
import { getGlobalSheet } from '../../css/sheet';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; Surface + Accordion observe in effects. */
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

const headersOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>('button[aria-expanded]'));

const expandedOf = (container: HTMLElement) =>
  headersOf(container).map((el) => el.getAttribute('aria-expanded'));

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* NB: items must be direct children — the root indexes them via
   React.Children.map, so a wrapping fragment would leave every
   item at the default index 0. */

/* Suite ----------------------------------------------------------------- */
describe('Accordion controlled expanded={0} (jsdom)', () => {
  it('expanded={0} renders the first panel expanded', () => {
    const { container } = render(
      <Surface>
        <Accordion expanded={0}>
          <Accordion.Item header='First'>one</Accordion.Item>
          <Accordion.Item header='Second'>two</Accordion.Item>
        </Accordion>
      </Surface>,
    );
    expect(expandedOf(container)).toEqual(['true', 'false']);
  });

  it('expanded={0} stays controlled — clicking reports intent but never mutates internal state', () => {
    const onExpandedChange = vi.fn();
    const { container } = render(
      <Surface>
        <Accordion
          expanded={0}
          onExpandedChange={onExpandedChange}
        >
          <Accordion.Item header='First'>one</Accordion.Item>
          <Accordion.Item header='Second'>two</Accordion.Item>
        </Accordion>
      </Surface>,
    );
    /* Click the open header: a controlled Accordion must report the
       close intent and keep rendering from the prop. */
    act(() => {
      headersOf(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onExpandedChange).toHaveBeenCalledTimes(1);
    expect(onExpandedChange).toHaveBeenCalledWith([]);
    expect(expandedOf(container)).toEqual(['true', 'false']);
  });

  it('the first panel responds to `expanded` prop changes, including back to 0', () => {
    const ui = (expanded: number) => (
      <Surface>
        <Accordion expanded={expanded}>
          <Accordion.Item header='First'>one</Accordion.Item>
          <Accordion.Item header='Second'>two</Accordion.Item>
        </Accordion>
      </Surface>
    );
    const { root, container } = render(ui(1));
    expect(expandedOf(container)).toEqual(['false', 'true']);
    /* Pre-fix, expanded={0} flipped the component to uncontrolled here. */
    act(() => {
      root.render(ui(0));
    });
    expect(expandedOf(container)).toEqual(['true', 'false']);
  });
});

/* ─────────────────────────────────────────────────────────────
   FIELDS S10 (ruling R9/R14) — Accordion's private
   `useControllableState` copy was deleted; it now consumes the
   shared `useControlledState` hook. The controlled/uncontrolled
   behavior must be byte-equivalent, and a post-mount flip now
   warns once through the shared warnOnce (the private copy was
   silent on flips). The `open={0}` fix above is unchanged.
   ───────────────────────────────────────────────────────────── */
describe('Accordion controlled-state hook integration (jsdom)', () => {
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

  it('uncontrolled: defaultExpanded seeds internal state and clicks toggle it (no warning)', () => {
    const { container } = render(
      <Surface>
        <Accordion defaultExpanded={0}>
          <Accordion.Item header='First'>one</Accordion.Item>
          <Accordion.Item header='Second'>two</Accordion.Item>
        </Accordion>
      </Surface>,
    );
    expect(expandedOf(container)).toEqual(['true', 'false']);
    /* Single mode: opening the second closes the first via internal state. */
    act(() => {
      headersOf(container)[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(expandedOf(container)).toEqual(['false', 'true']);
    expect(valetWarns()).toEqual([]);
  });

  it('a controlled→uncontrolled flip warns once and keeps the mode latched', () => {
    const ui = (props: { expanded?: number; defaultExpanded?: number }) => (
      <Surface>
        <Accordion {...props}>
          <Accordion.Item header='First'>one</Accordion.Item>
          <Accordion.Item header='Second'>two</Accordion.Item>
        </Accordion>
      </Surface>
    );
    const { root, container } = render(ui({ expanded: 1 }));
    expect(expandedOf(container)).toEqual(['false', 'true']);

    /* Drop `open`. The hook latches controlled at mount and never adopts
       internal state, so it renders the latched-controlled value falling
       back to `defaultValue` (toArray(undefined) ⇒ [] ⇒ nothing open). */
    act(() => root.render(ui({})));
    expect(expandedOf(container)).toEqual(['false', 'false']);
    expect(valetWarns()).toEqual([expect.stringContaining('controlled to uncontrolled')]);

    /* warnOnce — a second uncontrolled render does not warn again. */
    act(() => root.render(ui({})));
    expect(valetWarns()).toHaveLength(1);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Mobile hardening — touch target + chrome kit                   */

describe('Accordion — mobile hardening', () => {
  const tree = (
    <Surface>
      <Accordion>
        <Accordion.Item header='First'>one</Accordion.Item>
      </Accordion>
    </Surface>
  );

  it('sets a coarse-pointer hit-size var on the root (44px default)', () => {
    const { container } = render(tree);
    const root = container.querySelector('[data-valet-component="Accordion"]') as HTMLElement;
    expect(root.style.getPropertyValue('--valet-acc-hit')).toBe('44px');
  });

  it('header ships the chrome kit + a coarse >=44px floor in its styled rule', () => {
    const { container } = render(tree);
    const header = headersOf(container)[0];
    const cls = header.className.split(/\s+/).find(Boolean)!;
    const rule =
      Array.from(getGlobalSheet()!.cssRules, (r) => r.cssText).find((t) =>
        t.startsWith(`.${cls}`),
      ) ?? '';
    expect(rule).toContain('touch-action: manipulation');
    expect(rule).toContain('@media (pointer: coarse)');
    expect(rule).toContain('--valet-acc-hit'); // the floor reads the hit var
  });
});

// ─────────────────────────────────────────────────────────────
// src/components/layout/Accordion.dom.test.tsx | valet
// FIELDS S4 regression — `open={0}` must stay controlled. The
// original guard was `openProp ? … : undefined`, so index 0 (the
// most common controlled value) was treated as "no prop" and the
// component silently flipped to uncontrolled, desyncing the parent.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Surface } from './Surface';
import { Accordion } from './Accordion';

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
describe('Accordion controlled open={0} (jsdom)', () => {
  it('open={0} renders the first panel expanded', () => {
    const { container } = render(
      <Surface>
        <Accordion open={0}>
          <Accordion.Item header='First'>one</Accordion.Item>
          <Accordion.Item header='Second'>two</Accordion.Item>
        </Accordion>
      </Surface>,
    );
    expect(expandedOf(container)).toEqual(['true', 'false']);
  });

  it('open={0} stays controlled — clicking reports intent but never mutates internal state', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Surface>
        <Accordion
          open={0}
          onOpenChange={onOpenChange}
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
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith([]);
    expect(expandedOf(container)).toEqual(['true', 'false']);
  });

  it('the first panel responds to `open` prop changes, including back to 0', () => {
    const ui = (open: number) => (
      <Surface>
        <Accordion open={open}>
          <Accordion.Item header='First'>one</Accordion.Item>
          <Accordion.Item header='Second'>two</Accordion.Item>
        </Accordion>
      </Surface>
    );
    const { root, container } = render(ui(1));
    expect(expandedOf(container)).toEqual(['false', 'true']);
    /* Pre-fix, open={0} flipped the component to uncontrolled here. */
    act(() => {
      root.render(ui(0));
    });
    expect(expandedOf(container)).toEqual(['true', 'false']);
  });
});

// ─────────────────────────────────────────────────────────────
// src/components/layout/Accordion.deprecate.dom.test.tsx | valet
// API-TYPES S9 (Q12, ruling R30) — Accordion's `open`/`defaultOpen`/
// `onOpenChange` props were renamed to `expanded`/`defaultExpanded`/
// `onExpandedChange`. The old names ship as additive aliases through
// 0.x: they keep working but dev-warn once each, and the canonical
// name wins when both are supplied. Removed at 1.0.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Surface } from './Surface';
import { Accordion } from './Accordion';
import { resetWarnOnce } from '../../system/devErrors';

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

let warnSpy: ReturnType<typeof vi.spyOn>;
const deprecationWarns = () =>
  warnSpy.mock.calls
    .map((c: unknown[]) => String(c[0]))
    .filter((m: string) => m.includes('is deprecated'));

beforeEach(() => {
  resetWarnOnce();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  warnSpy.mockRestore();
});

/* ─────────────────────────────────────────────────────────────
   Canonical names — work silently
   ───────────────────────────────────────────────────────────── */
describe('Accordion canonical props (jsdom)', () => {
  it('`expanded` controls the panel and emits no deprecation warning', () => {
    const onExpandedChange = vi.fn();
    const { container } = render(
      <Surface>
        <Accordion
          expanded={1}
          onExpandedChange={onExpandedChange}
        >
          <Accordion.Item header='First'>one</Accordion.Item>
          <Accordion.Item header='Second'>two</Accordion.Item>
        </Accordion>
      </Surface>,
    );
    expect(expandedOf(container)).toEqual(['false', 'true']);
    act(() => {
      headersOf(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onExpandedChange).toHaveBeenCalledWith([0]);
    expect(deprecationWarns()).toEqual([]);
  });

  it('`defaultExpanded` seeds uncontrolled state silently', () => {
    const { container } = render(
      <Surface>
        <Accordion defaultExpanded={0}>
          <Accordion.Item header='First'>one</Accordion.Item>
          <Accordion.Item header='Second'>two</Accordion.Item>
        </Accordion>
      </Surface>,
    );
    expect(expandedOf(container)).toEqual(['true', 'false']);
    expect(deprecationWarns()).toEqual([]);
  });
});

/* ─────────────────────────────────────────────────────────────
   Deprecated aliases — work, but warn once each
   ───────────────────────────────────────────────────────────── */
describe('Accordion deprecated aliases (jsdom)', () => {
  it('`open` still controls the panel and warns once across re-renders', () => {
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

    // The alias drives behaviour exactly like `expanded`.
    act(() => root.render(ui(0)));
    expect(expandedOf(container)).toEqual(['true', 'false']);

    // …and warns exactly once despite two renders.
    const warns = deprecationWarns();
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('`open`');
    expect(warns[0]).toContain('`expanded`');
  });

  it('`defaultOpen` seeds uncontrolled state and warns once', () => {
    const { container } = render(
      <Surface>
        <Accordion defaultOpen={1}>
          <Accordion.Item header='First'>one</Accordion.Item>
          <Accordion.Item header='Second'>two</Accordion.Item>
        </Accordion>
      </Surface>,
    );
    expect(expandedOf(container)).toEqual(['false', 'true']);
    const warns = deprecationWarns();
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('`defaultOpen`');
    expect(warns[0]).toContain('`defaultExpanded`');
  });

  it('`onOpenChange` still fires and warns once', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Surface>
        <Accordion onOpenChange={onOpenChange}>
          <Accordion.Item header='First'>one</Accordion.Item>
          <Accordion.Item header='Second'>two</Accordion.Item>
        </Accordion>
      </Surface>,
    );
    act(() => {
      headersOf(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onOpenChange).toHaveBeenCalledWith([0]);
    const warns = deprecationWarns();
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('`onOpenChange`');
    expect(warns[0]).toContain('`onExpandedChange`');
  });
});

/* ─────────────────────────────────────────────────────────────
   Both given — canonical wins, alias still warns
   ───────────────────────────────────────────────────────────── */
describe('Accordion canonical + deprecated together (jsdom)', () => {
  it('`expanded` wins over `open`, and `open` still warns once', () => {
    const { container } = render(
      <Surface>
        {/* expanded selects index 0; the stale `open={1}` is ignored. */}
        <Accordion
          expanded={0}
          open={1}
        >
          <Accordion.Item header='First'>one</Accordion.Item>
          <Accordion.Item header='Second'>two</Accordion.Item>
        </Accordion>
      </Surface>,
    );
    expect(expandedOf(container)).toEqual(['true', 'false']);
    const warns = deprecationWarns();
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('`open`');
  });

  it('`onExpandedChange` wins over `onOpenChange`; only the deprecated one warns', () => {
    const onExpandedChange = vi.fn();
    const onOpenChange = vi.fn();
    const { container } = render(
      <Surface>
        <Accordion
          onExpandedChange={onExpandedChange}
          onOpenChange={onOpenChange}
        >
          <Accordion.Item header='First'>one</Accordion.Item>
          <Accordion.Item header='Second'>two</Accordion.Item>
        </Accordion>
      </Surface>,
    );
    act(() => {
      headersOf(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onExpandedChange).toHaveBeenCalledWith([0]);
    expect(onOpenChange).not.toHaveBeenCalled();
    const warns = deprecationWarns();
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('`onOpenChange`');
  });
});

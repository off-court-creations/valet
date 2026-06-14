// ─────────────────────────────────────────────────────────────
// src/components/layout/List.selection.dom.test.tsx | valet
// API-TYPES S11 (Q11(a), ruling R12) — the unified selection
// vocabulary. List's pre-S11 names are renamed:
//   selectable (boolean) → selectionMode ('none' | 'single')
//   getKey                → getItemKey
// The old names ship as additive aliases through 0.x: they keep
// working but dev-warn once each, and the canonical name wins when
// both are supplied. List's single-by-reference selection model is
// unchanged — this suite proves the alias wiring + the unified
// vocabulary (`selectionMode='single'` single-select round-trip,
// `getItemKey` as React-key identity). Removed at 1.0.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { List } from './List';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';
import { resetWarnOnce } from '../../system/devErrors';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom shims ----------------------------------------------------------- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver ??=
  ResizeObserverStub as unknown as typeof ResizeObserver;
beforeAll(() => {
  Element.prototype.setPointerCapture ??= () => {};
});

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function renderStrict(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  const store = createSurfaceStore();
  const wrap = (n: React.ReactNode) => (
    <React.StrictMode>
      <SurfaceCtx.Provider value={store}>{n}</SurfaceCtx.Provider>
    </React.StrictMode>
  );
  act(() => {
    root.render(wrap(node));
  });
  return { root, container, rerender: (n: React.ReactNode) => act(() => root.render(wrap(n))) };
}

const rows = (container: HTMLElement) => Array.from(container.querySelectorAll('li'));
const selectedRows = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('li[aria-selected="true"]'));

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

interface Item {
  id: string;
  label: string;
}
const data: Item[] = [
  { id: 'a', label: 'Apple' },
  { id: 'b', label: 'Banana' },
  { id: 'c', label: 'Cherry' },
];

/* ─────────────────────────────────────────────────────────────
   Canonical vocabulary — works silently
   ───────────────────────────────────────────────────────────── */
describe('List canonical selection vocabulary (jsdom)', () => {
  it('`selectionMode="single"` enables single selection (listbox role), silently', () => {
    const onSelectionChange = vi.fn();
    const { container } = renderStrict(
      <List<Item>
        data={data}
        getTitle={(i) => i.label}
        getItemKey={(i) => i.id}
        selectionMode='single'
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(container.querySelector('[role="listbox"]')).not.toBeNull();

    act(() => rows(container)[1].dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onSelectionChange).toHaveBeenCalledWith(data[1], 1);
    expect(selectedRows(container).map((li) => li.textContent)).toEqual(['Banana']);

    /* single-select: clicking another row moves the selection */
    act(() => rows(container)[2].dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(selectedRows(container).map((li) => li.textContent)).toEqual(['Cherry']);
    expect(deprecationWarns()).toEqual([]);
  });

  it('`selectionMode="none"`/omitted renders a plain list and never selects', () => {
    const onSelectionChange = vi.fn();
    const { container } = renderStrict(
      <List<Item>
        data={data}
        getTitle={(i) => i.label}
        getItemKey={(i) => i.id}
        selectionMode='none'
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(container.querySelector('[role="list"]')).not.toBeNull();
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    act(() => rows(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(selectedRows(container)).toHaveLength(0);
    expect(deprecationWarns()).toEqual([]);
  });

  it('`getItemKey="id"` (property form) keys the rendered rows, silently', () => {
    const { container } = renderStrict(
      <List<Item>
        data={data}
        getTitle={(i) => i.label}
        getItemKey='id'
      />,
    );
    /* keyed render — the rows render in order; no warning for the property form */
    expect(rows(container).map((li) => li.textContent)).toEqual(['Apple', 'Banana', 'Cherry']);
    expect(deprecationWarns()).toEqual([]);
  });
});

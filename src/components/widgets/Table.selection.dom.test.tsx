// ─────────────────────────────────────────────────────────────
// src/components/widgets/Table.selection.dom.test.tsx | valet
// API-TYPES S11 (Q11(a), ruling R12) — the unified selection
// vocabulary. Table's pre-S11 selection props are renamed:
//   selectable → selectionMode ('single' | 'multi' → 'single' | 'multiple')
//   rowKey     → getItemKey
// The old names ship as additive aliases through 0.x: they keep
// working but dev-warn once each, and the canonical name wins when
// both are supplied. PERF S8's keyed internals are untouched — this
// suite proves the alias wiring + the unified vocabulary, including
// keyed single/multiple selection round-trips through `selectionMode`
// + `getItemKey`. Removed at 1.0.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Table, type TableColumn } from './Table';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';
import { resetWarnOnce } from '../../system/devErrors';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom lacks ResizeObserver (surfaceStore needs it) ------------------- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/* Fixtures -------------------------------------------------------------- */
interface Row {
  id: number;
  name: string;
}

const makeRows = (): Row[] => [
  { id: 1, name: 'alpha' },
  { id: 2, name: 'beta' },
  { id: 3, name: 'gamma' },
];

const nameColumns: TableColumn<Row>[] = [{ header: 'Name', accessor: 'name', sortable: true }];

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function renderStrict(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  const store = createSurfaceStore();
  const ui = (children: React.ReactNode) => (
    <React.StrictMode>
      <SurfaceCtx.Provider value={store}>{children}</SurfaceCtx.Provider>
    </React.StrictMode>
  );
  act(() => {
    root.render(ui(node));
  });
  return { root, container, rerender: (next: React.ReactNode) => act(() => root.render(ui(next))) };
}

const clickCheckbox = (container: HTMLElement, rowIdx: number) => {
  const boxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
  act(() => {
    boxes[rowIdx].click();
  });
};

const selectedCount = (container: HTMLElement) =>
  container.querySelectorAll('tbody tr[data-selected="true"]').length;

let warnSpy: ReturnType<typeof vi.spyOn>;
const deprecationWarns = () =>
  warnSpy.mock.calls
    .map((c: unknown[]) => String(c[0]))
    .filter((m: string) => m.includes('is deprecated'));

beforeEach(() => {
  resetWarnOnce();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  warnSpy.mockRestore();
  vi.unstubAllGlobals();
});

/* ─────────────────────────────────────────────────────────────
   Canonical vocabulary — works silently
   ───────────────────────────────────────────────────────────── */
describe('Table canonical selection vocabulary (jsdom)', () => {
  it('`selectionMode="multiple"` enables multi-select with no deprecation warning', () => {
    const rows = makeRows();
    const onSelectionChange = vi.fn();
    const { container } = renderStrict(
      <Table<Row>
        data={rows}
        columns={nameColumns}
        selectionMode='multiple'
        constrainHeight={false}
        onSelectionChange={onSelectionChange}
      />,
    );
    clickCheckbox(container, 0);
    clickCheckbox(container, 1);
    expect(onSelectionChange.mock.calls).toEqual([[[rows[0]]], [[rows[0], rows[1]]]]);
    expect(selectedCount(container)).toBe(2);
    expect(deprecationWarns()).toEqual([]);
  });

  it('`selectionMode="single"` keeps at most one row selected, silently', () => {
    const rows = makeRows();
    const onSelectionChange = vi.fn();
    const { container } = renderStrict(
      <Table<Row>
        data={rows}
        columns={nameColumns}
        selectionMode='single'
        constrainHeight={false}
        onSelectionChange={onSelectionChange}
      />,
    );
    clickCheckbox(container, 0);
    clickCheckbox(container, 1);
    /* single-select clears the prior selection on each toggle */
    expect(onSelectionChange.mock.calls).toEqual([[[rows[0]]], [[rows[1]]]]);
    expect(selectedCount(container)).toBe(1);
    expect(deprecationWarns()).toEqual([]);
  });

  it('`selectionMode="none"`/omitted renders no selection column', () => {
    const { container } = renderStrict(
      <Table<Row>
        data={makeRows()}
        columns={nameColumns}
        selectionMode='none'
        constrainHeight={false}
      />,
    );
    expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
    expect(deprecationWarns()).toEqual([]);
  });

  it('`getItemKey` keys selection so an immutable refresh preserves it, silently', () => {
    const rows = makeRows();
    const onSelectionChange = vi.fn();
    const table = (data: Row[]) => (
      <Table<Row>
        data={data}
        columns={nameColumns}
        selectionMode='multiple'
        getItemKey='id'
        constrainHeight={false}
        onSelectionChange={onSelectionChange}
      />
    );
    const { container, rerender } = renderStrict(table(rows));

    clickCheckbox(container, 0);
    clickCheckbox(container, 1);
    expect(selectedCount(container)).toBe(2);

    /* brand-new objects, same ids → keyed selection survives, no prune fires */
    const refreshed = rows.map((r) => ({ ...r }));
    rerender(table(refreshed));
    expect(selectedCount(container)).toBe(2);
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(deprecationWarns()).toEqual([]);
  });

  it('a function `getItemKey` keeps selection stable across a re-sort, silently', () => {
    const rows = makeRows();
    const { container } = renderStrict(
      <Table<Row>
        data={rows}
        columns={nameColumns}
        selectionMode='multiple'
        getItemKey={(r) => r.id}
        constrainHeight={false}
      />,
    );
    clickCheckbox(container, 0); /* select alpha (id 1) */
    expect(selectedCount(container)).toBe(1);

    const sortBtn = container.querySelector('thead th button')!;
    act(() => (sortBtn as HTMLButtonElement).click());
    act(() => (sortBtn as HTMLButtonElement).click()); /* desc */
    expect(selectedCount(container)).toBe(1);
    const selectedRow = container.querySelector('tbody tr[data-selected="true"]')!;
    expect(selectedRow.querySelectorAll('td')[1].textContent?.trim()).toBe('alpha');
    expect(deprecationWarns()).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// src/components/widgets/Table.selection.dom.test.tsx | valet
// The unified selection vocabulary (canonical only — the pre-S11
// `selectable`/`rowKey` aliases were removed at 1.0; the `deprecationWarns()
// === []` assertions stand as a regression guard that the canonical props emit
// no warnings). Covers keyed single/multiple/none round-trips through
// `selectionMode` + `getItemKey`, CONTROLLED + uncontrolled selection
// (`selected`/`defaultSelected`/`onSelectionChange`, row arrays), the
// multiple-mode select-all header checkbox, and sort→page-1 reset.
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

/* Row checkboxes only — scoped to tbody so the multiple-mode select-all header
   checkbox (a tbody-external input) never shifts the index. */
const clickCheckbox = (container: HTMLElement, rowIdx: number) => {
  const boxes = container.querySelectorAll<HTMLInputElement>('tbody input[type="checkbox"]');
  act(() => {
    boxes[rowIdx].click();
  });
};

const headerSelectAll = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('thead input[type="checkbox"]');

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

/* ─────────────────────────────────────────────────────────────
   Controlled + uncontrolled selection (1.0 contract)
   ───────────────────────────────────────────────────────────── */
describe('Table controlled/uncontrolled selection', () => {
  it('`defaultSelected` seeds the uncontrolled selection', () => {
    const rows = makeRows();
    const { container } = renderStrict(
      <Table<Row>
        data={rows}
        columns={nameColumns}
        selectionMode='multiple'
        getItemKey='id'
        defaultSelected={[rows[1]]}
        constrainHeight={false}
      />,
    );
    expect(selectedCount(container)).toBe(1);
    const sel = container.querySelector('tbody tr[data-selected="true"]')!;
    expect(sel.querySelectorAll('td')[1].textContent?.trim()).toBe('beta');
  });

  it('`selected` is controlled — clicks request via onSelectionChange but the prop drives the view', () => {
    const rows = makeRows();
    const onSelectionChange = vi.fn();
    const table = (selected: Row[]) => (
      <Table<Row>
        data={rows}
        columns={nameColumns}
        selectionMode='multiple'
        getItemKey='id'
        selected={selected}
        onSelectionChange={onSelectionChange}
        constrainHeight={false}
      />
    );
    const { container, rerender } = renderStrict(table([rows[0]]));
    expect(selectedCount(container)).toBe(1);

    /* Clicking an unselected row does NOT self-update (controlled); it requests
       the next selection through onSelectionChange. */
    clickCheckbox(container, 1);
    expect(onSelectionChange).toHaveBeenLastCalledWith([rows[0], rows[1]]);
    expect(selectedCount(container)).toBe(1); // view still reflects the prop

    /* Parent applies the request → view updates. */
    rerender(table([rows[0], rows[1]]));
    expect(selectedCount(container)).toBe(2);
    expect(deprecationWarns()).toEqual([]);
  });

  it('select-all header checkbox toggles the whole dataset, with an indeterminate partial state', () => {
    const rows = makeRows();
    const onSelectionChange = vi.fn();
    const { container } = renderStrict(
      <Table<Row>
        data={rows}
        columns={nameColumns}
        selectionMode='multiple'
        getItemKey='id'
        constrainHeight={false}
        onSelectionChange={onSelectionChange}
      />,
    );
    const all = headerSelectAll(container)!;
    expect(all).not.toBeNull();

    /* Partial selection → indeterminate, not checked. */
    clickCheckbox(container, 0);
    expect(all.indeterminate).toBe(true);
    expect(all.checked).toBe(false);

    /* Click select-all → every row selected. */
    act(() => all.click());
    expect(selectedCount(container)).toBe(3);
    expect(onSelectionChange).toHaveBeenLastCalledWith(rows);
    expect(all.checked).toBe(true);
    expect(all.indeterminate).toBe(false);

    /* Click again → cleared. */
    act(() => all.click());
    expect(selectedCount(container)).toBe(0);
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it('single-select renders no select-all header checkbox', () => {
    const { container } = renderStrict(
      <Table<Row>
        data={makeRows()}
        columns={nameColumns}
        selectionMode='single'
        constrainHeight={false}
      />,
    );
    expect(headerSelectAll(container)).toBeNull();
  });
});

/* ─────────────────────────────────────────────────────────────
   Sort resets pagination to page 1
   ───────────────────────────────────────────────────────────── */
describe('Table sort resets page', () => {
  it('re-sorting returns to page 1', () => {
    /* 6 rows, 2 per page → 3 pages. */
    const rows: Row[] = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: `r${i + 1}` }));
    const onPageChange = vi.fn();
    const { container } = renderStrict(
      <Table<Row>
        data={rows}
        columns={nameColumns}
        paginate
        maxExpandedRows={2}
        constrainHeight={false}
        onPageChange={onPageChange}
      />,
    );
    /* Go to page 2 via the Pagination control. */
    const pageButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).filter(
      (b) => b.textContent?.trim() === '2',
    );
    act(() => pageButtons[0]?.click());
    expect(onPageChange).toHaveBeenLastCalledWith(2);

    /* Sort the Name column → page resets to 1. */
    const sortBtn = container.querySelector('thead th button')!;
    act(() => (sortBtn as HTMLButtonElement).click());
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });
});

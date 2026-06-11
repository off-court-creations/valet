// ─────────────────────────────────────────────────────────────
// src/components/widgets/Table.dom.test.tsx | valet
// PERF S3 — Table purity: sort/selection callbacks fire exactly
// once (outside setState updaters) under StrictMode, the selection
// prune effect cannot loop on data identity churn, and descending
// sort is a stable negation of the ascending comparator
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Table, type TableColumn } from './Table';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';

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

function makeRoot() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  return { root, container };
}

/** Render `node` under StrictMode inside a Surface store provider. */
function renderStrict(node: React.ReactNode) {
  const { root, container } = makeRoot();
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

const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });

const clickCheckbox = (container: HTMLElement, rowIdx: number) => {
  const boxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
  act(() => {
    boxes[rowIdx].click();
  });
};

const columnTexts = (container: HTMLElement, cellIdx: number) =>
  Array.from(container.querySelectorAll('tbody tr'), (tr) =>
    tr.querySelectorAll('td')[cellIdx].textContent?.trim(),
  );

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.unstubAllGlobals();
});

/* Suite ----------------------------------------------------------------- */
describe('Table (jsdom)', () => {
  it('onSortChange fires exactly once per header click under StrictMode', () => {
    const onSortChange = vi.fn();
    const { container } = renderStrict(
      <Table<Row>
        data={makeRows()}
        columns={nameColumns}
        constrainHeight={false}
        onSortChange={onSortChange}
      />,
    );
    const th = container.querySelector('thead th')!;

    click(th);
    expect(onSortChange.mock.calls).toEqual([[0, false]]);

    click(th);
    expect(onSortChange.mock.calls).toEqual([
      [0, false],
      [0, true],
    ]);
  });

  it('onSelectionChange fires exactly once per checkbox toggle under StrictMode', () => {
    const rows = makeRows();
    const onSelectionChange = vi.fn();
    const { container } = renderStrict(
      <Table<Row>
        data={rows}
        columns={nameColumns}
        selectable='multi'
        constrainHeight={false}
        onSelectionChange={onSelectionChange}
      />,
    );

    clickCheckbox(container, 0);
    expect(onSelectionChange.mock.calls).toEqual([[[rows[0]]]]);

    clickCheckbox(container, 1);
    expect(onSelectionChange.mock.calls).toEqual([[[rows[0]]], [[rows[0], rows[1]]]]);

    clickCheckbox(container, 0); /* uncheck */
    expect(onSelectionChange.mock.calls).toEqual([[[rows[0]]], [[rows[0], rows[1]]], [[rows[1]]]]);
  });

  /* Failing-first regression (documented per PERF S3): before the fix the
     prune effect rebuilt the selection Set — a fresh identity even when
     nothing was pruned — and fired onSelectionChange *inside* the
     setSelected updater on every `data` identity change. A parent that
     stores the selection in state and passes a freshly-spread data array
     (the ordinary immutable pattern below) then looped forever:
     callback → parent setState → re-render → new data identity → prune
     effect → callback → … Against HEAD 2aa0aa1 this test hung the fork
     in a synchronous update loop (worker pinned at 100% CPU; killed by
     hand). The fix bails out when nothing left the dataset and fires the
     callback after setState, only when the pruned selection shrank. */
  it('prune effect does not loop when a selecting parent passes a new data identity each render', () => {
    const rows = makeRows();
    const spy = vi.fn();

    function Parent() {
      const [, setSel] = React.useState<Row[]>([]);
      return (
        <Table<Row>
          /* new array identity every render; row objects stay stable */
          data={[...rows]}
          columns={nameColumns}
          selectable='multi'
          constrainHeight={false}
          onSelectionChange={(s) => {
            spy(s);
            setSel(s);
          }}
        />
      );
    }

    const { container } = renderStrict(<Parent />);
    /* No spurious callback on mount — nothing was pruned. */
    expect(spy).not.toHaveBeenCalled();

    /* Selecting must fire exactly once and survive the parent's
       identity-only data refresh triggered by its setState. */
    clickCheckbox(container, 0);
    expect(spy.mock.calls).toEqual([[[rows[0]]]]);
    const selectedRows = container.querySelectorAll('tbody tr[data-selected="true"]');
    expect(selectedRows).toHaveLength(1);
  });

  it('pruning rows that left the dataset fires onSelectionChange exactly once with the kept selection', () => {
    const rows = makeRows();
    const onSelectionChange = vi.fn();
    const table = (data: Row[]) => (
      <Table<Row>
        data={data}
        columns={nameColumns}
        selectable='multi'
        constrainHeight={false}
        onSelectionChange={onSelectionChange}
      />
    );
    const { container, rerender } = renderStrict(table(rows));

    clickCheckbox(container, 0); /* select alpha */
    clickCheckbox(container, 1); /* select beta  */
    expect(onSelectionChange).toHaveBeenCalledTimes(2);

    /* beta leaves the dataset → exactly one prune callback with [alpha]. */
    rerender(table([rows[0], rows[2]]));
    expect(onSelectionChange).toHaveBeenCalledTimes(3);
    expect(onSelectionChange).toHaveBeenLastCalledWith([rows[0]]);

    /* Identity-only churn (same rows, new array) → no further callback. */
    rerender(table([rows[0], rows[2]]));
    expect(onSelectionChange).toHaveBeenCalledTimes(3);
  });

  it('descending sort is stable — ties keep insertion order instead of reversing', () => {
    interface Ranked {
      k: number;
      tag: string;
    }
    const ranked: Ranked[] = [
      { k: 1, tag: 'a' },
      { k: 1, tag: 'b' },
      { k: 0, tag: 'c' },
      { k: 1, tag: 'd' },
    ];
    const cols: TableColumn<Ranked>[] = [
      { header: 'K', accessor: 'k', sortable: true },
      { header: 'Tag', accessor: 'tag' },
    ];
    const { container } = renderStrict(
      <Table<Ranked>
        data={ranked}
        columns={cols}
        constrainHeight={false}
        initialSort={{ index: 0, desc: true }}
      />,
    );
    /* Stable desc: the k=1 ties stay a, b, d (insertion order), k=0 last.
       The old `[...].sort(cmp).reverse()` produced d, b, a, c. */
    expect(columnTexts(container, 1)).toEqual(['a', 'b', 'd', 'c']);
  });
});

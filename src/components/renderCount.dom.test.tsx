// ─────────────────────────────────────────────────────────────
// src/components/renderCount.dom.test.tsx | valet
// PERF S10 — render-count regression harness (consolidation pass).
//
// The render-count invariants the plan §3.7 S10 names mostly already
// ship in their owning suites; this file is the consolidation point that
// (a) closes the one gap those suites leave and (b) records, in one place,
// where each named invariant is proven. The gap is Table's INLINE-CALLBACK
// re-render behaviour: a parent that re-renders for an unrelated reason
// while passing FRESH closures (`onSelectionChange`/`onSortChange`) every
// render must not loop and must not fire those callbacks spuriously. That
// matters because the selection-prune effect (Table.tsx:518–523) lists
// `onSelectionChange` in its dependency array, so a new closure identity
// re-runs the effect every render — the bail-out at :520 is the only thing
// standing between "inline callback" and "infinite spurious fire". The
// pre-existing Table suite drives new *data* identities; none isolates the
// callback-identity axis, nor asserts the parent's own commit count stays
// bounded. This file does, using the shared render counter (test-utils).
//
// Named-invariant coverage map (each verified to exist; this file adds the
// missing inline-callback dimension and a cross-suite render-count probe):
//   • Surface render counter under store sets ....... Surface.dom.test.tsx
//   • surfaceStore notification counts (n→1) ........ surfaceStore.dom.test.ts
//   • Table StrictMode exactly-once callbacks ....... Table.dom.test.tsx
//   • Table inline-callback no-loop / no-spurious ... THIS FILE (the gap)
//   • List reorder counts (exactly-once) ............ List.dom.test.tsx
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Table, type TableColumn } from './widgets/Table';
import { SurfaceCtx, createSurfaceStore } from '../system/surfaceStore';
import { makeRenderCounter } from '../test-utils/renderCounter';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom lacks ResizeObserver (the Surface store constructs one). ------- */
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

/** Render under StrictMode inside a Surface store provider. */
function renderStrict(node: React.ReactNode) {
  const { root, container } = makeRoot();
  const store = createSurfaceStore();
  act(() => {
    root.render(
      <React.StrictMode>
        <SurfaceCtx.Provider value={store}>{node}</SurfaceCtx.Provider>
      </React.StrictMode>,
    );
  });
  return { root, container };
}

const clickCheckbox = (container: HTMLElement, rowIdx: number) => {
  const boxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
  act(() => {
    boxes[rowIdx].click();
  });
};

const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });

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

/* ───────────────────────── the named gap ──────────────────────────── */
describe('PERF S10 — Table inline-callback re-render behaviour (jsdom, StrictMode)', () => {
  /* A parent that re-renders for an UNRELATED reason while passing fresh
     `onSelectionChange`/`onSortChange` closures every render. The prune
     effect depends on `onSelectionChange`, so each new closure identity
     re-runs it; without the length-equality bail-out at Table.tsx:520
     that effect would setSelected (fresh Set) → re-render → … forever and
     fire `onSelectionChange` spuriously on every parent tick. This must be
     a pure no-op: no callback, no extra Table commit, no hang. */
  it('fresh inline callbacks across unrelated parent re-renders never loop or fire spuriously', () => {
    const selSpy = vi.fn<(s: Row[]) => void>();
    const sortSpy = vi.fn<(i: number, d: boolean) => void>();
    const tableCounter = makeRenderCounter();
    const rows = makeRows();

    let bump!: () => void;
    function Parent() {
      // Unrelated state: incrementing it re-renders Parent (and thus mints
      // brand-new onSelectionChange/onSortChange closures) without touching
      // Table's data or selection.
      const [, setTick] = React.useState(0);
      bump = () => setTick((t) => t + 1);
      return tableCounter.wrap(
        <Table<Row>
          data={rows}
          columns={nameColumns}
          selectionMode='multiple'
          constrainHeight={false}
          /* FRESH identity every render — this is the whole point. */
          onSelectionChange={(s) => selSpy(s)}
          onSortChange={(i, d) => sortSpy(i, d)}
        />,
      );
    }

    renderStrict(<Parent />);
    // Mount must not have fired either callback (nothing selected, no sort).
    expect(selSpy).not.toHaveBeenCalled();
    expect(sortSpy).not.toHaveBeenCalled();

    const commitsAfterMount = tableCounter.count;

    // Drive several unrelated parent re-renders. Each remints the closures,
    // re-running the prune effect; the bail-out keeps it inert.
    for (let i = 0; i < 5; i += 1) act(() => bump());

    // No spurious fires, and the Table re-rendered only because the parent
    // did (no self-perpetuating loop adding commits of its own). The
    // spurious-fire assertions above are the primary loop detector — a real
    // prune loop fires `onSelectionChange` and/or throws "Maximum update
    // depth exceeded" inside one of the act(bump) calls. The commit ceiling
    // is the belt-and-suspenders check.
    expect(selSpy).not.toHaveBeenCalled();
    expect(sortSpy).not.toHaveBeenCalled();
    // 5 unrelated parent ticks settle at ~one commit each (measured delta 6
    // under StrictMode's double-commit). Assert a generous-but-finite ceiling
    // that sits far above the real value yet far below any runaway loop.
    expect(tableCounter.count).toBeGreaterThan(commitsAfterMount); // it did re-render
    expect(tableCounter.count).toBeLessThanOrEqual(commitsAfterMount + 12);
  });

  /* With those same fresh inline callbacks, a real user selection still
     fires `onSelectionChange` exactly once (the prune bail-out must not
     also suppress genuine selection callbacks). */
  it('a real selection still fires the inline callback exactly once', () => {
    const selSpy = vi.fn<(s: Row[]) => void>();
    const rows = makeRows();
    function Parent() {
      const [, setTick] = React.useState(0);
      // One unrelated re-render before interacting, to prove the fresh
      // closure each render does not desync the exactly-once guarantee.
      React.useEffect(() => setTick(1), []);
      return (
        <Table<Row>
          data={rows}
          columns={nameColumns}
          selectionMode='multiple'
          constrainHeight={false}
          onSelectionChange={(s) => selSpy(s)}
        />
      );
    }
    const { container } = renderStrict(<Parent />);

    clickCheckbox(container, 0);
    expect(selSpy).toHaveBeenCalledTimes(1);
    expect(selSpy.mock.calls[0][0]).toEqual([rows[0]]);
  });

  /* And a real sort still fires `onSortChange` exactly once with a fresh
     inline closure. */
  it('a real sort still fires the inline callback exactly once', () => {
    const sortSpy = vi.fn<(i: number, d: boolean) => void>();
    const rows = makeRows();
    function Parent() {
      const [, setTick] = React.useState(0);
      React.useEffect(() => setTick(1), []);
      return (
        <Table<Row>
          data={rows}
          columns={nameColumns}
          constrainHeight={false}
          onSortChange={(i, d) => sortSpy(i, d)}
        />
      );
    }
    const { container } = renderStrict(<Parent />);
    const sortBtn = container.querySelector('thead th button')!;

    click(sortBtn);
    expect(sortSpy).toHaveBeenCalledTimes(1);
    expect(sortSpy.mock.calls[0]).toEqual([0, false]);
  });

  /* The combined worst case: fresh inline callbacks AND a fresh data array
     identity every parent render (the immutable-refresh pattern), with the
     parent storing selection in state. This is the PERF S3 infinite-loop
     shape crossed with inline-callback identity; it must settle, fire the
     selection callback exactly once on the click, and not runaway-commit. */
  it('fresh callbacks + fresh data identity + state-storing parent: settles, no loop', () => {
    const selSpy = vi.fn<(s: Row[]) => void>();
    const tableCounter = makeRenderCounter();
    const rows = makeRows();

    function Parent() {
      const [, setSel] = React.useState<Row[]>([]);
      return tableCounter.wrap(
        <Table<Row>
          /* new array identity every render */
          data={[...rows]}
          columns={nameColumns}
          selectionMode='multiple'
          constrainHeight={false}
          /* fresh closure every render */
          onSelectionChange={(s) => {
            selSpy(s);
            setSel(s);
          }}
        />,
      );
    }

    const { container } = renderStrict(<Parent />);
    expect(selSpy).not.toHaveBeenCalled();
    const commitsAfterMount = tableCounter.count;

    clickCheckbox(container, 0);
    // Exactly one selection callback; the parent's setState re-render (new
    // data identity, fresh closure) must not trigger a prune callback.
    expect(selSpy).toHaveBeenCalledTimes(1);
    expect(selSpy.mock.calls[0][0]).toEqual([rows[0]]);
    expect(container.querySelectorAll('tbody tr[data-selected="true"]')).toHaveLength(1);
    // A loop would have driven commits without bound; assert it settled.
    expect(tableCounter.count).toBeGreaterThan(commitsAfterMount);
    expect(tableCounter.count).toBeLessThanOrEqual(commitsAfterMount + 8);
  });
});

/* ─────────────── shared render counter — self-check ──────────────────
   The harness util is load-bearing for the assertions above (a broken
   counter would make every "no extra commit" check vacuously pass), so
   pin its contract: counts commits, isolates instances, resets. */
describe('PERF S10 — makeRenderCounter contract', () => {
  it('counts committed renders, isolates instances, and resets', () => {
    const a = makeRenderCounter();
    const b = makeRenderCounter();
    let bump!: () => void;
    function Leaf() {
      const [, setN] = React.useState(0);
      bump = () => setN((n) => n + 1);
      return null;
    }
    const { root, container } = makeRoot();
    // No StrictMode here: assert exact counts.
    act(() => {
      root.render(a.wrap(<Leaf />));
    });
    expect(a.count).toBe(1); // mount commit
    expect(b.count).toBe(0); // independent instance untouched

    act(() => bump());
    expect(a.count).toBe(2);

    a.reset();
    expect(a.count).toBe(0);
    act(() => bump());
    expect(a.count).toBe(1);

    act(() => root.unmount());
    container.remove();
  });
});

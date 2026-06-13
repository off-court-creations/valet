// ─────────────────────────────────────────────────────────────
// src/components/widgets/Tree.selection.dom.test.tsx | valet
// API-TYPES S11 (Q11(a), ruling R12) — Tree adopts the unified
// selection/expansion vocabulary. Expansion already speaks the
// canonical `expanded`/`defaultExpanded`/`onExpandedChange` trio
// (matching Accordion). Selection gains the cross-component
// `selectionMode` ('none' | 'single'): Tree is single-select by
// node id, so 'single' (default) preserves today's behavior and
// 'none' disables selection writes (rows still expand/collapse and
// navigate). No deprecated aliases — Tree had no pre-S11 selection
// flag to rename.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Tree, type TreeNode } from './Tree';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom lacks ResizeObserver (surfaceStore needs it) ------------------- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  /* Tree's rows render <Typography>, which reads the Surface store. */
  const store = createSurfaceStore();
  act(() => {
    root.render(<SurfaceCtx.Provider value={store}>{node}</SurfaceCtx.Provider>);
  });
  return { root, container };
}

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

interface Label {
  label: string;
}
const nodes: TreeNode<Label>[] = [
  {
    id: 'fruit',
    data: { label: 'Fruit' },
    children: [
      { id: 'apple', data: { label: 'Apple' } },
      { id: 'banana', data: { label: 'Banana' } },
    ],
  },
  { id: 'veg', data: { label: 'Vegetable' } },
];

const treeItems = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[role="treeitem"]'));
const selectedItems = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[role="treeitem"][aria-selected="true"]'));

/* ─────────────────────────────────────────────────────────────
   selectionMode='single' (default) — current behavior preserved
   ───────────────────────────────────────────────────────────── */
describe('Tree selectionMode (jsdom)', () => {
  it('default (single) selects the clicked node and fires onNodeSelect', () => {
    const onNodeSelect = vi.fn();
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        defaultExpanded={['fruit']}
        onNodeSelect={onNodeSelect}
      />,
    );
    const items = treeItems(container);
    /* click the "veg" row (a leaf, so no toggle interferes) */
    const veg = items.find((el) => el.textContent?.includes('Vegetable'))!;
    act(() => veg.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onNodeSelect).toHaveBeenCalledWith({ label: 'Vegetable' });
    expect(selectedItems(container).map((el) => el.textContent)).toEqual(['Vegetable']);
  });

  it('explicit `selectionMode="single"` behaves identically', () => {
    const onNodeSelect = vi.fn();
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        selectionMode='single'
        defaultExpanded={['fruit']}
        onNodeSelect={onNodeSelect}
      />,
    );
    const veg = treeItems(container).find((el) => el.textContent?.includes('Vegetable'))!;
    act(() => veg.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onNodeSelect).toHaveBeenCalledWith({ label: 'Vegetable' });
    expect(selectedItems(container)).toHaveLength(1);
  });

  /* selectionMode='none' — selection writes disabled, expansion still works */
  it('`selectionMode="none"` never selects but still expands/collapses', () => {
    const onNodeSelect = vi.fn();
    const onExpandedChange = vi.fn();
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        selectionMode='none'
        defaultExpanded={['fruit']}
        onNodeSelect={onNodeSelect}
        onExpandedChange={onExpandedChange}
      />,
    );
    /* a leaf click does not select and does not fire onNodeSelect */
    const veg = treeItems(container).find((el) => el.textContent?.includes('Vegetable'))!;
    act(() => veg.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onNodeSelect).not.toHaveBeenCalled();
    expect(selectedItems(container)).toHaveLength(0);

    /* a parent click still toggles expansion (collapses "fruit") */
    const fruit = treeItems(container).find((el) => el.textContent?.includes('Fruit'))!;
    act(() => fruit.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onExpandedChange).toHaveBeenCalled();
    /* fruit's children are no longer rendered after collapse */
    expect(treeItems(container).some((el) => el.textContent?.includes('Apple'))).toBe(false);
    /* still never selected */
    expect(selectedItems(container)).toHaveLength(0);
  });

  it('`selectionMode="none"` ignores keyboard Enter/Space selection', () => {
    const onNodeSelect = vi.fn();
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        selectionMode='none'
        defaultExpanded={['fruit']}
        onNodeSelect={onNodeSelect}
      />,
    );
    const tree = container.querySelector('[role="tree"]')!;
    act(() => {
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(onNodeSelect).not.toHaveBeenCalled();
    expect(selectedItems(container)).toHaveLength(0);
  });

  /* Expansion vocabulary is the canonical trio (already unified). */
  it('controlled `expanded` + `onExpandedChange` drive expansion (unified vocabulary)', () => {
    const onExpandedChange = vi.fn();
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        expanded={['fruit']}
        onExpandedChange={onExpandedChange}
      />,
    );
    /* controlled-expanded "fruit" shows its children */
    expect(treeItems(container).some((el) => el.textContent?.includes('Apple'))).toBe(true);
    const fruit = treeItems(container).find((el) => el.textContent?.includes('Fruit'))!;
    /* clicking requests a collapse via onExpandedChange (controlled: parent owns state) */
    act(() => fruit.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onExpandedChange).toHaveBeenCalledWith([]);
  });
});

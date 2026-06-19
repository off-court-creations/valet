// ─────────────────────────────────────────────────────────────
// src/components/widgets/Tree.selection.dom.test.tsx | valet
// Tree 1.0 rewrite regression suite (tree-analysis-2026-06-18):
//   • canonical SelectionProps<string>: selected:string[] +
//     onSelectionChange; single / multiple / none
//   • one unified render path → nested role=group in EVERY variant
//   • aria-level/setsize/posinset on a nested fixture
//   • keyboard matrix (Up/Down/Left/Right/Home/End/'*'/Enter), typeahead
//   • NO focus-steal on mount; StrictMode single-fire of onExpandedChange
//   • disabled nodes; mobile chrome kit + ≥44px coarse hit floor
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Tree, type TreeNode } from './Tree';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';
import { getGlobalSheet } from '../../css/sheet';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function render(node: React.ReactNode, strict = false) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  const store = createSurfaceStore();
  const tree = <SurfaceCtx.Provider value={store}>{node}</SurfaceCtx.Provider>;
  act(() => {
    root.render(strict ? <React.StrictMode>{tree}</React.StrictMode> : tree);
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

const treeItems = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLElement>('[role="treeitem"]'));
const rowFor = (c: HTMLElement, text: string) =>
  treeItems(c).find((el) => el.textContent?.includes(text))!;
const selectedTexts = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('[role="treeitem"][aria-selected="true"]')).map(
    (el) => el.textContent,
  );
const focusedRow = (c: HTMLElement) =>
  treeItems(c).find((el) => el.getAttribute('tabindex') === '0');
const click = (el: Element) =>
  act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const key = (c: HTMLElement, k: string) =>
  act(() =>
    c
      .querySelector('[role="tree"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })),
  );

/*───────────────────────────────────────────────────────────────*/
/* Selection — single / multiple / none                           */
describe('Tree selection (canonical SelectionProps<string>)', () => {
  it('single (default): click selects + fires onSelectionChange with [id]', () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        defaultExpanded={['fruit']}
        onSelectionChange={onSelectionChange}
      />,
    );
    click(rowFor(container, 'Vegetable'));
    expect(onSelectionChange).toHaveBeenCalledWith(['veg']);
    expect(selectedTexts(container)).toEqual(['Vegetable']);
    // single-select replaces, never accumulates
    click(rowFor(container, 'Apple'));
    expect(selectedTexts(container)).toEqual(['Apple']);
  });

  it('multiple: clicks toggle ids in/out; aria-multiselectable on the tree', () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        selectionMode='multiple'
        defaultExpanded={['fruit']}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(container.querySelector('[role="tree"]')!.getAttribute('aria-multiselectable')).toBe(
      'true',
    );
    click(rowFor(container, 'Apple'));
    click(rowFor(container, 'Banana'));
    expect(selectedTexts(container).sort()).toEqual(['Apple', 'Banana']);
    // toggling an already-selected node removes it
    click(rowFor(container, 'Apple'));
    expect(selectedTexts(container)).toEqual(['Banana']);
    expect(onSelectionChange).toHaveBeenLastCalledWith(['banana']);
  });

  it('none: never selects (no aria-selected attr) but still expands', () => {
    const onSelectionChange = vi.fn();
    const onExpandedChange = vi.fn();
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        selectionMode='none'
        defaultExpanded={['fruit']}
        onSelectionChange={onSelectionChange}
        onExpandedChange={onExpandedChange}
      />,
    );
    // under 'none', aria-selected is omitted entirely (not 'false')
    expect(rowFor(container, 'Vegetable').hasAttribute('aria-selected')).toBe(false);
    click(rowFor(container, 'Vegetable'));
    expect(onSelectionChange).not.toHaveBeenCalled();
    // parent click still collapses
    click(rowFor(container, 'Fruit'));
    expect(onExpandedChange).toHaveBeenCalled();
    expect(treeItems(container).some((el) => el.textContent?.includes('Apple'))).toBe(false);
  });

  it('controlled `expanded` + `onExpandedChange` (collapse requests [])', () => {
    const onExpandedChange = vi.fn();
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        expanded={['fruit']}
        onExpandedChange={onExpandedChange}
      />,
    );
    expect(treeItems(container).some((el) => el.textContent?.includes('Apple'))).toBe(true);
    click(rowFor(container, 'Fruit'));
    expect(onExpandedChange).toHaveBeenCalledWith([]);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* ARIA structure — nested role=group in EVERY variant            */
describe('Tree ARIA structure (unified render path)', () => {
  it.each(['chevron', 'list', 'files'] as const)(
    'variant=%s emits a nested role=group for an expanded parent',
    (variant) => {
      const { container } = render(
        <Tree<Label>
          nodes={nodes}
          getLabel={(n) => n.label}
          variant={variant}
          defaultExpanded={['fruit']}
        />,
      );
      const groups = container.querySelectorAll('[role="group"]');
      expect(groups.length).toBeGreaterThanOrEqual(1);
      // the group contains the child treeitems
      expect(groups[0].querySelector('[role="treeitem"]')!.textContent).toContain('Apple');
    },
  );

  it('sets correct aria-level / setsize / posinset on a nested fixture', () => {
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        defaultExpanded={['fruit']}
      />,
    );
    const meta = (text: string) => {
      const el = rowFor(container, text);
      return [
        el.getAttribute('aria-level'),
        el.getAttribute('aria-setsize'),
        el.getAttribute('aria-posinset'),
      ];
    };
    expect(meta('Fruit')).toEqual(['1', '2', '1']);
    expect(meta('Apple')).toEqual(['2', '2', '1']);
    expect(meta('Banana')).toEqual(['2', '2', '2']);
    expect(meta('Vegetable')).toEqual(['1', '2', '2']);
    // parent carries aria-expanded; leaf does not
    expect(rowFor(container, 'Fruit').getAttribute('aria-expanded')).toBe('true');
    expect(rowFor(container, 'Vegetable').hasAttribute('aria-expanded')).toBe(false);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Keyboard navigation + typeahead                                */
describe('Tree keyboard', () => {
  const mount = () =>
    render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        defaultExpanded={['fruit']}
      />,
    );

  it('ArrowDown / ArrowUp move the roving focus', () => {
    const { container } = mount();
    expect(focusedRow(container)!.textContent).toContain('Fruit'); // initial roving stop
    key(container, 'ArrowDown');
    expect(focusedRow(container)!.textContent).toContain('Apple');
    key(container, 'ArrowUp');
    expect(focusedRow(container)!.textContent).toContain('Fruit');
  });

  it('ArrowRight expands a collapsed parent then descends; ArrowLeft collapses then climbs', () => {
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
      />,
    ); // start collapsed
    expect(treeItems(container).some((el) => el.textContent?.includes('Apple'))).toBe(false);
    key(container, 'ArrowRight'); // expands fruit
    expect(treeItems(container).some((el) => el.textContent?.includes('Apple'))).toBe(true);
    key(container, 'ArrowRight'); // descends to first child
    expect(focusedRow(container)!.textContent).toContain('Apple');
    key(container, 'ArrowLeft'); // climbs back to parent (apple has no children)
    expect(focusedRow(container)!.textContent).toContain('Fruit');
    key(container, 'ArrowLeft'); // collapses fruit
    expect(treeItems(container).some((el) => el.textContent?.includes('Apple'))).toBe(false);
  });

  it('Home / End jump to first / last visible', () => {
    const { container } = mount();
    key(container, 'End');
    expect(focusedRow(container)!.textContent).toContain('Vegetable');
    key(container, 'Home');
    expect(focusedRow(container)!.textContent).toContain('Fruit');
  });

  it('typeahead jumps to the next node whose label matches', () => {
    const { container } = mount();
    key(container, 'v');
    expect(focusedRow(container)!.textContent).toContain('Vegetable');
  });

  it('Enter selects the focused node', () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        defaultExpanded={['fruit']}
        onSelectionChange={onSelectionChange}
      />,
    );
    key(container, 'ArrowDown'); // focus Apple
    key(container, 'Enter');
    expect(onSelectionChange).toHaveBeenCalledWith(['apple']);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Focus discipline                                               */
describe('Tree focus discipline', () => {
  it('does NOT steal focus on mount (no row is focused before interaction)', () => {
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        defaultExpanded={['fruit']}
      />,
    );
    // The roving tab stop exists (tabIndex=0) but nothing was programmatically focused.
    expect(focusedRow(container)).toBeTruthy();
    expect(treeItems(container).some((el) => el === document.activeElement)).toBe(false);
    expect(document.activeElement).toBe(document.body);
  });

  it('refocuses the nearest visible ancestor when the focused node is collapsed away', () => {
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        defaultExpanded={['fruit']}
      />,
    );
    key(container, 'ArrowDown'); // focus Apple (child of fruit)
    expect(focusedRow(container)!.textContent).toContain('Apple');
    click(rowFor(container, 'Fruit')); // collapse the parent → Apple is gone
    expect(focusedRow(container)!.textContent).toContain('Fruit'); // focus retargeted to ancestor
  });
});

/*───────────────────────────────────────────────────────────────*/
/* StrictMode — onExpandedChange fires exactly once               */
describe('Tree StrictMode', () => {
  it('fires onExpandedChange exactly once per toggle (no impure-updater double-fire)', () => {
    const onExpandedChange = vi.fn();
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
        onExpandedChange={onExpandedChange}
      />,
      true, // StrictMode
    );
    click(rowFor(container, 'Fruit')); // expand
    expect(onExpandedChange).toHaveBeenCalledTimes(1);
    expect(onExpandedChange).toHaveBeenCalledWith(['fruit']);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Disabled nodes                                                 */
describe('Tree disabled nodes', () => {
  const withDisabled: TreeNode<Label>[] = [
    { id: 'a', data: { label: 'Alpha' } },
    { id: 'b', data: { label: 'Bravo' }, disabled: true },
  ];
  it('marks aria-disabled and ignores select/toggle on a disabled node', () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <Tree<Label>
        nodes={withDisabled}
        getLabel={(n) => n.label}
        onSelectionChange={onSelectionChange}
      />,
    );
    const bravo = rowFor(container, 'Bravo');
    expect(bravo.getAttribute('aria-disabled')).toBe('true');
    click(bravo);
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(selectedTexts(container)).toEqual([]);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Theming + mobile                                               */
describe('Tree theming + mobile', () => {
  const ruleFor = (el: Element) => {
    const cls = el.className.split(/\s+/).find(Boolean)!;
    return (
      Array.from(getGlobalSheet()!.cssRules, (r) => r.cssText).find((t) =>
        t.startsWith(`.${cls}`),
      ) ?? ''
    );
  };

  it('drives colours from the intent contract and exposes the coarse hit var', () => {
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
      />,
    );
    const tree = container.querySelector('[role="tree"]') as HTMLElement;
    expect(tree.style.getPropertyValue('--valet-intent-bg')).not.toBe('');
    expect(tree.style.getPropertyValue('--valet-tree-hit')).toBe('44px');
  });

  it('rows ship the chrome kit + a coarse >=44px floor in the styled rule', () => {
    const { container } = render(
      <Tree<Label>
        nodes={nodes}
        getLabel={(n) => n.label}
      />,
    );
    const rule = ruleFor(rowFor(container, 'Fruit'));
    expect(rule).toContain('touch-action: manipulation');
    expect(rule).toContain('@media (pointer: coarse)');
    expect(rule).toContain('--valet-tree-hit');
  });
});

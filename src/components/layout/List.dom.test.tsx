// ─────────────────────────────────────────────────────────────
// src/components/layout/List.dom.test.tsx | valet
// PERF S4 — List purity: onReorder fires outside setState updaters
// (exactly once under StrictMode), and the drop callbacks read a
// latest-items ref instead of a stale pre-drag render closure
// (endPointer + the touch finish handler).
// ─────────────────────────────────────────────────────────────
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { List } from './List';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom shims ----------------------------------------------------------- */
/* jsdom ships no ResizeObserver; createSurfaceStore constructs one. */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver ??=
  ResizeObserverStub as unknown as typeof ResizeObserver;

/* jsdom has no pointer-capture; beginReorder calls it on pointerdown. */
beforeAll(() => {
  Element.prototype.setPointerCapture ??= () => {};
});

/* calcInsertIndex hit-tests row midpoints via getBoundingClientRect, which
   jsdom zeroes out. Lay List rows out as 40px bands by child index. */
const ROW_H = 40;
const nativeGBCR = Element.prototype.getBoundingClientRect;
beforeAll(() => {
  Element.prototype.getBoundingClientRect = function (this: Element): DOMRect {
    const parent = this.parentElement;
    if (this.tagName === 'LI' && parent?.getAttribute('data-valet-component') === 'List') {
      const i = Array.from(parent.children).indexOf(this);
      const top = i * ROW_H;
      return {
        x: 0,
        y: top,
        top,
        bottom: top + ROW_H,
        left: 0,
        right: 200,
        width: 200,
        height: ROW_H,
        toJSON: () => ({}),
      } as DOMRect;
    }
    return nativeGBCR.call(this);
  };
});
afterAll(() => {
  Element.prototype.getBoundingClientRect = nativeGBCR;
});

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render under StrictMode inside a Surface context; tracked for cleanup. */
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
  /** Re-render new props on the same root (same Surface store). */
  const rerender = (n: React.ReactNode) =>
    act(() => {
      root.render(wrap(n));
    });
  return { root, container, rerender };
}

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/** Build a bubbling pointer event at a given clientY (pointerId for capture). */
const pointerEvent = (type: 'pointerdown' | 'pointermove' | 'pointerup', clientY: number) =>
  new PointerEvent(type, { bubbles: true, cancelable: true, clientY, pointerId: 1 });

/** Build a touch-family event carrying a single touch point at clientY. */
function touchEvent(type: 'touchstart' | 'touchmove' | 'touchend', clientY: number) {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  const points = [{ clientY }];
  Object.defineProperty(ev, 'touches', { value: points });
  Object.defineProperty(ev, 'changedTouches', { value: points });
  return ev;
}

const rows = (container: HTMLElement) => Array.from(container.querySelectorAll('li'));

const fixture = (data: string[], onReorder: (items: string[]) => void, selectable = false) => (
  <List<string>
    data={data}
    getTitle={(s) => s}
    getItemKey={(s) => s}
    selectionMode={selectable ? 'single' : 'none'}
    onReorder={onReorder}
  />
);

/* Suite ----------------------------------------------------------------- */
describe('List reorder purity (jsdom)', () => {
  it('keyboard reorder fires onReorder exactly once under StrictMode', () => {
    const spy = vi.fn<(items: string[]) => void>();
    const { container } = renderStrict(fixture(['a', 'b', 'c'], spy, true));
    /* Alt+ArrowDown on row 0 swaps rows 0/1. Pre-fix, onReorder lived
       inside the setItems updater — StrictMode double-invoked it. */
    act(() => {
      rows(container)[0].dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          altKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(['b', 'a', 'c']);
    expect(rows(container).map((li) => li.textContent)).toEqual(['b', 'a', 'c']);
  });

  it('pointer drag-drop fires onReorder exactly once with the dropped order under StrictMode', () => {
    const spy = vi.fn<(items: string[]) => void>();
    const { container } = renderStrict(fixture(['a', 'b', 'c'], spy));
    const li = rows(container)[0];
    act(() => {
      li.dispatchEvent(pointerEvent('pointerdown', 20));
    });
    /* Move + drop inside one act: the move's re-render has not committed
       when pointerup runs, so a closure-read of `items` is pre-drag. */
    act(() => {
      li.dispatchEvent(pointerEvent('pointermove', 130)); // row 0 → end
      li.dispatchEvent(pointerEvent('pointerup', 130));
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(['b', 'c', 'a']);
  });

  it('reports the reorder of the latest items when the data prop changes mid-drag', () => {
    const spy = vi.fn<(items: string[]) => void>();
    const { container, rerender } = renderStrict(fixture(['a', 'b', 'c'], spy));
    act(() => {
      rows(container)[0].dispatchEvent(pointerEvent('pointerdown', 20));
    });
    /* The data prop is replaced while the drag is in flight. */
    rerender(fixture(['x', 'y', 'z'], spy));
    const li = rows(container)[0];
    act(() => {
      li.dispatchEvent(pointerEvent('pointermove', 130)); // row 0 → end
      li.dispatchEvent(pointerEvent('pointerup', 130));
    });
    /* Pre-fix: the stale pre-move array ['x','y','z'] (or worse, the
       pre-drag ['a','b','c'] on the touch path) was reported. */
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(['y', 'z', 'x']);
  });

  it('touch drag-drop reports the post-drag order, not the drag-start closure array', () => {
    const spy = vi.fn<(items: string[]) => void>();
    const { container } = renderStrict(fixture(['a', 'b', 'c'], spy));
    /* startTouchDrag captures `finish` → endPointer at touch start;
       pre-fix that closure reported the pre-drag items on drop. */
    act(() => {
      rows(container)[0].dispatchEvent(touchEvent('touchstart', 20));
    });
    act(() => {
      window.dispatchEvent(touchEvent('touchmove', 130)); // row 0 → end
    });
    act(() => {
      window.dispatchEvent(touchEvent('touchend', 130));
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(['b', 'c', 'a']);
  });
});

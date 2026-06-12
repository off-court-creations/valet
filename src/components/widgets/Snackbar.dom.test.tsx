// ─────────────────────────────────────────────────────────────
// src/components/widgets/Snackbar.dom.test.tsx | valet
// enter-animation rAF ids are effect-local — concurrent snackbars
// must not cancel each other's enter frame (no window global)
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Snackbar from './Snackbar';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';
import * as sheet from '../../css/sheet';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom lacks ResizeObserver (surfaceStore needs it) ------------------- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/* Deterministic rAF queue so frames advance only when we say so. ------- */
let rafQueue: Map<number, FrameRequestCallback>;
let rafSeq: number;

/** Run every currently queued frame callback (inside act). */
const flushFrame = () => {
  const cbs = Array.from(rafQueue.values());
  rafQueue.clear();
  act(() => {
    cbs.forEach((cb) => cb(performance.now()));
  });
};

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function makeRoot() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  return root;
}

/** Effective opacity of a styled element via its injected rule. */
const opacityOf = (el: Element) => {
  const cls = el.className.split(' ')[0];
  const rules = Array.from(sheet.getGlobalSheet()?.cssRules ?? [], (r) => r.cssText);
  const rule = rules.find((t) => t.startsWith(`.${cls}`)) ?? '';
  const m = rule.match(/opacity:\s*([\d.]+)/);
  return m ? Number(m[1]) : NaN;
};

beforeEach(() => {
  rafQueue = new Map();
  rafSeq = 0;
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafQueue.set(++rafSeq, cb);
    return rafSeq;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    rafQueue.delete(id);
  });
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.unstubAllGlobals();
});

/* Suite ----------------------------------------------------------------- */
describe('Snackbar (jsdom)', () => {
  it('enters after two animation frames (sanity)', () => {
    const root = makeRoot();
    const store = createSurfaceStore();
    act(() => {
      root.render(
        <React.StrictMode>
          <SurfaceCtx.Provider value={store}>
            <Snackbar
              id='snack-solo'
              autoHideDuration={null}
              message='solo'
            />
          </SurfaceCtx.Provider>
        </React.StrictMode>,
      );
    });
    const el = document.getElementById('snack-solo')!;
    expect(opacityOf(el)).toBe(0);
    flushFrame(); // first frame schedules the nested one
    flushFrame(); // nested frame flips $visible on
    expect(opacityOf(el)).toBe(1);
  });

  it('a snackbar unmounting mid-enter cannot cancel a sibling’s enter frame', () => {
    const root = makeRoot();
    const store = createSurfaceStore();
    const ui = (snacks: React.ReactNode) => (
      <React.StrictMode>
        <SurfaceCtx.Provider value={store}>{snacks}</SurfaceCtx.Provider>
      </React.StrictMode>
    );

    act(() => {
      root.render(
        ui(
          <>
            <Snackbar
              key='a'
              id='snack-a'
              autoHideDuration={null}
              message='alpha'
            />
            <Snackbar
              key='b'
              id='snack-b'
              autoHideDuration={null}
              message='beta'
            />
          </>,
        ),
      );
    });
    const b = document.getElementById('snack-b')!;
    expect(opacityOf(b)).toBe(0);

    /* Frame 1: both snackbars schedule their nested enter frame. With the
       old shared window global, A's nested id was overwritten by B's. */
    flushFrame();

    /* A unmounts mid-enter — its cleanup must cancel only its own ids. */
    act(() => {
      root.render(
        ui(
          <Snackbar
            key='b'
            id='snack-b'
            autoHideDuration={null}
            message='beta'
          />,
        ),
      );
    });
    expect(document.getElementById('snack-a')).toBeNull();

    /* Frame 2: B's nested frame must have survived A's cleanup. */
    flushFrame();
    expect(document.getElementById('snack-b')).toBe(b);
    expect(opacityOf(b)).toBe(1);

    /* The window global is gone for good. */
    expect('__valet_snackbar_enter_id2' in window).toBe(false);
  });
});

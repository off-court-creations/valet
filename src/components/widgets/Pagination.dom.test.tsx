// ─────────────────────────────────────────────────────────────
// src/components/widgets/Pagination.dom.test.tsx | valet
// rule-lifecycle policy (ENGINE S9): measured pixels never reach rule
// text — underline/track/viewport geometry rides on --valet-pag-* CSS
// vars set on inline style, so the injected-rule count stays stable
// across 50 page changes instead of minting a permanent CSSOM rule
// per unique measurement (the audited rule-per-pixel leak)
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Pagination from './Pagination';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';
import { getStyleRegistry, getGlobalSheet } from '../../css/sheet';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom lacks ResizeObserver (Pagination + surfaceStore construct one) - */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/* Deterministic rAF queue so frames advance only when we say so -------- */
let rafQueue: Map<number, FrameRequestCallback>;
let rafSeq: number;

/** Drain every queued frame (incl. frames queued by frames), inside act. */
const flushFrames = () => {
  for (let guard = 0; rafQueue.size > 0 && guard < 10; guard++) {
    const cbs = Array.from(rafQueue.values());
    rafQueue.clear();
    act(() => {
      cbs.forEach((cb) => cb(performance.now()));
    });
  }
};

/* Distinct, page-keyed layout metrics: every page button measures at a
   UNIQUE left/width, so (pre-fix) each page change would bake fresh
   pixel values into rule text. jsdom returns all-zero rects natively,
   which would mask the leak. */
const mkRect = (left: number, width: number): DOMRect =>
  ({
    x: left,
    y: 0,
    top: 0,
    bottom: 24,
    left,
    right: left + width,
    width,
    height: 24,
    toJSON: () => ({}),
  }) as DOMRect;

const mockMeasurements = () => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const pageAttr = (this as HTMLElement).dataset?.page;
    if (pageAttr) {
      const n = Number(pageAttr);
      return mkRect(100 + n * 50, 40 + (n % 7) * 3);
    }
    return mkRect(0, 600);
  });
};

/* Render helper -------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  const store = createSurfaceStore();
  const render = (page: number) => {
    act(() => {
      root.render(
        <React.StrictMode>
          <SurfaceCtx.Provider value={store}>
            <Pagination
              count={60}
              page={page}
              onChange={() => {}}
            />
          </SurfaceCtx.Provider>
        </React.StrictMode>,
      );
    });
    flushFrames();
  };
  return { container, render };
}

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
  /* Freeze the multi-phase animation timers: phase transitions never run
     outside act, and effect cleanups still clearTimeout correctly. */
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  mockMeasurements();
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/* Suite ----------------------------------------------------------------- */
describe('Pagination rule lifecycle (ENGINE S9, jsdom)', () => {
  it('injected rule count stays stable across 50 page changes (no rule-per-pixel minting)', () => {
    const registry = getStyleRegistry();
    const { render } = mount();

    /* Mount + warm-up: lets every DISCRETE variant (active/inactive
       button, easing/origin combos, fade states) mint its one immortal
       rule. Distinct page-keyed measurements flow on every change. */
    render(1);
    for (let p = 2; p <= 5; p++) render(p);

    const cacheBefore = registry.styleCache.size;
    const injectedBefore = registry.injected.size;

    /* 50 further page changes, each with unique measured geometry. */
    for (let i = 0; i < 50; i++) render(6 + i);

    /* Rules are immortal — so the rule space must be discrete. Continuous
       values (underline x/w, durations, scale) ride on CSS vars and the
       caches must not have grown at all. */
    expect(registry.styleCache.size - cacheBefore).toBe(0);
    expect(registry.injected.size - injectedBefore).toBe(0);
    expect(registry.renderQueue.size).toBe(0);
  });

  it('continuous geometry rides on --valet-pag-* inline vars; rule text reads var(...)', () => {
    const { container, render } = mount();
    render(1);
    render(2);

    /* The underline element carries the measured geometry inline. */
    const underline = Array.from(container.querySelectorAll('div')).find((d) =>
      d.style.getPropertyValue('--valet-pag-x'),
    );
    expect(underline).toBeDefined();
    expect(underline!.style.getPropertyValue('--valet-pag-x')).toMatch(/^-?\d+px$/);
    expect(underline!.style.getPropertyValue('--valet-pag-w')).toMatch(/^\d+px$/);
    expect(underline!.style.getPropertyValue('--valet-pag-trans-x')).toMatch(/^\d+ms$/);

    /* …and the injected rules consume vars instead of baked pixels. */
    const ruleTexts = Array.from(getGlobalSheet()?.cssRules ?? [], (r) => r.cssText);
    const underlineCls = underline!.className.split(/\s+/)[0];
    const underlineRule = ruleTexts.find((t) => t.startsWith(`.${underlineCls}`)) ?? '';
    expect(underlineRule).toContain('translateX(var(--valet-pag-x');
    expect(underlineRule).toContain('var(--valet-pag-w');
    expect(ruleTexts.some((t) => t.includes('translateX(var(--valet-pag-track-x'))).toBe(true);
    expect(ruleTexts.some((t) => t.includes('var(--valet-pag-vp-w'))).toBe(true);
    /* No measured pixel ever lands in Pagination rule text: the only px
       values allowed are the discrete theme paddings minted at mount. */
    expect(underlineRule).not.toMatch(/translateX\(-?\d+px\)/);
  });
});

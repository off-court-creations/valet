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
              onPageChange={() => {}}
            />
          </SurfaceCtx.Provider>
        </React.StrictMode>,
      );
    });
    flushFrames();
  };
  return { container, render };
}

/* Controlled mount: parent owns `page` and commits it on every onChange,
   exactly like a real consumer. Returns the click count log + a clicker that
   fires a real DOM click on the live (non-duplicate) page button. */
function mountControlled(initial = 1, count = 60) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  const store = createSurfaceStore();
  const changes: number[] = [];
  let current = initial;

  const renderAt = (page: number) => {
    root.render(
      <React.StrictMode>
        <SurfaceCtx.Provider value={store}>
          <Pagination
            count={count}
            page={page}
            onPageChange={(n) => {
              changes.push(n);
              current = n;
              renderAt(n);
            }}
          />
        </SurfaceCtx.Provider>
      </React.StrictMode>,
    );
  };

  act(() => renderAt(current));
  flushFrames();

  /* Click the live page button (the one outside the sliding track: not
     aria-hidden, not disabled) carrying data-page === n. */
  const click = (n: number): boolean => {
    const btn = Array.from(
      container.querySelectorAll<HTMLButtonElement>(`button[data-page="${n}"]`),
    ).find((b) => !b.disabled && b.getAttribute('aria-hidden') == null);
    if (!btn) return false;
    act(() => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    flushFrames();
    return true;
  };

  return { container, changes, click, page: () => current };
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
    // 55 mount+measure cycles in jsdom legitimately run ~2.5s in isolation but
    // exceed the 5s default under CI parallel load (esp. Node 20); give it room
    // so the gate isn't flaky. It asserts a hard invariant, not timing.
  }, 30000);

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

/* ─────────────────────────────────────────────────────────────────────────
   PERF S11 — animation click-drop (plan §3.7 / R21; audit Pagination.tsx:282).
   The underline stretch-follow animation runs on every page change and used to
   (a) `disabled` every page button and (b) early-return from the click handler
   while `isAnimating`, so a second rapid click landing mid-animation was
   silently dropped. Fixed: page-number buttons stay clickable during the
   animation and the click always commits its target page.
   ───────────────────────────────────────────────────────────────────────── */
describe('Pagination mid-animation click-drop (PERF S11, jsdom)', () => {
  it('commits a second click that lands during the underline animation', () => {
    const { changes, click, page } = mountControlled(1);

    /* First click starts the multi-phase underline animation. Fake timers are
       NOT advanced, so phase2 never settles → isAnimating stays true. */
    expect(click(3)).toBe(true);
    expect(changes).toEqual([3]);

    /* Second click lands WHILE the first animation is still in flight. Pre-fix
       the button was `disabled` and the handler bailed on isAnimating, so this
       was dropped. It must now commit. */
    expect(click(5)).toBe(true);
    expect(changes).toEqual([3, 5]);
    expect(page()).toBe(5);
  });

  it('keeps page buttons enabled while the underline animates', () => {
    const { container, click } = mountControlled(1);

    expect(click(4)).toBe(true); // kick off the animation (timers frozen)

    /* Every live (non-duplicate) page button stays enabled mid-animation. */
    const liveButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button[data-page]'),
    ).filter((b) => b.getAttribute('aria-hidden') == null);
    expect(liveButtons.length).toBeGreaterThan(0);
    expect(liveButtons.every((b) => !b.disabled)).toBe(true);
  });

  it('lands on the final target after several rapid mid-animation clicks', () => {
    const { changes, click, page } = mountControlled(1);

    [2, 6, 9, 4].forEach((n) => expect(click(n)).toBe(true));
    expect(changes).toEqual([2, 6, 9, 4]);
    expect(page()).toBe(4);
  });
});

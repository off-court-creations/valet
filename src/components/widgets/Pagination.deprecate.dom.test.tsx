// ─────────────────────────────────────────────────────────────
// src/components/widgets/Pagination.deprecate.dom.test.tsx | valet
// API-TYPES S10 (Q12, ruling R30) — Pagination's `onChange` prop was
// renamed to `onPageChange`. The old name ships as an additive alias
// through 0.x: it keeps firing with the new 1-based page but dev-warns
// once, and the canonical `onPageChange` wins when both are supplied.
// Removed at 1.0.
//
// House style: createRoot + act, StrictMode, no @testing-library; the
// rAF/timer stubs mirror Pagination.dom.test.tsx so a page-button click
// commits deterministically.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Pagination from './Pagination';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';
import { resetWarnOnce } from '../../system/devErrors';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom lacks ResizeObserver (Pagination + surfaceStore construct one) - */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/* Deterministic rAF queue so frames advance only when we drain them ---- */
let rafQueue: Map<number, FrameRequestCallback>;
let rafSeq: number;

const flushFrames = () => {
  for (let guard = 0; rafQueue.size > 0 && guard < 10; guard++) {
    const cbs = Array.from(rafQueue.values());
    rafQueue.clear();
    act(() => {
      cbs.forEach((cb) => cb(performance.now()));
    });
  }
};

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

let warnSpy: ReturnType<typeof vi.spyOn>;
const deprecationWarns = () =>
  (warnSpy.mock.calls as unknown[][])
    .map((c) => String(c[0]))
    .filter((m) => m.includes('is deprecated'));

/** Mount with the given handler props; click the live page button `n`. */
function mount(props: { onPageChange?: (n: number) => void; onChange?: (n: number) => void }) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  const store = createSurfaceStore();
  act(() => {
    root.render(
      <React.StrictMode>
        <SurfaceCtx.Provider value={store}>
          <Pagination
            count={10}
            page={1}
            {...props}
          />
        </SurfaceCtx.Provider>
      </React.StrictMode>,
    );
  });
  flushFrames();

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

  return { container, click };
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
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  resetWarnOnce();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.useRealTimers();
  warnSpy.mockRestore();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ─────────────────────────────────────────────────────────────
   Canonical `onPageChange` — fires, no deprecation warning
   ───────────────────────────────────────────────────────────── */
describe('Pagination canonical onPageChange (jsdom)', () => {
  it('fires with the new page and emits no deprecation warning', () => {
    const onPageChange = vi.fn();
    const { click } = mount({ onPageChange });
    expect(click(3)).toBe(true);
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(deprecationWarns()).toEqual([]);
  });
});

/* ─────────────────────────────────────────────────────────────
   Deprecated `onChange` alias — fires, but warns once
   ───────────────────────────────────────────────────────────── */
describe('Pagination deprecated onChange alias (jsdom)', () => {
  it('still fires with the new page and warns once', () => {
    const onChange = vi.fn();
    const { click } = mount({ onChange });
    expect(click(4)).toBe(true);
    expect(onChange).toHaveBeenCalledWith(4);
    const warns = deprecationWarns();
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('`onChange`');
    expect(warns[0]).toContain('`onPageChange`');
  });
});

/* ─────────────────────────────────────────────────────────────
   Both given — canonical wins, alias still warns
   ───────────────────────────────────────────────────────────── */
describe('Pagination canonical + deprecated together (jsdom)', () => {
  it('`onPageChange` wins over `onChange`; the alias still warns once', () => {
    const onPageChange = vi.fn();
    const onChange = vi.fn();
    const { click } = mount({ onPageChange, onChange });
    expect(click(2)).toBe(true);
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(onChange).not.toHaveBeenCalled();
    const warns = deprecationWarns();
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('`onChange`');
  });
});

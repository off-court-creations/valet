// ─────────────────────────────────────────────────────────────
// src/components/widgets/Snackbar.dom.test.tsx | valet
// enter-animation rAF ids are effect-local — concurrent snackbars
// must not cancel each other's enter frame (no window global)
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Snackbar, { useSnackbar } from './Snackbar';
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

/* ── A11Y S1: live region + pausable auto-hide ─────────────────────────── */
describe('Snackbar a11y (live region + pausable auto-hide)', () => {
  const render = (ui: React.ReactNode) => {
    const root = makeRoot();
    const store = createSurfaceStore();
    act(() => {
      root.render(<SurfaceCtx.Provider value={store}>{ui}</SurfaceCtx.Provider>);
    });
    return root;
  };

  /* Drive the two enter frames so the node is fully shown. */
  const settleEnter = () => {
    flushFrame();
    flushFrame();
  };

  /* React polyfills onPointerEnter/Leave via native pointerover/out (with a
     relatedTarget boundary check) and onFocusCapture/onBlurCapture via native
     focusin/focusout. Dispatch what React actually listens for. `outside` is
     a node not contained by the snackbar so enter/leave semantics hold.    */
  const outside = document.body;
  const hoverIn = (el: Element) =>
    act(() => {
      el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, relatedTarget: outside }));
    });
  const hoverOut = (el: Element) =>
    act(() => {
      el.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: outside }));
    });
  const focusIn = (el: Element) =>
    act(() => {
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: outside }));
    });
  const focusOut = (el: Element) =>
    act(() => {
      el.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
    });

  it('defaults to role=status / aria-live=polite (a polite live region)', () => {
    render(
      <Snackbar
        id='snack-live'
        autoHideDuration={null}
        message='saved'
      />,
    );
    const el = document.getElementById('snack-live')!;
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-live')).toBe('polite');
  });

  it('lets callers override role/aria-live (role placed before the rest spread)', () => {
    render(
      <Snackbar
        id='snack-alert'
        autoHideDuration={null}
        role='alert'
        aria-live='assertive'
        message='boom'
      />,
    );
    const el = document.getElementById('snack-alert')!;
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.getAttribute('aria-live')).toBe('assertive');
  });

  it('auto-hides after autoHideDuration', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      const onClose = vi.fn();
      render(
        <Snackbar
          id='snack-auto'
          autoHideDuration={4000}
          onClose={onClose}
          message='bye'
        />,
      );
      settleEnter();
      expect(document.getElementById('snack-auto')).not.toBeNull();
      // Auto-hide fires the close-fade, then the fade settles and unmounts.
      act(() => {
        vi.advanceTimersByTime(4000); // hide deadline → handleClose
      });
      act(() => {
        vi.advanceTimersByTime(200); // exit-fade settle → unmount + onClose
      });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(document.getElementById('snack-auto')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('pauses the auto-hide clock on hover and resumes with the REMAINDER', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      const onClose = vi.fn();
      render(
        <Snackbar
          id='snack-hover'
          autoHideDuration={4000}
          onClose={onClose}
          message='hover me'
        />,
      );
      settleEnter();
      const el = document.getElementById('snack-hover')!;

      // 3s elapse, then hover pauses with 1s remaining.
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      hoverIn(el);
      // While paused, the full original duration must NOT dismiss it.
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(onClose).not.toHaveBeenCalled();
      expect(document.getElementById('snack-hover')).not.toBeNull();

      // Leaving resumes with the banked ~1s remainder, not a fresh 4s.
      hoverOut(el);
      act(() => {
        vi.advanceTimersByTime(1000); // remainder elapses → handleClose
      });
      act(() => {
        vi.advanceTimersByTime(200); // exit fade settles
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('also pauses on focus and stays paused while either hover OR focus is active', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      const onClose = vi.fn();
      render(
        <Snackbar
          id='snack-focus'
          autoHideDuration={4000}
          onClose={onClose}
          message={
            <>
              <button id='snack-focus-btn'>act</button>
            </>
          }
        />,
      );
      settleEnter();
      const el = document.getElementById('snack-focus')!;

      // Hover AND focus both active.
      hoverIn(el);
      focusIn(el);
      // Releasing only ONE input must keep the clock paused.
      hoverOut(el);
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(onClose).not.toHaveBeenCalled();

      // Releasing the other input too resumes; the full budget then dismisses.
      focusOut(el);
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('controlled dismissal fades out instead of vanishing, then unmounts', () => {
    const onClose = vi.fn();
    const root = makeRoot();
    const store = createSurfaceStore();
    const ui = (openProp: boolean) => (
      <SurfaceCtx.Provider value={store}>
        <Snackbar
          id='snack-ctl'
          open={openProp}
          autoHideDuration={null}
          onClose={onClose}
          message='controlled'
        />
      </SurfaceCtx.Provider>
    );
    act(() => root.render(ui(true)));
    settleEnter();
    const el = document.getElementById('snack-ctl')!;
    expect(opacityOf(el)).toBe(1);

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      // Parent flips open=false: node must stay mounted and fade (opacity 0),
      // NOT disappear on the same commit (audit Snackbar.tsx:176).
      act(() => root.render(ui(false)));
      expect(document.getElementById('snack-ctl')).toBe(el);
      expect(opacityOf(el)).toBe(0);
      // After the fade settles it unmounts.
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(document.getElementById('snack-ctl')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('a controlled re-open mid-fade cancels the exit and stays visible', () => {
    const onClose = vi.fn();
    const root = makeRoot();
    const store = createSurfaceStore();
    const ui = (openProp: boolean) => (
      <SurfaceCtx.Provider value={store}>
        <Snackbar
          id='snack-reopen'
          open={openProp}
          autoHideDuration={null}
          onClose={onClose}
          message='controlled'
        />
      </SurfaceCtx.Provider>
    );
    act(() => root.render(ui(true)));
    settleEnter();
    const el = document.getElementById('snack-reopen')!;

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      // Begin the exit fade ...
      act(() => root.render(ui(false)));
      expect(opacityOf(el)).toBe(0);
      // ... then re-open before it settles: the fade is cancelled.
      act(() => root.render(ui(true)));
      // Re-run the enter frames and confirm it's shown, not unmounted.
      settleEnter();
      expect(document.getElementById('snack-reopen')).toBe(el);
      // The cancelled fade must never fire its completion callback.
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onClose).not.toHaveBeenCalled();
      expect(opacityOf(el)).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('dismisses via the useSnackbar() context with a fade-out (uncontrolled)', () => {
    const onClose = vi.fn();
    const Closer = () => {
      const dismiss = useSnackbar();
      return (
        <button
          id='snack-dismiss-btn'
          onClick={() => dismiss?.()}
        >
          dismiss
        </button>
      );
    };
    const root = makeRoot();
    const store = createSurfaceStore();
    act(() => {
      root.render(
        <SurfaceCtx.Provider value={store}>
          <Snackbar
            id='snack-ctx'
            autoHideDuration={null}
            onClose={onClose}
          >
            <Closer />
          </Snackbar>
        </SurfaceCtx.Provider>,
      );
    });
    settleEnter();
    const el = document.getElementById('snack-ctx')!;
    expect(opacityOf(el)).toBe(1);

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      act(() => {
        document
          .getElementById('snack-dismiss-btn')!
          .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      // Fades first (still mounted at opacity 0) ...
      expect(document.getElementById('snack-ctx')).toBe(el);
      expect(opacityOf(el)).toBe(0);
      // ... then settles, unmounts, and reports completion exactly once.
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(document.getElementById('snack-ctx')).toBeNull();
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cleans the close-fade timeout on unmount (no setState after unmount)', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      const onClose = vi.fn();
      const root = makeRoot();
      const store = createSurfaceStore();
      act(() => {
        root.render(
          <SurfaceCtx.Provider value={store}>
            <Snackbar
              id='snack-unmount'
              autoHideDuration={4000}
              onClose={onClose}
              message='will be torn down mid-fade'
            />
          </SurfaceCtx.Provider>,
        );
      });
      settleEnter();
      // Start the close-fade (auto-hide fires) ...
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      // ... then unmount BEFORE the fade settles. The pending timeout must be
      // cleared so it never fires setState on the gone component.
      act(() => root.unmount());
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      // React logs an error if a timer setState lands after unmount.
      const lateStateWarnings = errSpy.mock.calls.filter((c) => String(c[0]).includes('unmounted'));
      expect(lateStateWarnings).toHaveLength(0);
    } finally {
      vi.useRealTimers();
      errSpy.mockRestore();
    }
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Mobile — safe-area positioning + no tap-flash                  */

describe('Snackbar — mobile', () => {
  it('offsets above the home indicator via safe-area-inset-bottom', () => {
    const root = makeRoot();
    const store = createSurfaceStore();
    act(() => {
      root.render(
        <React.StrictMode>
          <SurfaceCtx.Provider value={store}>
            <Snackbar
              id='snack-mobile'
              autoHideDuration={null}
              message='m'
            />
          </SurfaceCtx.Provider>
        </React.StrictMode>,
      );
    });
    const el = document.getElementById('snack-mobile')!;
    const cls = el.className.split(' ')[0];
    const rule =
      Array.from(sheet.getGlobalSheet()?.cssRules ?? [], (r) => r.cssText).find((t) =>
        t.startsWith(`.${cls}`),
      ) ?? '';
    expect(rule).toContain('env(safe-area-inset-bottom');
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Variant — outline (default) vs filled                          */

describe('Snackbar — variant', () => {
  const ruleFor = (el: Element) => {
    const cls = el.className.split(' ')[0];
    return (
      Array.from(sheet.getGlobalSheet()?.cssRules ?? [], (r) => r.cssText).find((t) =>
        t.startsWith(`.${cls}`),
      ) ?? ''
    );
  };

  const mount = (variant?: 'outline' | 'filled') => {
    const root = makeRoot();
    const store = createSurfaceStore();
    act(() => {
      root.render(
        <React.StrictMode>
          <SurfaceCtx.Provider value={store}>
            <Snackbar
              id={`snack-${variant ?? 'default'}`}
              autoHideDuration={null}
              variant={variant}
              message='m'
            />
          </SurfaceCtx.Provider>
        </React.StrictMode>,
      );
    });
    return document.getElementById(`snack-${variant ?? 'default'}`)!;
  };

  it('defaults to the outline style — a solid keyline, no elevation shadow', () => {
    const rule = ruleFor(mount());
    expect(rule).toMatch(/outline:\s*[^;]*solid/);
    expect(rule).not.toContain('box-shadow');
  });

  it('filled drops the outline for a solid surface + elevation shadow', () => {
    const rule = ruleFor(mount('filled'));
    expect(rule).toContain('outline: none');
    expect(rule).toContain('box-shadow');
  });
});

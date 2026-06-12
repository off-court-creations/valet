// ─────────────────────────────────────────────────────────────
// src/components/layout/Surface.dom.test.tsx | valet
// PERF S1 regression — the screen root stops re-rendering the app:
// shallow width/height selector, measure() bails when geometry is
// unchanged, no scroll listener, rAF-coalesced observer storms, and
// styled-child mounts batch into one surface-store notification.
//
// jsdom has no real layout (gBCR is all zeros) — geometry changes are
// driven by mocking getBoundingClientRect and firing a ResizeObserver
// stub. What jsdom cannot prove (manual phase-gate check): real RO
// initial delivery supplying first child metrics before paint.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act, useContext, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Surface from './Surface';
import { styled } from '../../css/createStyled';
import { SurfaceCtx, type SurfaceStore } from '../../system/surfaceStore';
import { useFonts } from '../../system/fontStore';
import { ValetLocaleProvider } from '../../system/locale';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Controllable ResizeObserver stub ------------------------------------ */
type ROCallback = (entries: Array<{ target: Element }>, observer: unknown) => void;

class ROStub {
  static instances: ROStub[] = [];
  static deliverInitial = false;
  cb: ROCallback;
  observed = new Set<Element>();
  constructor(cb: ROCallback) {
    this.cb = cb;
    ROStub.instances.push(this);
  }
  observe(el: Element) {
    this.observed.add(el);
    if (ROStub.deliverInitial) this.cb([{ target: el }], this);
  }
  unobserve(el: Element) {
    this.observed.delete(el);
  }
  disconnect() {
    this.observed.clear();
  }
  deliver(targets: Element[]) {
    this.cb(
      targets.map((target) => ({ target })),
      this,
    );
  }
}

const lastRO = () => ROStub.instances[ROStub.instances.length - 1];

/* Manual rAF queue — proves coalescing and makes flushes deterministic */
const rafQueue: FrameRequestCallback[] = [];
const flushRaf = () => {
  for (const cb of rafQueue.splice(0)) cb(0);
};

/** Macrotask hop — guarantees queued microtask store flushes have run. */
const drain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/* Render helpers -------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function renderStrict(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(<React.StrictMode>{node}</React.StrictMode>);
  });
  return { root, container };
}

/** Grabs the per-surface store out of context for direct driving. */
const storeRef: { current: SurfaceStore | null } = { current: null };
const Capture: React.FC = () => {
  storeRef.current = useContext(SurfaceCtx);
  return null;
};

beforeEach(() => {
  ROStub.instances.length = 0;
  ROStub.deliverInitial = false;
  rafQueue.length = 0;
  storeRef.current = null;
  vi.stubGlobal('ResizeObserver', ROStub as unknown as typeof ResizeObserver);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafQueue.push(cb);
    return rafQueue.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* Suite ----------------------------------------------------------------- */
describe('Surface (jsdom)', () => {
  it('shallow selector: store writes outside width/height do not re-render Surface', () => {
    let commits = 0;
    const { container } = renderStrict(
      <React.Profiler
        id='surface-perf'
        onRender={() => {
          commits += 1;
        }}
      >
        <Surface>
          <Capture />
        </Surface>
      </React.Profiler>,
    );
    const store = storeRef.current!;
    const base = commits;

    /* Regression: these used to re-render the whole app on every set(). */
    act(() => {
      store.setState({ hasScrollbar: true });
    });
    act(() => {
      store.setState({ children: new Map([['x', { width: 1, height: 1, top: 0, left: 0 }]]) });
    });
    expect(commits).toBe(base);

    /* …while width/height changes still re-render. (Exact commit count
       is shim behavior — uSES double-commits under StrictMode.) */
    act(() => {
      store.setState({ width: 800 });
    });
    expect(commits).toBeGreaterThan(base);
    const rootDiv = container.querySelector('[data-valet-surface-root]') as HTMLDivElement;
    expect(rootDiv.style.getPropertyValue('--valet-screen-width')).toBe('800px');
  });

  it('measure() bails when geometry is unchanged; observer storms coalesce to one rAF', () => {
    const { container } = renderStrict(
      <Surface>
        <Capture />
      </Surface>,
    );
    const store = storeRef.current!;
    const rootDiv = container.querySelector('[data-valet-surface-root]') as HTMLDivElement;
    const surfaceRO = lastRO();
    expect(surfaceRO.observed.has(rootDiv)).toBe(true);

    let notifications = 0;
    store.subscribe(() => {
      notifications += 1;
    });

    /* Storm with unchanged geometry → one scheduled frame, zero sets. */
    rafQueue.length = 0;
    act(() => {
      for (let i = 0; i < 5; i += 1) surfaceRO.deliver([rootDiv]);
    });
    expect(rafQueue.length).toBe(1);
    act(() => {
      flushRaf();
    });
    expect(notifications).toBe(0);

    /* A real geometry change still notifies (once) and updates state. */
    rootDiv.getBoundingClientRect = () => ({ width: 800, height: 600, top: 0, left: 0 }) as DOMRect;
    act(() => {
      surfaceRO.deliver([rootDiv]);
      flushRaf();
    });
    expect(notifications).toBe(1);
    expect(store.getState().width).toBe(800);
    expect(store.getState().height).toBe(600);
    expect(store.getState().breakpoint).toBe('sm');
    expect(rootDiv.style.getPropertyValue('--valet-screen-width')).toBe('800px');
    expect(rootDiv.style.getPropertyValue('--valet-screen-height')).toBe('600px');
  });

  it('attaches no scroll listener to the surface root', () => {
    const spy = vi.spyOn(EventTarget.prototype, 'addEventListener');
    const { container } = renderStrict(<Surface />);
    const rootDiv = container.querySelector('[data-valet-surface-root]') as HTMLDivElement;
    const scrollCalls = spy.mock.calls
      .map((args, i) => ({ type: args[0], ctx: spy.mock.contexts[i] }))
      .filter(({ type, ctx }) => type === 'scroll' && ctx === rootDiv);
    expect(scrollCalls).toHaveLength(0);
  });

  /* PERF S9 (ruling Q9(a)): size tracking is OPT-IN via the `$trackSize`
     transient prop. Only `$trackSize` elements register with the surface
     store and receive the `--valet-el-*` vars; plain styled children do
     not (the old universal registration was unconsumed observer churn). */
  it('$trackSize styled-child mounts → one children notification; Surface does not re-render', async () => {
    ROStub.deliverInitial = true;
    const Kid = styled('div')`
      color: rgb(200, 100, 50);
    `;
    let setKids: ((n: number) => void) | undefined;
    const Kids: React.FC = () => {
      const [n, setN] = useState(0);
      setKids = setN;
      return (
        <>
          {Array.from({ length: n }, (_, i) => (
            <Kid
              key={i}
              $trackSize
            />
          ))}
        </>
      );
    };
    let commits = 0;
    const { container } = renderStrict(
      <React.Profiler
        id='surface-kids'
        onRender={() => {
          commits += 1;
        }}
      >
        <Surface>
          <Capture />
          <Kids />
        </Surface>
      </React.Profiler>,
    );
    const store = storeRef.current!;
    let notifications = 0;
    store.subscribe(() => {
      notifications += 1;
    });

    await act(async () => {
      setKids!(5);
    });
    const commitsAfterMount = commits;
    await drain();
    expect(notifications).toBe(1); // five mounts, one batched commit
    expect(store.getState().children.size).toBe(5);
    expect(commits).toBe(commitsAfterMount); // children commit ≠ Surface render

    /* registerChild cb feeds per-element CSS vars (via RO) — opt-in only. */
    const kid = container.querySelector('div[class^="z-div-"]') as HTMLDivElement;
    expect(kid.style.getPropertyValue('--valet-el-width')).toBe('0px');

    /* …and n unmounts batch into one delete notification. */
    await act(async () => {
      setKids!(0);
    });
    await drain();
    expect(notifications).toBe(2);
    expect(store.getState().children.size).toBe(0);
  });

  it('default styled children do NOT register (no $trackSize) — zero store churn, no --valet-el-* vars', async () => {
    ROStub.deliverInitial = true;
    const Kid = styled('div')`
      color: rgb(10, 20, 30);
    `;
    const { container } = renderStrict(
      <Surface>
        <Capture />
        {Array.from({ length: 5 }, (_, i) => (
          <Kid key={i} />
        ))}
      </Surface>,
    );
    const store = storeRef.current!;
    let notifications = 0;
    store.subscribe(() => {
      notifications += 1;
    });
    await drain();

    /* No registration: no children in the store, no notifications. */
    expect(notifications).toBe(0);
    expect(store.getState().children.size).toBe(0);

    /* …and the dead-on-arrival `--valet-el-*` vars are absent by default. */
    const kid = container.querySelector('div[class^="z-div-"]') as HTMLDivElement;
    expect(kid.style.getPropertyValue('--valet-el-width')).toBe('');
    expect(kid.style.getPropertyValue('--valet-el-height')).toBe('');
  });
});

/* THEMING S5 — never-block grace ---------------------------------------- */
/* A `blockUntilFonts` Surface used to hide its content forever whenever no
   font load ever started (e.g. an app that never calls useInitialTheme):
   fontStore stays {loading:0, ready:false} and `ready` never flips. The
   500ms never-started grace reveals content anyway. Driven with fake timers;
   the manual rAF queue from the file-level beforeEach is independent of
   setTimeout, so the two coexist. */
const innerWrapper = (container: HTMLElement) =>
  container.querySelector('[data-valet-surface-root] > div:last-child') as HTMLDivElement;
const backdrop = (container: HTMLElement) =>
  container.querySelector('[data-valet-component="LoadingBackdrop"]');

describe('Surface blockUntilFonts grace (jsdom, fake timers)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useFonts.setState({ loading: 0, ready: false, started: false });
  });
  afterEach(() => {
    // Drain pending roots under fake timers, then restore real timers.
    for (const { root, container } of roots.splice(0)) {
      act(() => root.unmount());
      container.remove();
    }
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    useFonts.setState({ loading: 0, ready: false, started: false });
  });

  it('hides content while blocking and no load has started yet (within grace)', () => {
    const { container } = renderStrict(<Surface blockUntilFonts>hi</Surface>);
    expect(innerWrapper(container).style.visibility).toBe('hidden');
    expect(backdrop(container)).not.toBeNull();
  });

  it('reveals content after 500ms when a font load never starts (no wedge)', () => {
    const { container } = renderStrict(<Surface blockUntilFonts>hi</Surface>);
    expect(innerWrapper(container).style.visibility).toBe('hidden');

    /* Grace elapses with started:false — the wedge-forever case. */
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(innerWrapper(container).style.visibility).toBe('visible');
    /* No fonts ever loaded → nothing to fade for → backdrop dropped at once. */
    expect(backdrop(container)).toBeNull();
  });

  it('keeps blocking past the grace once a load has actually started', () => {
    const { container } = renderStrict(<Surface blockUntilFonts>hi</Surface>);

    /* A load begins before the grace expires → grace must NOT release it. */
    act(() => {
      useFonts.getState().start();
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(innerWrapper(container).style.visibility).toBe('hidden');
    expect(backdrop(container)).not.toBeNull();

    /* Only the real ready signal unblocks an in-flight load. */
    act(() => {
      useFonts.getState().finish();
    });
    expect(useFonts.getState().ready).toBe(true);
    expect(innerWrapper(container).style.visibility).toBe('visible');
  });

  it('never blocks when fonts are already ready at mount', () => {
    act(() => {
      useFonts.setState({ loading: 0, ready: true, started: true });
    });
    const { container } = renderStrict(<Surface blockUntilFonts>hi</Surface>);
    expect(innerWrapper(container).style.visibility).toBe('visible');
    expect(backdrop(container)).toBeNull();
  });

  it('never hides content when blockUntilFonts is off, regardless of grace', () => {
    const { container } = renderStrict(<Surface>hi</Surface>);
    expect(innerWrapper(container).style.visibility).toBe('visible');
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(innerWrapper(container).style.visibility).toBe('visible');
    expect(backdrop(container)).toBeNull();
  });
});

/* A11Y S12 — direction plumbing -----------------------------------------
   Surface stamps `dir` from the ValetLocaleProvider on its single root
   element, so logical CSS properties resolve RTL for the whole subtree.
   These run under the file-level beforeEach (RO/rAF stubs, real timers). */
const surfaceRoot = (container: HTMLElement) =>
  container.querySelector('[data-valet-surface-root]') as HTMLDivElement;

describe('Surface dir attribute (A11Y S12)', () => {
  it('defaults to dir="ltr" with no provider (frozen locale default)', () => {
    const { container } = renderStrict(<Surface>hi</Surface>);
    expect(surfaceRoot(container).getAttribute('dir')).toBe('ltr');
  });

  it('stamps dir="rtl" when the provider resolves an RTL locale', () => {
    const { container } = renderStrict(
      <ValetLocaleProvider locale='ar-EG'>
        <Surface>hi</Surface>
      </ValetLocaleProvider>,
    );
    expect(surfaceRoot(container).getAttribute('dir')).toBe('rtl');
  });

  it('stamps dir="ltr" for an LTR provider locale', () => {
    const { container } = renderStrict(
      <ValetLocaleProvider locale='de-DE'>
        <Surface>hi</Surface>
      </ValetLocaleProvider>,
    );
    expect(surfaceRoot(container).getAttribute('dir')).toBe('ltr');
  });

  it('honours an explicit provider dir override regardless of locale', () => {
    const { container } = renderStrict(
      <ValetLocaleProvider
        locale='en-US'
        dir='rtl'
      >
        <Surface>hi</Surface>
      </ValetLocaleProvider>,
    );
    expect(surfaceRoot(container).getAttribute('dir')).toBe('rtl');
  });

  it('lets a caller-supplied dir prop win over the provider value', () => {
    /* `dir` sits before {...props}, so an explicit dom prop overrides it. */
    const { container } = renderStrict(
      <ValetLocaleProvider locale='ar-EG'>
        <Surface dir='ltr'>hi</Surface>
      </ValetLocaleProvider>,
    );
    expect(surfaceRoot(container).getAttribute('dir')).toBe('ltr');
  });
});

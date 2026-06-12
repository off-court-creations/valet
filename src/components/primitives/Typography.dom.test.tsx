// ─────────────────────────────────────────────────────────────
// src/components/primitives/Typography.dom.test.tsx | valet
// caller style / sx merge — caller style survives, sx wins on
// conflicts, no style attribute when neither given (API-TYPES S2);
// per-tag module-scope styled cache — one styled() per tag across all
// instances, stable host identity, no subtree remount (PERF S7)
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import * as createStyledModule from '../../css/createStyled';
import { Typography } from './Typography';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; createSurfaceStore constructs one ----- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver ??=
  ResizeObserverStub as unknown as typeof ResizeObserver;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render under StrictMode inside a Surface context; tracked for cleanup. */
function renderWithSurface(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
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

const typoEl = (container: HTMLElement) =>
  container.querySelector('[data-valet-component="Typography"]') as HTMLElement;

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* Suite ----------------------------------------------------------------- */
describe('Typography style/sx merge (jsdom)', () => {
  it('forwards a caller style prop when no sx is given (was clobbered before)', () => {
    const { container } = renderWithSurface(
      <Typography style={{ marginTop: '7px' }}>hi</Typography>,
    );
    expect(typoEl(container).style.marginTop).toBe('7px');
  });

  it('keeps caller style alongside sx when keys do not conflict', () => {
    const { container } = renderWithSurface(
      <Typography
        style={{ marginTop: '7px' }}
        sx={{ paddingBottom: '3px' }}
      >
        hi
      </Typography>,
    );
    const el = typoEl(container);
    expect(el.style.marginTop).toBe('7px');
    expect(el.style.paddingBottom).toBe('3px');
  });

  it('sx wins over caller style on conflicting keys', () => {
    const { container } = renderWithSurface(
      <Typography
        style={{ color: 'rgb(1, 2, 3)', marginTop: '7px' }}
        sx={{ color: 'rgb(4, 5, 6)' }}
      >
        hi
      </Typography>,
    );
    const el = typoEl(container);
    expect(el.style.color).toBe('rgb(4, 5, 6)');
    /* non-conflicting caller keys still survive */
    expect(el.style.marginTop).toBe('7px');
  });

  it('renders no style attribute when neither style nor sx is given', () => {
    const { container } = renderWithSurface(<Typography>hi</Typography>);
    expect(typoEl(container).getAttribute('style')).toBeNull();
  });
});

/* ─────────────── PERF S7 — per-tag module-scope styled cache ───────────
   The styled host is now cached by tag at module scope. The old code ran
   `useMemo(() => styled(Tag), [Tag])` in the component body, so every
   Typography *instance* minted its own styled component — N mounts of the
   same tag meant N `styled()` calls, N forwardRef closures, N dev
   cardinality Sets. The cache collapses that to ONE styled component per
   tag, shared by every instance: stable identity, single allocation.

   The load-bearing, discriminating assertion is the `styled()` call count
   (spy): with the cache it is called at most once per tag no matter how
   many instances mount; the per-instance memo called it once per mount.
   The remaining cases pin the stable-host-identity contract the cache
   exists to provide. */
describe('Typography per-tag styled cache (PERF S7, jsdom)', () => {
  /* THE discriminator: spy on `styled` and mount three Typography of the
     same tag. The cache resolves the host once and reuses it; a
     per-instance `useMemo(() => styled(Tag))` would call `styled('h5')`
     three times. `h5` is used by no other test in this file, so its cache
     entry is cold when the spy is installed. */
  it('calls styled() at most once per tag across many same-tag instances', () => {
    const spy = vi.spyOn(createStyledModule, 'styled');

    const make = () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      roots.push({ root, container });
      const store = createSurfaceStore();
      act(() => {
        root.render(
          <SurfaceCtx.Provider value={store}>
            <Typography variant='h5'>cold-tag</Typography>
          </SurfaceCtx.Provider>,
        );
      });
    };
    make();
    make();
    make();

    const h5Calls = spy.mock.calls.filter((c) => c[0] === 'h5').length;
    expect(h5Calls).toBeLessThanOrEqual(1);
    spy.mockRestore();
  });

  /* Re-rendering an instance (new Typography element each parent render)
     keeps the same host DOM node — the cached styled type is referentially
     stable, so React reconciles in place rather than tearing down. */
  it('reuses the host DOM node across re-renders', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push({ root, container });
    const store = createSurfaceStore();

    let swap!: () => void;
    function Harness() {
      const [n, setN] = React.useState(0);
      swap = () => setN((v) => v + 1);
      return <Typography variant='body'>pass {n}</Typography>;
    }

    act(() => {
      root.render(
        <SurfaceCtx.Provider value={store}>
          <Harness />
        </SurfaceCtx.Provider>,
      );
    });
    const before = typoEl(container);
    expect(before).toBeTruthy();

    act(() => swap());
    const after = typoEl(container);
    expect(after).toBe(before); // host reconciled, not remounted
    expect(after.textContent).toContain('pass 1');
  });

  /* A child effect inside Typography must mount exactly once across parent
     re-renders — a host remount would re-run it. */
  it('does not remount the child subtree when the parent re-renders', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push({ root, container });
    const store = createSurfaceStore();

    let mounts = 0;
    function Probe() {
      React.useEffect(() => {
        mounts += 1;
      }, []);
      return <span data-probe>x</span>;
    }

    let bump!: () => void;
    function Harness() {
      const [n, setN] = React.useState(0);
      bump = () => setN((v) => v + 1);
      return (
        <Typography
          variant='h2'
          data-tick={n}
        >
          <Probe />
        </Typography>
      );
    }

    act(() => {
      root.render(
        <SurfaceCtx.Provider value={store}>
          <Harness />
        </SurfaceCtx.Provider>,
      );
    });
    expect(mounts).toBe(1);

    act(() => bump());
    act(() => bump());
    expect(mounts).toBe(1);
  });

  /* `subtitle` and `button` both map to <span>; switching between them
     keeps the same host node since the cache is keyed by tag. */
  it('keeps the host node when switching between variants that share a tag', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push({ root, container });
    const store = createSurfaceStore();

    let toggle!: () => void;
    function Harness() {
      const [alt, setAlt] = React.useState(false);
      toggle = () => setAlt((v) => !v);
      return <Typography variant={alt ? 'button' : 'subtitle'}>shared-tag</Typography>;
    }

    act(() => {
      root.render(
        <SurfaceCtx.Provider value={store}>
          <Harness />
        </SurfaceCtx.Provider>,
      );
    });
    const first = typoEl(container);
    expect(first.tagName).toBe('SPAN');

    act(() => toggle());
    const second = typoEl(container);
    expect(second.tagName).toBe('SPAN');
    expect(second).toBe(first);
  });
});

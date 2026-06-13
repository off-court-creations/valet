// ─────────────────────────────────────────────────────────────
// src/hooks/useGoogleFonts.dom.test.tsx | valet
// THEMING S4 (ruling R20) — useGoogleFonts hygiene regression suite:
//  • start() runs from a passive effect, NOT useInsertionEffect
//    (store writes there schedule renders from the wrong phase);
//  • start/finish always balance — an unmount that races the async
//    waitForFonts must not leave the fontStore loading forever (the
//    leak this slice fixes), and ready returns to true;
//  • effects key on stable string deps: a fresh-but-equal `extras`
//    array or `options` object never re-runs the inject/wait pipeline.
// House style: createRoot + act, no @testing-library. fontLoader is
// mocked so the suite never touches real network/FontFace APIs.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/* Controllable fontLoader — the real module hits the network / FontFaceSet.
   injectFontLinks returns a cleanup spy; waitForFonts is resolvable on demand.
   Defined via vi.hoisted so the (hoisted) vi.mock factory can reference them. */
const { cleanupSpy, injectSpy, waitSpy, waitState } = vi.hoisted(() => {
  const cleanup = vi.fn();
  const state: { resolvers: Array<() => void> } = { resolvers: [] };
  return {
    cleanupSpy: cleanup,
    injectSpy: vi.fn(() => cleanup),
    waitSpy: vi.fn(
      () =>
        new Promise<void>((resolve) => {
          state.resolvers.push(resolve);
        }),
    ),
    waitState: state,
  };
});

vi.mock('../helpers/fontLoader', () => ({
  injectFontLinks: injectSpy,
  waitForFonts: waitSpy,
}));

import { useGoogleFonts } from './useGoogleFonts';
import { useFonts } from '../system/fontStore';
import type { Font, GoogleFontOptions } from '../helpers/fontLoader';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Mount WITHOUT StrictMode by default so effect/cleanup counts are 1:1
 *  and easy to assert; pass strict=true to exercise the double-invoke. */
function mount(node: React.ReactElement, strict = false) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  const wrap = (n: React.ReactElement) => (strict ? <React.StrictMode>{n}</React.StrictMode> : n);
  const render = (next: React.ReactElement) => act(() => root.render(wrap(next)));
  const unmount = () => act(() => root.unmount());
  render(node);
  return { container, render, unmount };
}

/** Resolve all pending waitForFonts promises and flush microtasks. */
async function flushWaits() {
  await act(async () => {
    const pending = waitState.resolvers.splice(0);
    pending.forEach((r) => r());
    await Promise.resolve();
    await Promise.resolve();
  });
}

function Probe(props: { extras?: Font[]; options?: GoogleFontOptions }) {
  useGoogleFonts(props.extras, props.options);
  return null;
}

beforeEach(() => {
  injectSpy.mockClear();
  cleanupSpy.mockClear();
  waitSpy.mockClear();
  waitState.resolvers = [];
  useFonts.setState({ loading: 0, ready: false });
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.useRealTimers();
});

describe('useGoogleFonts — start() out of useInsertionEffect (R20)', () => {
  it('start() is NOT called from useInsertionEffect — the source uses it only inside a passive effect', () => {
    // Source-level guard: the only thing inside the useInsertionEffect
    // callback is the DOM <link> injection. Store writes (start) belong in
    // a passive effect. Extract just the insertion effect's call body.
    // vitest runs from the repo root; resolve the source off cwd (jsdom's
    // import.meta.url is a virtual, non-file URL).
    const srcPath = resolve(process.cwd(), 'src/hooks/useGoogleFonts.ts');
    const src = readFileSync(srcPath, 'utf8');
    const open = src.indexOf('useInsertionEffect(');
    // The insertion effect callback ends at its `}, [...]);` closer.
    const close = src.indexOf('}, [', open);
    const insertion = src.slice(open, close);
    expect(insertion).toContain('injectFontLinks');
    expect(insertion).not.toContain('start()');
  });

  it('mount increments loading via a passive effect; resolving fonts restores ready', async () => {
    mount(<Probe />);
    // start() has run from the passive effect.
    expect(useFonts.getState().loading).toBe(1);
    expect(useFonts.getState().ready).toBe(false);
    expect(injectSpy).toHaveBeenCalledTimes(1);
    expect(waitSpy).toHaveBeenCalledTimes(1);

    await flushWaits();
    expect(useFonts.getState().loading).toBe(0);
    expect(useFonts.getState().ready).toBe(true);
  });
});

describe('useGoogleFonts — guaranteed start/finish balance (the unmount leak)', () => {
  it('unmount BETWEEN start and finish decrements loading exactly once — never wedges', () => {
    const { unmount } = mount(<Probe />);
    expect(useFonts.getState().loading).toBe(1);
    expect(useFonts.getState().ready).toBe(false);
    expect(waitState.resolvers).toHaveLength(1); // waitForFonts still in flight

    // Unmount before the wait resolves — the pre-fix leak left loading=1 forever.
    unmount();
    expect(useFonts.getState().loading).toBe(0);
    expect(useFonts.getState().ready).toBe(true);
  });

  it('a late waitForFonts resolution after unmount does not double-decrement', async () => {
    const { unmount } = mount(<Probe />);
    expect(useFonts.getState().loading).toBe(1);

    unmount();
    expect(useFonts.getState().loading).toBe(0);

    // The async wrapper still settles after teardown — must be a no-op.
    await flushWaits();
    expect(useFonts.getState().loading).toBe(0);
    expect(useFonts.getState().ready).toBe(true);

    // Cleanup ran exactly one DOM teardown for the one injection.
    expect(cleanupSpy).toHaveBeenCalledTimes(1);
  });

  it('StrictMode double-invoke stays balanced: mounted loading=1, unmount→0', async () => {
    const { unmount } = mount(<Probe />, true);
    // StrictMode runs effect→cleanup→effect; net one outstanding load.
    expect(useFonts.getState().loading).toBe(1);

    await flushWaits();
    expect(useFonts.getState().loading).toBe(0);
    expect(useFonts.getState().ready).toBe(true);

    unmount();
    expect(useFonts.getState().loading).toBe(0);
  });
});

describe('useGoogleFonts — stable string deps (no re-run on array/object identity)', () => {
  it('a fresh-but-equal `extras` array does not re-run inject/wait', async () => {
    const { render } = mount(<Probe extras={['Poppins']} />);
    await flushWaits();
    expect(injectSpy).toHaveBeenCalledTimes(1);
    expect(waitSpy).toHaveBeenCalledTimes(1);

    // New array literal, same content — identity changed, key unchanged.
    render(<Probe extras={['Poppins']} />);
    await flushWaits();
    expect(injectSpy).toHaveBeenCalledTimes(1); // no re-injection
    expect(waitSpy).toHaveBeenCalledTimes(1); // no re-wait
    expect(cleanupSpy).not.toHaveBeenCalled(); // links never torn down
    expect(useFonts.getState().loading).toBe(0);
  });

  it('a fresh-but-equal `options` object does not re-run inject/wait', async () => {
    const { render } = mount(<Probe options={{ display: 'swap' }} />);
    await flushWaits();
    expect(injectSpy).toHaveBeenCalledTimes(1);

    render(<Probe options={{ display: 'swap' }} />); // new object, equal shape
    await flushWaits();
    expect(injectSpy).toHaveBeenCalledTimes(1);
    expect(waitSpy).toHaveBeenCalledTimes(1);
  });

  it('an actual content change DOES re-run inject/wait (tears down the old links)', async () => {
    const { render } = mount(<Probe extras={['Poppins']} />);
    await flushWaits();
    expect(injectSpy).toHaveBeenCalledTimes(1);

    render(<Probe extras={['Inter']} />); // different font — work changed
    await flushWaits();
    expect(injectSpy).toHaveBeenCalledTimes(2);
    expect(waitSpy).toHaveBeenCalledTimes(2);
    expect(cleanupSpy).toHaveBeenCalledTimes(1); // previous links cleaned up
    expect(useFonts.getState().loading).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// src/components/primitives/WebGLCanvas.dom.test.tsx | valet
// clearColor lives outside the main effect's deps — re-renders with
// fresh array identities must not tear down the GL program
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import WebGLCanvas, { type WebGLProgramLike } from './WebGLCanvas';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom lacks ResizeObserver -------------------------------------------- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/* Inert rAF: the render loop schedules but never runs ------------------- */
let rafSeq = 0;

/* Minimal fake WebGL2 context ------------------------------------------- */
const loseContextExt = { loseContext: vi.fn() };
const fakeGl = {
  clearColor: vi.fn(),
  viewport: vi.fn(),
  getExtension: vi.fn((name: string) => (name === 'WEBGL_lose_context' ? loseContextExt : null)),
  isContextLost: vi.fn(() => false),
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

const makeProgram = (): WebGLProgramLike => ({
  resize: vi.fn(),
  update: vi.fn(),
  render: vi.fn(),
  dispose: vi.fn(),
});

beforeEach(() => {
  rafSeq = 0;
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  vi.stubGlobal('requestAnimationFrame', () => ++rafSeq);
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeGl as never);
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  fakeGl.clearColor.mockClear();
  fakeGl.viewport.mockClear();
  fakeGl.getExtension.mockClear();
  fakeGl.isContextLost.mockClear();
  loseContextExt.loseContext.mockClear();
});

/* Suite ----------------------------------------------------------------- */
describe('WebGLCanvas (jsdom)', () => {
  it('parent re-renders with the default clearColor do not rebuild the GL program', () => {
    const program = makeProgram();
    const create = vi.fn(() => program);
    const root = makeRoot();
    const render = (tick: number) =>
      act(() => {
        root.render(
          <React.StrictMode>
            <WebGLCanvas
              create={create}
              className={`tick-${tick}`}
            />
          </React.StrictMode>,
        );
      });

    render(1);
    expect(create).toHaveBeenCalled();
    const createsAfterMount = create.mock.calls.length;
    const disposesAfterMount = (program.dispose as ReturnType<typeof vi.fn>).mock.calls.length;
    /* default clearColor was applied to the context */
    expect(fakeGl.clearColor).toHaveBeenCalledWith(0, 0, 0, 0);

    /* Two more renders — pre-fix, the fresh `[0,0,0,0]` default in the
       effect deps disposed and re-created the program every time. */
    render(2);
    render(3);
    expect(create.mock.calls.length).toBe(createsAfterMount);
    expect((program.dispose as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
      disposesAfterMount,
    );
  });

  it('clearColor value changes apply in place without rebuilding the program', () => {
    const program = makeProgram();
    const create = vi.fn(() => program);
    const root = makeRoot();
    const render = (color: readonly [number, number, number, number]) =>
      act(() => {
        root.render(
          <React.StrictMode>
            <WebGLCanvas
              create={create}
              clearColor={color}
            />
          </React.StrictMode>,
        );
      });

    render([0.1, 0.2, 0.3, 1]);
    expect(fakeGl.clearColor).toHaveBeenCalledWith(0.1, 0.2, 0.3, 1);
    const createsAfterMount = create.mock.calls.length;
    fakeGl.clearColor.mockClear();

    /* New colour, new (fresh) array identity — applied live, no rebuild. */
    render([0.4, 0.5, 0.6, 1]);
    expect(fakeGl.clearColor).toHaveBeenCalledWith(0.4, 0.5, 0.6, 1);
    expect(create.mock.calls.length).toBe(createsAfterMount);
  });

  it('inline create / contextAttributes (fresh identity each render) do NOT rebuild the program', () => {
    // THE headline trap: a brand-new function + object identity every render must
    // not tear down + rebuild the GL pipeline (ref-latched, deps are [dprMax]).
    const program = makeProgram();
    let createCalls = 0;
    const root = makeRoot();
    const render = (tick: number) =>
      act(() => {
        root.render(
          <WebGLCanvas
            create={() => {
              createCalls++;
              return program;
            }}
            contextAttributes={{ alpha: true }}
            className={`tick-${tick}`}
          />,
        );
      });

    render(1);
    expect(createCalls).toBe(1);
    render(2);
    render(3);
    expect(createCalls).toBe(1); // built once, never rebuilt
    expect((program.dispose as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });

  it('unmount disposes the program (and does NOT loseContext — the canvas/context may be reused)', () => {
    const program = makeProgram();
    const root = makeRoot();
    const entry = roots[roots.length - 1];
    act(() => root.render(<WebGLCanvas create={() => program} />));
    act(() => root.unmount());
    roots.pop(); // already unmounted — keep afterEach from double-unmounting
    entry.container.remove();

    expect((program.dispose as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
    // Must NOT force-lose the context: getContext returns the same context on a
    // StrictMode/remount of the reused <canvas>, and losing it breaks the remount.
    expect(loseContextExt.loseContext).not.toHaveBeenCalled();
  });

  it('unsupported WebGL2 (getContext → null) fires onError and renders the fallback', () => {
    (HTMLCanvasElement.prototype.getContext as ReturnType<typeof vi.fn>).mockImplementation(
      () => null,
    );
    const onError = vi.fn();
    const root = makeRoot();
    const container = roots[roots.length - 1].container;
    act(() => {
      root.render(
        <WebGLCanvas
          create={() => makeProgram()}
          onError={onError}
          fallback={<div data-fb='1'>no webgl</div>}
        />,
      );
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-fb]')).not.toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('create() → null fires onError (and does not set a live glRef)', () => {
    const onError = vi.fn();
    const root = makeRoot();
    act(() =>
      root.render(
        <WebGLCanvas
          create={() => null}
          onError={onError}
        />,
      ),
    );
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

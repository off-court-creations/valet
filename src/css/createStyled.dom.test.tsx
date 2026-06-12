// ─────────────────────────────────────────────────────────────
// src/css/createStyled.dom.test.tsx | valet
// styled() under React.StrictMode in jsdom — one injected rule per
// unique class, stable class names, pending-rule path bypassed,
// render purity (ENGINE S6): no insertRule during the render phase,
// rules flushed by useInsertionEffect before layout effects run,
// memoization (ENGINE S8): repeat raw css skips normalize+hash via
// the global LRU; unchanged same-instance re-renders skip even that
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { keyframes, styled } from './createStyled';
import { LRU } from './lru';
import { normalizeCSS } from './normalize';
import * as sheet from './sheet';
import { SurfaceCtx, type SurfaceStore, type SurfaceState } from '../system/surfaceStore';

/* Spy-mode module mock (real implementation, observable call counts) —
   lets the S8 suite assert which renders actually paid for normalize. */
vi.mock(import('./normalize'), { spy: true });

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render under StrictMode into a fresh container; tracked for cleanup. */
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

/** Spy on the live sheet's prototype — must be installed before render. */
const spyInsertRule = () => vi.spyOn(CSSStyleSheet.prototype, 'insertRule');

/** Count insertRule calls whose rule text targets `.cls{…}`. */
const rulesFor = (spy: ReturnType<typeof spyInsertRule>, cls: string) =>
  spy.mock.calls.filter(([text]) => String(text).startsWith(`.${cls}{`)).length;

afterEach(() => {
  vi.restoreAllMocks();
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* Suite ----------------------------------------------------------------- */
describe('createStyled (jsdom)', () => {
  it('StrictMode double-render injects exactly one rule per unique class', () => {
    const spy = spyInsertRule();
    const A = styled('div')`
      color: rgb(1, 2, 3);
    `;
    const B = styled('div')`
      color: rgb(4, 5, 6);
    `;
    /* Two <A/> siblings + StrictMode = four render passes for A's CSS. */
    const { container } = renderStrict(
      <>
        <A data-testid='a1' />
        <A data-testid='a2' />
        <B data-testid='b' />
      </>,
    );
    const divs = container.querySelectorAll('div');
    expect(divs).toHaveLength(3);
    const clsA = divs[0].className;
    const clsB = divs[2].className;
    expect(divs[1].className).toBe(clsA);
    expect(clsB).not.toBe(clsA);
    expect(rulesFor(spy, clsA)).toBe(1);
    expect(rulesFor(spy, clsB)).toBe(1);
  });

  it('re-render, unmount and remount never re-inject a cached rule', () => {
    const spy = spyInsertRule();
    const C = styled('div')`
      color: rgb(7, 8, 9);
    `;
    const first = renderStrict(<C />);
    const cls = first.container.querySelector('div')!.className;
    /* Update pass on the same root … */
    act(() => {
      first.root.render(
        <React.StrictMode>
          <C />
        </React.StrictMode>,
      );
    });
    /* … then a full unmount + fresh root. */
    act(() => first.root.unmount());
    const second = renderStrict(<C />);
    expect(second.container.querySelector('div')!.className).toBe(cls);
    expect(rulesFor(spy, cls)).toBe(1);
  });

  it('class names are stable across independent roots and hash-shaped', () => {
    spyInsertRule();
    const D = styled('div')`
      color: rgb(10, 11, 12);
    `;
    const one = renderStrict(<D />);
    const two = renderStrict(<D />);
    const cls = one.container.querySelector('div')!.className;
    expect(two.container.querySelector('div')!.className).toBe(cls);
    /* z-<tag>-<base36 hash>-<base36 length> (hash.ts contract) */
    expect(cls).toMatch(/^z-div-[0-9a-z]+-[0-9a-z]+$/);
  });

  it("drops `${cond && 'color:red'}` vetoes — no 'false' in generated CSS", () => {
    const spy = spyInsertRule();
    const cond = false as boolean;
    const F = styled('div')<{ $active?: boolean }>`
      ${cond && 'color: red;'}
      display: flex;
      ${(p) => p.$active && 'color: red;'}
    `;
    const { container } = renderStrict(<F />);
    const cls = container.querySelector('div')!.className;
    const calls = spy.mock.calls.filter(([text]) => String(text).startsWith(`.${cls}{`));
    expect(calls).toHaveLength(1);
    const ruleText = String(calls[0][0]);
    expect(ruleText).not.toContain('false');
    expect(ruleText).toContain('display: flex;');
  });

  it("keyframes drops veto interpolations — no 'false' in the @keyframes body", () => {
    const spy = spyInsertRule();
    const cond = false as boolean;
    const name = keyframes`
      from { opacity: ${0}; }
      ${cond && '50% { opacity: 0.5; }'}
      to { opacity: ${1}; }
    `;
    expect(name).toMatch(/^z-kf-/);
    const calls = spy.mock.calls.filter(([text]) => String(text).startsWith(`@keyframes ${name}{`));
    expect(calls).toHaveLength(1);
    const ruleText = String(calls[0][0]);
    expect(ruleText).not.toContain('false');
    /* normalizeCSS collapses `; }` → `}` — 0 still renders. */
    expect(ruleText).toContain('from { opacity: 0}');
  });

  it('never calls insertRule during the render phase; rules are flushed before layout effects read them', () => {
    const spy = spyInsertRule();
    const G = styled('div')`
      color: rgb(16, 17, 18);
    `;
    /* insertRule call counts captured INSIDE a component body, i.e. during
       the render phase (StrictMode double-render → several samples). The
       probe renders AFTER <G/> in tree order, so with render-phase
       injection (the old behavior) it would observe a non-zero count. */
    const renderPhaseCounts: number[] = [];
    /* Sheet state observed from a layout effect — insertion effects run
       first, so the rule must already be live here. */
    let ruleAtLayoutEffect: string | undefined;
    let computedColorAtLayoutEffect = '';
    const targetRef = React.createRef<HTMLDivElement>();
    function RenderPhaseProbe() {
      renderPhaseCounts.push(spy.mock.calls.length);
      React.useLayoutEffect(() => {
        const el = targetRef.current!;
        const cls = el.className.split(/\s+/)[0];
        ruleAtLayoutEffect = Array.from(
          sheet.getGlobalSheet()?.cssRules ?? [],
          (r) => r.cssText,
        ).find((t) => t.startsWith(`.${cls}`));
        computedColorAtLayoutEffect = getComputedStyle(el).color;
      });
      return null;
    }
    renderStrict(
      <>
        <G ref={targetRef} />
        <RenderPhaseProbe />
      </>,
    );
    /* Render phase stayed pure: zero insertRule calls in every pass. */
    expect(renderPhaseCounts.length).toBeGreaterThan(0);
    expect(renderPhaseCounts).toEqual(renderPhaseCounts.map(() => 0));
    /* …but the rule WAS flushed (useInsertionEffect) before layout
       effects ran, so computed styles were already readable. */
    expect(ruleAtLayoutEffect).toBeDefined();
    expect(ruleAtLayoutEffect).toContain('rgb(16, 17, 18)');
    expect(computedColorAtLayoutEffect).toBe('rgb(16, 17, 18)');
    /* And the class itself was still computed synchronously in render. */
    const cls = targetRef.current!.className.split(/\s+/)[0];
    expect(cls).toMatch(/^z-div-[0-9a-z]+-[0-9a-z]+$/);
    expect(rulesFor(spy, cls)).toBe(1);
  });

  it('prop-driven class changes queue and flush one rule per new class (multi-rule case)', () => {
    const spy = spyInsertRule();
    const H = styled('div')<{ $c?: string }>`
      color: ${(p) => p.$c ?? 'rgb(21, 22, 23)'};
    `;
    const first = renderStrict(<H />);
    const cls1 = first.container.querySelector('div')!.className;
    /* Update pass with a different interpolated value → new class. */
    act(() => {
      first.root.render(
        <React.StrictMode>
          <H $c='rgb(24, 25, 26)' />
        </React.StrictMode>,
      );
    });
    const cls2 = first.container.querySelector('div')!.className;
    expect(cls2).not.toBe(cls1);
    /* Exactly one insertion per class, both rules live in the sheet. */
    expect(rulesFor(spy, cls1)).toBe(1);
    expect(rulesFor(spy, cls2)).toBe(1);
    const ruleTexts = Array.from(sheet.getGlobalSheet()!.cssRules, (r) => r.cssText);
    expect(ruleTexts.some((t) => t.startsWith(`.${cls1}`))).toBe(true);
    expect(ruleTexts.some((t) => t.startsWith(`.${cls2}`))).toBe(true);
  });

  it('keyframes() at module/test scope still injects eagerly (not render-gated)', () => {
    const spy = spyInsertRule();
    /* Called OUTSIDE any component render — must hit the sheet now. */
    const name = keyframes`
      from { transform: scale(0.9); }
      to { transform: scale(1); }
    `;
    const calls = spy.mock.calls.filter(([text]) => String(text).startsWith(`@keyframes ${name}{`));
    expect(calls).toHaveLength(1);
  });

  /* ─── ENGINE S8: memoization layers ─────────────────────────────── */

  it('S8 layer 1: a repeat raw css string skips normalize (global LRU hit), same class, no re-injection', () => {
    const insertSpy = spyInsertRule();
    const normSpy = vi.mocked(normalizeCSS);
    const M = styled('div')<{ $c?: string }>`
      color: ${(p) => p.$c ?? 'rgb(31, 32, 33)'};
    `;
    normSpy.mockClear();
    /* Fresh raw string → exactly ONE normalize despite the StrictMode
       double render (second pass hits the per-instance ref). */
    const first = renderStrict(<M />);
    const cls = first.container.querySelector('div')!.className;
    expect(normSpy).toHaveBeenCalledTimes(1);
    /* New root → new component instance (cold ref) but warm global LRU:
       zero normalize calls, identical class, still a single rule. */
    normSpy.mockClear();
    const second = renderStrict(<M />);
    expect(normSpy).not.toHaveBeenCalled();
    expect(second.container.querySelector('div')!.className).toBe(cls);
    expect(rulesFor(insertSpy, cls)).toBe(1);
  });

  it('S8 layer 2: a same-instance re-render with unchanged raw css skips even the LRU', () => {
    const normSpy = vi.mocked(normalizeCSS);
    const P = styled('div')<{ $c?: string }>`
      color: ${(p) => p.$c ?? 'rgb(41, 42, 43)'};
    `;
    const first = renderStrict(<P $c='rgb(44, 45, 46)' />);
    const cls = first.container.querySelector('div')!.className;
    /* Spy installed AFTER mount so only the re-render is observed. */
    const lruGetSpy = vi.spyOn(LRU.prototype, 'get');
    normSpy.mockClear();
    act(() => {
      first.root.render(
        <React.StrictMode>
          <P $c='rgb(44, 45, 46)' />
        </React.StrictMode>,
      );
    });
    expect(normSpy).not.toHaveBeenCalled();
    expect(lruGetSpy).not.toHaveBeenCalled();
    expect(first.container.querySelector('div')!.className).toBe(cls);
  });

  it('S8: prop flip and revert returns the original class with exactly one rule per class', () => {
    const insertSpy = spyInsertRule();
    const Q = styled('div')<{ $c: string }>`
      color: ${(p) => p.$c};
    `;
    const r = renderStrict(<Q $c='rgb(51, 52, 53)' />);
    const cls1 = r.container.querySelector('div')!.className;
    act(() => {
      r.root.render(
        <React.StrictMode>
          <Q $c='rgb(54, 55, 56)' />
        </React.StrictMode>,
      );
    });
    const cls2 = r.container.querySelector('div')!.className;
    expect(cls2).not.toBe(cls1);
    act(() => {
      r.root.render(
        <React.StrictMode>
          <Q $c='rgb(51, 52, 53)' />
        </React.StrictMode>,
      );
    });
    /* Revert maps back to the SAME cached class — and neither class was
       ever inserted twice (injected bookkeeping is never evicted). */
    expect(r.container.querySelector('div')!.className).toBe(cls1);
    expect(rulesFor(insertSpy, cls1)).toBe(1);
    expect(rulesFor(insertSpy, cls2)).toBe(1);
  });

  it('S8: different raw strings that normalize identically still share one class (styleCache dedupe preserved under the raw memo)', () => {
    const insertSpy = spyInsertRule();
    /* Same css after whitespace collapse, different raw bytes (the
       whitespace lives in string interpolations so prettier keeps it). */
    const A = styled('div')`
      ${'color: rgb(61, 62, 63);'}
    `;
    const B = styled('div')`
      ${'color:    rgb(61, 62, 63);'}
    `;
    const { container } = renderStrict(
      <>
        <A />
        <B />
      </>,
    );
    const divs = container.querySelectorAll('div');
    const clsA = divs[0].className;
    expect(divs[1].className).toBe(clsA);
    expect(rulesFor(insertSpy, clsA)).toBe(1);
  });

  /* ─── ENGINE S9: rule-cardinality tripwire ──────────────────────── */

  it('S9: warns once, naming the component, past 256 distinct rules for one styled component', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cardinalityWarnings = () =>
      warnSpy.mock.calls.filter(([msg]) => String(msg).includes('distinct CSS rules'));
    /* Deliberately-abusive fixture: a measured/continuous value baked
       straight into rule text — the exact leak the policy forbids. */
    const Abusive = styled('div')<{ $w: number }>`
      width: ${(p) => p.$w}px;
      content: 'cardinality-abusive';
    `;
    const { root } = renderStrict(<Abusive $w={0} />);
    /* …255 more distinct values → exactly AT the 256 limit: silent. */
    for (let i = 1; i <= 255; i++) {
      act(() => {
        root.render(
          <React.StrictMode>
            <Abusive $w={i} />
          </React.StrictMode>,
        );
      });
    }
    expect(cardinalityWarnings()).toHaveLength(0);
    /* The 257th distinct rule crosses the tripwire → one dev warning. */
    act(() => {
      root.render(
        <React.StrictMode>
          <Abusive $w={256} />
        </React.StrictMode>,
      );
    });
    expect(cardinalityWarnings()).toHaveLength(1);
    const msg = String(cardinalityWarnings()[0][0]);
    expect(msg).toContain('styled(div)');
    expect(msg).toContain('cardinality-abusive'); // template preview identifies the offender
    expect(msg).toContain('CSS custom property'); // and the prescribed fix
    /* warnOnce: 25 further distinct values never re-warn. */
    for (let i = 257; i <= 281; i++) {
      act(() => {
        root.render(
          <React.StrictMode>
            <Abusive $w={i} />
          </React.StrictMode>,
        );
      });
    }
    expect(cardinalityWarnings()).toHaveLength(1);
  });

  it('S9: discrete variants (repeat values) never trip the cardinality warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Discrete = styled('div')<{ $on: boolean }>`
      color: ${(p) => (p.$on ? 'rgb(71, 72, 73)' : 'rgb(74, 75, 76)')};
    `;
    const { root } = renderStrict(<Discrete $on={false} />);
    for (let i = 0; i < 40; i++) {
      act(() => {
        root.render(
          <React.StrictMode>
            <Discrete $on={i % 2 === 0} />
          </React.StrictMode>,
        );
      });
    }
    expect(
      warnSpy.mock.calls.filter(([msg]) => String(msg).includes('distinct CSS rules')),
    ).toHaveLength(0);
  });

  /* ─── PERF S9 (ruling Q9(a)): opt-in size tracking ─────────────────
     A styled element registers with the surface store — and receives the
     `--valet-el-*` CSS vars — ONLY when passed `$trackSize`. The default
     path performs zero registration (the universal one was dead on arrival:
     it ran for every styled element but nothing consumed the vars). These
     tests drive createStyled directly against a fake surface store so the
     registration contract is asserted independent of <Surface>. */
  type ChildMetrics = SurfaceState['children'] extends Map<string, infer M> ? M : never;
  type RegCall = { id: string; node: HTMLElement; cb?: (m: ChildMetrics) => void };
  function fakeSurfaceProvider() {
    const registerCalls: RegCall[] = [];
    const unregisterCalls: string[] = [];
    /* createStyled skips elements outside the surface root, so the fake root
       must contain the mounted child. `renderStrict` appends into
       document.body, which always contains it — and document.body is attached
       before any styled-child layout effect runs (unlike a callback-ref div,
       whose ref attaches child-first, after the child's own layout effect). */
    const state = {
      get element() {
        return document.body;
      },
      registerChild: (id: string, node: HTMLElement, cb?: RegCall['cb']) => {
        registerCalls.push({ id, node, cb });
      },
      unregisterChild: (id: string) => {
        unregisterCalls.push(id);
      },
    } as unknown as SurfaceState;
    const store = (() => state) as unknown as SurfaceStore;
    (store as unknown as { getState: () => SurfaceState }).getState = () => state;
    const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <SurfaceCtx.Provider value={store}>{children}</SurfaceCtx.Provider>
    );
    return { Provider, registerCalls, unregisterCalls };
  }

  it('S9: $trackSize registers the element with the surface store', () => {
    const { Provider, registerCalls } = fakeSurfaceProvider();
    const T = styled('div')`
      color: rgb(91, 92, 93);
    `;
    renderStrict(
      <Provider>
        <T $trackSize />
      </Provider>,
    );
    expect(registerCalls.length).toBeGreaterThanOrEqual(1);
    /* The registration callback writes the per-element vars. */
    const { node, cb } = registerCalls[registerCalls.length - 1];
    expect(node.tagName).toBe('DIV');
    cb?.({ width: 120, height: 40, top: 0, left: 0 });
    expect(node.style.getPropertyValue('--valet-el-width')).toBe('120px');
    expect(node.style.getPropertyValue('--valet-el-height')).toBe('40px');
  });

  it('S9: default styled element does NOT register (no $trackSize)', () => {
    const { Provider, registerCalls } = fakeSurfaceProvider();
    const U = styled('div')`
      color: rgb(94, 95, 96);
    `;
    renderStrict(
      <Provider>
        <U />
      </Provider>,
    );
    expect(registerCalls).toHaveLength(0);
  });

  it('S9: $trackSize is transient — never leaks onto the DOM element', () => {
    const { Provider } = fakeSurfaceProvider();
    const V = styled('div')`
      color: rgb(97, 98, 99);
    `;
    const { container } = renderStrict(
      <Provider>
        <V
          $trackSize
          data-testid='v'
        />
      </Provider>,
    );
    const el = container.querySelector('[data-testid="v"]') as HTMLDivElement;
    expect(el.getAttribute('$trackSize')).toBeNull();
    expect(el.getAttribute('trackSize')).toBeNull();
  });

  it('DOM mode bypasses the pending-rule path and writes the live sheet', () => {
    const spy = spyInsertRule();
    const E = styled('div')`
      color: rgb(13, 14, 15);
    `;
    const { container } = renderStrict(<E />);
    const cls = container.querySelector('div')!.className;
    expect(rulesFor(spy, cls)).toBe(1);
    /* Nothing parked for a later flush … */
    expect(sheet.getPendingRules()).toHaveLength(0);
    /* … because the rule landed in the lazily created global sheet. */
    expect(sheet.getGlobalSheet()).toBeDefined();
    const ruleTexts = Array.from(sheet.getGlobalSheet()!.cssRules, (r) => r.cssText);
    expect(ruleTexts.some((t) => t.startsWith(`.${cls}`))).toBe(true);
  });
});

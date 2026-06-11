// ─────────────────────────────────────────────────────────────
// src/css/createStyled.dom.test.tsx | valet
// styled() under React.StrictMode in jsdom — one injected rule per
// unique class, stable class names, pending-rule path bypassed
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { styled } from './createStyled';
import * as sheet from './sheet';

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
    expect(sheet.globalSheet).toBeDefined();
    const ruleTexts = Array.from(sheet.globalSheet!.cssRules, (r) => r.cssText);
    expect(ruleTexts.some((t) => t.startsWith(`.${cls}`))).toBe(true);
  });
});

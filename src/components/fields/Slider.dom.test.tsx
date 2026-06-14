// ─────────────────────────────────────────────────────────────
// src/components/fields/Slider.dom.test.tsx | valet
// FIELDS S9 (rulings R9/R10) — regression suite for the Slider
// migration onto the shared `useFieldState` hook.
//
//  • control modes: uncontrolled self-steps; controlled `value` is the
//    source of truth; a seeded FormControl key drives the initial value and
//    a keyboard step writes through; an unseeded key honours `defaultValue`
//    as controlled with a one-time valet warn.
//  • ChangeInfo.source honesty: arrow/Page/Home/End keys ⇒ 'keyboard'; the
//    pointer path ⇒ 'pointer' (the old `instanceof KeyboardEvent` check
//    labelled every pointer drag 'programmatic' — the pointer path passed no
//    event).
//  • orphan fix (audit Slider.tsx:368): a `pointercancel` tears down the
//    document `pointermove`/`pointerup` listeners that a canceled gesture
//    used to leak forever.
//
// House style: createRoot + act, StrictMode, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Slider } from './Slider';
import { FormControl } from './FormControl';
import { createFormStore } from '../../system/createFormStore';
import { resetWarnOnce } from '../../system/devErrors';
import type { ChangeInfo } from '../../system/events';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/*───────────────────────────────────────────────────────────────*/
/* Harness                                                       */

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function mount(node: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  const render = (next: React.ReactElement) =>
    act(() => {
      root.render(<React.StrictMode>{next}</React.StrictMode>);
    });
  render(node);
  return { container, render };
}

const thumb = (c: HTMLElement) => c.querySelector('[role="slider"]') as HTMLElement;
const now = (c: HTMLElement) => Number(thumb(c).getAttribute('aria-valuenow'));

/** Press a key on the thumb (the slider's keyboard target). */
function pressKey(c: HTMLElement, key: string) {
  act(() => {
    thumb(c).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
}

let warnSpy: ReturnType<typeof vi.spyOn>;
const valetWarns = () =>
  (warnSpy.mock.calls as unknown[][])
    .map((c) => String(c[0]))
    .filter((m) => m.startsWith('valet:'));

beforeEach(() => {
  resetWarnOnce();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  warnSpy.mockRestore();
});

/*───────────────────────────────────────────────────────────────*/
/* Control modes (ruling R9)                                      */

describe('Slider — control modes (ruling R9)', () => {
  it('uncontrolled steps its own value with the arrow keys', () => {
    const { container } = mount(
      <Slider
        defaultValue={5}
        min={0}
        max={10}
      />,
    );
    expect(now(container)).toBe(5);
    pressKey(container, 'ArrowRight');
    expect(now(container)).toBe(6);
    pressKey(container, 'ArrowLeft');
    expect(now(container)).toBe(5);
  });

  it('controlled `value` is the source of truth; the view does not self-step', () => {
    const onValueChange = vi.fn();
    const { container } = mount(
      <Slider
        value={4}
        min={0}
        max={10}
        onValueChange={onValueChange}
      />,
    );
    pressKey(container, 'ArrowRight');
    // No parent re-render → the controlled value stays 4.
    expect(now(container)).toBe(4);
    // The change request still fires with the requested next value.
    expect(onValueChange.mock.calls[0][0]).toBe(5);
  });

  it('seeded FormControl key drives the initial value and a step writes through', () => {
    const useStore = createFormStore<{ vol: number }>({ vol: 3 });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <Slider
          name='vol'
          min={0}
          max={10}
        />
      </FormControl>,
    );
    expect(now(container)).toBe(3);
    pressKey(container, 'ArrowRight');
    expect(useStore.getState().values.vol).toBe(4);
    expect(now(container)).toBe(4);
  });

  it('unseeded FormControl key honours defaultValue as controlled with a one-time warn', () => {
    const useStore = createFormStore<Record<string, number>>({ other: 0 });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <Slider
          name='vol'
          defaultValue={7}
          min={0}
          max={10}
          aria-label='Volume'
        />
      </FormControl>,
    );
    expect(now(container)).toBe(7);
    expect(valetWarns()).toEqual([expect.stringContaining("form key 'vol' is not seeded")]);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* ChangeInfo.source honesty (ruling R10)                         */

describe('Slider — ChangeInfo.source classification (ruling R10)', () => {
  it("arrow/Page/Home/End keys report 'keyboard'", () => {
    const infos: ChangeInfo<number>[] = [];
    const { container } = mount(
      <Slider
        defaultValue={5}
        min={0}
        max={10}
        onValueCommit={(_v, i) => infos.push(i)}
      />,
    );
    pressKey(container, 'ArrowRight');
    pressKey(container, 'Home');
    pressKey(container, 'End');
    pressKey(container, 'PageUp');
    expect(infos.map((i) => i.source)).toEqual(['keyboard', 'keyboard', 'keyboard', 'keyboard']);
  });

  it("the pointer path reports 'pointer' (old code mislabelled it 'programmatic')", () => {
    const infos: ChangeInfo<number>[] = [];
    const { container } = mount(
      <Slider
        defaultValue={5}
        min={0}
        max={10}
        onValueChange={(_v, i) => infos.push(i)}
      />,
    );
    const track = container.querySelector('[aria-hidden]') as HTMLElement;
    act(() => {
      track.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 50 }),
      );
    });
    expect(infos.length).toBeGreaterThan(0);
    expect(infos[0].source).toBe('pointer');
    // Tear down the gesture so the listeners don't leak into other tests.
    act(() => {
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: 50 }));
    });
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Orphan fix: pointercancel listener teardown (audit Slider.tsx:368) */

describe('Slider — pointercancel tears down the document drag listeners', () => {
  it('a canceled gesture removes the document pointermove listener (no leak)', () => {
    const { container } = mount(
      <Slider
        defaultValue={5}
        min={0}
        max={10}
      />,
    );
    const track = container.querySelector('[aria-hidden]') as HTMLElement;

    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    act(() => {
      track.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 10 }),
      );
    });

    // pointerdown attaches a document `pointermove` listener.
    const moveFn = addSpy.mock.calls.find((c) => c[0] === 'pointermove')?.[1];
    expect(moveFn).toBeTruthy();

    // A canceled gesture must remove it (the pre-fix code only removed it on
    // pointerup, so a cancel left `move` tracking forever).
    act(() => {
      document.dispatchEvent(new PointerEvent('pointercancel', {}));
    });

    const removedMove = removeSpy.mock.calls.some((c) => c[0] === 'pointermove' && c[1] === moveFn);
    expect(removedMove).toBe(true);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

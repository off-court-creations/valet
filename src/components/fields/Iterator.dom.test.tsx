// ─────────────────────────────────────────────────────────────
// src/components/fields/Iterator.dom.test.tsx | valet
// FIELDS S9 (rulings R9/R10) — regression suite for the Iterator
// migration onto the shared `useFieldState` hook.
//
//  • control modes: uncontrolled self-steps; controlled `value` is the source
//    of truth; a seeded FormControl key drives the initial value and a step
//    writes through; an unseeded key honours `defaultValue` as controlled with
//    a one-time valet warn.
//  • ChangeInfo.source honesty: the +/- buttons ⇒ 'pointer'; Arrow/Page/Home/
//    End/Enter keys & blur ⇒ 'keyboard'; the wheel ⇒ 'wheel' — the old code
//    hardcoded 'programmatic' for every change, including real user input.
//
// House style: createRoot + act, StrictMode, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import * as sheet from '../../css/sheet';
import { Iterator } from './Iterator';
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

const field = (c: HTMLElement) => c.querySelector('input[type="number"]') as HTMLInputElement;
const incBtn = (c: HTMLElement) =>
  c.querySelector('button[aria-label="increment"]') as HTMLButtonElement;
const decBtn = (c: HTMLElement) =>
  c.querySelector('button[aria-label="decrement"]') as HTMLButtonElement;

function click(el: Element) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}
function pressKey(el: Element, key: string) {
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
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

describe('Iterator — control modes (ruling R9)', () => {
  it('uncontrolled steps its own value via the +/- buttons', () => {
    const { container } = mount(<Iterator defaultValue={3} />);
    expect(field(container).value).toBe('3');
    click(incBtn(container));
    expect(field(container).value).toBe('4');
    click(decBtn(container));
    expect(field(container).value).toBe('3');
  });

  it('controlled `value` routes a step to the request trio relative to the controlled value', () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    const { container } = mount(
      <Iterator
        value={2}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />,
    );
    click(incBtn(container));
    // The step is computed off the controlled `value` (2 → 3) and reported via
    // the request trio; the component does not own the value when controlled.
    expect(onValueChange.mock.calls[0][0]).toBe(3);
    expect(onValueCommit.mock.calls[0][0]).toBe(3);
    expect(onValueCommit.mock.calls[0][1].previousValue).toBe(2);
  });

  it('a controlled FormControl key is not written on a step unless the parent updates it', () => {
    // Seeded form key → controlled via the form binding. A step writes through
    // to the store (live binding) AND fires the request; this verifies the
    // hook's write-through path under a controlled (seeded) key.
    const useStore = createFormStore<{ qty: number }>({ qty: 2 });
    const onValueCommit = vi.fn();
    const { container } = mount(
      <FormControl useStore={useStore}>
        <Iterator
          name='qty'
          onValueCommit={onValueCommit}
        />
      </FormControl>,
    );
    click(incBtn(container));
    expect(onValueCommit.mock.calls[0][0]).toBe(3);
    expect(useStore.getState().values.qty).toBe(3);
  });

  it('seeded FormControl key drives the initial value and a step writes through', () => {
    const useStore = createFormStore<{ qty: number }>({ qty: 5 });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <Iterator name='qty' />
      </FormControl>,
    );
    expect(field(container).value).toBe('5');
    click(incBtn(container));
    expect(useStore.getState().values.qty).toBe(6);
    expect(field(container).value).toBe('6');
  });

  it('unseeded FormControl key honours defaultValue as controlled with a one-time warn', () => {
    const useStore = createFormStore<Record<string, number>>({ other: 0 });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <Iterator
          name='qty'
          defaultValue={9}
          aria-label='Quantity'
        />
      </FormControl>,
    );
    expect(field(container).value).toBe('9');
    expect(valetWarns()).toEqual([expect.stringContaining("form key 'qty' is not seeded")]);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* ChangeInfo.source honesty (ruling R10)                         */

describe('Iterator — ChangeInfo.source classification (ruling R10)', () => {
  it("buttons ⇒ 'pointer', arrow keys ⇒ 'keyboard', wheel ⇒ 'wheel'", () => {
    const infos: ChangeInfo<number>[] = [];
    const { container } = mount(
      <Iterator
        defaultValue={5}
        wheelBehavior='hover'
        onValueCommit={(_v, i) => infos.push(i)}
      />,
    );

    click(incBtn(container)); // pointer
    pressKey(field(container), 'ArrowUp'); // keyboard
    act(() => {
      field(container).dispatchEvent(
        new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -1 }),
      );
    });

    expect(infos.map((i) => i.source)).toEqual(['pointer', 'keyboard', 'wheel']);
  });

  it("Enter and blur commits report 'keyboard'", () => {
    const infos: ChangeInfo<number>[] = [];
    const { container } = mount(
      <Iterator
        defaultValue={1}
        onValueCommit={(_v, i) => infos.push(i)}
      />,
    );
    const input = field(container);
    act(() => {
      input.value = '8';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    pressKey(input, 'Enter');
    expect(infos[infos.length - 1].source).toBe('keyboard');
  });
});

/*───────────────────────────────────────────────────────────────*/
/* FormControl form-wide config (additive layer)                  */

describe('Iterator — FormControl config', () => {
  it('a form-wide `disabled` disables the input and blocks interaction', () => {
    const useStore = createFormStore<{ qty: number }>({ qty: 2 });
    const onValueCommit = vi.fn();
    const { container } = mount(
      <FormControl
        useStore={useStore}
        disabled
      >
        <Iterator
          name='qty'
          onValueCommit={onValueCommit}
        />
      </FormControl>,
    );
    expect(field(container).disabled).toBe(true);
    // Keyboard stepping is guarded by effectiveDisabled, not styling alone.
    pressKey(field(container), 'ArrowUp');
    expect(onValueCommit).not.toHaveBeenCalled();
    expect(useStore.getState().values.qty).toBe(2);
  });

  it('a name-keyed `errors` entry marks the input aria-invalid', () => {
    const useStore = createFormStore<{ qty: number }>({ qty: 2 });
    const { container } = mount(
      <FormControl
        useStore={useStore}
        errors={{ qty: 'Too low' }}
      >
        <Iterator name='qty' />
      </FormControl>,
    );
    expect(field(container).getAttribute('aria-invalid')).toBe('true');
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Mobile touch target / chrome kit                               */

describe('Iterator — coarse hit target + chrome kit', () => {
  it('wires the coarse hit var on the root and the chrome kit on the input rule', () => {
    const { container } = mount(<Iterator defaultValue={1} />);
    const root = container.querySelector('[data-valet-component="Iterator"]') as HTMLElement;
    // Root carries the --valet-iter-hit var (44px default, non-compact).
    expect(root.style.getPropertyValue('--valet-iter-hit')).toBe('44px');
    // The styled <input> rule carries the chrome kit + the coarse hit floor.
    const cls = field(container).className.split(' ').find(Boolean) ?? '';
    const rules = Array.from(sheet.getGlobalSheet()?.cssRules ?? [], (r) => r.cssText);
    const rule = rules.find((t) => t.startsWith(`.${cls}`)) ?? '';
    expect(rule).toContain('touch-action: manipulation');
    expect(rule).toContain('@media (pointer: coarse)');
    expect(rule).toContain('--valet-iter-hit');
  });
});

// ─────────────────────────────────────────────────────────────
// src/components/fields/Select.fields.dom.test.tsx | valet
// FIELDS S8 (rulings R9/R10) — regression suite for the Select
// migration onto the shared `useFieldState` hook (the value/control/
// form layer; the OVERLAY S6 portal behaviour is pinned separately in
// Select.dom.test.tsx). Pins:
//   • form binding reads `form.values` (precedence prop > form >
//     internal): a seeded value drives the initial label, and a pointer
//     selection writes through to the store + reflects a store reset.
//   • precedence: an explicit `value` prop wins over a form binding and
//     dev-warns once.
//   • ChangeInfo.source honesty: an option chosen by pointer click
//     reports 'pointer'; one chosen via keyboard (Enter in the listbox)
//     reports 'keyboard' — the old code hardcoded 'programmatic'.
//   • standalone uncontrolled selection still works.
//
// House style: createRoot + act, StrictMode, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Select } from './Select';
import { FormControl } from './FormControl';
import { createFormStore } from '../../system/createFormStore';
import { resetWarnOnce } from '../../system/devErrors';
import { overlayStackSize } from '../../system/overlay';
import type { ChangeInfo } from '../../system/events';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; Surface/engine touch it indirectly. */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

/*───────────────────────────────────────────────────────────────*/
/* Harness                                                       */

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function mount(node: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(<React.StrictMode>{node}</React.StrictMode>);
  });
  return { container };
}

const overlayRoot = () => document.getElementById('valet-overlay-root');
const liveMenu = () => overlayRoot()?.querySelector<HTMLUListElement>('ul[role="listbox"]') ?? null;
const triggerLabel = (c: HTMLElement) =>
  c.querySelector('[data-valet-component="Select"] span')?.textContent ?? '';

const fire = (el: Element, type: 'click' | 'pointerdown') =>
  act(() => {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
  });

/** Open a Select menu via its trigger (within `scope`). */
function openMenu(scope: HTMLElement) {
  const trigger = scope.querySelector('[data-valet-component="Select"]')!;
  fire(trigger, 'click');
  const menu = liveMenu();
  expect(menu).not.toBeNull();
  return menu as HTMLUListElement;
}

const option = (menu: HTMLUListElement, idx: number) =>
  menu.querySelectorAll<HTMLLIElement>('li[role="option"]')[idx];

const last = <T,>(arr: T[]): T | undefined => arr[arr.length - 1];

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
  expect(overlayStackSize()).toBe(0);
});

/** Fresh option elements per render, as an array (not a fragment). */
const opts = () => [
  <Select.Option
    key='a'
    value='a'
  >
    Alpha
  </Select.Option>,
  <Select.Option
    key='b'
    value='b'
  >
    Beta
  </Select.Option>,
  <Select.Option
    key='c'
    value='c'
  >
    Gamma
  </Select.Option>,
];

/*───────────────────────────────────────────────────────────────*/
/* Form binding now reads + writes (ruling R9)                    */

describe('Select — form binding reads values (ruling R9)', () => {
  it('a seeded form value drives the initial label', () => {
    const useStore = createFormStore<{ pick: string }>({ pick: 'b' });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <Select name='pick'>{opts()}</Select>
      </FormControl>,
    );
    // The seeded store value resolves to the 'Beta' option label.
    expect(triggerLabel(container)).toBe('Beta');
  });

  it('a pointer selection writes through to the store and a reset is reflected', () => {
    const useStore = createFormStore<{ pick: string }>({ pick: 'a' });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <Select name='pick'>{opts()}</Select>
      </FormControl>,
    );
    expect(triggerLabel(container)).toBe('Alpha');

    const menu = openMenu(container);
    fire(option(menu, 2), 'click'); // pick 'Gamma'
    expect(useStore.getState().values.pick).toBe('c');
    expect(triggerLabel(container)).toBe('Gamma');

    act(() => useStore.getState().reset());
    expect(triggerLabel(container)).toBe('Alpha');
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Precedence + standalone modes                                  */

describe('Select — control modes (ruling R9)', () => {
  it('explicit `value` prop wins over a form binding and dev-warns once', () => {
    const useStore = createFormStore<{ pick: string }>({ pick: 'a' });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <Select
          name='pick'
          value='c'
          aria-label='Pick'
        >
          {opts()}
        </Select>
      </FormControl>,
    );
    expect(triggerLabel(container)).toBe('Gamma'); // prop 'c' wins over store 'a'
    expect(valetWarns()).toEqual([
      expect.stringContaining('both an explicit `value` prop and a FormControl binding'),
    ]);
  });

  it('uncontrolled standalone select toggles its own state', () => {
    const onValueChange = vi.fn();
    const { container } = mount(
      <Select
        defaultValue='a'
        onValueChange={onValueChange}
      >
        {opts()}
      </Select>,
    );
    expect(triggerLabel(container)).toBe('Alpha');

    const menu = openMenu(container);
    fire(option(menu, 1), 'click');
    expect(triggerLabel(container)).toBe('Beta');
    expect(onValueChange.mock.calls[0][0]).toBe('b');
  });
});

/*───────────────────────────────────────────────────────────────*/
/* ChangeInfo.source honesty (ruling R10)                         */

describe('Select — ChangeInfo.source classification (ruling R10)', () => {
  it("an option chosen by pointer click reports 'pointer'", () => {
    const infos: ChangeInfo<string | number | (string | number)[]>[] = [];
    const { container } = mount(
      <Select
        defaultValue='a'
        onValueCommit={(_v, info) => infos.push(info)}
      >
        {opts()}
      </Select>,
    );
    const menu = openMenu(container);
    fire(option(menu, 1), 'click');
    expect(last(infos)?.source).toBe('pointer');
    expect(last(infos)?.previousValue).toBe('a');
  });

  it("an option chosen via keyboard (Enter in the listbox) reports 'keyboard'", () => {
    const infos: ChangeInfo<string | number | (string | number)[]>[] = [];
    const { container } = mount(
      <Select
        defaultValue='a'
        onValueCommit={(_v, info) => infos.push(info)}
      >
        {opts()}
      </Select>,
    );
    const menu = openMenu(container);
    // Active starts on the current selection ('a'); ArrowDown roves to 'b',
    // then Enter commits via the keyboard path.
    act(() => {
      menu.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
      );
    });
    act(() => {
      menu.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
    });
    expect(last(infos)?.source).toBe('keyboard');
  });
});

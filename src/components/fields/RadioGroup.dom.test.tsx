// ─────────────────────────────────────────────────────────────
// src/components/fields/RadioGroup.dom.test.tsx | valet
// FIELDS S8 (rulings R9/R10) — regression suite for the RadioGroup
// migration onto the shared `useFieldState` hook. Pins:
//   • THE AUTHORIZED FLIP (audit RadioGroup.tsx:189–191): the form
//     binding now READS `form.values` (precedence prop > form >
//     internal). Before this slice it was write-only, so a seeded
//     initial value and `form.reset()` had no effect on the rendered
//     selection. We pin: seeded value drives the initial selection;
//     `form.reset()` is reflected; toggles write through to the store.
//   • precedence: an explicit `value` prop wins over a form binding and
//     dev-warns once (prop + form conflict).
//   • ChangeInfo.source honesty: a genuine pointer click reports
//     'pointer'; keyboard activation (synthetic click, detail 0)
//     reports 'keyboard' — the old `instanceof KeyboardEvent` check
//     always fell through to 'programmatic' for radio change events.
//   • standalone uncontrolled selection still works.
//
// House style: createRoot + act, StrictMode, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { RadioGroup, Radio } from './RadioGroup';
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

const radios = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
const radioFor = (c: HTMLElement, value: string) =>
  radios(c).find((r) => r.value === value) as HTMLInputElement;

/**
 * Select a radio the way the browser does: dispatch a `click` carrying the
 * given `detail`. The HTML activation behaviour flips `.checked` and fires the
 * `change` React listens on, so the handler's `e.nativeEvent` is exactly this
 * MouseEvent — `detail: 1` stands in for a genuine pointer click, `detail: 0`
 * for keyboard activation (Space/Enter and arrow roving ⇒ synthetic click).
 */
function clickRadio(el: HTMLInputElement, detail: number) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
  });
}

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
});

const options = (
  <>
    <Radio
      value='a'
      label='Alpha'
    />
    <Radio
      value='b'
      label='Beta'
    />
    <Radio
      value='c'
      label='Gamma'
    />
  </>
);

/*───────────────────────────────────────────────────────────────*/
/* THE AUTHORIZED FLIP — form binding now reads + reset (audit :189) */

describe('RadioGroup — form binding now READS values + reset (audit :189–191)', () => {
  it('a seeded form value drives the initial selection (was write-only before)', () => {
    const useStore = createFormStore<{ plan: string }>({ plan: 'b' });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <RadioGroup name='plan'>{options}</RadioGroup>
      </FormControl>,
    );

    // The seeded store value selects 'b' on first render — the pre-S8
    // write-only binding ignored it and rendered nothing selected.
    expect(radioFor(container, 'b').checked).toBe(true);
    expect(radioFor(container, 'a').checked).toBe(false);
  });

  it('form.reset() is reflected in the rendered selection', () => {
    const useStore = createFormStore<{ plan: string }>({ plan: 'a' });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <RadioGroup name='plan'>{options}</RadioGroup>
      </FormControl>,
    );
    expect(radioFor(container, 'a').checked).toBe(true);

    // User picks 'c' → writes through to the store.
    clickRadio(radioFor(container, 'c'), 1);
    expect(useStore.getState().values.plan).toBe('c');
    expect(radioFor(container, 'c').checked).toBe(true);

    // Resetting the store restores the original selection in the UI —
    // impossible with the old write-only binding.
    act(() => useStore.getState().reset());
    expect(radioFor(container, 'a').checked).toBe(true);
    expect(radioFor(container, 'c').checked).toBe(false);
  });

  it('selecting writes through to the store', () => {
    const useStore = createFormStore<{ plan: string }>({ plan: 'a' });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <RadioGroup name='plan'>{options}</RadioGroup>
      </FormControl>,
    );
    clickRadio(radioFor(container, 'b'), 1);
    expect(useStore.getState().values.plan).toBe('b');
    expect(radioFor(container, 'b').checked).toBe(true);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Precedence + standalone modes                                  */

describe('RadioGroup — control modes (ruling R9)', () => {
  it('explicit `value` prop wins over a form binding and dev-warns once', () => {
    const useStore = createFormStore<{ plan: string }>({ plan: 'a' });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <RadioGroup
          name='plan'
          value='c'
        >
          {options}
        </RadioGroup>
      </FormControl>,
    );
    // Prop 'c' wins over the store's 'a'.
    expect(radioFor(container, 'c').checked).toBe(true);
    expect(radioFor(container, 'a').checked).toBe(false);
    expect(valetWarns()).toEqual([
      expect.stringContaining('both an explicit `value` prop and a FormControl binding'),
    ]);
  });

  it('uncontrolled standalone group toggles its own state', () => {
    const onValueChange = vi.fn();
    const { container } = mount(
      <RadioGroup
        defaultValue='a'
        onValueChange={onValueChange}
      >
        {options}
      </RadioGroup>,
    );
    expect(radioFor(container, 'a').checked).toBe(true);

    clickRadio(radioFor(container, 'b'), 1);
    expect(radioFor(container, 'b').checked).toBe(true);
    expect(onValueChange.mock.calls[0][0]).toBe('b');
  });
});

/*───────────────────────────────────────────────────────────────*/
/* ChangeInfo.source honesty (ruling R10)                         */

describe('RadioGroup — ChangeInfo.source classification (ruling R10)', () => {
  it("pointer click reports 'pointer'; keyboard activation reports 'keyboard'", () => {
    const infos: ChangeInfo<string>[] = [];
    const onValueCommit = (_v: string, info: ChangeInfo<string>) => infos.push(info);
    const { container } = mount(
      <RadioGroup
        defaultValue='a'
        onValueCommit={onValueCommit}
      >
        {options}
      </RadioGroup>,
    );

    clickRadio(radioFor(container, 'b'), 1); // genuine pointer click
    clickRadio(radioFor(container, 'c'), 0); // keyboard ⇒ synthetic click, detail 0

    expect(infos.map((i) => i.source)).toEqual(['pointer', 'keyboard']);
    // The trio fires with the previous value and a commit phase.
    expect(infos[0].previousValue).toBe('a');
    expect(infos[1].previousValue).toBe('b');
    expect(infos[0].phase).toBe('commit');
  });

  it('roving arrow-key navigation classifies the selection as keyboard', () => {
    const infos: ChangeInfo<string>[] = [];
    const onValueChange = (_v: string, info: ChangeInfo<string>) => infos.push(info);
    const { container } = mount(
      <RadioGroup
        defaultValue='a'
        onValueChange={onValueChange}
      >
        {options}
      </RadioGroup>,
    );

    // Focus the first radio, then ArrowDown roves to the next and selects it
    // via a programmatic `.click()` (detail 0) inside the group's key handler.
    const group = container.querySelector('[data-valet-component="RadioGroup"]') as HTMLElement;
    act(() => radioFor(container, 'a').focus());
    act(() => {
      group.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
      );
    });

    expect(radioFor(container, 'b').checked).toBe(true);
    expect(last(infos)?.source).toBe('keyboard');
  });
});

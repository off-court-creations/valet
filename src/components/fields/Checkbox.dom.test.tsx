// ─────────────────────────────────────────────────────────────
// src/components/fields/Checkbox.dom.test.tsx | valet
// FIELDS S7 (rulings R9/R10) — regression suite for the Checkbox
// migration onto the shared `useFieldState` hook. Pins:
//   • `bindForm` semantics are KEPT (Fields veto register): with
//     `bindForm={false}` the checkbox ignores an enclosing FormControl
//     entirely (expressed by passing `name: undefined` to the hook),
//     and no `name` attribute is emitted on the input.
//   • form binding now reads `form.values` (precedence prop > form >
//     internal), so seeded keys drive initial state and toggles write
//     through.
//   • ChangeInfo.source honesty: keyboard activation (synthetic click,
//     detail 0) ⇒ 'keyboard', a real pointer click (detail ≥ 1) ⇒
//     'pointer' — the old `instanceof MouseEvent ⇒ 'pointer'` check
//     mislabelled keyboard toggles.
//
// House style: createRoot + act, StrictMode, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Checkbox } from './Checkbox';
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

const input = (c: HTMLElement) => c.querySelector('input[type="checkbox"]') as HTMLInputElement;

/**
 * Toggle a checkbox the way the browser does: dispatch a `click` carrying the
 * given `detail`. The HTML activation behaviour flips `.checked` and fires the
 * `change` event React listens on, so the handler's `e.nativeEvent` is exactly
 * this MouseEvent — `detail: 1` stands in for a genuine pointer click,
 * `detail: 0` for keyboard activation (Space/Enter ⇒ synthetic click). Do NOT
 * pre-set `.checked`: doing so cancels jsdom's toggle and the change never
 * fires.
 */
function toggle(el: HTMLInputElement, detail: number) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
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
/* bindForm semantics (KEPT — Fields veto register)               */

describe('Checkbox — bindForm semantics (ruling R9, veto-kept)', () => {
  it('bindForm={false} ignores the enclosing FormControl and emits no name attribute', () => {
    const useStore = createFormStore<{ agree: boolean }>({ agree: true });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <Checkbox
          name='agree'
          bindForm={false}
          defaultChecked={false}
        />
      </FormControl>,
    );

    const el = input(container);
    // Form layer is skipped (`name: undefined` to the hook): defaultChecked
    // wins, not the seeded `true` from the store.
    expect(el.checked).toBe(false);
    // No DOM `name` attribute → excluded from native submission too.
    expect(el.getAttribute('name')).toBe(null);

    // Toggling updates internal state only; the store is untouched.
    toggle(el, 1);
    expect(el.checked).toBe(true);
    expect(useStore.getState().values.agree).toBe(true); // unchanged seed
  });

  it('bindForm default (true) reads the seeded form value and writes through', () => {
    const useStore = createFormStore<{ agree: boolean }>({ agree: true });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <Checkbox name='agree' />
      </FormControl>,
    );

    const el = input(container);
    expect(el.checked).toBe(true); // seeded form value drives initial state
    expect(el.getAttribute('name')).toBe('agree'); // name emitted for submission

    toggle(el, 1);
    expect(useStore.getState().values.agree).toBe(false); // writes through
    expect(el.checked).toBe(false);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Precedence + standalone modes                                  */

describe('Checkbox — control modes (ruling R9)', () => {
  it('explicit `checked` prop wins over a form binding and dev-warns once', () => {
    const useStore = createFormStore<{ agree: boolean }>({ agree: false });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <Checkbox
          name='agree'
          checked
        />
      </FormControl>,
    );
    expect(input(container).checked).toBe(true); // prop wins over form's false
    expect(valetWarns()).toEqual([
      expect.stringContaining('both an explicit `value` prop and a FormControl binding'),
    ]);
  });

  it('uncontrolled standalone checkbox toggles its own state', () => {
    const onValueChange = vi.fn();
    const { container } = mount(
      <Checkbox
        defaultChecked={false}
        onValueChange={onValueChange}
      />,
    );
    toggle(input(container), 1);
    expect(input(container).checked).toBe(true);
    expect(onValueChange.mock.calls[0][0]).toBe(true);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* ChangeInfo.source honesty (ruling R10)                         */

describe('Checkbox — ChangeInfo.source classification (ruling R10)', () => {
  it("pointer click reports 'pointer'; keyboard activation reports 'keyboard'", () => {
    const infos: ChangeInfo<boolean>[] = [];
    const onValueChange = (_v: boolean, info: ChangeInfo<boolean>) => infos.push(info);
    const { container } = mount(
      <Checkbox
        defaultChecked={false}
        onValueChange={onValueChange}
      />,
    );
    const el = input(container);

    toggle(el, 1); // genuine pointer click
    toggle(el, 0); // Space/Enter ⇒ synthetic click, detail 0

    expect(infos.map((i) => i.source)).toEqual(['pointer', 'keyboard']);
    expect(infos[0].phase).toBe('input');
    expect(infos[0].previousValue).toBe(false);
    expect(infos[1].previousValue).toBe(true);
  });
});

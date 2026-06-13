// ─────────────────────────────────────────────────────────────
// src/components/fields/TextField.dom.test.tsx | valet
// FIELDS S6 (rulings R9/R10) — regression suite for the TextField
// migration onto the shared `useFieldState` hook. Pins the two audit
// bugs (TextField.tsx:284): an explicit `value` prop is silently
// ignored under FormControl, and an unseeded `name` mounts
// uncontrolled then flips controlled on the first keystroke. Also
// pins ChangeInfo.source honesty: a real paste classifies as
// 'clipboard', typed text as 'keyboard' — the old dead
// `instanceof KeyboardEvent` check fabricated these.
//
// House style: createRoot + act, StrictMode, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TextField } from './TextField';
import { FormControl } from './FormControl';
import { createFormStore } from '../../system/createFormStore';
import { resetWarnOnce } from '../../system/devErrors';
import type { ChangeInfo } from '../../system/events';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/*───────────────────────────────────────────────────────────────*/
/* Harness                                                       */

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Mount under StrictMode; returns the container plus a same-root rerender. */
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

const input = (container: HTMLElement) => container.querySelector('input')!;

let warnSpy: ReturnType<typeof vi.spyOn>;
/** Only valet warnings — ignores unrelated react-dom chatter. */
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

/**
 * Fire a realistic edit on a text control: set the value via the native
 * setter (so React's controlled-input tracker sees a change) and dispatch an
 * `input` event carrying the given `inputType`, mirroring what a browser sends
 * for typing vs. pasting. `inputType: undefined` dispatches a plain Event,
 * standing in for a programmatic value assignment.
 */
function fireEdit(el: HTMLInputElement, value: string, inputType?: string) {
  const proto = Object.getPrototypeOf(el) as object;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')!.set!;
  act(() => {
    setter.call(el, value);
    const ev =
      inputType !== undefined
        ? new InputEvent('input', { bubbles: true, inputType, data: value })
        : new Event('input', { bubbles: true });
    el.dispatchEvent(ev);
  });
}

/*───────────────────────────────────────────────────────────────*/
/* Audit bug: value prop ignored under FormControl               */

describe('TextField — value prop under FormControl (ruling R9)', () => {
  it('controlled-with-form: explicit value wins over the form store + dev-warns once; edits still write through', () => {
    const useStore = createFormStore<{ email: string }>({ email: 'fromForm' });
    const onValueChange = vi.fn();
    const { container } = mount(
      <FormControl useStore={useStore}>
        <TextField
          name='email'
          value='fromProp'
          onValueChange={onValueChange}
        />
      </FormControl>,
    );

    // Prop wins for rendering — the old code rendered 'fromForm' (bug).
    expect(input(container).value).toBe('fromProp');
    expect(valetWarns()).toEqual([
      expect.stringContaining('both an explicit `value` prop and a FormControl binding'),
    ]);

    // User edits still write through to the store so submit stays in sync.
    fireEdit(input(container), 'edited', 'insertText');
    expect(useStore.getState().values.email).toBe('edited');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0]).toBe('edited');

    // Prop still drives the rendered value (controlled, latched on prop).
    expect(input(container).value).toBe('fromProp');
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Audit bug: unseeded name uncontrolled→controlled flip          */

describe('TextField — unseeded form name (ruling R9)', () => {
  it('renders defaultValue as a controlled input from mount; no uncontrolled→controlled flip on first edit', () => {
    const useStore = createFormStore<Record<string, string>>({ other: 'x' });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <TextField
          name='email'
          defaultValue='seed'
        />
      </FormControl>,
    );

    const el = input(container);
    // Controlled from the first render — value attribute reflects defaultValue,
    // and the React-managed `value` is the seed, not '' (the old flip bug).
    expect(el.value).toBe('seed');
    expect(el).not.toHaveProperty('defaultValue', undefined);
    expect(valetWarns()).toEqual([expect.stringContaining("form key 'email' is not seeded")]);

    // First edit writes through to the store and the field stays controlled —
    // React does NOT log the uncontrolled→controlled warning.
    fireEdit(el, 'typed', 'insertText');
    expect(useStore.getState().values.email).toBe('typed');
    expect(el.value).toBe('typed'); // store re-renders the controlled value

    const reactFlipWarnings = (warnSpy.mock.calls as unknown[][])
      .map((c) => String(c[0]))
      .filter((m) => /changing an? (un)?controlled input/i.test(m));
    expect(reactFlipWarnings).toEqual([]);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* ChangeInfo.source honesty (ruling R10)                         */

describe('TextField — ChangeInfo.source classification (ruling R10)', () => {
  it("paste yields source 'clipboard'; typing yields 'keyboard'; programmatic yields 'programmatic'", () => {
    const infos: ChangeInfo<string>[] = [];
    const onValueChange = (_v: string, info: ChangeInfo<string>) => infos.push(info);
    const { container } = mount(
      <TextField
        name='note'
        value=''
        onValueChange={onValueChange}
      />,
    );
    const el = input(container);

    fireEdit(el, 'pasted', 'insertFromPaste');
    fireEdit(el, 'pasted text', 'insertText');
    fireEdit(el, 'set externally'); // plain Event → not an InputEvent

    expect(infos.map((i) => i.source)).toEqual(['clipboard', 'keyboard', 'programmatic']);
    // phase is always 'input' for these and name threads through.
    expect(infos.every((i) => i.phase === 'input')).toBe(true);
    expect(infos.every((i) => i.name === 'note')).toBe(true);
    // previousValue tracks the prior rendered value (seed '' for the first).
    expect(infos[0].previousValue).toBe('');
  });

  it("Enter commit reports source 'keyboard'; blur commit reports 'programmatic'", () => {
    const commits: ChangeInfo<string>[] = [];
    const onValueCommit = (_v: string, info: ChangeInfo<string>) => commits.push(info);
    const { container } = mount(
      <TextField
        name='note'
        defaultValue='hi'
        onValueCommit={onValueCommit}
      />,
    );
    const el = input(container);

    act(() => {
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
    });
    act(() => {
      // React delegates blur via the bubbling `focusout` event at the root.
      el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    });

    expect(commits.map((c) => ({ phase: c.phase, source: c.source }))).toEqual([
      { phase: 'commit', source: 'keyboard' },
      { phase: 'commit', source: 'programmatic' },
    ]);
  });
});

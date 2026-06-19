// ─────────────────────────────────────────────────────────────
// src/components/fields/FormControl.dom.test.tsx | valet
// FormControl — provides the form store via context (useForm reads it),
// intercepts native submit (preventDefault) and hands typed values to
// onSubmitValues, and useForm throws when used outside a FormControl.
//
// FormControl is a context provider over a plain <form> (no
// theme/surface), so no Surface wrapper is required.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FormControl, useForm, useFormConfig } from './FormControl';
import { createFormStore } from '../../system/createFormStore';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(node);
  });
  return container;
}

const formEl = (c: HTMLElement) =>
  c.querySelector('[data-valet-component="FormControl"]') as HTMLFormElement;

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.restoreAllMocks();
});

/* Suite ----------------------------------------------------------------- */
describe('FormControl (jsdom)', () => {
  it('renders a <form> tagged data-valet-component="FormControl"', () => {
    const useStore = createFormStore({ name: '' });
    const c = render(<FormControl useStore={useStore} />);
    const form = formEl(c);
    expect(form).not.toBeNull();
    expect(form.tagName).toBe('FORM');
  });

  it('binds the store so useForm reads its values inside the tree', () => {
    const useStore = createFormStore({ email: 'a@b.com', count: 3 });
    function Reader() {
      const form = useForm<{ email: string; count: number }>();
      return <span data-readout>{`${form.values.email}|${form.values.count}`}</span>;
    }
    const c = render(
      <FormControl useStore={useStore}>
        <Reader />
      </FormControl>,
    );
    expect(c.querySelector('[data-readout]')!.textContent).toBe('a@b.com|3');
  });

  it('intercepts submit (preventDefault) and forwards typed values', () => {
    const useStore = createFormStore({ first: 'Ada', last: 'Lovelace' });
    const onSubmitValues = vi.fn();
    const c = render(
      <FormControl
        useStore={useStore}
        onSubmitValues={onSubmitValues}
      >
        <button type='submit'>go</button>
      </FormControl>,
    );
    const form = formEl(c);
    const submitEvt = new Event('submit', { bubbles: true, cancelable: true });
    act(() => {
      form.dispatchEvent(submitEvt);
    });
    expect(submitEvt.defaultPrevented).toBe(true);
    expect(onSubmitValues).toHaveBeenCalledTimes(1);
    expect(onSubmitValues.mock.calls[0][0]).toEqual({ first: 'Ada', last: 'Lovelace' });
  });

  it('submits the live store values after a field write', () => {
    const useStore = createFormStore({ n: 0 });
    const onSubmitValues = vi.fn();
    function Bumper() {
      const form = useForm<{ n: number }>();
      return (
        <button
          type='button'
          data-bump
          onClick={() => form.setField('n', 5)}
        >
          bump
        </button>
      );
    }
    const c = render(
      <FormControl
        useStore={useStore}
        onSubmitValues={onSubmitValues}
      >
        <Bumper />
        <button type='submit'>go</button>
      </FormControl>,
    );
    act(() => {
      c.querySelector<HTMLButtonElement>('[data-bump]')!.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });
    act(() => {
      formEl(c).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(onSubmitValues.mock.calls[0][0]).toEqual({ n: 5 });
  });

  it('useForm throws when used outside a FormControl', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useForm();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(/FormControl/);
    err.mockRestore();
  });
});

/*───────────────────────────────────────────────────────────────*/
/* FormConfigCtx — form-wide disabled / errors / submit lifecycle */

function ConfigReader() {
  const cfg = useFormConfig();
  return (
    <span data-cfg>{`${cfg.disabled}|${JSON.stringify(cfg.errors)}|${cfg.isSubmitting}`}</span>
  );
}
const cfgText = (c: HTMLElement) => c.querySelector('[data-cfg]')!.textContent;

describe('FormControl — FormConfigCtx (additive)', () => {
  it('useFormConfig returns inert defaults outside a FormControl', () => {
    const c = render(<ConfigReader />);
    expect(cfgText(c)).toBe('false|{}|false');
  });

  it('propagates form-wide disabled to bound fields', () => {
    const useStore = createFormStore({ a: '' });
    const c = render(
      <FormControl
        useStore={useStore}
        disabled
      >
        <ConfigReader />
      </FormControl>,
    );
    expect(cfgText(c)).toBe('true|{}|false');
  });

  it('propagates name-keyed errors', () => {
    const useStore = createFormStore({ email: '' });
    const c = render(
      <FormControl
        useStore={useStore}
        errors={{ email: 'Invalid' }}
      >
        <ConfigReader />
      </FormControl>,
    );
    expect(cfgText(c)).toBe('false|{"email":"Invalid"}|false');
  });

  it('an async onSubmitValues flips isSubmitting + aria-busy while pending', async () => {
    const useStore = createFormStore({ a: '' });
    let resolveSubmit!: () => void;
    const pending = new Promise<void>((r) => {
      resolveSubmit = r;
    });
    const onSubmitValues = vi.fn(() => pending);
    const c = render(
      <FormControl
        useStore={useStore}
        onSubmitValues={onSubmitValues}
      >
        <ConfigReader />
        <button type='submit'>go</button>
      </FormControl>,
    );
    act(() => {
      formEl(c).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    // Pending: submitting flag + aria-busy on the form.
    expect(cfgText(c)).toBe('false|{}|true');
    expect(formEl(c).getAttribute('aria-busy')).toBe('true');
    // Resolve: flag clears, aria-busy drops.
    await act(async () => {
      resolveSubmit();
      await pending;
    });
    expect(cfgText(c)).toBe('false|{}|false');
    expect(formEl(c).getAttribute('aria-busy')).toBe(null);
  });
});

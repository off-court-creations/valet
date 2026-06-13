// ─────────────────────────────────────────────────────────────
// src/hooks/useControlledState.dom.test.tsx | valet
// FIELDS S5 (ruling R9) — regression suite for the shared
// controlled-state hooks: the four canonical scenarios
// (pure-controlled, pure-uncontrolled, form-bound, prop+form
// conflict), the mount latch, and the no-mount-write guarantee
// against a real createFormStore.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useControlledState, useFieldState, type FieldStateMeta } from './useControlledState';
import { resetWarnOnce } from '../system/devErrors';
import { createFormStore } from '../system/createFormStore';
import { FormControl } from '../components/fields/FormControl';

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

const text = (container: HTMLElement) => container.querySelector('output')!.textContent;

let warnSpy: ReturnType<typeof vi.spyOn>;
/** Only valet warnings — ignores unrelated react-dom chatter. */
const valetWarns = () =>
  warnSpy.mock.calls
    .map((c: unknown[]) => String(c[0]))
    .filter((m: string) => m.startsWith('valet:'));

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
/* Probes                                                        */

type CtlCapture = { set: (n: string) => void; isControlled: boolean };
const ctl: { current?: CtlCapture } = {};

function CtlProbe(props: {
  value?: string;
  defaultValue?: string;
  onChange?: (n: string) => void;
}) {
  const [current, setValue, isControlled] = useControlledState(
    props.value,
    props.defaultValue ?? '',
    props.onChange,
    'CtlProbe',
  );
  ctl.current = { set: setValue, isControlled };
  return <output>{current}</output>;
}

type FieldCapture = { set: (n: string) => void; meta: FieldStateMeta };
const fld: { current?: FieldCapture } = {};

function FieldProbe(props: {
  value?: string;
  defaultValue?: string;
  name?: string;
  onChange?: (n: string) => void;
}) {
  const [current, setValue, meta] = useFieldState<string>({
    value: props.value,
    defaultValue: props.defaultValue,
    fallback: '',
    name: props.name,
    onChange: props.onChange,
    component: 'FieldProbe',
  });
  fld.current = { set: setValue, meta };
  return <output data-source={meta.source}>{current}</output>;
}

const makeStore = (initial: Record<string, unknown>) =>
  createFormStore<Record<string, unknown>>(initial);

/*───────────────────────────────────────────────────────────────*/
/* useControlledState                                            */

describe('useControlledState', () => {
  it('pure-controlled: renders the prop, setter is a state no-op, onChange still fires', () => {
    const onChange = vi.fn();
    const { container, render } = mount(
      <CtlProbe
        value='a'
        defaultValue='seed'
        onChange={onChange}
      />,
    );
    expect(text(container)).toBe('a');
    expect(ctl.current!.isControlled).toBe(true);

    act(() => ctl.current!.set('b'));
    expect(text(container)).toBe('a'); // state no-op while controlled
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('b');

    render(
      <CtlProbe
        value='b'
        defaultValue='seed'
        onChange={onChange}
      />,
    );
    expect(text(container)).toBe('b'); // parent-driven update renders
    expect(valetWarns()).toEqual([]);
  });

  it('pure-uncontrolled: seeds from defaultValue, setter updates, onChange fires', () => {
    const onChange = vi.fn();
    const { container } = mount(
      <CtlProbe
        defaultValue='seed'
        onChange={onChange}
      />,
    );
    expect(text(container)).toBe('seed');
    expect(ctl.current!.isControlled).toBe(false);

    act(() => ctl.current!.set('typed'));
    expect(text(container)).toBe('typed');
    expect(onChange).toHaveBeenCalledWith('typed');
    expect(valetWarns()).toEqual([]);
  });

  it('latch: a later undefined does not flip to uncontrolled — warns once, renders defaultValue', () => {
    const { container, render } = mount(
      <CtlProbe
        value='a'
        defaultValue='fallback'
      />,
    );
    expect(ctl.current!.isControlled).toBe(true);

    render(<CtlProbe defaultValue='fallback' />);
    expect(ctl.current!.isControlled).toBe(true); // mode latched
    expect(text(container)).toBe('fallback'); // never adopts internal state
    expect(valetWarns()).toEqual([expect.stringContaining('controlled to uncontrolled')]);

    render(<CtlProbe defaultValue='fallback' />);
    expect(valetWarns()).toHaveLength(1); // warnOnce — no repeat
  });

  it('latch: an uncontrolled mount ignores a later value prop — warns once', () => {
    const { container, render } = mount(<CtlProbe defaultValue='seed' />);
    act(() => ctl.current!.set('typed'));
    expect(text(container)).toBe('typed');

    render(
      <CtlProbe
        value='forced'
        defaultValue='seed'
      />,
    );
    expect(ctl.current!.isControlled).toBe(false); // mode latched
    expect(text(container)).toBe('typed'); // late prop ignored
    expect(valetWarns()).toEqual([expect.stringContaining('uncontrolled to controlled')]);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* useFieldState                                                 */

describe('useFieldState', () => {
  it('pure-controlled: explicit value wins, source=prop, setter is a state no-op', () => {
    const onChange = vi.fn();
    const { container } = mount(
      <FieldProbe
        value='fromProp'
        defaultValue='dv'
        onChange={onChange}
      />,
    );
    expect(text(container)).toBe('fromProp');
    expect(fld.current!.meta).toEqual({ isControlled: true, source: 'prop', formBound: false });

    act(() => fld.current!.set('edit'));
    expect(text(container)).toBe('fromProp');
    expect(onChange).toHaveBeenCalledWith('edit');
    expect(valetWarns()).toEqual([]);
  });

  it('pure-uncontrolled: internal state seeded from defaultValue ?? fallback', () => {
    const { container } = mount(<FieldProbe defaultValue='dv' />);
    expect(text(container)).toBe('dv');
    expect(fld.current!.meta).toEqual({
      isControlled: false,
      source: 'internal',
      formBound: false,
    });

    act(() => fld.current!.set('typed'));
    expect(text(container)).toBe('typed');

    const bare = mount(<FieldProbe />); // no defaultValue → fallback ''
    expect(text(bare.container)).toBe('');
    expect(valetWarns()).toEqual([]);
  });

  it('form-bound: seeded key renders the store value as controlled; edits and external writes flow both ways', () => {
    const useStore = makeStore({ email: 'seeded' });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <FieldProbe name='email' />
      </FormControl>,
    );
    expect(text(container)).toBe('seeded');
    expect(fld.current!.meta).toEqual({ isControlled: true, source: 'form', formBound: true });

    act(() => fld.current!.set('next'));
    expect(useStore.getState().values.email).toBe('next'); // write-through
    expect(text(container)).toBe('next'); // re-render from store

    act(() => useStore.getState().setField('email', 'external'));
    expect(text(container)).toBe('external'); // external store writes render
    expect(valetWarns()).toEqual([]);
  });

  it('prop+form conflict: warns once, the prop wins for rendering, edits still write through to the store', () => {
    const useStore = makeStore({ email: 'fromForm' });
    const onChange = vi.fn();
    const { container, render } = mount(
      <FormControl useStore={useStore}>
        <FieldProbe
          value='fromProp'
          name='email'
          onChange={onChange}
        />
      </FormControl>,
    );
    expect(text(container)).toBe('fromProp'); // prop > form
    expect(fld.current!.meta).toEqual({ isControlled: true, source: 'prop', formBound: true });
    expect(valetWarns()).toEqual([
      expect.stringContaining('both an explicit `value` prop and a FormControl binding'),
    ]);

    act(() => fld.current!.set('edited'));
    expect(text(container)).toBe('fromProp'); // still prop-driven
    expect(useStore.getState().values.email).toBe('edited'); // submit stays in sync
    expect(onChange).toHaveBeenCalledWith('edited');

    render(
      <FormControl useStore={useStore}>
        <FieldProbe
          value='fromProp'
          name='email'
          onChange={onChange}
        />
      </FormControl>,
    );
    expect(valetWarns()).toHaveLength(1); // warnOnce — no repeat
  });

  it('unseeded form key renders defaultValue ?? fallback AS CONTROLLED with a one-time dev warn', () => {
    const useStore = makeStore({ other: 'x' });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <FieldProbe
          name='email'
          defaultValue='dv'
        />
      </FormControl>,
    );
    expect(text(container)).toBe('dv');
    expect(fld.current!.meta).toEqual({ isControlled: true, source: 'form', formBound: true });
    expect(valetWarns()).toEqual([expect.stringContaining("form key 'email' is not seeded")]);

    /* no defaultValue → fallback, still controlled, still one warn per key */
    resetWarnOnce();
    warnSpy.mockClear();
    const useStore2 = makeStore({ other: 'x' });
    const bare = mount(
      <FormControl useStore={useStore2}>
        <FieldProbe name='email' />
      </FormControl>,
    );
    expect(text(bare.container)).toBe('');
    expect(fld.current!.meta.isControlled).toBe(true);
    expect(valetWarns()).toHaveLength(1);
  });

  it('no-mount-write: mounting never calls setField nor mutates a real createFormStore', () => {
    const useStore = makeStore({ other: 'x' }); // 'email' unseeded
    const setFieldSpy = vi.spyOn(useStore.getState(), 'setField');
    const writes: unknown[] = [];
    const unsubscribe = useStore.subscribe((next) => writes.push(next.values));
    const before = useStore.getState().values;

    mount(
      <FormControl useStore={useStore}>
        <FieldProbe
          name='email'
          defaultValue='dv'
        />
      </FormControl>,
    );
    expect(setFieldSpy).not.toHaveBeenCalled(); // StrictMode double-mount included
    expect(writes).toEqual([]);
    expect(useStore.getState().values).toBe(before); // exact identity preserved
    expect(useStore.getState().values).not.toHaveProperty('email');

    /* the write path itself stays live — first user edit seeds the key */
    act(() => fld.current!.set('user'));
    expect(setFieldSpy).toHaveBeenCalledTimes(1);
    expect(setFieldSpy).toHaveBeenCalledWith('email', 'user');
    expect(useStore.getState().values.email).toBe('user');
    unsubscribe();
  });

  it('latch: form binding is latched — a value prop appearing later warns and is ignored', () => {
    const useStore = makeStore({ email: 'fromForm' });
    const tree = (value?: string) => (
      <FormControl useStore={useStore}>
        <FieldProbe
          value={value}
          name='email'
        />
      </FormControl>
    );
    const { container, render } = mount(tree());
    expect(text(container)).toBe('fromForm');
    expect(fld.current!.meta.source).toBe('form');

    render(tree('late'));
    expect(fld.current!.meta.source).toBe('form'); // binding latched
    expect(text(container)).toBe('fromForm'); // late prop ignored for reading
    expect(valetWarns()).toContainEqual(expect.stringContaining("from 'form' to 'prop'"));
  });
});

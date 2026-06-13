// ─────────────────────────────────────────────────────────────
// src/components/fields/Switch.dom.test.tsx | valet
// FIELDS S7 (rulings R9/R10) — regression suite for the Switch
// migration onto the shared `useFieldState` hook. Pins the audit
// bug (Switch.tsx:138): inside a FormControl the old
// `Boolean(form.values[name])` predicate was never undefined, so
// `checked`/`defaultChecked` were dead and an unseeded key always
// rendered unchecked. Also pins ChangeInfo.source honesty: keyboard
// activation (Space/Enter ⇒ synthetic click, detail 0) classifies as
// 'keyboard', a real pointer click (detail ≥ 1) as 'pointer' — the
// old code hardcoded 'pointer' for every toggle.
//
// House style: createRoot + act, StrictMode, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Switch } from './Switch';
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

const track = (c: HTMLElement) => c.querySelector('button[role="switch"]')!;

/** Click the track with a given `detail`: 1 ⇒ pointer, 0 ⇒ keyboard activation. */
function clickTrack(el: Element, detail: number) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
  });
}

let warnSpy: ReturnType<typeof vi.spyOn>;
const valetWarns = () =>
  (warnSpy.mock.calls as unknown[][])
    .map((c) => String(c[0]))
    .filter((m) => m.startsWith('valet:'));
const deprecationWarns = () =>
  (warnSpy.mock.calls as unknown[][])
    .map((c) => String(c[0]))
    .filter((m) => m.includes('is deprecated'));

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
/* Audit bug: dead checked/defaultChecked under FormControl       */

describe('Switch — checked/defaultChecked under FormControl (ruling R9)', () => {
  it('seeded form key drives initial state and a toggle writes through', () => {
    const useStore = createFormStore<{ wifi: boolean }>({ wifi: true });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <Switch name='wifi' />
      </FormControl>,
    );

    // Seeded `true` renders checked (form binding is the source).
    expect(track(container).getAttribute('aria-checked')).toBe('true');

    // Toggling writes through to the store and re-renders unchecked.
    clickTrack(track(container), 1);
    expect(useStore.getState().values.wifi).toBe(false);
    expect(track(container).getAttribute('aria-checked')).toBe('false');
  });

  it('unseeded form key honours defaultChecked (old bug: always rendered unchecked)', () => {
    // The old `Boolean(form.values[name])` coerced the missing key to `false`,
    // ignoring `defaultChecked` and rendering unchecked. With useFieldState an
    // unseeded key renders `defaultChecked` as controlled with a one-time warn.
    const useStore = createFormStore<Record<string, boolean>>({ other: false });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <Switch
          name='wifi'
          defaultChecked
        />
      </FormControl>,
    );

    expect(track(container).getAttribute('aria-checked')).toBe('true');
    expect(valetWarns()).toEqual([expect.stringContaining("form key 'wifi' is not seeded")]);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Uncontrolled / controlled standalone behaviour                 */

describe('Switch — standalone control modes', () => {
  it('uncontrolled toggles its own state and fires the value trio', () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    const { container } = mount(
      <Switch
        defaultChecked={false}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />,
    );

    expect(track(container).getAttribute('aria-checked')).toBe('false');
    clickTrack(track(container), 1);
    expect(track(container).getAttribute('aria-checked')).toBe('true');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0]).toBe(true);
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit.mock.calls[0][1].phase).toBe('commit');
  });

  it('controlled `checked` prop is the source of truth; the view does not self-toggle', () => {
    const onValueChange = vi.fn();
    const { container } = mount(
      <Switch
        checked={false}
        onValueChange={onValueChange}
      />,
    );
    clickTrack(track(container), 1);
    // No parent re-render, so the controlled value stays false.
    expect(track(container).getAttribute('aria-checked')).toBe('false');
    // The change request still fires with the requested next value.
    expect(onValueChange.mock.calls[0][0]).toBe(true);
  });

  it('disabled swallows the toggle entirely', () => {
    const onValueChange = vi.fn();
    const { container } = mount(
      <Switch
        defaultChecked={false}
        disabled
        onValueChange={onValueChange}
      />,
    );
    clickTrack(track(container), 1);
    expect(track(container).getAttribute('aria-checked')).toBe('false');
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

/*───────────────────────────────────────────────────────────────*/
/* ChangeInfo.source honesty (ruling R10)                         */

describe('Switch — ChangeInfo.source classification (ruling R10)', () => {
  it("pointer click reports 'pointer'; keyboard activation reports 'keyboard'", () => {
    const infos: ChangeInfo<boolean>[] = [];
    const onValueChange = (_v: boolean, info: ChangeInfo<boolean>) => infos.push(info);
    const { container } = mount(<Switch onValueChange={onValueChange} />);

    clickTrack(track(container), 1); // genuine pointer click
    clickTrack(track(container), 0); // Space/Enter ⇒ synthetic click, detail 0

    expect(infos.map((i) => i.source)).toEqual(['pointer', 'keyboard']);
    expect(infos[0].phase).toBe('input');
    // previousValue tracks the prior rendered state (false → true → false).
    expect(infos[0].previousValue).toBe(false);
    expect(infos[1].previousValue).toBe(true);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* onChange deprecation (API-TYPES S10, Q12 / ruling R30)         */
//
// `onChange` (raw DOM passthrough) is deprecated in favour of the canonical
// `onValueChange`. Unlike a renamed value prop the two are not mutually
// exclusive — the old code always fired both — so the alias keeps firing with
// the raw MouseEvent through 0.x and warns once on presence (removed at 1.0).

describe('Switch — onChange deprecation (ruling R30)', () => {
  it('`onChange` still fires with the raw MouseEvent and warns once', () => {
    const onChange = vi.fn();
    const { container } = mount(<Switch onChange={onChange} />);

    clickTrack(track(container), 1);
    // StrictMode mounts twice but the warn is memoised once.
    expect(onChange).toHaveBeenCalledTimes(1);
    // `onChange` is the raw DOM passthrough: it receives React's synthetic
    // click event wrapping the native MouseEvent (not the boolean value).
    const arg = onChange.mock.calls[0][0] as React.SyntheticEvent;
    expect(arg.type).toBe('click');
    expect(arg.nativeEvent).toBeInstanceOf(MouseEvent);

    const warns = deprecationWarns();
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('`onChange`');
    expect(warns[0]).toContain('`onValueChange`');
  });

  it('`onChange` and `onValueChange` both fire; only `onChange` warns', () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    const { container } = mount(
      <Switch
        onChange={onChange}
        onValueChange={onValueChange}
      />,
    );

    clickTrack(track(container), 1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0]).toBe(true);
    expect(deprecationWarns()).toHaveLength(1);
  });

  it('`onValueChange` alone emits no deprecation warning', () => {
    const onValueChange = vi.fn();
    const { container } = mount(<Switch onValueChange={onValueChange} />);

    clickTrack(track(container), 1);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(deprecationWarns()).toEqual([]);
  });
});

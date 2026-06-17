// ─────────────────────────────────────────────────────────────
// src/components/fields/controlledContract.dom.test.tsx | valet
// FIELDS S11 (rulings R9/R10) — THE CROSS-FIELD CONTRACT SUITE.
//
// This is the FIELDS-FORMS workstream acceptance gate. Where each
// component's own *.dom.test.tsx pins its bespoke audit bugs, THIS
// suite proves — table-driven, one row per migrated component — that
// every field now obeys the ONE precedence rule the shared
// `useControlledState`/`useFieldState` pair encodes (plan §2.2,
// §9 Fields veto register):
//
//     explicit value prop > form binding > internal state,
//     latched at mount.
//
// Four scenarios run against EVERY migrated component (the
// "re-divergence is a review failure, not a latent bug" guarantee):
//
//   1. pure-controlled    — a defined `value`/`checked`/`open` prop is
//                           the source of truth; the view never
//                           self-updates; the change request still fires.
//   2. pure-uncontrolled  — `defaultValue`/`defaultChecked` seeds, and a
//                           user edit moves the rendered value.
//   3. form-bound         — a seeded FormControl key drives the initial
//                           render AND a user edit writes through to the
//                           store (RadioGroup/Select/MetroSelect that
//                           used to be write-only now READ too).
//   4. prop+form conflict — an explicit prop AND a form binding: the prop
//                           wins for rendering and a single dev-warn fires.
//
// Plus two suite-wide gates:
//   • ZERO stray console.error/console.warn in the canonical scenarios
//     (1–3). Scenario 4 deliberately emits exactly one valet warn.
//   • A SOURCE-LEVEL assertion that the old copy-pasted controlled/
//     uncontrolled guard — the hand-rolled `initialCtl` mount-latch ref
//     that was duplicated across every field — is gone from all field
//     source. Re-adding it (the re-divergence this whole slice prevents)
//     turns this test red.
//
// House style: createRoot + act, StrictMode, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { Surface } from '../layout/Surface';
import { TextField } from './TextField';
import { Switch } from './Switch';
import { Checkbox } from './Checkbox';
import { Select } from './Select';
import { MetroSelect } from './MetroSelect';
import { RadioGroup, Radio } from './RadioGroup';
import { Slider } from './Slider';
import { Iterator } from './Iterator';
import { DateSelector } from './DateSelector';
import { Tabs } from '../layout/Tabs';
import { Accordion } from '../layout/Accordion';
import { FormControl } from './FormControl';
import { createFormStore } from '../../system/createFormStore';
import { resetWarnOnce } from '../../system/devErrors';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; Surface (the required screen root) plus
 * Tabs/Accordion observe in effects. */
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

/** Mount under StrictMode inside a <Surface> (every valet screen mounts one at
 *  its root; Typography/Accordion read it via useSurface) and return the
 *  container plus a same-root rerender. */
function mount(node: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  const render = (next: React.ReactElement) =>
    act(() => {
      root.render(
        <React.StrictMode>
          <Surface>{next}</Surface>
        </React.StrictMode>,
      );
    });
  render(node);
  return { container, render };
}

let warnSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

/** Only valet warnings — ignores unrelated react-dom chatter. */
const valetWarns = () =>
  (warnSpy.mock.calls as unknown[][])
    .map((c) => String(c[0]))
    .filter((m) => m.startsWith('valet:'));

/** Every console.warn/error string that is NOT valet's own dev guidance.
 *  A non-empty result in the canonical scenarios means React itself
 *  complained — an uncontrolled→controlled flip, a key warning, etc. */
const strayConsole = () =>
  [...(warnSpy.mock.calls as unknown[][]), ...(errorSpy.mock.calls as unknown[][])]
    .map((c) => String(c[0]))
    .filter((m) => !m.startsWith('valet:'));

beforeEach(() => {
  resetWarnOnce();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

/*───────────────────────────────────────────────────────────────*/
/* DOM interaction primitives (shared by the adapters)            */

function clickEl(el: Element, detail = 1) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
  });
}
function pressKey(el: Element, key: string) {
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
}
/** Native-setter edit on a text/number input so React's tracker sees it. */
function fireInput(el: HTMLInputElement, value: string) {
  const proto = Object.getPrototypeOf(el) as object;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')!.set!;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

const overlayRoot = () => document.getElementById('valet-overlay-root');
/** Open a Select dropdown and return its live listbox (portalled). */
function openSelect(scope: HTMLElement): HTMLUListElement {
  const trigger = scope.querySelector('[data-valet-component="Select"]')!;
  clickEl(trigger);
  const menu = overlayRoot()?.querySelector<HTMLUListElement>('ul[role="listbox"]') ?? null;
  expect(menu).not.toBeNull();
  return menu as HTMLUListElement;
}

/* Shared option fragments for the menu/group components. */
const radioOpts = (
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
/** Select (like MetroSelect) needs its options as direct children / an ARRAY,
 *  not wrapped in a `<>` fragment — a fragment is the single child and gets
 *  filtered out, leaving the trigger on its placeholder. */
const selectOpts = () => [
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
/** MetroSelect needs an ARRAY (not a fragment) so Children.toArray sees the
 *  options directly — see MetroSelect.dom.test.tsx for the rationale. */
const metroOpts = () => [
  <MetroSelect.Option
    key='a'
    value='a'
    icon='mdi:home'
    label='Alpha'
  />,
  <MetroSelect.Option
    key='b'
    value='b'
    icon='mdi:briefcase'
    label='Beta'
  />,
  <MetroSelect.Option
    key='c'
    value='c'
    icon='mdi:airplane'
    label='Gamma'
  />,
];

/*───────────────────────────────────────────────────────────────*/
/* Adapter contract                                              */

interface Adapter<V> {
  /** Component display name (row label + the FormControl key). */
  name: string;
  /** A "first" value and a "second" value the component can take. */
  first: V;
  second: V;
  /** Render in pure-controlled mode (`value`-equivalent prop set to v). An
   *  optional change-request spy is wired to the component's `onValueChange`. */
  controlled: (v: V, key: string, onChange?: OnChangeSpy<V>) => React.ReactElement;
  /** Render in pure-uncontrolled mode (`defaultValue`-equivalent = v). */
  uncontrolled: (v: V) => React.ReactElement;
  /** Children passed inside the FormControl for the form-bound scenarios. */
  formChild: (extra: { value?: V; key: string }) => React.ReactElement;
  /** Read the current rendered value off the DOM, normalized to V. */
  read: (c: HTMLElement) => V;
  /** Drive a user edit toward `second`; returns nothing (read after). */
  edit: (c: HTMLElement) => void;
  /** Store seed object for the form-bound scenarios. */
  seed: (v: V) => Record<string, V>;
  /** Whether the controlled DOM reliably reflects the controlled prop after a
   *  rejected edit. Default true. Iterator is the lone `false`: its display
   *  `<input>` optimistically shows the typed/stepped value and never reverts
   *  while the controlled `value` is unchanged (an FF S9 display quirk — see the
   *  scenario-1 note). The hook-level contract (`current` stays pinned) is still
   *  proven via the change request's `previousValue`. */
  controlledDomPins?: boolean;
}

/** Spy shape for a component's `onValueChange` (value, info). */
type OnChangeSpy<V> = (value: V, info: { previousValue?: V }) => void;

/* Helper readers --------------------------------------------------- */
const textInput = (c: HTMLElement) => c.querySelector('input')! as HTMLInputElement;
const switchTrack = (c: HTMLElement) => c.querySelector('button[role="switch"]')!;
const checkboxInput = (c: HTMLElement) =>
  c.querySelector('input[type="checkbox"]') as HTMLInputElement;
const sliderThumb = (c: HTMLElement) => c.querySelector('[role="slider"]') as HTMLElement;
const numberInput = (c: HTMLElement) => c.querySelector('input[type="number"]') as HTMLInputElement;
const radioFor = (c: HTMLElement, v: string) =>
  Array.from(c.querySelectorAll<HTMLInputElement>('input[type="radio"]')).find(
    (r) => r.value === v,
  )!;
const selectTriggerText = (c: HTMLElement) =>
  c.querySelector('[data-valet-component="Select"] span')?.textContent ?? '';
const metroTiles = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLElement>('[role="option"]'));
const tabSelected = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>('[role="tab"]')).findIndex(
    (t) => t.getAttribute('aria-selected') === 'true',
  );
const accordionExpanded = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>('button[aria-expanded]'))
    .map((b, i) => (b.getAttribute('aria-expanded') === 'true' ? i : -1))
    .filter((i) => i >= 0);

/* DateSelector day-grid helpers (mirrors DateSelector.fields.dom.test.tsx). */
const dayCells = (c: HTMLElement): HTMLButtonElement[] =>
  Array.from(c.querySelectorAll('button')).filter(
    (b) =>
      !b.hasAttribute('aria-label') &&
      !b.closest('[data-valet-component="Select"]') &&
      /^\d+$/.test(b.textContent ?? ''),
  ) as HTMLButtonElement[];
/** The uniquely-classed (start-selected) day cell's number, or null. */
const selectedDay = (c: HTMLElement): number | null => {
  const cells = dayCells(c);
  const counts = new Map<string, number>();
  for (const cell of cells) counts.set(cell.className, (counts.get(cell.className) ?? 0) + 1);
  const unique = cells.find((cell) => counts.get(cell.className) === 1);
  return unique ? Number(unique.textContent) : null;
};
const clickDay = (c: HTMLElement, day: number) => {
  const cell = dayCells(c).find((b) => b.textContent === String(day));
  if (!cell) throw new Error(`day cell ${day} not found`);
  clickEl(cell);
};
/** A fixed June-2025 ISO date for the given day-of-month. */
const juneIso = (day: number) => `2025-06-${String(day).padStart(2, '0')}`;

/*───────────────────────────────────────────────────────────────*/
/* The component table                                           */

/* eslint-disable @typescript-eslint/no-explicit-any */
const ADAPTERS: Array<Adapter<any>> = [
  {
    name: 'TextField',
    first: 'alpha',
    second: 'omega',
    controlled: (v, key, onChange) => (
      <TextField
        name={key}
        value={v as string}
        onValueChange={onChange}
      />
    ),
    // `name` is required by TextFieldProps; with no enclosing FormControl the
    // form layer is skipped (`formBound = form && name` ⇒ false), so this stays
    // a pure-uncontrolled input. `as string` resolves the input/textarea union.
    uncontrolled: (v) => (
      <TextField
        name='field'
        defaultValue={v as string}
      />
    ),
    formChild: ({ value, key }) => (
      <TextField
        name={key}
        value={value as string}
      />
    ),
    read: (c) => textInput(c).value,
    edit: (c) => fireInput(textInput(c), 'omega'),
    seed: (v) => ({ field: v }),
  },
  {
    name: 'Switch',
    first: false,
    second: true,
    controlled: (v, key, onChange) => (
      <Switch
        name={key}
        checked={v}
        onValueChange={onChange}
        aria-label='Field'
      />
    ),
    uncontrolled: (v) => (
      <Switch
        defaultChecked={v}
        aria-label='Field'
      />
    ),
    formChild: ({ value, key }) => (
      <Switch
        name={key}
        checked={value}
        aria-label='Field'
      />
    ),
    read: (c) => switchTrack(c).getAttribute('aria-checked') === 'true',
    edit: (c) => clickEl(switchTrack(c), 1),
    seed: (v) => ({ field: v }),
  },
  {
    name: 'Checkbox',
    first: false,
    second: true,
    controlled: (v, key, onChange) => (
      <Checkbox
        name={key}
        checked={v}
        onValueChange={onChange}
        aria-label='Field'
      />
    ),
    uncontrolled: (v) => (
      <Checkbox
        defaultChecked={v}
        aria-label='Field'
      />
    ),
    formChild: ({ value, key }) => (
      <Checkbox
        name={key}
        checked={value}
        aria-label='Field'
      />
    ),
    read: (c) => checkboxInput(c).checked,
    edit: (c) => clickEl(checkboxInput(c), 1),
    seed: (v) => ({ field: v }),
  },
  {
    name: 'Select',
    first: 'a',
    second: 'b',
    controlled: (v, key, onChange) => (
      <Select
        name={key}
        value={v}
        onValueChange={onChange}
        aria-label='Field'
      >
        {selectOpts()}
      </Select>
    ),
    uncontrolled: (v) => (
      <Select
        defaultValue={v}
        aria-label='Field'
      >
        {selectOpts()}
      </Select>
    ),
    formChild: ({ value, key }) => (
      <Select
        name={key}
        value={value}
        aria-label='Field'
      >
        {selectOpts()}
      </Select>
    ),
    // The trigger renders the selected option's label; map back to value.
    read: (c) => ({ Alpha: 'a', Beta: 'b', Gamma: 'c' })[selectTriggerText(c)] ?? null,
    edit: (c) => {
      const menu = openSelect(c);
      const opt = menu.querySelectorAll<HTMLLIElement>('li[role="option"]')[1]; // 'b'
      clickEl(opt);
    },
    seed: (v) => ({ field: v }),
  },
  {
    name: 'MetroSelect',
    first: 'a',
    second: 'b',
    controlled: (v, key, onChange) => (
      <MetroSelect
        name={key}
        value={v}
        onValueChange={onChange}
      >
        {metroOpts()}
      </MetroSelect>
    ),
    uncontrolled: (v) => <MetroSelect defaultValue={v}>{metroOpts()}</MetroSelect>,
    formChild: ({ value, key }) => (
      <MetroSelect
        name={key}
        value={value}
      >
        {metroOpts()}
      </MetroSelect>
    ),
    read: (c) => {
      const sel = metroTiles(c).findIndex((t) => t.getAttribute('aria-selected') === 'true');
      return sel < 0 ? null : ['a', 'b', 'c'][sel];
    },
    edit: (c) => clickEl(metroTiles(c)[1], 1), // pick 'b'
    seed: (v) => ({ field: v }),
  },
  {
    name: 'RadioGroup',
    first: 'a',
    second: 'b',
    controlled: (v, key, onChange) => (
      <RadioGroup
        name={key}
        value={v}
        onValueChange={onChange}
      >
        {radioOpts}
      </RadioGroup>
    ),
    uncontrolled: (v) => <RadioGroup defaultValue={v}>{radioOpts}</RadioGroup>,
    formChild: ({ value, key }) => (
      <RadioGroup
        name={key}
        value={value}
      >
        {radioOpts}
      </RadioGroup>
    ),
    read: (c) => ['a', 'b', 'c'].find((v) => radioFor(c, v).checked) ?? null,
    edit: (c) => clickEl(radioFor(c, 'b'), 1),
    seed: (v) => ({ field: v }),
  },
  {
    name: 'Slider',
    // Both values are multiples of the step, so `first + step` is already
    // step-aligned and `snap='step'` is a no-op: one ArrowRight moves the value
    // exactly 40 → 80 (computeKeyStep returns the configured step in snap mode —
    // this also guards the FIELDS S2 keyStep-floor fix's stepped path).
    first: 40,
    second: 80,
    controlled: (v, key, onChange) => (
      <Slider
        name={key}
        value={v}
        min={0}
        max={120}
        snap='step'
        step={40}
        onValueChange={onChange}
        aria-label='Field'
      />
    ),
    uncontrolled: (v) => (
      <Slider
        defaultValue={v}
        min={0}
        max={120}
        snap='step'
        step={40}
        aria-label='Field'
      />
    ),
    formChild: ({ value, key }) => (
      <Slider
        name={key}
        value={value}
        min={0}
        max={120}
        snap='step'
        step={40}
        aria-label='Field'
      />
    ),
    read: (c) => Number(sliderThumb(c).getAttribute('aria-valuenow')),
    edit: (c) => pressKey(sliderThumb(c), 'ArrowRight'),
    seed: (v) => ({ field: v }),
  },
  {
    name: 'Iterator',
    first: 3,
    second: 4,
    controlled: (v, key, onChange) => (
      <Iterator
        name={key}
        value={v}
        onValueChange={onChange}
        aria-label='Field'
      />
    ),
    uncontrolled: (v) => (
      <Iterator
        defaultValue={v}
        aria-label='Field'
      />
    ),
    formChild: ({ value, key }) => (
      <Iterator
        name={key}
        value={value}
        aria-label='Field'
      />
    ),
    read: (c) => Number(numberInput(c).value),
    edit: (c) => clickEl(c.querySelector('button[aria-label="increment"]')!),
    seed: (v) => ({ field: v }),
    // The display <input> optimistically shows the stepped value and does not
    // revert while the controlled `value` is unchanged (FF S9 quirk). The hook
    // keeps `current` pinned — proven by the change request's previousValue.
    controlledDomPins: false,
  },
  {
    // Single-date mode (the only mode with a FormControl binding — `range`
    // mode passes `name: undefined` to the hook). Values are ISO strings in a
    // fixed June-2025 view so the month/year never shift; `read` reconstructs
    // the ISO from the uniquely-classed selected day cell.
    name: 'DateSelector',
    first: juneIso(10),
    second: juneIso(18),
    controlled: (v, key, onChange) => (
      <DateSelector
        name={key}
        value={v}
        onValueChange={onChange}
      />
    ),
    uncontrolled: (v) => <DateSelector defaultValue={v} />,
    formChild: ({ value, key }) => (
      <DateSelector
        name={key}
        value={value}
      />
    ),
    read: (c) => {
      const day = selectedDay(c);
      return day == null ? null : juneIso(day);
    },
    edit: (c) => clickDay(c, 18),
    seed: (v) => ({ field: v }),
  },
];
/* eslint-enable @typescript-eslint/no-explicit-any */

/*───────────────────────────────────────────────────────────────*/
/* Scenario 1 — pure-controlled                                  */

describe('controlled contract — pure-controlled (prop is the source of truth)', () => {
  for (const a of ADAPTERS) {
    it(`${a.name}: a defined value prop renders, the view never self-updates, no stray console`, () => {
      const requests: Array<{ value: unknown; previousValue?: unknown }> = [];
      const onChange: OnChangeSpy<unknown> = (value, info) =>
        requests.push({ value, previousValue: info.previousValue });

      const { container } = mount(a.controlled(a.first, 'field', onChange));
      expect(a.read(container)).toEqual(a.first);

      // A user edit fires the change *request* (the parent decides), but with
      // no parent re-render the controlled value the hook resolves stays
      // pinned to `first` — the latched-controlled contract the old per-field
      // guards diverged on.
      a.edit(container);

      // The edit reached the handler asking for `second`...
      expect(requests.length).toBeGreaterThan(0);
      expect(requests[0].value).toEqual(a.second);
      // ...and `previousValue` is `first`, proving the hook never advanced its
      // resolved value (true even for Iterator, whose display input optimistic-
      // ally shows the stepped number).
      expect(requests[0].previousValue).toEqual(a.first);

      if (a.controlledDomPins !== false) {
        // The DOM reflects the unchanged controlled value.
        expect(a.read(container)).toEqual(a.first);
      }

      expect(strayConsole()).toEqual([]);
      expect(valetWarns()).toEqual([]);
    });
  }
});

/*───────────────────────────────────────────────────────────────*/
/* Scenario 2 — pure-uncontrolled                                */

describe('controlled contract — pure-uncontrolled (defaultValue seeds, edits move it)', () => {
  for (const a of ADAPTERS) {
    it(`${a.name}: defaultValue seeds the view and a user edit advances it, no stray console`, () => {
      const { container } = mount(a.uncontrolled(a.first));
      expect(a.read(container)).toEqual(a.first);

      a.edit(container);
      expect(a.read(container)).toEqual(a.second);

      expect(strayConsole()).toEqual([]);
      expect(valetWarns()).toEqual([]);
    });
  }
});

/*───────────────────────────────────────────────────────────────*/
/* Scenario 3 — form-bound (seeded key reads + writes through)   */

describe('controlled contract — form-bound (seeded key drives render + writes through)', () => {
  for (const a of ADAPTERS) {
    it(`${a.name}: a seeded FormControl key drives the initial render and edits write through, no stray console`, () => {
      const useStore = createFormStore<Record<string, unknown>>(a.seed(a.first));
      const { container } = mount(
        <FormControl useStore={useStore}>{a.formChild({ key: 'field' })}</FormControl>,
      );

      // Seeded value reads through to the view (RadioGroup/Select/MetroSelect
      // used to be write-only and rendered nothing selected here — the
      // authorized FF S8 flip).
      expect(a.read(container)).toEqual(a.first);

      a.edit(container);
      expect(useStore.getState().values.field).toEqual(a.second);
      expect(a.read(container)).toEqual(a.second);

      // A correctly-seeded key emits NO "unseeded" warning and nothing strays.
      expect(strayConsole()).toEqual([]);
      expect(valetWarns()).toEqual([]);
    });
  }
});

/*───────────────────────────────────────────────────────────────*/
/* Scenario 4 — prop + form conflict (prop wins, exactly one warn) */

describe('controlled contract — prop+form conflict (prop wins for render, one dev-warn)', () => {
  for (const a of ADAPTERS) {
    it(`${a.name}: an explicit value prop wins over the form binding and dev-warns exactly once`, () => {
      // Store seeds `second`; the explicit prop forces `first` — the prop
      // must win for rendering.
      const useStore = createFormStore<Record<string, unknown>>(a.seed(a.second));
      const { container } = mount(
        <FormControl useStore={useStore}>
          {a.formChild({ key: 'field', value: a.first })}
        </FormControl>,
      );

      expect(a.read(container)).toEqual(a.first);
      // Exactly one valet warning, and it is the prop+form-conflict notice.
      const warns = valetWarns();
      expect(warns).toHaveLength(1);
      expect(warns[0]).toContain('both an explicit `value` prop and a FormControl binding');
      // No NON-valet console noise (no React controlled-flip warning).
      expect(strayConsole()).toEqual([]);
    });
  }
});

/*───────────────────────────────────────────────────────────────*/
/* Tabs + Accordion — useControlledState (no form layer)         */
/* These take `useControlledState` directly (ruling R9, FF S10):  */
/* the same controlled/uncontrolled contract, no FormControl.     */

const tabsTree = (props: { value?: string; defaultValue?: string }) => (
  <Tabs {...props}>
    {/* Explicit string values so a controlled `value='b'` resolves to a tab —
        a Tab without `value` falls back to its index, which would never match. */}
    <Tabs.Tab
      label='A'
      value='a'
    />
    <Tabs.Tab
      label='B'
      value='b'
    />
    <Tabs.Tab
      label='C'
      value='c'
    />
    <Tabs.Panel>panel-a</Tabs.Panel>
    <Tabs.Panel>panel-b</Tabs.Panel>
    <Tabs.Panel>panel-c</Tabs.Panel>
  </Tabs>
);

describe('controlled contract — Tabs (useControlledState)', () => {
  it('pure-controlled: `value` selects the tab in the first paint and never self-moves', () => {
    const { container } = mount(tabsTree({ value: 'b' }));
    expect(tabSelected(container)).toBe(1);

    // Clicking another tab reports intent but the controlled view stays put.
    const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    clickEl(tabs[2]);
    expect(tabSelected(container)).toBe(1);

    expect(strayConsole()).toEqual([]);
    expect(valetWarns()).toEqual([]);
  });

  it('pure-uncontrolled: `defaultValue` selects, and clicking advances the selection', () => {
    const { container } = mount(tabsTree({ defaultValue: 'a' }));
    expect(tabSelected(container)).toBe(0);

    const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    clickEl(tabs[2]);
    expect(tabSelected(container)).toBe(2);

    expect(strayConsole()).toEqual([]);
    expect(valetWarns()).toEqual([]);
  });
});

/* API-TYPES S9 renamed Accordion `open`/`defaultOpen` → `expanded`/
   `defaultExpanded` (Q12). The contract suite tracks the canonical names so
   it tests the controlled behaviour, not the deprecation path (which has its
   own suite in Accordion.deprecate.dom.test.tsx and would otherwise dirty the
   strayConsole/valetWarns assertions). */
const accordionTree = (props: {
  expanded?: number | number[];
  defaultExpanded?: number | number[];
}) => (
  <Accordion {...props}>
    <Accordion.Item header='First'>one</Accordion.Item>
    <Accordion.Item header='Second'>two</Accordion.Item>
    <Accordion.Item header='Third'>three</Accordion.Item>
  </Accordion>
);

describe('controlled contract — Accordion (useControlledState)', () => {
  it('pure-controlled: `expanded={0}` stays controlled — clicks report intent, view never self-moves', () => {
    const { container } = mount(accordionTree({ expanded: 0 }));
    expect(accordionExpanded(container)).toEqual([0]);

    const headers = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button[aria-expanded]'),
    );
    clickEl(headers[1]);
    // Controlled: the parent didn't change `expanded`, so the view is unchanged.
    expect(accordionExpanded(container)).toEqual([0]);

    expect(strayConsole()).toEqual([]);
    expect(valetWarns()).toEqual([]);
  });

  it('pure-uncontrolled: `defaultExpanded` seeds and a header click toggles the panel', () => {
    const { container } = mount(accordionTree({ defaultExpanded: 0 }));
    expect(accordionExpanded(container)).toEqual([0]);

    const headers = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button[aria-expanded]'),
    );
    clickEl(headers[1]);
    // Single-open accordion: opening the second collapses the first.
    expect(accordionExpanded(container)).toEqual([1]);

    expect(strayConsole()).toEqual([]);
    expect(valetWarns()).toEqual([]);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* SOURCE-LEVEL gate — the copy-pasted guard must stay deleted    */

describe('controlled contract — source-level: the copy-pasted guard is gone', () => {
  // Resolve the fields directory from this test file's own location so the
  // assertion is independent of the process cwd.
  const fieldsDir = path.dirname(fileURLToPath(import.meta.url));
  const layoutDir = path.resolve(fieldsDir, '../layout');

  /** Strip // line comments and /* block comments *​/ so a comment that merely
   *  MENTIONS the old guard (several files reference it in their migration
   *  notes) does not trip the source-level grep — only live code counts. */
  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  }

  /** The migrated field files (components, not tests). */
  function fieldSources(): Array<{ file: string; code: string }> {
    const fieldFiles = readdirSync(fieldsDir)
      .filter((f) => f.endsWith('.tsx') && !f.includes('.test.') && !f.endsWith('.meta.json'))
      .map((f) => path.join(fieldsDir, f));
    const layoutFiles = ['Tabs.tsx', 'Accordion.tsx'].map((f) => path.join(layoutDir, f));
    return [...fieldFiles, ...layoutFiles].map((file) => ({
      file: path.basename(file),
      code: stripComments(readFileSync(file, 'utf8')),
    }));
  }

  it('no field component declares the hand-rolled `initialCtl` mount-latch ref', () => {
    // The exact copy-pasted guard: `const initialCtl = (React.)?useRef<...>(undefined)`
    // plus the `initialCtl.current === undefined` first-render assignment. It was
    // duplicated verbatim across all 9 field components (+ Accordion's private
    // hook + TextField's `externalValue !== undefined || Boolean(form && name)`)
    // before the FF S5–S10 migrations onto useControlledState/useFieldState.
    const offenders = fieldSources().filter(
      ({ code }) =>
        /\binitialCtl\b/.test(code) || /initialCtl\.current\s*===\s*undefined/.test(code),
    );
    expect(offenders.map((o) => o.file)).toEqual([]);
  });

  it('no field component re-introduces the old form-wins predicate `Boolean(form && name)`', () => {
    // TextField's original `isControlled = externalValue !== undefined ||
    // Boolean(form && name)` was the canonical form-wins guard. The shared
    // hooks encode prop > form > internal; this predicate must not reappear.
    const offenders = fieldSources().filter(({ code }) =>
      /Boolean\(\s*form\s*&&\s*name\s*\)/.test(code),
    );
    expect(offenders.map((o) => o.file)).toEqual([]);
  });

  it('every migrated field routes through the shared hook (positive guard)', () => {
    // Counterpart to the negative greps: prove the suite is actually covering
    // live code — each component file must import the shared primitive. (This
    // would fail loudly if a future edit hand-rolled state again instead.)
    const required = [
      'TextField.tsx',
      'Switch.tsx',
      'Checkbox.tsx',
      'Select.tsx',
      'MetroSelect.tsx',
      'RadioGroup.tsx',
      'Slider.tsx',
      'Iterator.tsx',
      'DateSelector.tsx',
      'Tabs.tsx',
      'Accordion.tsx',
    ];
    const byName = new Map(fieldSources().map((s) => [s.file, s.code]));
    const missing = required.filter(
      (f) => !/useControlledState|useFieldState/.test(byName.get(f) ?? ''),
    );
    expect(missing).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// src/system/events.contract.dom.test.tsx | valet
// API-TYPES S5 (ruling R10) — the ChangeInfo cross-field CONTRACT MATRIX.
//
// This is the uniform gate for the canonical classification table in
// `src/system/events.ts`. The FIELDS migrations implemented `ChangeInfo.source`
// honesty per component; this suite VERIFIES it uniformly: every migrated value
// component is driven through its real pointer / keyboard / clipboard / wheel
// interactions and the emitted `ChangeInfo.source` + `phase` are asserted
// against the one table.
//
// Discipline (ruling R10): if a field's emitted `source` disagrees with the
// table, this matrix FLAGS it (the assertion fails) — it is NOT this slice's
// job to fix the field. The fix lives in the field's own lane; the matrix is
// the gate that makes the disagreement visible.
//
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import type { ChangeInfo, InputPhase, InputSource } from './events';

import { TextField } from '../components/fields/TextField';
import { Checkbox } from '../components/fields/Checkbox';
import { Switch } from '../components/fields/Switch';
import { RadioGroup, Radio } from '../components/fields/RadioGroup';
import { Select } from '../components/fields/Select';
import { MetroSelect } from '../components/fields/MetroSelect';
import { Slider } from '../components/fields/Slider';
import { Iterator } from '../components/fields/Iterator';
import { DateSelector } from '../components/fields/DateSelector';
import { Tabs } from '../components/layout/Tabs';
import { Surface } from '../components/layout/Surface';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Select repositions via ResizeObserver; jsdom lacks it --------------- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
  }
});

/*───────────────────────────────────────────────────────────────*/
/* Harness                                                        */

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function mount(node: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    // NOT StrictMode: a few of these fields double-fire effects under
    // StrictMode; the source/phase contract is independent of that and the
    // per-field suites cover StrictMode separately. We assert on the events
    // each interaction emits, not the render count.
    root.render(node);
  });
  return { container };
}

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

const overlayRoot = () => document.getElementById('valet-overlay-root');

/** Every InputSource the matrix has actually observed — asserted complete. */
const observedSources = new Set<InputSource>();
/** Every InputPhase the matrix has actually observed. */
const observedPhases = new Set<InputPhase>();

/**
 * A `vi.fn`-free collector that records every emitted ChangeInfo and folds its
 * `source`/`phase` into the global coverage sets. Using this everywhere keeps
 * the vocabulary-coverage test (below) honest.
 */
function sink<T>() {
  const infos: ChangeInfo<T>[] = [];
  const collect = (_v: T, info: ChangeInfo<T>) => {
    infos.push(info);
    observedSources.add(info.source);
    observedPhases.add(info.phase);
  };
  return { infos, collect };
}

/* Interaction primitives mirroring how a browser delivers each gesture. */

/** A pointer click (detail ≥ 1) vs. keyboard activation (detail 0). */
function clickWithDetail(el: Element, detail: number) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
  });
}

function keydown(el: Element, key: string) {
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
}

/**
 * Edit a text input the way the browser does: write through the native value
 * setter (so React's controlled tracker sees a change) and dispatch an `input`
 * event carrying the given `inputType`. `inputType: undefined` dispatches a
 * plain Event (a programmatic value write + dispatch).
 */
function fireEdit(el: HTMLInputElement, value: string, inputType?: string) {
  act(() => {
    const proto = Object.getPrototypeOf(el) as object;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    setter?.call(el, value);
    const ev =
      inputType !== undefined
        ? new InputEvent('input', { bubbles: true, inputType, data: value })
        : new Event('input', { bubbles: true });
    el.dispatchEvent(ev);
  });
}

const sourcesOf = <T,>(infos: ChangeInfo<T>[]) => infos.map((i) => i.source);
const phasesOf = <T,>(infos: ChangeInfo<T>[]) => infos.map((i) => i.phase);

/*════════════════════════════════════════════════════════════════*/
/* TextField — typing ⇒ keyboard · paste ⇒ clipboard ·            */
/*             programmatic ⇒ programmatic · Enter ⇒ keyboard ·   */
/*             blur ⇒ programmatic                                 */
/*════════════════════════════════════════════════════════════════*/
describe('ChangeInfo matrix — TextField', () => {
  it('typing ⇒ keyboard, paste ⇒ clipboard, drop ⇒ clipboard, programmatic ⇒ programmatic (all phase input)', () => {
    const change = sink<string>();
    const { container } = mount(
      <TextField
        name='t'
        onValueChange={change.collect}
      />,
    );
    const el = container.querySelector('input') as HTMLInputElement;

    fireEdit(el, 'typed', 'insertText');
    fireEdit(el, 'pasted', 'insertFromPaste');
    fireEdit(el, 'pasted-quote', 'insertFromPasteAsQuotation');
    fireEdit(el, 'dropped', 'insertFromDrop');
    fireEdit(el, 'external'); // plain Event → not an InputEvent

    expect(sourcesOf(change.infos)).toEqual([
      'keyboard',
      'clipboard',
      'clipboard',
      'clipboard',
      'programmatic',
    ]);
    expect(phasesOf(change.infos).every((p) => p === 'input')).toBe(true);
  });

  it("Enter commits as 'keyboard', blur commits as 'programmatic'", () => {
    const commit = sink<string>();
    const { container } = mount(
      <TextField
        name='t'
        onValueCommit={commit.collect}
      />,
    );
    const el = container.querySelector('input') as HTMLInputElement;

    fireEdit(el, 'value', 'insertText');
    keydown(el, 'Enter');
    act(() => {
      // React delegates blur via the bubbling `focusout` event at the root.
      el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    });

    expect(sourcesOf(commit.infos)).toEqual(['keyboard', 'programmatic']);
    expect(phasesOf(commit.infos).every((p) => p === 'commit')).toBe(true);
  });
});

/*════════════════════════════════════════════════════════════════*/
/* Checkbox — pointer click (detail≥1) ⇒ pointer ·                */
/*            keyboard activation (detail 0) ⇒ keyboard           */
/*════════════════════════════════════════════════════════════════*/
describe('ChangeInfo matrix — Checkbox', () => {
  it("pointer click ⇒ 'pointer', keyboard activation ⇒ 'keyboard'", () => {
    const change = sink<boolean>();
    const { container } = mount(
      <Checkbox
        name='c'
        onValueChange={change.collect}
      />,
    );
    const el = container.querySelector('input[type="checkbox"]') as HTMLInputElement;

    clickWithDetail(el, 1); // genuine pointer
    clickWithDetail(el, 0); // Space/Enter ⇒ synthetic click, detail 0

    expect(sourcesOf(change.infos)).toEqual(['pointer', 'keyboard']);
  });
});

/*════════════════════════════════════════════════════════════════*/
/* Switch — pointer click ⇒ pointer · keyboard activation ⇒ keyboard */
/*════════════════════════════════════════════════════════════════*/
describe('ChangeInfo matrix — Switch', () => {
  it("pointer click ⇒ 'pointer', keyboard activation ⇒ 'keyboard'", () => {
    const change = sink<boolean>();
    const { container } = mount(
      <Switch
        name='s'
        onValueChange={change.collect}
      />,
    );
    const el = container.querySelector('[role="switch"]') as HTMLElement;

    clickWithDetail(el, 1);
    clickWithDetail(el, 0);

    expect(sourcesOf(change.infos)).toEqual(['pointer', 'keyboard']);
  });
});

/*════════════════════════════════════════════════════════════════*/
/* RadioGroup — pointer click ⇒ pointer · keyboard (detail 0) ⇒    */
/*              keyboard                                           */
/*════════════════════════════════════════════════════════════════*/
describe('ChangeInfo matrix — RadioGroup', () => {
  it("pointer click ⇒ 'pointer', keyboard activation ⇒ 'keyboard'", () => {
    const change = sink<string>();
    const { container } = mount(
      <RadioGroup
        name='r'
        onValueChange={change.collect}
      >
        <Radio value='a'>A</Radio>
        <Radio value='b'>B</Radio>
      </RadioGroup>,
    );
    const radios = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'));

    clickWithDetail(radios[0], 1); // pointer
    clickWithDetail(radios[1], 0); // synthetic keyboard click

    expect(sourcesOf(change.infos)).toEqual(['pointer', 'keyboard']);
  });
});

/*════════════════════════════════════════════════════════════════*/
/* Select — option pointer click ⇒ pointer · option keyboard ⇒    */
/*           keyboard (real portal into #valet-overlay-root)      */
/*════════════════════════════════════════════════════════════════*/
describe('ChangeInfo matrix — Select', () => {
  const liveMenu = () =>
    overlayRoot()?.querySelector<HTMLUListElement>('ul[role="listbox"]') ?? null;

  function openMenu(container: HTMLElement) {
    const trigger = container.querySelector('[data-valet-component="Select"]')!;
    clickWithDetail(trigger, 1);
    const menu = liveMenu();
    expect(menu).not.toBeNull();
    return menu as HTMLUListElement;
  }

  it("option pointer click ⇒ 'pointer' (phase input + commit)", () => {
    const change = sink<unknown>();
    const commit = sink<unknown>();
    const { container } = mount(
      <Select
        placeholder='Pick…'
        onValueChange={change.collect}
        onValueCommit={commit.collect}
      >
        <Select.Option value='a'>Alpha</Select.Option>
        <Select.Option value='b'>Beta</Select.Option>
      </Select>,
    );
    const menu = openMenu(container);
    const option = menu.querySelectorAll('li[role="option"]')[1];
    clickWithDetail(option, 1);

    expect(sourcesOf(change.infos)).toEqual(['pointer']);
    expect(phasesOf(change.infos)).toEqual(['input']);
    expect(sourcesOf(commit.infos)).toEqual(['pointer']);
    expect(phasesOf(commit.infos)).toEqual(['commit']);
  });

  it("option keyboard (Enter in menu) ⇒ 'keyboard'", () => {
    const commit = sink<unknown>();
    const { container } = mount(
      <Select
        placeholder='Pick…'
        onValueCommit={commit.collect}
      >
        <Select.Option value='a'>Alpha</Select.Option>
        <Select.Option value='b'>Beta</Select.Option>
      </Select>,
    );
    const menu = openMenu(container);
    keydown(menu, 'ArrowDown'); // move active to a real option
    keydown(menu, 'Enter'); // select the active option via keyboard

    expect(commit.infos.length).toBeGreaterThan(0);
    expect(sourcesOf(commit.infos).every((s) => s === 'keyboard')).toBe(true);
  });
});

/*════════════════════════════════════════════════════════════════*/
/* MetroSelect — tile pointer click ⇒ pointer · tile keyboard ⇒    */
/*               keyboard                                          */
/*════════════════════════════════════════════════════════════════*/
describe('ChangeInfo matrix — MetroSelect', () => {
  it("tile pointer click ⇒ 'pointer'", () => {
    const commit = sink<unknown>();
    const { container } = mount(
      <Surface>
        <MetroSelect onValueCommit={commit.collect}>
          <MetroSelect.Option
            value='a'
            icon='mdi:home'
            label='Alpha'
          />
          <MetroSelect.Option
            value='b'
            icon='mdi:briefcase'
            label='Beta'
          />
        </MetroSelect>
      </Surface>,
    );
    const tiles = Array.from(container.querySelectorAll<HTMLElement>('[role="option"]'));
    clickWithDetail(tiles[1], 1);

    expect(sourcesOf(commit.infos)).toEqual(['pointer']);
    expect(phasesOf(commit.infos)).toEqual(['commit']);
  });

  it("tile keyboard (Enter) ⇒ 'keyboard'", () => {
    const commit = sink<unknown>();
    const { container } = mount(
      <Surface>
        <MetroSelect onValueCommit={commit.collect}>
          <MetroSelect.Option
            value='a'
            icon='mdi:home'
            label='Alpha'
          />
          <MetroSelect.Option
            value='b'
            icon='mdi:briefcase'
            label='Beta'
          />
        </MetroSelect>
      </Surface>,
    );
    const listbox = container.querySelector('[role="listbox"]') as HTMLElement;
    keydown(listbox, 'Enter');

    expect(commit.infos.length).toBeGreaterThan(0);
    expect(sourcesOf(commit.infos).every((s) => s === 'keyboard')).toBe(true);
  });
});

/*════════════════════════════════════════════════════════════════*/
/* Slider — arrow/Page/Home/End keys ⇒ keyboard · pointer ⇒ pointer */
/*════════════════════════════════════════════════════════════════*/
describe('ChangeInfo matrix — Slider', () => {
  it("arrow/Page/Home/End keys ⇒ 'keyboard' (phase commit)", () => {
    const commit = sink<number>();
    const { container } = mount(
      <Slider
        min={0}
        max={100}
        value={50}
        onValueCommit={commit.collect}
      />,
    );
    const thumb = container.querySelector('[role="slider"]') as HTMLElement;
    keydown(thumb, 'ArrowRight');
    keydown(thumb, 'PageUp');
    keydown(thumb, 'Home');
    keydown(thumb, 'End');

    expect(commit.infos.length).toBe(4);
    expect(sourcesOf(commit.infos)).toEqual(['keyboard', 'keyboard', 'keyboard', 'keyboard']);
    expect(phasesOf(commit.infos).every((p) => p === 'commit')).toBe(true);
  });

  it("pointer drag ⇒ 'pointer'", () => {
    const change = sink<number>();
    const { container } = mount(
      <Slider
        min={0}
        max={100}
        value={50}
        onValueChange={change.collect}
      />,
    );
    const track = container.querySelector('[aria-hidden]') as HTMLElement;
    act(() => {
      track.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 50 }),
      );
    });
    act(() => {
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: 50 }));
    });

    expect(change.infos.length).toBeGreaterThan(0);
    expect(sourcesOf(change.infos).every((s) => s === 'pointer')).toBe(true);
  });
});

/*════════════════════════════════════════════════════════════════*/
/* Iterator — +/- buttons ⇒ pointer · arrow keys ⇒ keyboard ·      */
/*            wheel ⇒ wheel                                         */
/*════════════════════════════════════════════════════════════════*/
describe('ChangeInfo matrix — Iterator', () => {
  it("buttons ⇒ 'pointer', arrow keys ⇒ 'keyboard', wheel ⇒ 'wheel'", () => {
    const commit = sink<number>();
    const { container } = mount(
      <Iterator
        value={2}
        step={1}
        wheelBehavior='hover'
        onValueCommit={commit.collect}
      />,
    );
    const inc = container.querySelector('button[aria-label="increment"]') as HTMLButtonElement;
    const field = container.querySelector('input[type="number"]') as HTMLInputElement;

    // +/- button: a real click carries detail >= 1 in a browser; even detail 0
    // here, Iterator hardcodes 'pointer' for the +/- button path (the button
    // handler passes 'pointer' explicitly, independent of click detail).
    clickWithDetail(inc, 1);
    keydown(field, 'ArrowUp');
    act(() => {
      field.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -1 }));
    });

    expect(sourcesOf(commit.infos)).toEqual(['pointer', 'keyboard', 'wheel']);
    expect(phasesOf(commit.infos).every((p) => p === 'commit')).toBe(true);
  });
});

/*════════════════════════════════════════════════════════════════*/
/* DateSelector — day-cell click ⇒ pointer                         */
/*════════════════════════════════════════════════════════════════*/
describe('ChangeInfo matrix — DateSelector', () => {
  /** Day-grid cells: numbered <button>s, excluding the header Select options. */
  function dayCells(container: HTMLElement): HTMLButtonElement[] {
    return Array.from(container.querySelectorAll('button')).filter(
      (b) =>
        /^\d+$/.test((b.textContent ?? '').trim()) &&
        !b.closest('[data-valet-component="Select"]') &&
        !b.closest('ul[role="listbox"]'),
    );
  }

  it("day click ⇒ 'pointer' (phase input + commit)", () => {
    const change = sink<string | [string, string]>();
    const commit = sink<string | [string, string]>();
    const { container } = mount(
      <DateSelector
        name='d'
        value='2026-06-10'
        onValueChange={change.collect}
        onValueCommit={commit.collect}
      />,
    );
    const cells = dayCells(container);
    const target = cells.find((b) => b.textContent?.trim() === '15') ?? cells[0];
    clickWithDetail(target, 1);

    expect(change.infos.length).toBeGreaterThan(0);
    expect(sourcesOf(change.infos).every((s) => s === 'pointer')).toBe(true);
    expect(sourcesOf(commit.infos).every((s) => s === 'pointer')).toBe(true);
    expect(phasesOf(change.infos).every((p) => p === 'input')).toBe(true);
    expect(phasesOf(commit.infos).every((p) => p === 'commit')).toBe(true);
  });
});

/*════════════════════════════════════════════════════════════════*/
/* Tabs — tab pointer click ⇒ pointer · arrow-key nav ⇒ keyboard   */
/* (API-TYPES S4 widened the inline payloads to the canonical trio) */
/*════════════════════════════════════════════════════════════════*/
describe('ChangeInfo matrix — Tabs', () => {
  const tabs = (c: HTMLElement) =>
    Array.from(c.querySelectorAll<HTMLButtonElement>('[role="tab"]'));

  it("tab pointer click ⇒ 'pointer', arrow-key nav ⇒ 'keyboard'", () => {
    const change = sink<string | number>();
    const { container } = mount(
      <Surface>
        <Tabs
          defaultValue='a'
          onValueChange={change.collect}
        >
          <Tabs.Tab
            value='a'
            label='Alpha'
          />
          <Tabs.Tab
            value='b'
            label='Beta'
          />
          <Tabs.Panel>A</Tabs.Panel>
          <Tabs.Panel>B</Tabs.Panel>
        </Tabs>
      </Surface>,
    );
    const ts = tabs(container);

    clickWithDetail(ts[1], 1); // genuine pointer click on Beta
    keydown(ts[1], 'ArrowLeft'); // keyboard nav back to Alpha

    expect(sourcesOf(change.infos)).toEqual(['pointer', 'keyboard']);
    expect(phasesOf(change.infos).every((p) => p === 'input')).toBe(true);
  });

  it("keyboard activation of a tab (synthetic detail-0 click) ⇒ 'keyboard'", () => {
    const change = sink<string | number>();
    const { container } = mount(
      <Surface>
        <Tabs
          defaultValue='a'
          onValueChange={change.collect}
        >
          <Tabs.Tab
            value='a'
            label='Alpha'
          />
          <Tabs.Tab
            value='b'
            label='Beta'
          />
        </Tabs>
      </Surface>,
    );
    const ts = tabs(container);
    clickWithDetail(ts[1], 0); // Space/Enter on a focused tab ⇒ detail 0

    expect(sourcesOf(change.infos)).toEqual(['keyboard']);
  });
});

/*════════════════════════════════════════════════════════════════*/
/* Vocabulary coverage — the matrix exercises EVERY InputSource and */
/* InputPhase. If events.ts gains a member, the matrix must drive a */
/* field that emits it (or the member is vestigial and the union    */
/* should be narrowed — ruling R10 / the events.ts contract).       */
/*════════════════════════════════════════════════════════════════*/
describe('ChangeInfo matrix — vocabulary coverage', () => {
  it('every InputSource in the union is emitted by a real interaction above', () => {
    const expected: InputSource[] = ['keyboard', 'pointer', 'programmatic', 'clipboard', 'wheel'];
    // This list IS the canonical InputSource union (events.ts). Keeping it
    // literal here is intentional: if the union changes, this line must change
    // too, forcing whoever edits the vocabulary to prove every member is live.
    expect([...observedSources].sort()).toEqual([...expected].sort());
  });

  it('every InputPhase in the union is emitted by a real interaction above', () => {
    const expected: InputPhase[] = ['input', 'commit'];
    expect([...observedPhases].sort()).toEqual([...expected].sort());
  });
});

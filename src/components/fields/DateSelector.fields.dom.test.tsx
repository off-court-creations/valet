// ─────────────────────────────────────────────────────────────
// src/components/fields/DateSelector.fields.dom.test.tsx | valet
// FIELDS S9 (rulings R9/R10) — regression suite for the DateSelector
// migration onto the shared `useFieldState` hook. (The TZ behavior-flip
// repro lives in DateSelector.dom.test.tsx; this file owns the control-mode
// and source-honesty contract.)
//
//  • control modes (single-date): a seeded FormControl key drives the initial
//    view/selection and a day click writes the ISO string through to the
//    store; an unseeded key is treated as controlled with a one-time valet
//    warn (the old hand-rolled guard treated an unseeded key as uncontrolled)
//    while still rendering `defaultValue`.
//  • ChangeInfo.source honesty: a day cell only commits via a click, so the
//    source is now 'pointer' instead of the old hardcoded 'programmatic' — in
//    both single and range mode.
//
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DateSelector } from './DateSelector';
import { FormControl } from './FormControl';
import { createFormStore } from '../../system/createFormStore';
import { resetWarnOnce } from '../../system/devErrors';
import type { ChangeInfo } from '../../system/events';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/*───────────────────────────────────────────────────────────────*/
/* Harness                                                       */

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(node);
  });
  return { container };
}

/** All day-grid cells: plain numbered <button>s, excluding the header month/
 *  year <Select> option buttons (which also carry numeric text) and the
 *  aria-labelled nav controls. */
function dayCells(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll('button')).filter(
    (b) =>
      !b.hasAttribute('aria-label') &&
      !b.closest('[data-valet-component="Select"]') &&
      /^\d+$/.test(b.textContent ?? ''),
  ) as HTMLButtonElement[];
}
function dayCell(container: HTMLElement, day: number): HTMLButtonElement {
  const cell = dayCells(container).find((b) => b.textContent === String(day));
  if (!cell) throw new Error(`day cell ${day} not found`);
  return cell;
}
function clickDay(container: HTMLElement, day: number) {
  act(() => {
    dayCell(container, day).dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
  });
}

/** The start-selected day cell is the single cell whose styled `$start` class
 *  is unique among the grid (every other day shares the default-cell class).
 *  Returns the day number of that uniquely-classed cell, or null. */
function selectedDay(container: HTMLElement): number | null {
  const cells = dayCells(container);
  const counts = new Map<string, number>();
  for (const c of cells) counts.set(c.className, (counts.get(c.className) ?? 0) + 1);
  const unique = cells.find((c) => counts.get(c.className) === 1);
  return unique ? Number(unique.textContent) : null;
}

/** The two header <Select>s render their current month name and year. */
function headerText(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-valet-component="Select"]')).map((s) =>
    (s.textContent ?? '').trim(),
  );
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
/* Control modes — single-date FormControl binding (ruling R9)    */

describe('DateSelector — single-date FormControl binding (ruling R9)', () => {
  it('seeded form key drives the initial view/selection and a day click writes through', () => {
    const useStore = createFormStore<{ when: string }>({ when: '2025-06-10' });
    const { container } = render(
      <FormControl useStore={useStore}>
        <DateSelector name='when' />
      </FormControl>,
    );
    // The seeded ISO date drove the rendered month/year and the selected day.
    expect(headerText(container)).toEqual(['Jun', '2025']);
    expect(selectedDay(container)).toBe(10);
    // Clicking another day writes the new ISO string through to the store …
    clickDay(container, 18);
    expect(useStore.getState().values.when).toBe('2025-06-18');
    // … and the view follows.
    expect(selectedDay(container)).toBe(18);
  });

  it('unseeded form key is treated as controlled (defaultValue rendered, one-time warn)', () => {
    const useStore = createFormStore<Record<string, string>>({ other: '' });
    const { container } = render(
      <FormControl useStore={useStore}>
        <DateSelector
          name='when'
          defaultValue='2025-06-07'
        />
      </FormControl>,
    );
    // defaultValue still drives the view; what changed under the unified hook is
    // the controlled treatment + the one-time unseeded-key dev warn.
    expect(headerText(container)).toEqual(['Jun', '2025']);
    expect(selectedDay(container)).toBe(7);
    expect(valetWarns()).toEqual([expect.stringContaining("form key 'when' is not seeded")]);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* ChangeInfo.source honesty (ruling R10)                         */

describe('DateSelector — ChangeInfo.source classification (ruling R10)', () => {
  it("single-mode day click reports 'pointer' (old code: 'programmatic')", () => {
    const infos: ChangeInfo<string | [string, string]>[] = [];
    const { container } = render(
      <DateSelector
        defaultValue='2025-06-15'
        onValueCommit={(_v, i) => infos.push(i)}
      />,
    );
    clickDay(container, 12);
    expect(infos).toHaveLength(1);
    expect(infos[0].source).toBe('pointer');
    expect(infos[0].phase).toBe('commit');
  });

  it("range-mode day click reports 'pointer'", () => {
    const infos: ChangeInfo<string | [string, string]>[] = [];
    const { container } = render(
      <DateSelector
        range
        defaultValue={['2025-06-05', '2025-06-05']}
        onValueChange={(_v, i) => infos.push(i)}
      />,
    );
    clickDay(container, 14);
    expect(infos[0].source).toBe('pointer');
  });
});

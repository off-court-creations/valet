// ─────────────────────────────────────────────────────────────
// src/components/fields/DateSelector.dom.test.tsx | valet
// FIELDS S1 behavior-flip regression (plan §3.5 S1, ruling Q5(a);
// audit Tier-1: DateSelector.tsx:255/292–295/229). Under any UTC+
// zone the legacy `new Date(y,m,d).toISOString().slice(0,10)`
// converted local midnight to UTC and committed the *previous*
// calendar day. These tests are the audit's runtime-proven repro:
// TZ pinned to Asia/Tokyo (UTC+9) via the house withTZ fork
// convention, click a day cell, assert the committed ISO value is
// THAT calendar day. Every `it` below FAILS on pre-flip code
// (commit '2025-06-10' for a June 11 click, range tuples shifted a
// day back, and the :229 controlled fallback resetting instead of
// extending the range) and passes only with formatLocalISO wired
// into the three commit sites.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { withTZ } from '../../test-utils/withTZ';
import { DateSelector } from './DateSelector';
import { FormControl } from './FormControl';
import { createFormStore } from '../../system/createFormStore';
import * as sheet from '../../css/sheet';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render into a fresh container appended to body; tracked for cleanup. */
function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(node);
  });
  return { root, container };
}

/** The day-grid cells are plain numbered <button>s; header controls all
 *  carry aria-labels or non-numeric text, so exact-text match is safe. */
function dayCell(container: HTMLElement, day: number): HTMLButtonElement {
  const cell = Array.from(container.querySelectorAll('button')).find(
    (b) => !b.hasAttribute('aria-label') && b.textContent === String(day),
  );
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

afterEach(() => {
  vi.restoreAllMocks();
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* Suite ----------------------------------------------------------------- */
withTZ('Asia/Tokyo', () => {
  describe('DateSelector commits the clicked calendar day (jsdom, UTC+9)', () => {
    it('single mode: clicking June 11 commits 2025-06-11, not the previous day', () => {
      // pre-flip: toISOString() at Tokyo local midnight → '2025-06-10'
      const onValueChange = vi.fn();
      const onValueCommit = vi.fn();
      const { container } = render(
        <DateSelector
          defaultValue='2025-06-15'
          onValueChange={onValueChange}
          onValueCommit={onValueCommit}
        />,
      );
      clickDay(container, 11);
      expect(onValueCommit).toHaveBeenCalledTimes(1);
      expect(onValueCommit.mock.calls[0][0]).toBe('2025-06-11');
      expect(onValueChange.mock.calls[0][0]).toBe('2025-06-11');
    });

    it('range mode: extending an uncontrolled range commits the clicked days verbatim', () => {
      // pre-flip: tuple formatted via toISOString → ['2025-06-04', '2025-06-19']
      const onValueCommit = vi.fn();
      const { container } = render(
        <DateSelector
          range
          defaultValue={['2025-06-05', '2025-06-05']}
          onValueCommit={onValueCommit}
        />,
      );
      clickDay(container, 20);
      expect(onValueCommit).toHaveBeenCalledTimes(1);
      expect(onValueCommit.mock.calls[0][0]).toEqual(['2025-06-05', '2025-06-20']);
    });

    it('controlled range with a string value: the end-date fallback stays on the same day', () => {
      // Exercises the :229 controlled fallback. Pre-flip it parsed
      // formatUTC(local midnight) → June 14, so start !== end and a click
      // RESET the range to ['2025-06-20', '2025-06-20'] instead of
      // extending it from the controlled start day.
      const onValueCommit = vi.fn();
      const { container } = render(
        <DateSelector
          range
          value='2025-06-15'
          onValueCommit={onValueCommit}
        />,
      );
      clickDay(container, 20);
      expect(onValueCommit).toHaveBeenCalledTimes(1);
      expect(onValueCommit.mock.calls[0][0]).toEqual(['2025-06-15', '2025-06-20']);
    });
  });
});

/* ── 1.0 verification: FormControl config + mobile chrome kit ─────────────
 * Matches the Checkbox/Slider/Select harness: a form-wide `disabled` disables
 * the field (every day cell carries the native disabled attr), a name-keyed
 * `errors` entry marks it aria-invalid, and the coarse-pointer hit floor /
 * chrome kit ship on the day-cell rule. */
describe('DateSelector — FormControl config + touch target', () => {
  it('a form-wide `disabled` disables every day cell (and the field-level prop too)', () => {
    const useStore = createFormStore<Record<string, unknown>>({ when: '2025-06-15' });
    const { container } = render(
      <FormControl
        useStore={useStore}
        disabled
      >
        <DateSelector name='when' />
      </FormControl>,
    );
    const cells = dayCell(container, 11);
    expect(cells.disabled).toBe(true);
    // The clicked day is blocked: no store write occurs.
    clickDay(container, 11);
    expect(useStore.getState().values.when).toBe('2025-06-15');
  });

  it('the field-level `disabled` prop alone disables the day cells', () => {
    const { container } = render(
      <DateSelector
        defaultValue='2025-06-15'
        disabled
      />,
    );
    expect(dayCell(container, 11).disabled).toBe(true);
  });

  it('a name-keyed FormControl `errors` entry marks the root aria-invalid', () => {
    const useStore = createFormStore<Record<string, unknown>>({ when: '2025-06-15' });
    const { container } = render(
      <FormControl
        useStore={useStore}
        errors={{ when: 'Pick a weekday' }}
      >
        <DateSelector name='when' />
      </FormControl>,
    );
    const root = container.querySelector('[data-valet-component="DateSelector"]')!;
    expect(root.getAttribute('aria-invalid')).toBe('true');
  });

  it('the field-level `error` prop alone marks the root aria-invalid', () => {
    const { container } = render(
      <DateSelector
        defaultValue='2025-06-15'
        error
      />,
    );
    const root = container.querySelector('[data-valet-component="DateSelector"]')!;
    expect(root.getAttribute('aria-invalid')).toBe('true');
  });

  it('day cells carry the coarse hit var and the chrome-kit + @media rule', () => {
    const { container } = render(<DateSelector defaultValue='2025-06-15' />);
    const cell = dayCell(container, 11);
    // Inline coarse-pointer hit floor (44px at default density).
    expect(cell.style.getPropertyValue('--valet-date-hit')).toBe('44px');
    // The styled rule carries the chrome kit + the coarse-pointer expander.
    const cls = cell.className.split(' ').find(Boolean) ?? '';
    const rule =
      Array.from(sheet.getGlobalSheet()?.cssRules ?? [], (r) => r.cssText).find((t) =>
        t.startsWith(`.${cls}`),
      ) ?? '';
    expect(rule).toContain('touch-action: manipulation');
    expect(rule).toContain('@media (pointer: coarse)');
    expect(rule).toContain('--valet-date-hit');
  });
});

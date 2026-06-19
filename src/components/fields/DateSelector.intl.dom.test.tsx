// ─────────────────────────────────────────────────────────────
// src/components/fields/DateSelector.intl.dom.test.tsx | valet
// A11Y S10 (plan §3.6 S10, ruling R8) — DateSelector Intl wiring.
//
// The hardcoded English month/weekday constants and the Sunday-fixed
// first-day math are replaced by the `src/helpers/dateLocale.ts` helpers.
// This suite pins:
//   • en-US default UNCHANGED — characterization (Sunday-first headers,
//     full English month names, Latin display digits identical to before);
//   • de-DE — German month names + Monday-start week (locale's own first day);
//   • explicit `firstDayOfWeek` override beats the locale default;
//   • VALUE contract holds across locales: ar-EG renders Arabic-Indic DISPLAY
//     digits while `onValueChange`/`onValueCommit` emit Latin ISO-8601 (veto
//     register / ruling R7/R8).
//
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DateSelector } from './DateSelector';

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

afterEach(() => {
  vi.restoreAllMocks();
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/** The `Grid` element — the parent of the numbered day <button>s. Derived from
 *  a verified day cell so it can never be confused with the header <Select>
 *  triggers (whose year button also renders all-digit text). */
function dayGrid(container: HTMLElement): HTMLElement {
  const cell = Array.from(container.querySelectorAll('button')).find(
    (b) =>
      !b.hasAttribute('aria-label') &&
      !b.closest('[data-valet-component="Select"]') &&
      (b.textContent ?? '').length > 0,
  );
  const grid = cell?.parentElement;
  if (!grid) throw new Error('day grid not found');
  return grid;
}

/** Weekday header labels, in render order (the `DayLabel` divs above the grid). */
function weekdayHeaders(container: HTMLElement): string[] {
  return Array.from(dayGrid(container).children)
    .filter((c) => c.tagName === 'DIV')
    .map((c) => (c.textContent ?? '').trim());
}

/** The two header <Select>s render the current month name and year. */
function headerSelects(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-valet-component="Select"]')).map((s) =>
    (s.textContent ?? '').trim(),
  );
}

/** Number of leading empty `<span>` blank cells before the first day button. */
function leadingBlanks(container: HTMLElement): number {
  let count = 0;
  for (const c of Array.from(dayGrid(container).children)) {
    if (c.tagName === 'DIV') continue; // weekday labels
    if (c.tagName === 'SPAN') count += 1;
    else break; // first day button
  }
  return count;
}

/** Find a day-grid cell by its DISPLAYED text (locale digits). */
function dayCellByText(container: HTMLElement, text: string): HTMLButtonElement {
  const cell = Array.from(container.querySelectorAll('button')).find(
    (b) =>
      !b.hasAttribute('aria-label') &&
      !b.closest('[data-valet-component="Select"]') &&
      b.textContent === text,
  );
  if (!cell) throw new Error(`day cell '${text}' not found`);
  return cell as HTMLButtonElement;
}

function clickCell(cell: HTMLButtonElement) {
  act(() => {
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

/*───────────────────────────────────────────────────────────────*/
/* en-US default — characterization (must be UNCHANGED)           */

describe('DateSelector — en-US default is unchanged (A11Y S10 characterization)', () => {
  it('Sunday-first 2-letter weekday headers, short English month name, Latin digits', () => {
    const { container } = render(<DateSelector defaultValue='2025-06-15' />);
    // The previous hardcoded `days` array, Sunday-first.
    expect(weekdayHeaders(container)).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
    // Short English month + year in the header selects (1.0: "Jun", not "June").
    expect(headerSelects(container)).toEqual(['Jun', '2025']);
    // Day cells render Latin digits (display === String(day)).
    expect(dayCellByText(container, '15').textContent).toBe('15');
  });

  it('June 2025 starts on Sunday → 0 leading blanks (previous getDay() math)', () => {
    // June 1 2025 is a Sunday; Sunday-first ⇒ no leading blanks.
    const { container } = render(<DateSelector defaultValue='2025-06-15' />);
    expect(leadingBlanks(container)).toBe(0);
  });

  it('default-locale omitted behaves identically to explicit locale="en-US"', () => {
    const a = render(<DateSelector defaultValue='2025-06-15' />);
    const b = render(
      <DateSelector
        locale='en-US'
        defaultValue='2025-06-15'
      />,
    );
    expect(weekdayHeaders(a.container)).toEqual(weekdayHeaders(b.container));
    expect(headerSelects(a.container)).toEqual(headerSelects(b.container));
  });
});

/*───────────────────────────────────────────────────────────────*/
/* de-DE — German month names + Monday-start week                 */

describe('DateSelector — de-DE locale (German names, Monday-start)', () => {
  it('renders German month name and Monday-first weekday headers', () => {
    const { container } = render(
      <DateSelector
        locale='de-DE'
        defaultValue='2025-06-15'
      />,
    );
    // de-DE first day is Monday (1); headers rotate to Monday-first.
    expect(weekdayHeaders(container)).toEqual(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
    // German short month name (Jun) drives the header select.
    expect(headerSelects(container)).toEqual(['Jun', '2025']);
  });

  it('Monday-start shifts the leading blanks: June 1 2025 (Sunday) → 6 blanks', () => {
    // June 1 2025 is a Sunday. With Monday as the first column, Sunday is the
    // 7th column ⇒ 6 leading blanks (vs 0 under the en-US Sunday-first default).
    const { container } = render(
      <DateSelector
        locale='de-DE'
        defaultValue='2025-06-15'
      />,
    );
    expect(leadingBlanks(container)).toBe(6);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* explicit firstDayOfWeek override                               */

describe('DateSelector — explicit firstDayOfWeek override', () => {
  it('firstDayOfWeek=1 forces Monday-start even for en-US', () => {
    const { container } = render(
      <DateSelector
        locale='en-US'
        firstDayOfWeek={1}
        defaultValue='2025-06-15'
      />,
    );
    expect(weekdayHeaders(container)).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
    // June 1 2025 (Sunday) is the 7th column under Monday-start ⇒ 6 blanks.
    expect(leadingBlanks(container)).toBe(6);
  });

  it('firstDayOfWeek=7 forces Sunday-start even for de-DE (overrides locale default)', () => {
    const { container } = render(
      <DateSelector
        locale='de-DE'
        firstDayOfWeek={7}
        defaultValue='2025-06-15'
      />,
    );
    // German names, but Sunday-first ordering.
    expect(weekdayHeaders(container)).toEqual(['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']);
    expect(leadingBlanks(container)).toBe(0);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* VALUE contract — ar-EG display digits, Latin ISO emitted       */

describe('DateSelector — ar-EG renders Arabic-Indic display digits, emits Latin ISO', () => {
  it('day cells show Arabic-Indic digits while onChange/onCommit emit Latin ISO-8601', () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    const { container } = render(
      <DateSelector
        locale='ar-EG'
        defaultValue='2025-06-15'
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />,
    );
    // DISPLAY: day 15 renders as Arabic-Indic '١٥', NOT Latin '15'.
    const arabicFifteen = new Intl.NumberFormat('ar-EG', { useGrouping: false }).format(15);
    expect(arabicFifteen).toBe('١٥');
    const cell = dayCellByText(container, arabicFifteen);
    expect(cell.textContent).toBe('١٥');
    // No Latin-digit '15' cell exists (display is fully localized).
    const latin = Array.from(container.querySelectorAll('button')).find(
      (b) =>
        !b.hasAttribute('aria-label') &&
        !b.closest('[data-valet-component="Select"]') &&
        b.textContent === '15',
    );
    expect(latin).toBeUndefined();

    // VALUE: clicking emits ISO-8601 Latin digits regardless of locale.
    const eleven = new Intl.NumberFormat('ar-EG', { useGrouping: false }).format(11);
    clickCell(dayCellByText(container, eleven));
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit.mock.calls[0][0]).toBe('2025-06-11');
    expect(onValueChange.mock.calls[0][0]).toBe('2025-06-11');
  });
});

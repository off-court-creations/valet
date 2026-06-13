// ─────────────────────────────────────────────────────────────
// src/components/fields/dateUtils.test.ts | valet
// basic node-env coverage: round-trip, padding, month boundaries
// (TZ-parameterized suite lives separately under test-utils/withTZ)
// ─────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { formatLocalISO, parseLocalISO } from './dateUtils';

describe('formatLocalISO', () => {
  it('formats using local getters (never UTC)', () => {
    const d = new Date(2024, 4, 1); // local midnight, May 1
    expect(formatLocalISO(d)).toBe('2024-05-01');
    // pin against the audited bug: in UTC+ zones toISOString() commits
    // the previous day for local midnight — local getters must not
    expect(formatLocalISO(d)).toBe(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`,
    );
  });

  it('zero-pads single-digit months and days', () => {
    expect(formatLocalISO(new Date(2024, 0, 5))).toBe('2024-01-05');
    expect(formatLocalISO(new Date(2024, 8, 9))).toBe('2024-09-09');
  });

  it('zero-pads years below 1000', () => {
    const d = new Date(2000, 5, 15);
    d.setFullYear(99);
    expect(formatLocalISO(d)).toBe('0099-06-15');
  });

  it('handles month and year boundaries', () => {
    expect(formatLocalISO(new Date(2023, 11, 31))).toBe('2023-12-31');
    expect(formatLocalISO(new Date(2024, 0, 1))).toBe('2024-01-01');
    expect(formatLocalISO(new Date(2024, 1, 29))).toBe('2024-02-29'); // leap day
    expect(formatLocalISO(new Date(2024, 5, 30))).toBe('2024-06-30');
  });
});

describe('parseLocalISO', () => {
  it('parses to local midnight', () => {
    const d = parseLocalISO('2024-05-01');
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(1);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  });

  it('parses years below 100 without the 19xx constructor mapping', () => {
    expect(parseLocalISO('0099-12-31').getFullYear()).toBe(99);
  });

  it('rejects non-conforming input with an Invalid Date', () => {
    for (const bad of ['', 'not-a-date', '2024-5-01', '2024-05-01T00:00', '05-01-2024']) {
      expect(Number.isNaN(parseLocalISO(bad).getTime())).toBe(true);
    }
  });

  it('rejects out-of-range dates instead of rolling over', () => {
    expect(Number.isNaN(parseLocalISO('2024-02-30').getTime())).toBe(true);
    expect(Number.isNaN(parseLocalISO('2023-02-29').getTime())).toBe(true); // non-leap
    expect(Number.isNaN(parseLocalISO('2024-13-01').getTime())).toBe(true);
    expect(Number.isNaN(parseLocalISO('2024-04-31').getTime())).toBe(true);
    expect(Number.isNaN(parseLocalISO('2024-04-00').getTime())).toBe(true);
  });
});

describe('round-trip', () => {
  it('format → parse preserves the local calendar day', () => {
    const samples = [
      new Date(2024, 0, 1),
      new Date(2024, 1, 29),
      new Date(2023, 11, 31),
      new Date(1970, 0, 1),
      new Date(2026, 6, 4),
    ];
    for (const d of samples) {
      const back = parseLocalISO(formatLocalISO(d));
      expect(back.getFullYear()).toBe(d.getFullYear());
      expect(back.getMonth()).toBe(d.getMonth());
      expect(back.getDate()).toBe(d.getDate());
    }
  });

  it('parse → format is the identity on valid ISO dates', () => {
    for (const iso of ['2024-01-01', '2024-02-29', '2023-12-31', '0099-06-15', '1999-09-09']) {
      expect(formatLocalISO(parseLocalISO(iso))).toBe(iso);
    }
  });
});

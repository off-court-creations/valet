// ─────────────────────────────────────────────────────────────
// src/helpers/dateLocale.test.ts | valet
// node-env coverage for the Intl-only dateLocale helpers
// (plan §3.6 S9, ruling R7).
//
// Localized names/digits are asserted AGAINST Intl DIRECTLY —
// never against hardcoded ICU strings — using *different*
// reference dates than the implementation, so ICU data updates
// can't break CI while real divergence still fails. Hardcoded
// numbers appear only where they are the contract itself
// (ISO weekday encoding; stable CLDR facts like en-US=Sunday).
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';

import { formatLocalISO, parseLocalISO } from '../components/fields/dateUtils';
import {
  type DateNameStyle,
  formatDayNumber,
  getFirstDayOfWeek,
  getMonthNames,
  getWeekdayNames,
  orderWeekdays,
} from './dateLocale';

const LOCALES = ['en-US', 'de-DE', 'ar-EG', 'ja-JP'] as const;
const STYLES: DateNameStyle[] = ['long', 'short', 'narrow'];

/* Independent Intl references — different dates than the impl
   (months: year 2025, day 1 vs impl's 2024/day 15; weekdays: the
   week of Mon 2024-06-03 vs impl's week of Mon 2024-01-01). */
const intlMonthNames = (locale: string, style: DateNameStyle): string[] => {
  const fmt = new Intl.DateTimeFormat(locale, {
    month: style,
    calendar: 'gregory',
    timeZone: 'UTC',
  });
  return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(Date.UTC(2025, m, 1))));
};

const intlWeekdayNames = (locale: string, style: DateNameStyle): string[] => {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2024, 5, 3 + i))));
};

/* The three Intl.Locale weekInfo shapes, modelled structurally. */
type MockWeekLocale = {
  weekInfo?: { firstDay?: unknown };
  getWeekInfo?: () => { firstDay?: unknown };
  region?: string;
  maximize?: () => { region?: string };
};
const asLocale = (mock: MockWeekLocale): Intl.Locale => mock as unknown as Intl.Locale;

describe('getMonthNames', () => {
  it.each(LOCALES)('%s matches Intl for all 12 months in every style', (locale) => {
    for (const style of STYLES) {
      const names = getMonthNames(locale, style);
      expect(names).toHaveLength(12);
      expect(names).toEqual(intlMonthNames(locale, style));
    }
  });

  it('defaults to the long style', () => {
    expect(getMonthNames('de-DE')).toEqual(getMonthNames('de-DE', 'long'));
  });

  it('localizes — de-DE and ja-JP differ from en-US', () => {
    const en = getMonthNames('en-US');
    expect(getMonthNames('de-DE')).not.toEqual(en);
    expect(getMonthNames('ja-JP')).not.toEqual(en);
  });

  it('pins the Gregorian calendar for locales with a non-Gregorian default (ar-SA)', () => {
    // ar-SA defaults to islamic-umalqura; the grid contract is ISO/Gregorian.
    expect(getMonthNames('ar-SA', 'long')).toEqual(intlMonthNames('ar-SA', 'long'));
  });

  it('accepts an Intl.Locale instance', () => {
    expect(getMonthNames(new Intl.Locale('de-DE'), 'short')).toEqual(
      getMonthNames('de-DE', 'short'),
    );
  });

  it('returns a fresh copy — consumer mutation cannot poison the cache', () => {
    const first = getMonthNames('en-US');
    first[0] = 'MUTATED';
    expect(getMonthNames('en-US')[0]).not.toBe('MUTATED');
  });

  it('throws Intl RangeError on an invalid locale tag (crisp failure, no silent fallback)', () => {
    expect(() => getMonthNames('not a locale !!')).toThrow(RangeError);
  });
});

describe('getWeekdayNames', () => {
  it.each(LOCALES)('%s matches Intl in ISO Monday-first order for every style', (locale) => {
    for (const style of STYLES) {
      const names = getWeekdayNames(locale, style);
      expect(names).toHaveLength(7);
      expect(names).toEqual(intlWeekdayNames(locale, style));
    }
  });

  it('index 0 is Monday and index 6 is Sunday (en-US, asserted via Intl)', () => {
    const fmt = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' });
    const names = getWeekdayNames('en-US', 'long');
    expect(names[0]).toBe(fmt.format(new Date(Date.UTC(2024, 5, 3)))); // a known Monday
    expect(names[6]).toBe(fmt.format(new Date(Date.UTC(2024, 5, 9)))); // a known Sunday
  });

  it('returns a fresh copy — consumer mutation cannot poison the cache', () => {
    const first = getWeekdayNames('ja-JP');
    first[3] = 'MUTATED';
    expect(getWeekdayNames('ja-JP')[3]).not.toBe('MUTATED');
  });
});

describe('getFirstDayOfWeek', () => {
  it('returns the ISO contract values: en-US=Sunday(7), de-DE=Monday(1), ar-EG=Saturday(6)', () => {
    expect(getFirstDayOfWeek('en-US')).toBe(7);
    expect(getFirstDayOfWeek('de-DE')).toBe(1);
    expect(getFirstDayOfWeek('ar-EG')).toBe(6);
  });

  it.each(LOCALES)('%s agrees with the runtime weekInfo when the runtime provides it', (tag) => {
    const loc = new Intl.Locale(tag) as Intl.Locale & MockWeekLocale;
    const runtime =
      loc.weekInfo ?? (typeof loc.getWeekInfo === 'function' ? loc.getWeekInfo() : undefined);
    if (runtime && typeof runtime.firstDay === 'number') {
      expect(getFirstDayOfWeek(tag)).toBe(runtime.firstDay);
    }
  });

  it('accepts an Intl.Locale instance', () => {
    expect(getFirstDayOfWeek(new Intl.Locale('en-US'))).toBe(7);
  });

  it('shape 1: reads the weekInfo accessor property when present', () => {
    expect(getFirstDayOfWeek(asLocale({ weekInfo: { firstDay: 3 }, region: 'US' }))).toBe(3);
  });

  it('shape 2: calls getWeekInfo() when the accessor is absent', () => {
    expect(
      getFirstDayOfWeek(asLocale({ getWeekInfo: () => ({ firstDay: 2 }), region: 'US' })),
    ).toBe(2);
  });

  it('prefers the accessor over the method when both exist', () => {
    expect(
      getFirstDayOfWeek(
        asLocale({ weekInfo: { firstDay: 3 }, getWeekInfo: () => ({ firstDay: 5 }) }),
      ),
    ).toBe(3);
  });

  it('shape 3: weekInfo absent → CLDR region fallback (US=7, DE=1, EG=6, MV=5)', () => {
    expect(getFirstDayOfWeek(asLocale({ region: 'US' }))).toBe(7);
    expect(getFirstDayOfWeek(asLocale({ region: 'DE' }))).toBe(1);
    expect(getFirstDayOfWeek(asLocale({ region: 'EG' }))).toBe(6);
    expect(getFirstDayOfWeek(asLocale({ region: 'MV' }))).toBe(5);
  });

  it('fallback resolves a missing region via maximize()', () => {
    expect(getFirstDayOfWeek(asLocale({ maximize: () => ({ region: 'JP' }) }))).toBe(7);
    expect(getFirstDayOfWeek(asLocale({ maximize: () => ({ region: 'FR' }) }))).toBe(1);
  });

  it('fallback defaults to Monday(1) — the documented CLDR world default', () => {
    expect(getFirstDayOfWeek(asLocale({}))).toBe(1); // no region, no maximize
    expect(getFirstDayOfWeek(asLocale({ region: 'ZZ' }))).toBe(1); // unknown region
    expect(getFirstDayOfWeek(asLocale({ maximize: () => ({}) }))).toBe(1); // unresolvable
  });

  it('rejects out-of-range firstDay values and falls through to the fallback', () => {
    expect(getFirstDayOfWeek(asLocale({ weekInfo: { firstDay: 0 }, region: 'EG' }))).toBe(6);
    expect(getFirstDayOfWeek(asLocale({ weekInfo: { firstDay: 7.5 }, region: 'US' }))).toBe(7);
    expect(
      getFirstDayOfWeek(asLocale({ getWeekInfo: () => ({ firstDay: 'mon' }), region: 'DE' })),
    ).toBe(1);
  });

  it('throws Intl RangeError on an invalid locale tag', () => {
    expect(() => getFirstDayOfWeek('not a locale !!')).toThrow(RangeError);
  });
});

describe('orderWeekdays', () => {
  const ISO_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

  it('is the identity for firstDay=1 (Monday)', () => {
    expect(orderWeekdays(ISO_WEEK, 1)).toEqual([...ISO_WEEK]);
  });

  it('rotates to Sunday-first for firstDay=7', () => {
    expect(orderWeekdays(ISO_WEEK, 7)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  });

  it('rotates to Saturday-first for firstDay=6', () => {
    expect(orderWeekdays(ISO_WEEK, 6)).toEqual(['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  });

  it('does not mutate its input and returns a new array', () => {
    const input = [...ISO_WEEK];
    const out = orderWeekdays(input, 6);
    expect(input).toEqual([...ISO_WEEK]);
    expect(out).not.toBe(input);
  });

  it('normalizes out-of-range firstDay modulo the week (8 ≡ 1, 0 ≡ 7)', () => {
    expect(orderWeekdays(ISO_WEEK, 8)).toEqual(orderWeekdays(ISO_WEEK, 1));
    expect(orderWeekdays(ISO_WEEK, 0)).toEqual(orderWeekdays(ISO_WEEK, 7));
  });

  it('composes with getWeekdayNames + getFirstDayOfWeek: en-US weeks start Sunday', () => {
    const fmt = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' });
    const ordered = orderWeekdays(getWeekdayNames('en-US'), getFirstDayOfWeek('en-US'));
    expect(ordered[0]).toBe(fmt.format(new Date(Date.UTC(2024, 5, 9)))); // Sunday
    expect(ordered[6]).toBe(fmt.format(new Date(Date.UTC(2024, 5, 8)))); // Saturday
  });

  it('composes with getWeekdayNames + getFirstDayOfWeek: de-DE weeks start Monday', () => {
    const fmt = new Intl.DateTimeFormat('de-DE', { weekday: 'long', timeZone: 'UTC' });
    const ordered = orderWeekdays(getWeekdayNames('de-DE'), getFirstDayOfWeek('de-DE'));
    expect(ordered[0]).toBe(fmt.format(new Date(Date.UTC(2024, 5, 3)))); // Monday
  });
});

describe('formatDayNumber', () => {
  it.each(LOCALES)('%s matches Intl.NumberFormat for representative day numbers', (locale) => {
    const fmt = new Intl.NumberFormat(locale, { useGrouping: false });
    for (const day of [1, 9, 15, 31]) {
      expect(formatDayNumber(day, locale)).toBe(fmt.format(day));
    }
  });

  it('renders Arabic-Indic digits under ar-EG (display-only localization)', () => {
    const display = formatDayNumber(15, 'ar-EG');
    expect(display).toBe(new Intl.NumberFormat('ar-EG', { useGrouping: false }).format(15));
    expect(display).not.toBe('15'); // not Latin digits
    expect(display).toMatch(/^[٠-٩]+$/); // U+0660–0669 ARABIC-INDIC DIGIT block
  });

  it('renders ASCII Latin digits under en-US', () => {
    expect(formatDayNumber(15, 'en-US')).toMatch(/^\d+$/);
  });

  it('accepts an Intl.Locale instance', () => {
    expect(formatDayNumber(7, new Intl.Locale('ar-EG'))).toBe(formatDayNumber(7, 'ar-EG'));
  });

  it('VALUE contract regression: parseLocalISO/formatLocalISO round-trips stay ISO Latin while display is localized', () => {
    const iso = '2026-06-15';
    const value = parseLocalISO(iso);

    // display side: localized digits
    const display = formatDayNumber(value.getDate(), 'ar-EG');
    expect(display).not.toBe(String(value.getDate()));

    // value side (ruling R7: dateUtils owns it; never redefined here):
    // the round-trip stays byte-identical ASCII ISO regardless of any
    // display-locale formatting that happened in between
    expect(formatLocalISO(value)).toBe(iso);
    expect(formatLocalISO(value)).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
  });
});

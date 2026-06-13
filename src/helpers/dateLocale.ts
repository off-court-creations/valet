// ─────────────────────────────────────────────────────────────
// src/helpers/dateLocale.ts | valet
// Intl-only date-localization helpers (zero deps; no React/css).
// A11Y S9 (plan §3.6) — consumed by the DateSelector Intl rewrite
// (A11Y S10, Phase 2).
//   • getMonthNames     – 12 Gregorian month names, January-first
//   • getWeekdayNames   – 7 weekday names, ISO Monday-first
//   • getFirstDayOfWeek – 1–7 ISO (Monday=1 … Sunday=7)
//   • orderWeekdays     – rotate a Monday-first array to firstDay
//   • formatDayNumber   – locale digits for DISPLAY only
//
// Value vs display (ruling R7 + veto register): the date VALUE
// contract is ISO 'YYYY-MM-DD' with Latin digits, owned by
// `formatLocalISO`/`parseLocalISO` in src/components/fields/
// dateUtils.ts. This module NEVER redefines those helpers — any
// date-string work imports them from there. Everything here is
// display-only localization (e.g. `formatDayNumber('ar-EG')`
// renders Arabic-Indic digits while the committed value stays
// '2026-06-15').
//
// Calendar pinning: month names are formatted with
// `calendar: 'gregory'` because the value contract (and the
// DateSelector grid math) is ISO/Gregorian. Without the pin,
// locales whose default calendar is non-Gregorian (ar-SA →
// islamic-umalqura, th-TH → buddhist) would label Gregorian
// month cells with months from a different calendar.
//
// Invalid locale tags throw Intl's RangeError unchanged — crisp
// failure signals over silent fallbacks (house posture, Q18).
// ─────────────────────────────────────────────────────────────

/** Textual name styles accepted by `Intl.DateTimeFormat`. */
export type DateNameStyle = 'long' | 'short' | 'narrow';

/** A BCP-47 tag or a constructed `Intl.Locale`. */
export type LocaleInput = string | Intl.Locale;

/*──────────── internals ────────────*/

/* TS 5.x lib.es2020 has no `weekInfo` typings; all three runtime
   shapes are reached through this structural view instead. */
interface WeekInfoLike {
  firstDay?: unknown;
}
interface WeekInfoCarrier {
  weekInfo?: WeekInfoLike;
  getWeekInfo?: () => WeekInfoLike;
  region?: string;
  maximize?: () => { region?: string };
}

const isIsoWeekday = (d: unknown): d is number =>
  typeof d === 'number' && Number.isInteger(d) && d >= 1 && d <= 7;

/* Caches are keyed by `${tag}|${style}`; `String(locale)` on an
   Intl.Locale yields its BCP-47 tag. Cached arrays are returned
   as copies so consumer mutation can never poison the cache. */
const monthNamesCache = new Map<string, readonly string[]>();
const weekdayNamesCache = new Map<string, readonly string[]>();
const dayNumberFormatters = new Map<string, Intl.NumberFormat>();

/* Reference dates are constructed in UTC and formatted with
   `timeZone: 'UTC'` so host-TZ offsets can never shift the
   calendar day (the audited DateSelector off-by-one class). */
const MONTH_REF_YEAR = 2024; // any year; day 15 keeps clear of month edges
const MONDAY_REF_UTC = Date.UTC(2024, 0, 1); // 2024-01-01 was a Monday
const DAY_MS = 86_400_000;

/*──────────── month names ────────────*/
/**
 * The 12 Gregorian month names for `locale`, January-first.
 *
 * Always Gregorian (`calendar: 'gregory'`) — the DateSelector value
 * contract is ISO, so grid labels must match Gregorian months even
 * where the locale's default calendar differs (see header).
 */
export function getMonthNames(locale: LocaleInput, style: DateNameStyle = 'long'): string[] {
  const key = `${String(locale)}|${style}`;
  let names = monthNamesCache.get(key);
  if (!names) {
    const fmt = new Intl.DateTimeFormat(locale, {
      month: style,
      calendar: 'gregory',
      timeZone: 'UTC',
    });
    names = Array.from({ length: 12 }, (_, m) =>
      fmt.format(new Date(Date.UTC(MONTH_REF_YEAR, m, 15))),
    );
    monthNamesCache.set(key, names);
  }
  return names.slice();
}

/*──────────── weekday names ────────────*/
/**
 * The 7 weekday names for `locale` in ISO order — index 0 is Monday,
 * index 6 is Sunday — matching `getFirstDayOfWeek`'s 1–7 encoding so
 * `orderWeekdays(names, firstDay)` is a plain rotation.
 */
export function getWeekdayNames(locale: LocaleInput, style: DateNameStyle = 'long'): string[] {
  const key = `${String(locale)}|${style}`;
  let names = weekdayNamesCache.get(key);
  if (!names) {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' });
    names = Array.from({ length: 7 }, (_, i) => fmt.format(new Date(MONDAY_REF_UTC + i * DAY_MS)));
    weekdayNamesCache.set(key, names);
  }
  return names.slice();
}

/*──────────── first day of week ────────────*/
/**
 * The locale's first day of the week as an ISO weekday number:
 * **1 = Monday … 7 = Sunday** (the same encoding ECMA-402 `weekInfo`
 * uses; en-US → 7, de-DE → 1, ar-EG → 6).
 *
 * Handles all three `Intl.Locale` week-info shapes:
 *  1. `weekInfo` accessor property — V8 / JavaScriptCore (Chrome,
 *     Edge, Node, Safari 15.4+);
 *  2. `getWeekInfo()` method — SpiderMonkey (Firefox 122+), per the
 *     later TC39 normative change;
 *  3. absent — e.g. Firefox 117–121, inside valet's published
 *     browser floor, so the fallback is load-bearing: a CLDR-derived
 *     region table, defaulting to **Monday (1)** — CLDR's `001`
 *     world default — for unknown or region-less locales. (en-US
 *     still resolves Sunday via data, never via the default.)
 */
export function getFirstDayOfWeek(locale: LocaleInput): number {
  const loc = (typeof locale === 'string' ? new Intl.Locale(locale) : locale) as Intl.Locale &
    WeekInfoCarrier;

  /* shape 1 — accessor property */
  const accessor = loc.weekInfo;
  if (accessor && isIsoWeekday(accessor.firstDay)) return accessor.firstDay;

  /* shape 2 — method */
  if (typeof loc.getWeekInfo === 'function') {
    const info = loc.getWeekInfo();
    if (info && isIsoWeekday(info.firstDay)) return info.firstDay;
  }

  /* shape 3 — absent: CLDR-derived region fallback */
  return fallbackFirstDay(loc);
}

/* CLDR supplemental weekData firstDay by territory (aligned with
   current ICU — e.g. SA→Sunday and AU→Monday per modern CLDR, both
   verified against Node 22's ICU). Everything unlisted is Monday,
   CLDR's '001' world default. */
const FRIDAY_REGIONS = new Set(['MV']);
const SATURDAY_REGIONS = new Set([
  'AE',
  'AF',
  'BH',
  'DJ',
  'DZ',
  'EG',
  'IQ',
  'IR',
  'JO',
  'KW',
  'LY',
  'OM',
  'QA',
  'SD',
  'SY',
]);
const SUNDAY_REGIONS = new Set([
  'AG',
  'AS',
  'BD',
  'BR',
  'BS',
  'BT',
  'BW',
  'BZ',
  'CA',
  'CO',
  'DM',
  'DO',
  'ET',
  'GT',
  'GU',
  'HK',
  'HN',
  'ID',
  'IL',
  'IN',
  'JM',
  'JP',
  'KE',
  'KH',
  'KR',
  'LA',
  'MH',
  'MM',
  'MO',
  'MT',
  'MX',
  'MZ',
  'NI',
  'NP',
  'PA',
  'PE',
  'PH',
  'PK',
  'PR',
  'PT',
  'PY',
  'SA',
  'SG',
  'SV',
  'TH',
  'TT',
  'TW',
  'UM',
  'US',
  'VE',
  'VI',
  'WS',
  'YE',
  'ZA',
  'ZW',
]);

function fallbackFirstDay(loc: WeekInfoCarrier): number {
  let region = typeof loc.region === 'string' ? loc.region : undefined;
  if (!region && typeof loc.maximize === 'function') {
    try {
      region = loc.maximize().region ?? undefined;
    } catch {
      /* unresolvable tag — fall through to the world default */
    }
  }
  const key = region?.toUpperCase();
  if (key) {
    if (FRIDAY_REGIONS.has(key)) return 5;
    if (SATURDAY_REGIONS.has(key)) return 6;
    if (SUNDAY_REGIONS.has(key)) return 7;
  }
  return 1; // CLDR '001' world default: Monday
}

/*──────────── weekday ordering ────────────*/
/**
 * Rotate a **Monday-first** weekday array (`getWeekdayNames` output)
 * so it starts on `firstDay` (ISO 1–7, `getFirstDayOfWeek` output).
 * Pure — returns a new array; any integer `firstDay` is normalized
 * modulo the array length (8 behaves like 1).
 */
export function orderWeekdays<T>(names: readonly T[], firstDay: number): T[] {
  const len = names.length;
  if (len === 0) return [];
  const shift = (((Math.trunc(firstDay) - 1) % len) + len) % len;
  return [...names.slice(shift), ...names.slice(0, shift)];
}

/*──────────── day-number display ────────────*/
/**
 * A calendar day number in the locale's digits — **display only**
 * (ar-EG → '١٥'). The committed date VALUE stays ISO Latin digits
 * via `formatLocalISO` (dateUtils, ruling R7); never feed this
 * output back into a value path.
 */
export function formatDayNumber(day: number, locale: LocaleInput): string {
  const key = String(locale);
  let fmt = dayNumberFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, { useGrouping: false });
    dayNumberFormatters.set(key, fmt);
  }
  return fmt.format(day);
}

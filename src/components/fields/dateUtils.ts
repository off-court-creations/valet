// ─────────────────────────────────────────────────────────────
// src/components/fields/dateUtils.ts | valet
// canonical TZ-safe local-date helpers (pure; no css/React imports)
//   • formatLocalISO – Date → 'YYYY-MM-DD' via local getters
//   • parseLocalISO  – 'YYYY-MM-DD' → Date at local midnight
// Rationale: `new Date(y, m, d).toISOString().slice(0, 10)`
// converts local midnight to UTC, committing the *previous*
// calendar day in every UTC+ timezone. These helpers do pure
// local-time math so format/parse round-trip symmetrically.
// ─────────────────────────────────────────────────────────────

/*──────────── internals ────────────*/
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number, width: number) => String(n).padStart(width, '0');

/*──────────── Date → 'YYYY-MM-DD' ────────────*/
/** Format a Date as an ISO calendar date using *local* getters (never UTC). */
export function formatLocalISO(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

/*──────────── 'YYYY-MM-DD' → Date ────────────*/
/** Parse an ISO calendar date into a Date at *local* midnight.
 *  Non-conforming or out-of-range input (e.g. '2024-02-30') yields an
 *  Invalid Date (`getTime()` is NaN), matching `new Date(bad)` semantics. */
export function parseLocalISO(iso: string): Date {
  const m = ISO_DATE.exec(iso);
  if (!m) return new Date(NaN);

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  const date = new Date(year, month - 1, day);
  date.setFullYear(year); // years 00–99 would otherwise map to 1900–1999

  // Reject silent rollover (e.g. Feb 30 → Mar 1)
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return new Date(NaN);
  return date;
}

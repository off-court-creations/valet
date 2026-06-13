// ─────────────────────────────────────────────────────────────
// src/components/fields/dateUtils.tz.test.ts | valet
// TZ-parameterized suite over the canonical local-date helpers
// (plan §3.2 TEST-CI S5, ruling R7). Zones are pinned per block
// via src/test-utils/withTZ.ts — see its header for the
// mechanism and its constraints (POSIX-only, pool:'forks').
// ─────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { withTZ } from '../../test-utils/withTZ';
import { formatLocalISO, parseLocalISO } from './dateUtils';

const ZONES = [
  'UTC',
  'Asia/Tokyo', // UTC+9, no DST
  'Europe/Berlin', // UTC+1/+2 (DST)
  'Pacific/Kiritimati', // UTC+14, the earliest zone on Earth
  'America/New_York', // UTC-5/-4 (DST)
];

/** Zones strictly ahead of UTC year-round — where the legacy bug bites. */
const UTC_PLUS_ZONES = ['Asia/Tokyo', 'Europe/Berlin', 'Pacific/Kiritimati'];

/** Calendar days exercised in every zone: [year, month0, day, 'YYYY-MM-DD']. */
const SAMPLE_DAYS: Array<[number, number, number, string]> = [
  [2024, 0, 1, '2024-01-01'], // year boundary
  [2024, 1, 29, '2024-02-29'], // leap day
  [2024, 6, 15, '2024-07-15'], // mid-year (DST active in Berlin / New York)
  [2023, 11, 31, '2023-12-31'], // year end
];

/* the shipped DateSelector.tsx:255 pattern, verbatim */
const legacyFormat = (y: number, m: number, d: number) =>
  new Date(y, m, d).toISOString().slice(0, 10);

/*──────────── withTZ mechanism smoke ────────────*/
describe('withTZ pins the zone for the enclosed block', () => {
  withTZ('Asia/Tokyo', () => {
    it('Date resolves at UTC+9', () => {
      expect(new Date(2024, 0, 1).getTimezoneOffset()).toBe(-540);
    });
  });

  withTZ('Pacific/Kiritimati', () => {
    it('Date resolves at UTC+14', () => {
      expect(new Date(2024, 0, 1).getTimezoneOffset()).toBe(-840);
    });
  });
});

/*──────────── parameterized helper suite ────────────*/
for (const zone of ZONES) {
  withTZ(zone, () => {
    describe('formatLocalISO', () => {
      it('returns the local calendar day for local midnight', () => {
        for (const [y, m, d, iso] of SAMPLE_DAYS) {
          expect(formatLocalISO(new Date(y, m, d))).toBe(iso);
        }
      });

      it('returns the local calendar day at 23:59:59.999 local', () => {
        for (const [y, m, d, iso] of SAMPLE_DAYS) {
          expect(formatLocalISO(new Date(y, m, d, 23, 59, 59, 999))).toBe(iso);
        }
      });
    });

    describe('parseLocalISO', () => {
      it('parses to local midnight on the named calendar day', () => {
        for (const [y, m, d, iso] of SAMPLE_DAYS) {
          const parsed = parseLocalISO(iso);
          expect(parsed.getFullYear()).toBe(y);
          expect(parsed.getMonth()).toBe(m);
          expect(parsed.getDate()).toBe(d);
          expect(parsed.getHours()).toBe(0);
          expect(parsed.getMinutes()).toBe(0);
        }
      });

      it('round-trips with formatLocalISO in both directions', () => {
        for (const [y, m, d, iso] of SAMPLE_DAYS) {
          expect(formatLocalISO(parseLocalISO(iso))).toBe(iso);
          const back = parseLocalISO(formatLocalISO(new Date(y, m, d)));
          expect([back.getFullYear(), back.getMonth(), back.getDate()]).toEqual([y, m, d]);
        }
      });
    });
  });
}

/*──────────── legacy bug pin (audit critical, DateSelector.tsx:255) ────────────*/
describe('legacy `new Date(y,m,d).toISOString().slice(0,10)` regression pin', () => {
  for (const zone of UTC_PLUS_ZONES) {
    withTZ(zone, () => {
      it('commits the *previous* calendar day where formatLocalISO does not', () => {
        // local midnight Jul 15 is still Jul 14 in UTC for every UTC+ zone
        expect(formatLocalISO(new Date(2024, 6, 15))).toBe('2024-07-15');
        expect(legacyFormat(2024, 6, 15)).toBe('2024-07-14'); // the shipped bug
        expect(legacyFormat(2024, 6, 15)).not.toBe(formatLocalISO(new Date(2024, 6, 15)));
      });
    });
  }

  withTZ('UTC', () => {
    it('agrees with formatLocalISO in UTC — why UTC-only checks missed it', () => {
      expect(legacyFormat(2024, 6, 15)).toBe(formatLocalISO(new Date(2024, 6, 15)));
    });
  });
});

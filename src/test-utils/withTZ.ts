// ─────────────────────────────────────────────────────────────
// src/test-utils/withTZ.ts | valet
// house convention for TZ-pinned tests (plan §3.2 S5, ruling R7)
//
// Mechanism: assigning `process.env.TZ` at runtime makes Node call
// tzset() and flush the V8/ICU date caches, so every subsequent
// Date and Intl call — even local getters on Dates constructed
// earlier — resolves in the new zone. `withTZ(zone, fn)` wraps
// `fn`'s tests in a describe block whose beforeAll pins TZ (and
// verifies the runtime honoured it) and whose afterAll restores
// the previous value.
//
// Constraints:
//   • POSIX-only — Windows ignores runtime TZ changes; the guard
//     throws rather than silently running tests in host time.
//   • Requires vitest `pool: 'forks'` (set in vitest.config.ts):
//     each test file runs in its own child process, so a pinned
//     zone never leaks into sibling files running in parallel.
//     Within one file, withTZ blocks execute sequentially.
//   • Construct Dates *inside* it/beforeEach bodies — a Date
//     created at collection time bakes its epoch in the ambient
//     zone, before beforeAll has pinned TZ.
//   • `zone` must be an IANA identifier (e.g. 'Asia/Tokyo').
// ─────────────────────────────────────────────────────────────
import { afterAll, beforeAll, describe } from 'vitest';

/** Run a block of tests with `process.env.TZ` pinned to `zone`. */
export function withTZ(zone: string, fn: () => void): void {
  describe(`[TZ=${zone}]`, () => {
    let previous: string | undefined;

    beforeAll(() => {
      previous = process.env.TZ;
      process.env.TZ = zone;
      const resolved = new Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (resolved !== zone) {
        throw new Error(
          `withTZ: runtime did not honour TZ=${zone} (resolved '${resolved}'). ` +
            'Runtime TZ changes are POSIX-only — see src/test-utils/withTZ.ts.',
        );
      }
    });

    afterAll(() => {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    });

    fn();
  });
}

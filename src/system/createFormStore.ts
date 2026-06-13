// ─────────────────────────────────────────────────────────────
// src/system/createFormStore.ts  | valet
// factory creating typed Zustand stores for form state
// ─────────────────────────────────────────────────────────────
import { createWithEqualityFn as create } from 'zustand/traditional';

/**
 * Runtime state slice for any form.
 *
 * Contract (pinned by `createFormStore.test.ts`; relied on by the shared
 * field hooks in `src/hooks/useControlledState.ts`, ruling R9):
 *
 * - The store is **values-only** — no validation/errors/touched tracking.
 * - `values` holds the **exact** object passed to `createFormStore` until
 *   the first write (no defensive clone), and `reset` restores that exact
 *   initial reference.
 * - Keys are fixed at creation time. Form-bound fields (`name` inside a
 *   `FormControl`) expect their key to be **seeded in `initial`**: an
 *   unseeded key reads as `undefined`, so the field renders its
 *   `defaultValue ?? fallback` as a controlled value and dev-warns once.
 *   Fields NEVER write to the store on mount — an unseeded key stays
 *   absent from submit/reset values until the first user edit.
 */
export interface FormStore<T extends Record<string, unknown>> {
  /** Current values keyed by field name. */
  values: T;
  /**
   * Imperative setter for a single field. Every call replaces `values`
   * with a fresh object — even an identity write (same value) produces a
   * new `values` reference, so subscribers always fire; identities of
   * untouched fields are preserved. `setField`/`reset` keep stable
   * function identity across writes.
   */
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
  /** Resets all values to their original defaults (the exact initial reference). */
  reset: () => void;
}

/**
 * **createFormStore** – one-liner helper that returns a _typed_ Zustand hook
 * for local form state.
 *
 * ```ts
 * const useLoginForm = createFormStore({ email:'', password:'' });
 * ```
 *
 * Seed **every** key a bound field will use — `{ email: '' }`, not `{}`.
 * The store is the single reading source for form-bound fields (precedence:
 * explicit `value` prop > form binding > internal state), and because fields
 * never write on mount, keys missing from `initial` are invisible to
 * `onSubmitValues`/`reset` until the user first edits the field.
 *
 * Separate stores never share state; two stores built from one shared
 * `initial` object stay isolated (writes are copy-on-write).
 */
export function createFormStore<T extends Record<string, unknown>>(initial: T) {
  return create<FormStore<T>>((set) => ({
    values: initial,
    setField: (key, value) =>
      set((state) => ({
        values: { ...state.values, [key]: value },
      })),
    reset: () => set({ values: initial }),
  }));
}

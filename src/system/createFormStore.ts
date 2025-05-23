import { create } from 'zustand';

/**
 * Runtime state slice for any form.
 */
export interface FormStore<T extends Record<string, any>> {
  /** Current values keyed by field name. */
  values: T;
  /** Imperative setter for a single field. */
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
  /** Resets all values to their original defaults. */
  reset: () => void;
}

/**
 * **createFormStore** – one-liner helper that returns a _typed_ Zustand hook
 * for local form state.
 *
 * ```ts
 * const useLoginForm = createFormStore({ email:'', password:'' });
 * ```
 */
export function createFormStore<T extends Record<string, any>>(initial: T) {
  return create<FormStore<T>>((set) => ({
    values: initial,
    setField: (key, value) =>
      set((state) => ({
        values: { ...state.values, [key]: value },
      })),
    reset: () => set({ values: initial }),
  }));
}

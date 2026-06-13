// ─────────────────────────────────────────────────────────────
// src/hooks/useControlledState.ts | valet
// FIELDS S5 (ruling R9) — the single controlled/uncontrolled
// definition that replaces the 10-way per-component guard.
//
// • `useControlledState` — controlled iff `value !== undefined`,
//   LATCHED at mount (a later `undefined` never flips the mode);
//   flips dev-warn once via warnOnce and are otherwise ignored.
// • `useFieldState` — layers the FormControl binding on top with
//   ONE precedence rule: explicit `value` prop > form binding >
//   internal state, latched at mount. Unseeded form keys render
//   `defaultValue ?? fallback` AS CONTROLLED (one-time dev warn);
//   fields NEVER write to the store on mount — only user-driven
//   `setValue` calls reach `setField`.
//
// INTERNAL — deliberately not exported from src/index.ts.
// Consumed by the FF S6–S10 migrations (Wave 1.2).
// ─────────────────────────────────────────────────────────────
import { useCallback, useMemo, useRef, useState } from 'react';
import { warnOnce } from '../system/devErrors';
import { useOptionalForm } from '../components/fields/FormControl';

/*───────────────────────────────────────────────────────────────*/
/* useControlledState                                            */

/**
 * **useControlledState** — single source of truth for the
 * controlled/uncontrolled decision (no form awareness; see
 * {@link useFieldState} for the form-layered variant).
 *
 * Contract:
 * - Controlled **iff** `value !== undefined`, latched at the first render.
 *   Later flips (defined → undefined or undefined → defined) dev-warn once
 *   per `component` via `warnOnce` and are ignored: a latched-controlled
 *   hook that loses its `value` renders `defaultValue`; a latched-
 *   uncontrolled hook ignores a late `value` prop.
 * - The setter updates internal state only when uncontrolled (a state
 *   no-op when controlled) and always forwards `next` to `onChange`, so
 *   controlled parents still hear change requests — this mirrors the
 *   Accordion private hook it replaces (deleted by FF S10).
 * - `defaultValue` is read once to seed internal state (React convention:
 *   later changes to it are ignored).
 *
 * @param value        Controlled value; `undefined` ⇒ uncontrolled.
 * @param defaultValue Seed for uncontrolled state; also rendered if a
 *                     latched-controlled `value` later becomes undefined.
 * @param onChange     Change-request listener, fired in both modes.
 * @param component    Display name for dev warnings (warnOnce key).
 * @returns `[current, setValue, isControlled]`
 */
export function useControlledState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void,
  component = 'useControlledState',
): readonly [T, (next: T) => void, boolean] {
  const [inner, setInner] = useState<T>(defaultValue);
  /* Latch the mode on the first render — never recomputed. */
  const isControlled = useRef(value !== undefined).current;

  if (process.env.NODE_ENV !== 'production') {
    const nowControlled = value !== undefined;
    if (nowControlled !== isControlled) {
      warnOnce(
        `${component}:controlled-flip`,
        `valet: ${component}: switched from ${isControlled ? 'controlled' : 'uncontrolled'} ` +
          `to ${nowControlled ? 'controlled' : 'uncontrolled'} after mount. The mode is ` +
          `latched at mount and will not change — pass a defined \`value\` for the whole ` +
          `lifetime, or never.`,
      );
    }
  }

  const current = isControlled ? (value !== undefined ? value : defaultValue) : inner;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInner(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue, isControlled] as const;
}

/*───────────────────────────────────────────────────────────────*/
/* useFieldState                                                 */

/** Where the rendered value comes from — latched at mount. */
export type FieldStateSource = 'prop' | 'form' | 'internal';

export interface FieldStateMeta {
  /** True for `prop` and `form` sources (unseeded form keys included). */
  isControlled: boolean;
  /** The latched binding decided on the first render. */
  source: FieldStateSource;
  /** Live: an enclosing FormControl store + `name` are present, so user
   *  edits write through to the store via `setField`. */
  formBound: boolean;
}

export interface UseFieldStateOptions<T> {
  /** Explicit controlled value — wins over the form binding (dev-warns
   *  when both are present). */
  value: T | undefined;
  /** Uncontrolled seed; also rendered for unseeded form keys
   *  (`defaultValue ?? fallback`). */
  defaultValue?: T;
  /** Type-appropriate empty value (`''`, `false`, `null`, …) rendered when
   *  neither `value` nor `defaultValue` nor a seeded form key supplies one. */
  fallback: T;
  /** Form-store key. Omit (or pass `undefined`) to skip the form layer —
   *  this is how Checkbox expresses `bindForm={false}` (kept, not
   *  propagated, per the Fields veto register). */
  name?: string;
  /** Change-request listener, fired in every mode. */
  onChange?: (next: T) => void;
  /** Display name for dev warnings (warnOnce key). */
  component?: string;
}

/**
 * **useFieldState** — {@link useControlledState} plus the FormControl
 * layer, under ONE precedence rule (ruling R9):
 *
 * `explicit value prop > form binding > internal state` — latched at mount.
 *
 * Contract:
 * - The binding source is decided on the first render and latched. Later
 *   changes to the inputs (value appearing/disappearing, `name` added or
 *   removed) dev-warn once and are ignored for *reading*.
 * - `value !== undefined` together with a form binding dev-warns once
 *   (prop + form conflict); the prop wins for rendering, but user edits
 *   still write through to the store so submit stays in sync — this
 *   mirrors every pre-R9 field, which always called `setField` when
 *   `form && name` were present.
 * - Form-bound with an unseeded key (`values[name] === undefined`):
 *   renders `defaultValue ?? fallback` **as controlled** with a one-time
 *   dev warn. The field NEVER writes to the store on mount — the key
 *   stays unseeded until the first user edit, so seed it in
 *   `createFormStore(initial)` if submit/reset must see it.
 * - The setter: updates internal state only for the `internal` source;
 *   writes through to the store whenever live-bound (`form && name`);
 *   always forwards to `onChange`.
 *
 * @returns `[current, setValue, meta]`
 */
export function useFieldState<T>(
  options: UseFieldStateOptions<T>,
): readonly [T, (next: T) => void, FieldStateMeta] {
  const { value, defaultValue, fallback, name, onChange, component = 'useFieldState' } = options;

  const form = useOptionalForm<Record<string, unknown>>();
  const formBound = Boolean(form && name);
  const resolvedDefault = (defaultValue ?? fallback) as T;

  const [inner, setInner] = useState<T>(resolvedDefault);

  /* Latch the source on the first render — never recomputed. */
  const source = useRef<FieldStateSource>(
    value !== undefined ? 'prop' : formBound ? 'form' : 'internal',
  ).current;

  const formVal = form && name ? (form.values[name] as T | undefined) : undefined;

  if (process.env.NODE_ENV !== 'production') {
    const label = name ? `${component}[${name}]` : component;
    if (value !== undefined && formBound) {
      warnOnce(
        `${label}:prop-form-conflict`,
        `valet: ${label}: received both an explicit \`value\` prop and a FormControl ` +
          `binding (\`name\`). The explicit prop wins for rendering; user edits still ` +
          `write through to the form store. Drop one of the two.`,
      );
    }
    const now: FieldStateSource = value !== undefined ? 'prop' : formBound ? 'form' : 'internal';
    if (now !== source) {
      warnOnce(
        `${label}:source-flip:${source}->${now}`,
        `valet: ${label}: binding changed from '${source}' to '${now}' after mount. ` +
          `The binding is latched at mount and will not change.`,
      );
    }
    if (source === 'form' && formBound && formVal === undefined) {
      warnOnce(
        `${label}:unseeded`,
        `valet: ${label}: form key '${name}' is not seeded in the store. Rendering ` +
          `\`defaultValue ?? fallback\` as a controlled value; the field never writes ` +
          `to the store on mount, so seed the key in createFormStore(initial) if ` +
          `submit/reset must see it.`,
      );
    }
  }

  let current: T;
  if (source === 'prop') {
    current = value !== undefined ? value : resolvedDefault;
  } else if (source === 'form') {
    current = formVal !== undefined ? formVal : resolvedDefault;
  } else {
    current = inner;
  }

  const setValue = useCallback(
    (next: T) => {
      if (source === 'internal') setInner(next);
      if (form && name) form.setField(name, next);
      onChange?.(next);
    },
    [source, form, name, onChange],
  );

  const meta = useMemo<FieldStateMeta>(
    () => ({ isControlled: source !== 'internal', source, formBound }),
    [source, formBound],
  );

  return [current, setValue, meta] as const;
}

// ─────────────────────────────────────────────────────────────
// src/components/fields/FormControl.tsx | valet
// Provides typed form store context and intercepts submit for SPA flows.
//
// TWO contexts, deliberately separate:
//   • FormCtx        — the raw values-only FormStore snapshot. This is the
//                      untouchable binding invariant every bound field reads
//                      via useFieldState (form.values[name] / form.setField).
//                      NEVER wrap or replace this value — doing so breaks every
//                      bound field at once.
//   • FormConfigCtx  — additive, presentation-level form config (form-wide
//                      `disabled`, name-keyed `errors`, async-submit
//                      `isSubmitting`). Held HERE, not in the values-only store,
//                      so it can grow without touching the store contract.
//                      Bound fields read it via `useFormConfig()` and merge it
//                      with their own props (own disabled/error wins; the form
//                      config is the fallback).
// ─────────────────────────────────────────────────────────────
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { preset } from '../../css/stylePresets';
import { valetError } from '../../system/devErrors';
import type { Presettable, Sx } from '../../types';
import type { FormStore } from '../../system/createFormStore';
import type { StoreApi, UseBoundStore } from 'zustand';

/*───────────────────────────────────────────────────────────────*/
/* Store context & hooks (store erased to avoid invariance issues) */
const FormCtx = createContext<unknown | null>(null);

export const useForm = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(): FormStore<T> => {
  const ctx = useContext(FormCtx);
  if (ctx === null) {
    throw valetError(
      'FormControl',
      'useForm must be called inside a <FormControl> — wrap the field tree in <FormControl useStore={…}>, or use useOptionalForm for fields that work standalone.',
      'form',
    );
  }
  return ctx as FormStore<T>;
};

export const useOptionalForm = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(): FormStore<T> | null => {
  const ctx = useContext(FormCtx);
  return ctx as FormStore<T> | null;
};

/*───────────────────────────────────────────────────────────────*/
/* Form config context (additive — NOT the values store)          */

/** Presentation-level form configuration shared with every bound field. */
export interface FormConfig {
  /** Disable every bound field in this form (e.g. while submitting). */
  disabled: boolean;
  /** Name-keyed error messages; a bound field with a matching `name` shows it. */
  errors: Record<string, React.ReactNode>;
  /** True while an async `onSubmitValues` is in flight. */
  isSubmitting: boolean;
}

const FormConfigCtx = createContext<FormConfig | null>(null);

/* Stable inert default so standalone fields can always call useFormConfig()
   without a provider and without minting a new object per render. */
const INERT_FORM_CONFIG: FormConfig = Object.freeze({
  disabled: false,
  errors: Object.freeze({}) as Record<string, React.ReactNode>,
  isSubmitting: false,
});

/**
 * Read the ambient form configuration. Returns inert defaults (nothing
 * disabled, no errors, not submitting) when called outside a `<FormControl>`,
 * so bound fields can consume it unconditionally.
 */
export function useFormConfig(): FormConfig {
  return useContext(FormConfigCtx) ?? INERT_FORM_CONFIG;
}

/*───────────────────────────────────────────────────────────────*/
/* Props & component                                             */
export interface FormControlProps<T extends Record<string, unknown>>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'style'>,
    Presettable {
  /**
   * The **Zustand hook** produced by `createFormStore(initialValues)`.
   * It’s the usual `const useForm = createFormStore(...)` function.
   */
  useStore: UseBoundStore<StoreApi<FormStore<T>>>;
  /**
   * Fires after native submit is intercepted – gives you typed values. May
   * return a Promise; while it is pending the form is `aria-busy` and every
   * bound field sees `isSubmitting` via `useFormConfig()`.
   */
  onSubmitValues?: (values: T, event: React.FormEvent<HTMLFormElement>) => void | Promise<unknown>;
  /** Disable every bound field in this form. */
  disabled?: boolean;
  /** Name-keyed error messages; a bound field whose `name` matches shows the error. */
  errors?: Record<string, React.ReactNode>;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

export function FormControl<T extends Record<string, unknown>>({
  useStore,
  onSubmitValues,
  disabled = false,
  errors,
  preset: p,
  className,
  sx,
  children,
  ...rest
}: FormControlProps<T>) {
  const store = useStore(); // ← FormStore<T> (full-store subscription, by design)
  const presetClasses = p ? preset(p) : '';
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* After a submit, move focus to the first invalid field (best-effort, post
     React flush so a consumer's synchronous error update has rendered). */
  const focusFirstInvalid = useCallback(() => {
    if (typeof requestAnimationFrame === 'undefined') return;
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      el?.focus?.();
    });
  }, []);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();
      const result = onSubmitValues?.(store.values, e); // values is <T>
      focusFirstInvalid();
      if (result && typeof (result as { then?: unknown }).then === 'function') {
        setIsSubmitting(true);
        Promise.resolve(result).finally(() => setIsSubmitting(false));
      }
    },
    [onSubmitValues, store, focusFirstInvalid],
  );

  /* Stable config identity unless its inputs change (avoids re-rendering every
     bound field on unrelated FormControl re-renders). */
  const config = useMemo<FormConfig>(
    () => ({ disabled, errors: errors ?? {}, isSubmitting }),
    [disabled, errors, isSubmitting],
  );

  return (
    <FormCtx.Provider value={store}>
      <FormConfigCtx.Provider value={config}>
        <form
          {...rest}
          ref={formRef}
          onSubmit={handleSubmit}
          aria-busy={isSubmitting || undefined}
          data-valet-component='FormControl'
          className={[presetClasses, className].filter(Boolean).join(' ')}
          style={sx}
        >
          {children}
        </form>
      </FormConfigCtx.Provider>
    </FormCtx.Provider>
  );
}

export default FormControl;

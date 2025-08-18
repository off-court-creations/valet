// ─────────────────────────────────────────────────────────────
// src/components/fields/FormControl.tsx | valet
// form context provider wiring labels, errors and disabled state
// ─────────────────────────────────────────────────────────────
import React, { createContext, useContext } from 'react';
import { preset } from '../../css/stylePresets';
import type { Presettable, Sx } from '../../types';
import type { FormStore } from '../../system/createFormStore';
import type { StoreApi, UseBoundStore } from 'zustand';

/*───────────────────────────────────────────────────────────────*/
/* Context & hooks (store erased to avoid invariance issues) */
const FormCtx = createContext<unknown | null>(null);

export const useForm = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(): FormStore<T> => {
  const ctx = useContext(FormCtx);
  if (ctx === null) {
    throw new Error('useForm must be used inside a <FormControl> component');
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
   * Fires after native submit is intercepted – gives you typed values.
   */
  onSubmitValues?: (values: T, event: React.FormEvent<HTMLFormElement>) => void;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

export function FormControl<T extends Record<string, unknown>>({
  useStore,
  onSubmitValues,
  preset: p,
  className,
  sx,
  children,
  ...rest
}: FormControlProps<T>) {
  const store = useStore(); // ← FormStore<T>
  const presetClasses = p ? preset(p) : '';

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onSubmitValues?.(store.values, e); // values is <T>
  };

  return (
    <FormCtx.Provider value={store}>
      <form
        {...rest}
        onSubmit={handleSubmit}
        className={[presetClasses, className].filter(Boolean).join(' ')}
        style={sx}
      >
        {children}
      </form>
    </FormCtx.Provider>
  );
}

export default FormControl;

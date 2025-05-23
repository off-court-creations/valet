// src/components/FormControl.tsx
import React, { createContext, useContext } from 'react';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';
import type { FormStore } from '../system/createFormStore';
import type { StoreApi, UseBoundStore } from 'zustand';

/*───────────────────────────────────────────────────────────────*/
/* Context & public hook                                         */
const FormCtx = createContext<FormStore<any> | null>(null);

export const useForm = <T extends Record<string, any>>() => {
  const ctx = useContext(FormCtx);
  if (!ctx)
    throw new Error('useForm must be used inside a <FormControl> component');
  return ctx as FormStore<T>;
};

/*───────────────────────────────────────────────────────────────*/
/* Props & component                                             */
export interface FormControlProps<T extends Record<string, any>>
  /*  Exclude the native onSubmit so we can supply our typed version  */
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>,
    Presettable {
  /**
   * The **Zustand hook** produced by `createFormStore(initialValues)`.
   * It’s the usual `const useForm = createFormStore(...)` function.
   */
  useStore: UseBoundStore<StoreApi<FormStore<T>>>;
  /**
   * Fires after native submit is intercepted – gives you typed values.
   */
  onSubmitValues?: (
    values: T,
    event: React.FormEvent<HTMLFormElement>
  ) => void;
}

export function FormControl<T extends Record<string, any>>({
  useStore,
  onSubmitValues,
  preset: p,
  className,
  children,
  ...rest
}: FormControlProps<T>) {
  const store = useStore();                 // ← typed FormStore<T>
  const presetClasses = p ? preset(p) : '';

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onSubmitValues?.(store.values, e);      // values is <T>
  };

  return (
    <FormCtx.Provider value={store}>
      <form
        {...rest}
        onSubmit={handleSubmit}
        className={[presetClasses, className].filter(Boolean).join(' ')}
      >
        {children}
      </form>
    </FormCtx.Provider>
  );
}

export default FormControl;

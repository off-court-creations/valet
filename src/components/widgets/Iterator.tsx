// ─────────────────────────────────────────────────────────────
// src/components/widgets/Iterator.tsx  | valet
// numeric stepper widget – small text field with ± buttons
// ─────────────────────────────────────────────────────────────
import React, { forwardRef, useState, useId, ChangeEvent } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { IconButton } from '../fields/IconButton';
import { useForm } from '../fields/FormControl';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Public props                                              */
export interface IteratorProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'>,
    Presettable {
  /** Current numeric value (controlled) */
  value?: number;
  /** Initial value for uncontrolled usage */
  defaultValue?: number;
  /** Step increment/decrement amount */
  step?: number;
  /** Width of the text field */
  width?: number | string;
  /** FormControl field name */
  name?: string;
  /** Fires with next value on change */
  onChange?: (val: number) => void;
}

/*───────────────────────────────────────────────────────────*/
/* Layout wrappers                                            */
const Wrapper = styled('div')`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`;

const Field = styled('input')<{ $w: string; $bg: string; $text: string }>`
  width: ${({ $w }) => $w};
  min-width: ${({ $w }) => $w};
  text-align: center;
  padding: 0.25rem;
  border: 1px solid ${({ $text }) => $text + '55'};
  border-radius: 4px;
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  font: inherit;
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                  */
export const Iterator = forwardRef<HTMLInputElement, IteratorProps>(
  (
    {
      value,
      defaultValue = 0,
      step = 1,
      width = '3.5rem',
      name,
      onChange,
      preset: p,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const { theme } = useTheme();

    /* Optional FormControl wiring ------------------------------------- */
    let form: ReturnType<typeof useForm<any>> | null = null;
    try { form = useForm<any>(); } catch {}

    const formVal = form && name ? Number(form.values[name]) : undefined;
    const controlled = value !== undefined || formVal !== undefined;
    const [selfVal, setSelfVal] = useState(defaultValue);
    const current = controlled
      ? (formVal !== undefined ? formVal : value ?? 0)
      : selfVal;

    const commit = (next: number) => {
      if (!controlled) setSelfVal(next);
      form?.setField?.(name as any, next);
      onChange?.(next);
    };

    const adjust = (delta: number) => {
      const next = current + delta;
      commit(next);
    };

    const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
      const parsed = Number(e.target.value);
      if (!Number.isNaN(parsed)) commit(parsed);
    };

    const presetCls = p ? preset(p) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;
    const w = typeof width === 'number' ? `${width}px` : width;

    return (
      <Wrapper className={mergedCls} style={style}>
        <IconButton
          size="sm"
          variant="outlined"
          icon="mdi:minus"
          aria-label="Decrease"
          onClick={() => adjust(-step)}
        />
        <Field
          {...rest}
          ref={ref}
          type="number"
          name={name}
          value={current}
          onChange={handleInput}
          $w={w}
          $bg={theme.colors.background}
          $text={theme.colors.text}
        />
        <IconButton
          size="sm"
          variant="outlined"
          icon="mdi:plus"
          aria-label="Increase"
          onClick={() => adjust(step)}
        />
      </Wrapper>
    );
  },
);

Iterator.displayName = 'Iterator';

export default Iterator;

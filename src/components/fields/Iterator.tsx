// ─────────────────────────────────────────────────────────────
// src/components/fields/Iterator.tsx | valet
// numeric stepper with plus/minus buttons and scroll wheel support
// ─────────────────────────────────────────────────────────────
import React, { forwardRef, useState, useEffect } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { IconButton } from './IconButton';
import { useForm } from './FormControl';
import type { Presettable } from '../../types';
import type { Theme } from '../../system/themeStore';

/*───────────────────────────────────────────────────────────*/
export interface IteratorProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>, Presettable {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  name?: string;
  min?: number;
  max?: number;
  step?: number;
  width?: number | string;
}

/*───────────────────────────────────────────────────────────*/
const Wrapper = styled('div')<{ theme: Theme }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const Field = styled('input')<{ theme: Theme; $w: string }>`
  padding: ${({ theme }) => theme.spacing(0.5)};
  border: 1px solid ${({ theme }) => theme.colors.text + '44'};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  text-align: center;
  width: ${({ $w }) => $w};
  -moz-appearance: textfield;
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }
`;

/*───────────────────────────────────────────────────────────*/
export const Iterator = forwardRef<HTMLInputElement, IteratorProps>(
  (
    {
      value: valueProp,
      defaultValue,
      onChange,
      name,
      min,
      max,
      step = 1,
      width = '4rem',
      disabled = false,
      preset: p,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const { theme } = useTheme();

    let form: ReturnType<typeof useForm<any>> | null = null;
    try { form = useForm<any>(); } catch {}

    const formVal = form && name ? (form.values[name] as number | undefined) : undefined;
    const controlled = valueProp !== undefined || formVal !== undefined;
    const [internal, setInternal] = useState(defaultValue ?? 0);
    const current = controlled ? (formVal ?? valueProp!) : internal;
    const [text, setText] = useState(String(current));

    useEffect(() => {
      setText(String(current));
    }, [current]);

    const commit = (next: number) => {
      if (min !== undefined && next < min) next = min;
      if (max !== undefined && next > max) next = max;
      if (!controlled) setInternal(next);
      form?.setField(name as any, next);
      onChange?.(next);
      setText(String(next));
    };

    const handleInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      const val = e.target.value;
      setText(val);
      const num = parseFloat(val);
      if (!Number.isNaN(num)) commit(num);
    };

    const handleBlur: React.FocusEventHandler<HTMLInputElement> = () => {
      const num = parseFloat(text);
      if (Number.isNaN(num)) setText(String(current));
      else commit(num);
    };

    const handleWheel: React.WheelEventHandler<HTMLInputElement> = (e) => {
      if (disabled) return;
      e.preventDefault();
      stepBy(e.deltaY < 0 ? 1 : -1);
    };

    const stepBy = (dir: number) => commit(current + dir * step);

    const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ') || undefined;

    const w = typeof width === 'number' ? `${width}px` : width;

    return (
      <Wrapper theme={theme} className={cls} style={style}>
        <IconButton
          size="sm"
          variant="outlined"
          icon="mdi:minus"
          onClick={() => stepBy(-1)}
          disabled={disabled}
          aria-label="decrement"
        />
        <Field
          {...rest}
          ref={ref}
          type="number"
          inputMode="numeric"
          theme={theme}
          $w={w}
          value={text}
          onChange={handleInput}
          onBlur={handleBlur}
          onWheel={handleWheel}
          disabled={disabled}
        />
        <IconButton
          size="sm"
          variant="outlined"
          icon="mdi:plus"
          onClick={() => stepBy(1)}
          disabled={disabled}
          aria-label="increment"
        />
      </Wrapper>
    );
  },
);

Iterator.displayName = 'Iterator';

export default Iterator;

// ─────────────────────────────────────────────────────────────
// src/components/fields/Iterator.tsx | valet
// numeric stepper with plus/minus buttons and scroll wheel support
// ─────────────────────────────────────────────────────────────
import React, { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { IconButton } from './IconButton';
import { useOptionalForm } from './FormControl';
import type { Presettable } from '../../types';
import type { Theme } from '../../system/themeStore';

/*───────────────────────────────────────────────────────────*/
export interface IteratorProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>,
    Presettable {
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
  gap: ${({ theme }) => theme.spacing(0.75)};
`;

const Field = styled('input')<{ theme: Theme; $w: string }>`
  padding: ${({ theme }) => theme.spacing(0.5)};
  border: ${({ theme }) => theme.stroke(1)} solid ${({ theme }) => theme.colors.text + '44'};
  border-radius: ${({ theme }) => theme.radius(1)};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  text-align: center;
  width: ${({ $w }) => $w};
  overscroll-behavior: contain;
  -moz-appearance: textfield;
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &:focus {
    outline: ${({ theme }) => theme.stroke(2)} solid ${({ theme }) => theme.colors.primary};
    outline-offset: ${({ theme }) => theme.stroke(1)};
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
      width = '3.5rem',
      disabled = false,
      preset: p,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const { theme } = useTheme();

    const localRef = useRef<HTMLInputElement | null>(null);
    const setRef = useCallback(
      (node: HTMLInputElement | null) => {
        localRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref],
    );

    const form = useOptionalForm<Record<string, number | undefined>>();

    const formVal = form && name ? (form.values[name] as number | undefined) : undefined;
    const controlled = valueProp !== undefined || formVal !== undefined;
    const [internal, setInternal] = useState(defaultValue ?? 0);
    const current = controlled ? (formVal ?? valueProp!) : internal;
    const [text, setText] = useState(String(current));

    useEffect(() => {
      setText(String(current));
    }, [current]);

    const commit = useCallback(
      (next: number) => {
        if (min !== undefined && next < min) next = min;
        if (max !== undefined && next > max) next = max;
        if (!controlled) setInternal(next);
        if (form && name) form.setField(name as keyof Record<string, number | undefined>, next);
        onChange?.(next);
        setText(String(next));
      },
      [controlled, form, max, min, name, onChange],
    );

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

    const stepBy = useCallback(
      (dir: number) => {
        commit(current + dir * step);
      },
      [commit, current, step],
    );

    const handleWheel = useCallback(
      (e: WheelEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        stepBy(e.deltaY < 0 ? 1 : -1);
      },
      [disabled, stepBy],
    );

    useEffect(() => {
      const node = localRef.current;
      if (!node) return;
      node.addEventListener('wheel', handleWheel, { passive: false });
      return () => node.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ') || undefined;

    const w = typeof width === 'number' ? `${width}px` : width;

    return (
      <Wrapper
        theme={theme}
        className={cls}
        style={style}
      >
        <IconButton
          size='xs'
          variant='outlined'
          icon='mdi:minus'
          onClick={() => stepBy(-1)}
          disabled={disabled}
          aria-label='decrement'
        />
        <Field
          {...rest}
          ref={setRef}
          type='number'
          inputMode='numeric'
          theme={theme}
          $w={w}
          value={text}
          onChange={handleInput}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <IconButton
          size='xs'
          variant='outlined'
          icon='mdi:plus'
          onClick={() => stepBy(1)}
          disabled={disabled}
          aria-label='increment'
        />
      </Wrapper>
    );
  },
);

Iterator.displayName = 'Iterator';

export default Iterator;

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
import type { FieldBaseProps } from '../../types';
import type { Theme } from '../../system/themeStore';

/*───────────────────────────────────────────────────────────*/
export interface IteratorProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'style' | 'name'>,
    FieldBaseProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Fires when a value is committed (buttons, wheel, keyboard, or blur). */
  onCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /**
   * When true, committing also happens while typing for any parsable number.
   * Defaults to false to avoid interrupting intermediate states like "1." or "-".
   */
  commitOnChange?: boolean;
  /**
   * If true, coerces committed values to align to `step` from the origin (min if provided, else 0).
   */
  roundToStep?: boolean;
  /**
   * Control mouse wheel behavior: off | focus | hover (default: focus)
   *  - off: disable wheel-based stepping
   *  - focus: only step when the field has focus
   *  - hover: step while hovered (prevents page scroll while over the input)
   */
  wheelBehavior?: 'off' | 'focus' | 'hover';
  /** Control width of the numeric field (token or CSS length). */
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
  &[disabled] {
    color: ${({ theme }) => theme.colors.text + '66'};
    border-color: ${({ theme }) => theme.colors.text + '22'};
    cursor: not-allowed;
  }
`;

/*───────────────────────────────────────────────────────────*/
export const Iterator = forwardRef<HTMLInputElement, IteratorProps>(
  (
    {
      value: valueProp,
      defaultValue,
      onChange,
      onCommit,
      name,
      min,
      max,
      step = 1,
      commitOnChange = false,
      roundToStep = false,
      wheelBehavior = 'focus',
      width = '3.5rem',
      disabled = false,
      readOnly = false,
      preset: p,
      className,
      sx,
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

    const alignToStep = useCallback(
      (val: number) => {
        if (!roundToStep || !step || step <= 0) return val;
        const origin = min ?? 0;
        const delta = val - origin;
        const snapped = Math.round(delta / step) * step + origin;
        return snapped;
      },
      [min, roundToStep, step],
    );

    const clamp = useCallback(
      (val: number) => {
        let v = val;
        if (min !== undefined && v < min) v = min;
        if (max !== undefined && v > max) v = max;
        return v;
      },
      [min, max],
    );

    const commit = useCallback(
      (next: number) => {
        const v = alignToStep(clamp(next));
        if (!controlled) setInternal(v);
        if (form && name) form.setField(name as keyof Record<string, number | undefined>, v);
        onChange?.(v);
        onCommit?.(v);
        setText(String(v));
      },
      [alignToStep, clamp, controlled, form, name, onChange, onCommit],
    );

    const handleInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      const val = e.target.value;
      setText(val);
      const num = parseFloat(val);
      if (commitOnChange && !Number.isNaN(num)) commit(num);
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
        if (disabled || readOnly) return;
        if (wheelBehavior === 'off') return;
        if (wheelBehavior === 'focus' && localRef.current !== document.activeElement) return;
        e.preventDefault();
        e.stopPropagation();
        stepBy(e.deltaY < 0 ? 1 : -1);
      },
      [disabled, readOnly, stepBy, wheelBehavior],
    );

    useEffect(() => {
      const node = localRef.current;
      if (!node) return;
      node.addEventListener('wheel', handleWheel, { passive: false });
      return () => node.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ') || undefined;

    const w = typeof width === 'number' ? `${width}px` : width;

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
      if (disabled || readOnly) return;
      const key = e.key;
      const big = Math.max(step * 10, step);
      if (key === 'ArrowUp') {
        e.preventDefault();
        stepBy(1);
      } else if (key === 'ArrowDown') {
        e.preventDefault();
        stepBy(-1);
      } else if (key === 'PageUp') {
        e.preventDefault();
        commit(current + big);
      } else if (key === 'PageDown') {
        e.preventDefault();
        commit(current - big);
      } else if (key === 'Home' && min !== undefined) {
        e.preventDefault();
        commit(min);
      } else if (key === 'End' && max !== undefined) {
        e.preventDefault();
        commit(max);
      } else if (key === 'Enter') {
        const num = parseFloat(text);
        if (!Number.isNaN(num)) commit(num);
        else setText(String(current));
      } else if (key === 'Escape') {
        setText(String(current));
      }
    };

    return (
      <Wrapper
        theme={theme}
        className={cls}
        style={sx}
      >
        <IconButton
          size='xs'
          variant='outlined'
          icon='mdi:minus-thick'
          onClick={() => stepBy(-1)}
          disabled={disabled || readOnly}
          aria-label='decrement'
        />
        <Field
          {...rest}
          ref={setRef}
          type='number'
          inputMode='numeric'
          theme={theme}
          $w={w}
          name={name}
          min={min}
          max={max}
          step={step}
          value={text}
          onChange={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          readOnly={readOnly}
        />
        <IconButton
          size='xs'
          variant='outlined'
          icon='mdi:plus-thick'
          onClick={() => stepBy(1)}
          disabled={disabled || readOnly}
          aria-label='increment'
        />
      </Wrapper>
    );
  },
);

Iterator.displayName = 'Iterator';

export default Iterator;

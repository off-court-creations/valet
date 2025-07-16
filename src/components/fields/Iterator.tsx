// ─────────────────────────────────────────────────────────────
// src/components/fields/Iterator.tsx | valet
// compact number input with +/- controls
// ─────────────────────────────────────────────────────────────
import React, { forwardRef, useId, useState } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import IconButton from './IconButton';
import type { Theme } from '../../system/themeStore';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
export interface IteratorProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size' | 'value' | 'defaultValue'>,
    Presettable {
  value?: number;
  defaultValue?: number;
  onChange?: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  width?: number | string;
}

/*───────────────────────────────────────────────────────────*/
const Wrapper = styled('div')<{ $width: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`;

const Field = styled('input')<{ theme: Theme; $width: string }>`
  width: ${({ $width }) => $width};
  text-align: center;
  padding: ${({ theme }) => theme.spacing(0.5)};
  border: 1px solid ${({ theme }) => theme.colors.text}44;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
`;

/*───────────────────────────────────────────────────────────*/
export const Iterator = forwardRef<HTMLInputElement, IteratorProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      min,
      max,
      step = 1,
      width = '4rem',
      preset: presetKey,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const id = useId();

    const presetCls = presetKey ? preset(presetKey) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

    const [internal, setInternal] = useState(defaultValue ?? 0);
    const current = value ?? internal;

    const clamp = (n: number) => {
      if (min !== undefined && n < min) n = min;
      if (max !== undefined && n > max) n = max;
      return n;
    };

    const update = (n: number) => {
      n = clamp(n);
      if (value === undefined) setInternal(n);
      onChange?.(n);
    };

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      const next = Number(e.target.value);
      if (!Number.isNaN(next)) update(next);
    };

    return (
      <Wrapper $width={typeof width === 'number' ? `${width}px` : width} className={mergedCls} style={style}>
        <IconButton icon="mdi:minus" size="sm" onClick={() => update(current - step)} aria-label="decrement" />
        <Field
          {...rest}
          ref={ref}
          id={id}
          theme={theme}
          type="number"
          value={current}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          $width={typeof width === 'number' ? `${width}px` : width}
        />
        <IconButton icon="mdi:plus" size="sm" onClick={() => update(current + step)} aria-label="increment" />
      </Wrapper>
    );
  },
);

Iterator.displayName = 'Iterator';

export default Iterator;

// ─────────────────────────────────────────────────────────────
// src/components/widgets/Iterator.tsx  | valet
// numeric stepper with +/- buttons
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';
import IconButton from '../fields/IconButton';

/*───────────────────────────────────────────────────────────*/
export interface IteratorProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue' | 'onChange'>,
    Presettable {
  value?: number;
  defaultValue?: number;
  step?: number;
  min?: number;
  max?: number;
  size?: number | string;
  onChange?: (value: number) => void;
}

/*───────────────────────────────────────────────────────────*/
const Root = styled('div')<{ $disabled: boolean; $gap: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ $gap }) => $gap};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
`;

const Field = styled('input')<{ theme: any; $width: string }>`
  width: ${({ $width }) => $width};
  padding: ${({ theme }) => theme.spacing(0.5)};
  border: 1px solid ${({ theme }) => theme.colors.text + '44'};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  text-align: center;
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }
`;

/*───────────────────────────────────────────────────────────*/
export const Iterator: React.FC<IteratorProps> = ({
  value: valueProp,
  defaultValue = 0,
  step = 1,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  size = '4rem',
  disabled = false,
  onChange,
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const [self, setSelf] = useState(defaultValue);
  const controlled = valueProp !== undefined;
  const current = controlled ? valueProp! : self;
  const width = typeof size === 'number' ? `${size}px` : size;
  const presetClass = p ? preset(p) : '';

  const commit = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));
    if (!controlled) setSelf(clamped);
    onChange?.(clamped);
  };

  const inc = () => !disabled && commit(current + step);
  const dec = () => !disabled && commit(current - step);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number(e.target.value);
    if (!Number.isNaN(num)) commit(num);
  };

  return (
    <Root
      $disabled={disabled}
      $gap={theme.spacing(0.5)}
      className={[presetClass, className].filter(Boolean).join(' ')}
      style={style}
    >
      <IconButton
        icon="mdi:minus"
        size="sm"
        onClick={dec}
        aria-label="decrease"
        disabled={disabled}
      />
      <Field
        {...rest}
        type="number"
        value={current}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        theme={theme}
        $width={width}
      />
      <IconButton
        icon="mdi:plus"
        size="sm"
        onClick={inc}
        aria-label="increase"
        disabled={disabled}
      />
    </Root>
  );
};

export default Iterator;

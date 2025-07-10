// ─────────────────────────────────────────────────────────────
// src/components/DateTimePicker.tsx | valet
// Accessible date & time picker built on TextField
// ─────────────────────────────────────────────────────────────
import React, { forwardRef, useId, ChangeEvent } from 'react';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import { useForm } from './FormControl';
import type { Presettable } from '../types';
import type { Theme } from '../system/themeStore';

/*──────────────────────────────────────────────────────────────*/
/* Prop contracts                                                */
export interface DateTimePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'>,
    Presettable {
  name: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  mode?: 'date' | 'time' | 'datetime';
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

interface StyledFieldProps { theme: Theme; $error?: boolean }

const sharedFieldCSS = ({ theme, $error }: StyledFieldProps) => `
  padding: ${theme.spacing(1)} ${theme.spacing(1)};
  border: 1px solid ${($error ? theme.colors.secondary : theme.colors.text) + '44'};
  border-radius: 4px;
  background: ${theme.colors.background};
  color: ${theme.colors.text};
  font-size: 0.875rem;
  width: 100%;
  &:focus {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 1px;
  }
`;

const Input = styled('input')<StyledFieldProps>`
  ${sharedFieldCSS}
`;

const Wrapper = styled('div')<{ theme: Theme }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Label = styled('label')<{ theme: Theme }>`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text};
`;

const Helper = styled('span')<{ theme: Theme; $error?: boolean }>`
  font-size: 0.75rem;
  color: ${({ theme, $error }) => ($error ? theme.colors.secondary : theme.colors.text) + 'AA'};
`;

/*──────────────────────────────────────────────────────────────*/
/* Component                                                     */
export const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(
  (props, ref) => {
    const {
      name,
      label,
      helperText,
      error = false,
      mode = 'date',
      preset: p,
      className,
      value: externalValue,
      defaultValue,
      onChange: externalOnChange,
      ...rest
    } = props;

    const id = useId();
    const { theme } = useTheme();

    let form: ReturnType<typeof useForm<any>> | null = null;
    try { form = useForm<any>(); } catch {}

    const controlledValue = form ? form.values[name] ?? '' : externalValue;
    const setField = form ? form.setField : undefined;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      setField?.(name as any, e.target.value);
      externalOnChange?.(e.target.value);
    };

    const presetCls = p ? preset(p) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

    const type = mode === 'datetime' ? 'datetime-local' : mode;

    return (
      <Wrapper theme={theme} className={mergedCls}>
        {label && (
          <Label theme={theme} htmlFor={id}>
            {label}
          </Label>
        )}
        <Input
          {...rest}
          id={id}
          name={name}
          ref={ref}
          theme={theme}
          $error={error}
          type={type}
          value={controlledValue}
          defaultValue={defaultValue}
          onChange={handleChange}
        />
        {helperText && (
          <Helper theme={theme} $error={error}>
            {helperText}
          </Helper>
        )}
      </Wrapper>
    );
  },
);

DateTimePicker.displayName = 'DateTimePicker';

export default DateTimePicker;

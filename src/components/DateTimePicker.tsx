// ─────────────────────────────────────────────────────────────
// src/components/DateTimePicker.tsx  | valet
// accessible date & time picker
// ─────────────────────────────────────────────────────────────
import React, { forwardRef, useState, useEffect, useId } from 'react';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import { useForm } from './FormControl';
import type { Theme } from '../system/themeStore';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
interface StyledInputProps { theme: Theme; }

const sharedInputCSS = ({ theme }: StyledInputProps) => `
  padding: ${theme.spacing(1)} ${theme.spacing(1)};
  border: 1px solid ${theme.colors.text + '44'};
  border-radius: 4px;
  background: ${theme.colors.background};
  color: ${theme.colors.text};
  font-size: 0.875rem;
  width: 100%;
  &:focus { outline: 2px solid ${theme.colors.primary}; outline-offset: 1px; }
`;

const Input = styled('input')<StyledInputProps>`
  ${sharedInputCSS}
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

const Row = styled('div')<{ theme: Theme }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
`;

/*───────────────────────────────────────────────────────────*/
/* Prop contracts                                            */
export interface DateTimePickerProps
  extends Presettable,
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Field name for FormControl */
  name?: string;
  /** Optional label */
  label?: string;
  /** Show date input */
  showDate?: boolean;
  /** Show time input */
  showTime?: boolean;
  /** Controlled value in ISO format */
  value?: string;
  /** Uncontrolled initial value */
  defaultValue?: string;
  /** Change handler receiving ISO string */
  onChange?: (val: string) => void;
  disabled?: boolean;
}

/*───────────────────────────────────────────────────────────*/
/* Helper functions                                          */
const splitParts = (v: string | undefined) => {
  const date = v?.split('T')[0] ?? '';
  const time = v?.split('T')[1]?.slice(0,5) ?? '';
  if (v && !v.includes('T')) {
    if (v.includes(':')) return { date: '', time: v };
    return { date: v, time: '' };
  }
  return { date, time };
};

const joinParts = (d: string, t: string, sd: boolean, st: boolean) => {
  if (sd && st) {
    if (!d && !t) return '';
    return `${d}T${t}`.trim();
  }
  return sd ? d : t;
};

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const DateTimePicker = forwardRef<HTMLDivElement, DateTimePickerProps>(
  (props, ref) => {
    const {
      name,
      label,
      showDate = true,
      showTime = true,
      value: valueProp,
      defaultValue,
      onChange,
      disabled,
      preset: presetKey,
      className,
      style,
      ...rest
    } = props;

    const { theme } = useTheme();
    const id = useId();

    let form: ReturnType<typeof useForm<any>> | null = null;
    try { form = useForm<any>(); } catch {}

    const formVal = form && name ? form.values[name] : undefined;
    const controlled = formVal !== undefined || valueProp !== undefined;

    const [self, setSelf] = useState(defaultValue ?? '');
    const cur = controlled ? (formVal ?? valueProp ?? '') : self;

    const parts = splitParts(cur);
    const [date, setDate] = useState(parts.date);
    const [time, setTime] = useState(parts.time);

    useEffect(() => {
      const p = splitParts(cur);
      setDate(p.date); setTime(p.time);
    }, [cur]);

    const commit = (d: string, t: string) => {
      const next = joinParts(d, t, showDate, showTime);
      if (!controlled) setSelf(next);
      if (form && name) form.setField(name as any, next);
      onChange?.(next);
    };

    const presetCls = presetKey ? preset(presetKey) : '';
    const merged = [presetCls, className].filter(Boolean).join(' ') || undefined;

    return (
      <Wrapper ref={ref} theme={theme} className={merged} style={style} {...rest}>
        {label && (
          <Label theme={theme} htmlFor={id}>{label}</Label>
        )}
        <Row theme={theme}>
          {showDate && (
            <Input
              theme={theme}
              type="date"
              value={date}
              disabled={disabled}
              onChange={(e) => {
                setDate(e.target.value);
                commit(e.target.value, time);
              }}
            />
          )}
          {showTime && (
            <Input
              theme={theme}
              type="time"
              value={time}
              disabled={disabled}
              onChange={(e) => {
                setTime(e.target.value);
                commit(date, e.target.value);
              }}
            />
          )}
        </Row>
      </Wrapper>
    );
  }
);

DateTimePicker.displayName = 'DateTimePicker';

export default DateTimePicker;

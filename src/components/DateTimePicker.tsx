// ─────────────────────────────────────────────────────────────
// src/components/DateTimePicker.tsx | valet
// accessible date/time picker with optional fields
// ─────────────────────────────────────────────────────────────
import React, { forwardRef, useId, useState, ChangeEvent } from 'react';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import { useForm } from './FormControl';
import type { Theme } from '../system/themeStore';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
/* Prop contracts                                            */
export interface DateTimePickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Presettable {
  /** Controlled ISO value: "YYYY-MM-DD", "HH:mm", or "YYYY-MM-DDTHH:mm" */
  value?: string;
  /** Uncontrolled default value */
  defaultValue?: string;
  /** Fires with the combined value whenever it changes */
  onChange?: (value: string) => void;
  /** Show the date field */
  showDate?: boolean;
  /** Show the time field */
  showTime?: boolean;
  /** Include seconds in the time selector */
  includeSeconds?: boolean;
  /** Field name when used inside FormControl */
  name?: string;
  /** Disabled state */
  disabled?: boolean;
  label?: string;
  helperText?: string;
  error?: boolean;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Wrapper = styled('div')<{ theme: Theme }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Row = styled('div')<{ theme: Theme }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Field = styled('input')<{ theme: Theme; $error?: boolean }>`
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(1)}`};
  border: 1px solid
    ${({ theme, $error }) =>
      ($error ? theme.colors.secondary : theme.colors.text) + '44'};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  width: 100%;
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }
`;

const TimeWrap = styled('div')<{ theme: Theme }>`
  display: flex;
  gap: 2px;
  align-items: center;
`;

const TimePart = styled('input')<{ theme: Theme; $error?: boolean }>`
  width: 3.5ch;
  text-align: center;
  padding: ${({ theme }) => `${theme.spacing(0.5)} ${theme.spacing(0.5)}`};
  border: 1px solid
    ${({ theme, $error }) =>
      ($error ? theme.colors.secondary : theme.colors.text) + '44'};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    height: 1em;
  }
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }
`;

const Colon = styled('span')<{ theme: Theme }>`
  user-select: none;
  padding: 0 2px;
  color: ${({ theme }) => theme.colors.text};
`;

const Label = styled('label')<{ theme: Theme }>`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text};
`;

const Helper = styled('span')<{ theme: Theme; $error?: boolean }>`
  font-size: 0.75rem;
  color: ${({ theme, $error }) =>
    ($error ? theme.colors.secondary : theme.colors.text) + 'AA'};
`;

/*───────────────────────────────────────────────────────────*/
/* Helpers                                                   */
const parse = (v?: string) => {
  let date = '';
  let time = '';
  if (!v) return { date, time };
  if (v.includes('T')) {
    [date, time] = v.split('T');
  } else if (v.includes('-')) {
    date = v;
  } else if (v.includes(':')) {
    time = v;
  }
  return { date, time };
};

const combine = (
  date: string,
  time: string,
  showDate: boolean,
  showTime: boolean,
) => {
  if (showDate && showTime) return date && time ? `${date}T${time}` : '';
  return showDate ? date : showTime ? time : '';
};

const pad = (n: number) => String(n).padStart(2, '0');

const parseTimeParts = (v: string) => {
  const [h = '00', m = '00', s = '00'] = v.split(':');
  return { h, m, s };
};

const buildTime = (h: string, m: string, s: string, includeSeconds: boolean) =>
  includeSeconds ? `${pad(+h)}:${pad(+m)}:${pad(+s)}` : `${pad(+h)}:${pad(+m)}`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const DateTimePicker = forwardRef<HTMLDivElement, DateTimePickerProps>(
  (
    {
      value: valueProp,
      defaultValue,
      onChange,
      showDate = true,
      showTime = true,
      includeSeconds = false,
      name,
      disabled = false,
      label,
      helperText,
      error = false,
      preset: p,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const { theme } = useTheme();

    let form: ReturnType<typeof useForm<any>> | null = null;
    try {
      form = useForm<any>();
    } catch {}

    const formVal = form && name ? (form.values[name] as string) : undefined;
    const controlled = formVal !== undefined || valueProp !== undefined;

    const initial = parse(controlled ? formVal ?? valueProp : defaultValue);
    const [date, setDate] = useState(initial.date);
    const [time, setTime] = useState(initial.time);

    const currentDate = controlled ? parse(formVal ?? valueProp).date : date;
    const currentTime = controlled ? parse(formVal ?? valueProp).time : time;

    const commit = (d: string, t: string) => {
      const combo = combine(d, t, showDate, showTime);
      if (!controlled) {
        setDate(d);
        setTime(t);
      }
      if (form && name) form.setField(name as any, combo);
      onChange?.(combo);
    };

    const handleDate = (e: ChangeEvent<HTMLInputElement>) => {
      commit(e.target.value, currentTime);
    };

    const handleTimePart = (
      part: 'h' | 'm' | 's',
      value: string,
    ) => {
      const { h, m, s } = parseTimeParts(currentTime);
      const updated = buildTime(
        part === 'h' ? value : h,
        part === 'm' ? value : m,
        part === 's' ? value : s,
        includeSeconds,
      );
      commit(currentDate, updated);
    };

    const presetCls = p ? preset(p) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

    const id = useId();
    const { h, m, s } = parseTimeParts(currentTime);

    return (
      <Wrapper
        {...rest}
        ref={ref}
        theme={theme}
        className={mergedCls}
        style={style}
      >
        {label && (
          <Label theme={theme} htmlFor={`${id}-date`}>
            {label}
          </Label>
        )}
        <Row theme={theme}>
          {showDate && (
            <Field
              id={`${id}-date`}
              type="date"
              value={currentDate}
              onChange={handleDate}
              disabled={disabled}
              theme={theme}
              $error={error}
            />
          )}
          {showTime && (
            <TimeWrap theme={theme}>
              <TimePart
                aria-label="Hours"
                type="number"
                min="0"
                max="23"
                value={h}
                onChange={(e) => handleTimePart('h', e.target.value)}
                disabled={disabled}
                theme={theme}
                $error={error}
              />
              <Colon theme={theme}>:</Colon>
              <TimePart
                aria-label="Minutes"
                type="number"
                min="0"
                max="59"
                value={m}
                onChange={(e) => handleTimePart('m', e.target.value)}
                disabled={disabled}
                theme={theme}
                $error={error}
              />
              {includeSeconds && (
                <>
                  <Colon theme={theme}>:</Colon>
                  <TimePart
                    aria-label="Seconds"
                    type="number"
                    min="0"
                    max="59"
                    value={s}
                    onChange={(e) => handleTimePart('s', e.target.value)}
                    disabled={disabled}
                    theme={theme}
                    $error={error}
                  />
                </>
              )}
            </TimeWrap>
          )}
        </Row>
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


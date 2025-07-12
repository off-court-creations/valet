// ─────────────────────────────────────────────────────────────
// src/components/fields/DateTimePicker.tsx | valet
// accessible date/time picker with optional fields
// ─────────────────────────────────────────────────────────────
import React, { forwardRef, useId, useState, ChangeEvent } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { useForm } from './FormControl';
import type { Theme } from '../../system/themeStore';
import type { Presettable } from '../../types';

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
  /** Show seconds when selecting a time */
  showSeconds?: boolean;
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

const TimeWrapper = styled('div')<{ theme: Theme }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const TimeNumber = styled('input')<{ theme: Theme; $error?: boolean }>`
  padding: ${({ theme }) => `${theme.spacing(0.5)} ${theme.spacing(0.5)}`};
  border: 1px solid
    ${({ theme, $error }) =>
      ($error ? theme.colors.secondary : theme.colors.text) + '44'};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  width: 8ch;
  text-align: center;
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }
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
  width: max-content;
  flex: none;
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }
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

const parseTime = (t: string) => {
  const [h = '', m = '', s = ''] = t.split(':');
  return { h, m, s };
};

const combineTime = (
  h: string,
  m: string,
  s: string,
  showSeconds: boolean,
) => {
  if (!h && !m && !s) return '';
  const pad = (v: string) => v.padStart(2, '0');
  const hm = `${pad(h)}:${pad(m || '0')}`;
  return showSeconds ? `${hm}:${pad(s || '0')}` : hm;
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
      showSeconds = false,
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
    const parsedTime = parseTime(initial.time);
    const [hour, setHour] = useState(parsedTime.h);
    const [minute, setMinute] = useState(parsedTime.m);
    const [second, setSecond] = useState(parsedTime.s);

    const controlledParts = (() => {
      if (!controlled) return null;
      const t = parse(formVal ?? valueProp).time;
      return parseTime(t);
    })();

    const currentDate = controlled ? parse(formVal ?? valueProp).date : date;
    const currentHour = controlledParts ? controlledParts.h : hour;
    const currentMinute = controlledParts ? controlledParts.m : minute;
    const currentSecond = controlledParts ? controlledParts.s : second;

    const commit = (d: string, h: string, m: string, s: string) => {
      const t = combineTime(h, m, s, showSeconds);
      const combo = combine(d, t, showDate, showTime);
      if (!controlled) {
        setDate(d);
        setHour(h);
        setMinute(m);
        setSecond(s);
      }
      if (form && name) form.setField(name as any, combo);
      onChange?.(combo);
    };

    const handleDate = (e: ChangeEvent<HTMLInputElement>) => {
      commit(e.target.value, currentHour, currentMinute, currentSecond);
    };
    const handleHour = (e: ChangeEvent<HTMLInputElement>) => {
      commit(currentDate, e.target.value, currentMinute, currentSecond);
    };
    const handleMinute = (e: ChangeEvent<HTMLInputElement>) => {
      commit(currentDate, currentHour, e.target.value, currentSecond);
    };
    const handleSecond = (e: ChangeEvent<HTMLInputElement>) => {
      commit(currentDate, currentHour, currentMinute, e.target.value);
    };

    const presetCls = p ? preset(p) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

    const id = useId();

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
            <TimeWrapper theme={theme}>
              <TimeNumber
                type="number"
                min="0"
                max="23"
                value={currentHour}
                onChange={handleHour}
                disabled={disabled}
                theme={theme}
                $error={error}
              />
              <span>:</span>
              <TimeNumber
                type="number"
                min="0"
                max="59"
                value={currentMinute}
                onChange={handleMinute}
                disabled={disabled}
                theme={theme}
                $error={error}
              />
              {showSeconds && (
                <>
                  <span>:</span>
                  <TimeNumber
                    type="number"
                    min="0"
                    max="59"
                    value={currentSecond}
                    onChange={handleSecond}
                    disabled={disabled}
                    theme={theme}
                    $error={error}
                  />
                </>
              )}
            </TimeWrapper>
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


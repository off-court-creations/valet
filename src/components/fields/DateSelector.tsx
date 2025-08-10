// ─────────────────────────────────────────────────────────────
// src/components/fields/DateSelector.tsx | valet
// interactive month calendar for picking dates
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { IconButton } from './IconButton';
import { Select } from './Select';
import { useForm } from './FormControl';
import { toRgb, mix, toHex } from '../../helpers/color';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
export interface DateSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Presettable {
  /** Controlled ISO date value (YYYY-MM-DD). */
  value?: string;
  /** Default value for uncontrolled usage. */
  defaultValue?: string;
  /** Fires with ISO value when selection changes. */
  onChange?: (value: string) => void;
  /** FormControl field name. */
  name?: string;
  /** Earliest selectable ISO date (YYYY-MM-DD). */
  minDate?: string;
  /** Latest selectable ISO date (YYYY-MM-DD). */
  maxDate?: string;
  /** Enable dual start/end selection mode. */
  range?: boolean;
  /** Controlled end date when `range` is true. */
  endValue?: string;
  /** Default end date for uncontrolled range mode. */
  defaultEndValue?: string;
  /** Fires with start and end ISO values when range changes. */
  onRangeChange?: (start: string, end: string) => void;
}

/*───────────────────────────────────────────────────────────*/
const Wrapper = styled('div')<{ $bg: string; $text: string }>`
  display: inline-block;
  padding: 0.5rem;
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  border-radius: 4px;
  user-select: none;
`;

const Header = styled('div')<{ $gap: string }>`
  display: flex;
  align-items: center;
  gap: ${({ $gap }) => $gap};
  margin-bottom: 0.5rem;
`;

const Grid = styled('div')`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
`;

const DayLabel = styled('div')`
  font-size: 0.75rem;
  text-align: center;
  opacity: 0.8;
`;

const Cell = styled('button')<{
  $start: boolean;
  $end: boolean;
  $inRange: boolean;
  $primary: string;
  $secondary: string;
  $rangeBg: string;
}>`
  padding: 0.25rem 0;
  border: none;
  background: ${({ $start, $end, $inRange, $primary, $secondary, $rangeBg }) =>
    $start ? $primary : $end ? $secondary : $inRange ? $rangeBg : 'transparent'};
  color: inherit;
  border-radius: 4px;
  cursor: pointer;
  font: inherit;
  font-weight: ${({ $start, $end }) => ($start || $end ? 'bold' : 'inherit')};
  height: 2rem;
  &:hover:not(:disabled) {
    filter: brightness(1.2);
  }
  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

/*───────────────────────────────────────────────────────────*/
const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/*───────────────────────────────────────────────────────────*/
export const DateSelector: React.FC<DateSelectorProps> = ({
  value,
  defaultValue,
  onChange,
  range = false,
  endValue,
  defaultEndValue,
  onRangeChange,
  name,
  minDate: minDateProp,
  maxDate: maxDateProp,
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();

  /* optional FormControl binding --------------------------- */
  type StringForm = ReturnType<typeof useForm<Record<string, string | undefined>>>;
  let form: StringForm | null = null;
  try {
    form = useForm<Record<string, string | undefined>>();
  } catch {}

  const formVal = form && name ? (form.values[name] as string | undefined) : undefined;
  const controlled = value !== undefined || formVal !== undefined;
  const parseDate = (v?: string) => (v ? new Date(v + 'T00:00') : new Date());

  const initialStart = value ?? formVal ?? defaultValue;
  const initialEnd = endValue ?? defaultEndValue ?? initialStart;

  const [startInt, setStartInt] = useState(parseDate(initialStart));
  const [endInt, setEndInt] = useState(parseDate(initialEnd));

  const today = new Date();
  const min = minDateProp ? parseDate(minDateProp) : new Date(today.getFullYear() - 120, 0, 1);
  const max = maxDateProp ? parseDate(maxDateProp) : new Date(today.getFullYear() + 120, 11, 31);

  const minYear = min.getFullYear();
  const maxYear = max.getFullYear();

  const startDate = controlled ? parseDate(value ?? formVal) : startInt;
  const endDate = range ? (endValue !== undefined ? parseDate(endValue) : endInt) : startDate;

  const [viewYear, setViewYear] = useState(startDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(startDate.getMonth());

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  const minMonth = min.getMonth();
  const maxMonth = max.getMonth();
  const firstMonth = viewYear === minYear ? minMonth : 0;
  const lastMonth = viewYear === maxYear ? maxMonth : 11;
  const months = Array.from({ length: lastMonth - firstMonth + 1 }, (_, i) => firstMonth + i);

  const startDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const commit = (d: number) => {
    const iso = new Date(viewYear, viewMonth, d).toISOString().slice(0, 10);
    if (!controlled) setStartInt(new Date(viewYear, viewMonth, d));
    if (form && name) form.setField(name as any, iso);
    onChange?.(iso);
  };

  const commitRange = (d: number) => {
    const clicked = new Date(viewYear, viewMonth, d);
    let start = startDate;
    let end = endDate;

    if (start.getTime() !== end.getTime()) {
      start = clicked;
      end = clicked;
    } else {
      if (clicked < start) {
        start = clicked;
      } else {
        end = clicked;
      }
      if (start > end) {
        const tmp = start;
        start = end;
        end = tmp;
      }
    }

    if (!controlled) setStartInt(start);
    if (endValue === undefined) setEndInt(end);
    onRangeChange?.(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
  };

  const changeMonth = (delta: number) => {
    setViewMonth((m) => {
      let next = m + delta;
      let yr = viewYear;
      while (next < 0) {
        next += 12;
        yr--;
      }
      while (next > 11) {
        next -= 12;
        yr++;
      }
      const start = new Date(yr, next, 1);
      const end = new Date(yr, next + 1, 0);
      if (end < min || start > max) return m;
      setViewYear(yr);
      return next;
    });
  };

  const presetCls = p ? preset(p) : '';
  const cls = [presetCls, className].filter(Boolean).join(' ') || undefined;

  const rangeBg = toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.25));

  return (
    <Wrapper
      {...rest}
      $bg={theme.colors.backgroundAlt}
      $text={theme.colors.text}
      className={cls}
      style={style}
    >
      <Header $gap={theme.spacing(1)}>
        <div style={{ display: 'flex', gap: theme.spacing(0.5) }}>
          <IconButton
            size='sm'
            variant='outlined'
            icon='mdi:chevron-double-left'
            aria-label='Previous year'
            onClick={() => {
              const yr = viewYear - 1;
              let m = viewMonth;
              if (yr === minYear && m < minMonth) m = minMonth;
              setViewYear(yr);
              setViewMonth(m);
            }}
            disabled={new Date(viewYear - 1, 11, 31) < min}
          />
          <IconButton
            size='sm'
            variant='outlined'
            icon='mdi:chevron-left'
            aria-label='Previous month'
            onClick={() => changeMonth(-1)}
            disabled={new Date(viewYear, viewMonth, 0) < min}
          />
        </div>
        <div
          style={{
            display: 'flex',
            gap: theme.spacing(0.5),
            flex: 1,
            alignItems: 'center',
          }}
        >
          <Select
            size='xs'
            value={viewMonth}
            onChange={(v) => setViewMonth(Number(v))}
            style={{ flex: 1 }}
          >
            {months.map((idx) => (
              <Select.Option
                key={monthNames[idx]}
                value={idx}
              >
                {monthNames[idx]}
              </Select.Option>
            ))}
          </Select>
          <Select
            size='xs'
            value={viewYear}
            onChange={(v) => {
              const yr = Number(v);
              let m = viewMonth;
              if (yr === minYear && m < minMonth) m = minMonth;
              if (yr === maxYear && m > maxMonth) m = maxMonth;
              setViewYear(yr);
              setViewMonth(m);
            }}
            style={{ flex: 1 }}
          >
            {years.map((y) => (
              <Select.Option
                key={y}
                value={y}
              >
                {y}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div style={{ display: 'flex', gap: theme.spacing(0.5) }}>
          <IconButton
            size='sm'
            variant='outlined'
            icon='mdi:chevron-right'
            aria-label='Next month'
            onClick={() => changeMonth(1)}
            disabled={new Date(viewYear, viewMonth + 1, 1) > max}
          />
          <IconButton
            size='sm'
            variant='outlined'
            icon='mdi:chevron-double-right'
            aria-label='Next year'
            onClick={() => {
              const yr = viewYear + 1;
              let m = viewMonth;
              if (yr === maxYear && m > maxMonth) m = maxMonth;
              setViewYear(yr);
              setViewMonth(m);
            }}
            disabled={new Date(viewYear + 1, 0, 1) > max}
          />
        </div>
      </Header>
      <Grid>
        {days.map((d) => (
          <DayLabel key={d}>{d}</DayLabel>
        ))}
        {Array.from({ length: startDay }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(viewYear, viewMonth, day);
          const disabled = date < min || date > max;
          const startSel =
            startDate.getFullYear() === viewYear &&
            startDate.getMonth() === viewMonth &&
            startDate.getDate() === day;
          const endSel =
            range &&
            endDate.getFullYear() === viewYear &&
            endDate.getMonth() === viewMonth &&
            endDate.getDate() === day;
          const inRange = range && date > startDate && date < endDate;
          return (
            <Cell
              key={day}
              $start={startSel}
              $end={!!endSel && !startSel}
              $inRange={!!inRange}
              $primary={theme.colors.primary}
              $secondary={theme.colors.secondary}
              $rangeBg={rangeBg}
              onClick={() => !disabled && (range ? commitRange(day) : commit(day))}
              disabled={disabled}
            >
              {day}
            </Cell>
          );
        })}
      </Grid>
    </Wrapper>
  );
};

export default DateSelector;

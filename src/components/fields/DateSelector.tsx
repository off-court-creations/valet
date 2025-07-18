// ─────────────────────────────────────────────────────────────
// src/components/widgets/DateSelector.tsx | valet
// interactive month calendar for picking dates
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { IconButton } from './IconButton';
import { Select } from './Select';
import { useForm } from './FormControl';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
export interface DateSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Presettable {
  /** Controlled ISO date value or `[start, end]` pair. */
  value?: string | [string, string];
  /** Default value for uncontrolled usage. */
  defaultValue?: string | [string, string];
  /** Fires with ISO value or pair when selection changes. */
  onChange?: (value: string | [string, string]) => void;
  /** FormControl field name. */
  name?: string;
  /** Earliest selectable ISO date (YYYY-MM-DD). */
  minDate?: string;
  /** Latest selectable ISO date (YYYY-MM-DD). */
  maxDate?: string;
  /** Enable dual start/end date selection. */
  range?: boolean;
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
  $between: boolean;
  $primary: string;
  $secondary: string;
}>`
  padding: 0.25rem 0;
  border: ${({ $end, $primary }) =>
    $end ? `1px solid ${$primary}` : 'none'};
  background: ${({ $start, $between, $primary, $secondary }) =>
    $start ? $primary : $between ? $secondary + '55' : 'transparent'};
  color: inherit;
  border-radius: 4px;
  cursor: pointer;
  font: inherit;
  height: 2rem;
  &:hover:not(:disabled) { filter: brightness(1.2); }
  &:disabled { opacity: 0.4; cursor: default; }
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
  name,
  minDate: minDateProp,
  maxDate: maxDateProp,
  preset: p,
  range = false,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  let form: ReturnType<typeof useForm<any>> | null = null;
  try { form = useForm<any>(); } catch {}

  const formVal = form && name ? (form.values[name] as any) : undefined;
  const controlled = value !== undefined || formVal !== undefined;
  const rangeMode = range;
  const initial = value ?? formVal ?? defaultValue;

  const parseDate = (v?: string) => (v ? new Date(v + 'T00:00') : undefined);

  const [startInt, setStartInt] = useState<Date | undefined>(() => {
    if (Array.isArray(initial)) return parseDate(initial[0]);
    return parseDate(initial as string);
  });
  const [endInt, setEndInt] = useState<Date | undefined>(() => {
    if (Array.isArray(initial)) return parseDate(initial[1]);
    return undefined;
  });

  const today = new Date();
  const min = minDateProp ? parseDate(minDateProp)! : new Date(today.getFullYear() - 120, 0, 1);
  const max = maxDateProp ? parseDate(maxDateProp)! : new Date(today.getFullYear() + 120, 11, 31);

  const minYear = min.getFullYear();
  const maxYear = max.getFullYear();


  const val = controlled ? (value ?? formVal) : undefined;
  const selectedStart = controlled
    ? Array.isArray(val)
      ? parseDate(val[0])
      : parseDate(val as string)
    : startInt;
  const selectedEnd = controlled
    ? Array.isArray(val)
      ? parseDate(val[1])
      : undefined
    : endInt;

  const [viewYear, setViewYear] = useState(
    (selectedStart ?? new Date()).getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    (selectedStart ?? new Date()).getMonth()
  );

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  const minMonth = min.getMonth();
  const maxMonth = max.getMonth();
  const firstMonth = viewYear === minYear ? minMonth : 0;
  const lastMonth = viewYear === maxYear ? maxMonth : 11;
  const months = Array.from({ length: lastMonth - firstMonth + 1 }, (_, i) => firstMonth + i);

  const startDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const isoDate = (d: Date) => d.toISOString().slice(0, 10);

  const commit = (d: number) => {
    const selDate = new Date(viewYear, viewMonth, d);
    const iso = isoDate(selDate);
    if (!rangeMode) {
      if (!controlled) setStartInt(parseDate(iso)!);
      if (form && name) form.setField(name as any, iso);
      onChange?.(iso);
      return;
    }

    let start = selectedStart;
    let end = selectedEnd;
    const sel = parseDate(iso)!;

    if (!start || (start && end)) {
      start = sel;
      end = undefined;
    } else if (sel < start) {
      end = start;
      start = sel;
    } else {
      end = sel;
    }

    if (!controlled) {
      setStartInt(start);
      setEndInt(end);
    }
    const out = end ? [isoDate(start), isoDate(end)] : [isoDate(start)];
    if (form && name) form.setField(name as any, out);
    onChange?.(out as any);
  };

  const changeMonth = (delta: number) => {
    setViewMonth((m) => {
      let next = m + delta;
      let yr = viewYear;
      while (next < 0) { next += 12; yr--; }
      while (next > 11) { next -= 12; yr++; }
      const start = new Date(yr, next, 1);
      const end = new Date(yr, next + 1, 0);
      if (end < min || start > max) return m;
      setViewYear(yr);
      return next;
    });
  };

  const presetCls = p ? preset(p) : '';
  const cls = [presetCls, className].filter(Boolean).join(' ') || undefined;

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
            size="sm"
            variant="outlined"
            icon="mdi:chevron-double-left"
            aria-label="Previous year"
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
            size="sm"
            variant="outlined"
            icon="mdi:chevron-left"
            aria-label="Previous month"
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
            size="xs"
            value={viewMonth}
            onChange={(v) => setViewMonth(Number(v))}
            style={{ flex: 1 }}
          >
            {months.map((idx) => (
              <Select.Option key={monthNames[idx]} value={idx}>
                {monthNames[idx]}
              </Select.Option>
            ))}
          </Select>
          <Select
            size="xs"
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
              <Select.Option key={y} value={y}>
                {y}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div style={{ display: 'flex', gap: theme.spacing(0.5) }}>
          <IconButton
            size="sm"
            variant="outlined"
            icon="mdi:chevron-right"
            aria-label="Next month"
            onClick={() => changeMonth(1)}
            disabled={new Date(viewYear, viewMonth + 1, 1) > max}
          />
          <IconButton
            size="sm"
            variant="outlined"
            icon="mdi:chevron-double-right"
            aria-label="Next year"
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

          const isStart =
            selectedStart &&
            selectedStart.getFullYear() === viewYear &&
            selectedStart.getMonth() === viewMonth &&
            selectedStart.getDate() === day;
          const isEnd =
            selectedEnd &&
            selectedEnd.getFullYear() === viewYear &&
            selectedEnd.getMonth() === viewMonth &&
            selectedEnd.getDate() === day;

          let between = false;
          if (rangeMode && selectedStart && selectedEnd) {
            const time = date.getTime();
            between =
              time > selectedStart.getTime() &&
              time < selectedEnd.getTime();
          }

          return (
            <Cell
              key={day}
              $start={!!isStart}
              $end={!!isEnd}
              $between={between}
              $primary={theme.colors.primary}
              $secondary={theme.colors.secondary}
              onClick={() => !disabled && commit(day)}
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

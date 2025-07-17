// ─────────────────────────────────────────────────────────────
// src/components/widgets/DateSelector.tsx | valet
// interactive month calendar for picking dates
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { IconButton } from '../fields/IconButton';
import { Select } from '../fields/Select';
import { useForm } from '../fields/FormControl';
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

const Cell = styled('button')<{ $selected: boolean; $primary: string }>`
  padding: 0.25rem 0;
  border: none;
  background: ${({ $selected, $primary }) =>
    $selected ? $primary : 'transparent'};
  color: inherit;
  border-radius: 4px;
  cursor: pointer;
  font: inherit;
  height: 2rem;
  &:hover:not(:disabled) { filter: brightness(1.2); }
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
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  let form: ReturnType<typeof useForm<any>> | null = null;
  try { form = useForm<any>(); } catch {}

  const formVal = form && name ? (form.values[name] as string | undefined) : undefined;
  const controlled = value !== undefined || formVal !== undefined;
  const initial = value ?? formVal ?? defaultValue;
  const parseDate = (v?: string) => v ? new Date(v + 'T00:00') : new Date();
  const [internal, setInternal] = useState(parseDate(initial));

  const selected = controlled ? parseDate(value ?? formVal) : internal;
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const years = Array.from({ length: 241 }, (_, i) => viewYear - 120 + i);

  const startDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const commit = (d: number) => {
    const iso = new Date(viewYear, viewMonth, d).toISOString().slice(0, 10);
    if (!controlled) setInternal(new Date(viewYear, viewMonth, d));
    if (form && name) form.setField(name as any, iso);
    onChange?.(iso);
  };

  const changeMonth = (delta: number) => {
    setViewMonth((m) => {
      let next = m + delta;
      let yr = viewYear;
      while (next < 0) { next += 12; yr--; }
      while (next > 11) { next -= 12; yr++; }
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
            onClick={() => setViewYear((y) => y - 1)}
          />
          <IconButton
            size="sm"
            variant="outlined"
            icon="mdi:chevron-left"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
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
            {monthNames.map((m, i) => (
              <Select.Option key={m} value={i}>
                {m}
              </Select.Option>
            ))}
          </Select>
          <Select
            size="xs"
            value={viewYear}
            onChange={(v) => setViewYear(Number(v))}
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
          />
          <IconButton
            size="sm"
            variant="outlined"
            icon="mdi:chevron-double-right"
            aria-label="Next year"
            onClick={() => setViewYear((y) => y + 1)}
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
          const selectedDay =
            selected.getFullYear() === viewYear &&
            selected.getMonth() === viewMonth &&
            selected.getDate() === day;
          return (
            <Cell
              key={day}
              $selected={selectedDay}
              $primary={theme.colors.primary}
              onClick={() => commit(day)}
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

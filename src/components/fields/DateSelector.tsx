// ─────────────────────────────────────────────────────────────
// src/components/fields/DateSelector.tsx | valet
// interactive month calendar for picking dates
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { IconButton } from './IconButton';
import { Select } from './Select';
import { useOptionalForm } from './FormControl';
import { toRgb, mix, toHex } from '../../helpers/color';
import type { Presettable, Sx } from '../../types';

/*───────────────────────────────────────────────────────────*/
export interface DateSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'style'>,
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
  /** Inline styles (with CSS var support) */
  sx?: Sx;
  /**
   * Control how compact mode engages.
   * - 'auto' (default): measure container and switch at thresholds.
   * - 'on': force compact layout always.
   * - 'off': disable compact behavior entirely.
   */
  compactMode?: 'auto' | 'on' | 'off';
  /** Width below which compact turns on (when compactMode='auto'). Default: 340 */
  compactThresholdIn?: number;
  /** Width above which compact turns off (when compactMode='auto'). Default: 380 */
  compactThresholdOut?: number;
}

/*───────────────────────────────────────────────────────────*/
const Wrapper = styled('div')<{ $bg: string; $text: string; $compact: boolean }>`
  ${({ $compact }) =>
    $compact ? 'display: block; width: 100%; max-width: 100%;' : 'display: inline-block;'}
  padding: 0.5rem;
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  border-radius: var(--valet-date-radius, 4px);
  user-select: none;
`;

const Header = styled('div')<{ $gap: string }>`
  display: flex;
  align-items: center;
  gap: ${({ $gap }) => $gap};
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  /* Ensure internal flex children can shrink */
  & > * {
    min-width: 0;
  }
`;

const Grid = styled('div')<{ $compact?: boolean }>`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  ${({ $compact }) => ($compact ? 'width: 100%;' : '')}
`;

const DayLabel = styled('div')<{ $compact?: boolean }>`
  font-size: ${({ $compact }) => ($compact ? '0.625rem' : '0.75rem')};
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
  $hoverStart: string;
  $hoverEnd: string;
  $hoverRange: string;
  $hoverDefault: string;
  $selText: string;
  $endText: string;
  $rangeText: string;
  $compact?: boolean;
}>`
  padding: 0.25rem 0;
  border: none;
  background: ${({ $start, $end, $inRange, $primary, $secondary, $rangeBg }) =>
    $start ? $primary : $end ? $secondary : $inRange ? $rangeBg : 'transparent'};
  color: ${({ $start, $end, $inRange, $selText, $endText, $rangeText }) =>
    $start ? $selText : $end ? $endText : $inRange ? $rangeText : 'inherit'};
  border-radius: var(--valet-date-cell-radius, 4px);
  cursor: pointer;
  font: inherit;
  font-weight: ${({ $start, $end }) => ($start || $end ? 'bold' : 'inherit')};
  height: ${({ $compact }) => ($compact ? '1.5rem' : '2rem')};
  transition: background-color 120ms ease; /* ← add this */
  &:hover:not(:disabled) {
    background: ${({
      $start,
      $end,
      $inRange,
      $hoverStart,
      $hoverEnd,
      $hoverRange,
      $hoverDefault,
    }) => ($start ? $hoverStart : $end ? $hoverEnd : $inRange ? $hoverRange : $hoverDefault)};
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
  sx,
  compactMode = 'auto',
  compactThresholdIn = 340,
  compactThresholdOut = 380,
  ...rest
}) => {
  const { theme } = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const compactRef = useRef(false);
  const ENTER_W = compactThresholdIn; // go compact when narrower than this
  const EXIT_W = compactThresholdOut; // leave compact when wider than this (hysteresis)

  // Compact detection with optional override via compactMode
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;

    if (compactMode === 'on') {
      compactRef.current = true;
      setCompact(true);
      return;
    }
    if (compactMode === 'off') {
      compactRef.current = false;
      setCompact(false);
      return;
    }

    // auto
    const measured = node.parentElement ?? node;
    let raf = 0;

    const compute = () => {
      const w = measured.clientWidth;
      if (!w) return;
      const prev = compactRef.current;
      const next = prev ? w < EXIT_W : w < ENTER_W;
      if (next !== prev) {
        compactRef.current = next;
        setCompact(next);
      }
    };

    const ro = new ResizeObserver(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    });
    ro.observe(measured);
    // Initialize immediately
    raf = requestAnimationFrame(compute);
    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [compactMode, ENTER_W, EXIT_W]);

  /* optional FormControl binding --------------------------- */
  const form = useOptionalForm<Record<string, string | undefined>>();

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

  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i),
    [maxYear, minYear],
  );

  const minMonth = min.getMonth();
  const maxMonth = max.getMonth();
  const firstMonth = viewYear === minYear ? minMonth : 0;
  const lastMonth = viewYear === maxYear ? maxMonth : 11;
  const months = useMemo(
    () => Array.from({ length: lastMonth - firstMonth + 1 }, (_, i) => firstMonth + i),
    [firstMonth, lastMonth],
  );

  const startDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const commit = (d: number) => {
    const iso = new Date(viewYear, viewMonth, d).toISOString().slice(0, 10);
    if (!controlled) setStartInt(new Date(viewYear, viewMonth, d));
    if (form && name) form.setField(name as keyof Record<string, string | undefined>, iso);
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
  // Use the wrapper's background (backgroundAlt) and nudge ~4% toward text
  const hoverDefault = toHex(
    mix(toRgb(theme.colors.backgroundAlt), toRgb(theme.colors.text), 0.04),
  );
  const hoverStart = toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.text), 0.3));
  const hoverEnd = toHex(mix(toRgb(theme.colors.secondary), toRgb(theme.colors.text), 0.3));
  const hoverRange = toHex(mix(toRgb(rangeBg), toRgb(theme.colors.text), 0.2));

  return (
    <Wrapper
      {...rest}
      ref={wrapRef}
      $bg={theme.colors.backgroundAlt}
      $text={`var(--valet-text-color, ${theme.colors.text})` as string}
      $compact={compact}
      className={cls}
      style={{ '--valet-date-radius': theme.radius(1), ...sx } as React.CSSProperties}
    >
      <Header $gap={theme.spacing(1)}>
        <div style={{ display: 'flex', gap: theme.spacing(0.5) }}>
          {!compact && (
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
          )}
          <IconButton
            size={compact ? 'xs' : 'sm'}
            variant='outlined'
            icon='mdi:chevron-left'
            aria-label='Previous month'
            onClick={() => changeMonth(-1)}
            disabled={new Date(viewYear, viewMonth, 0) < min}
          />
        </div>
        <div style={{ display: 'flex', gap: theme.spacing(0.5), flex: 1, minWidth: 0 }}>
          <Select
            size='xs'
            value={viewMonth}
            onChange={(v) => setViewMonth(Number(v))}
            sx={{ flex: 1, minWidth: 0 }}
          >
            {months.map((idx) => (
              <Select.Option
                key={monthNames[idx]}
                value={idx}
              >
                {compact ? monthNames[idx].slice(0, 3) : monthNames[idx]}
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
            sx={{ flex: 1, minWidth: 0 }}
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
            size={compact ? 'xs' : 'sm'}
            variant='outlined'
            icon='mdi:chevron-right'
            aria-label='Next month'
            onClick={() => changeMonth(1)}
            disabled={new Date(viewYear, viewMonth + 1, 1) > max}
          />
          {!compact && (
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
          )}
        </div>
      </Header>
      <Grid $compact={compact}>
        {days.map((d) => (
          <DayLabel
            key={d}
            $compact={compact}
          >
            {compact ? d[0] : d}
          </DayLabel>
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
              $hoverStart={hoverStart}
              $hoverEnd={hoverEnd}
              $hoverRange={hoverRange}
              $hoverDefault={hoverDefault}
              $selText={theme.colors.primaryText}
              $endText={theme.colors.secondaryText}
              $rangeText={theme.colors.primaryText}
              $compact={compact}
              style={{ '--valet-date-cell-radius': theme.radius(1) } as React.CSSProperties}
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

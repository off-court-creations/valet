// ─────────────────────────────────────────────────────────────
// src/components/fields/DateSelector.tsx | valet
// interactive month calendar for picking dates
//
// FIELDS S9 (rulings R9/R10): the controlled/uncontrolled decision and the
// single-date FormControl binding are delegated to the shared `useFieldState`
// hook (precedence prop > form > internal, latched at mount, no mount-time
// store writes), replacing the hand-rolled `initialCtl` effect guard. The
// internal `Date` state and the `formatLocalISO` commit sites are left intact
// for A11Y S10 (ruling R8: it is the last writer and must not re-touch those
// three sites; the month/day name constants are likewise A11Y S10's locale
// territory). Range mode keeps its explicit tuple write (the hook is single-
// value typed, so it owns the single-date string binding only — matching the
// pre-migration read semantics exactly). ChangeInfo.source is now 'pointer'
// (a day cell is only committed via a click) instead of the old hardcoded
// 'programmatic'.
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useRef, useState } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { IconButton } from './IconButton';
import { Select } from './Select';
import { useOptionalForm } from './FormControl';
import { useFieldState } from '../../hooks/useControlledState';
import { formatLocalISO } from './dateUtils';
import { toRgb, mix, toHex } from '../../helpers/color';
import type { Presettable, Sx } from '../../types';
import type { ChangeInfo, OnValueChange, OnValueCommit } from '../../system/events';

/*───────────────────────────────────────────────────────────*/
export interface DateSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'style'>,
    Presettable {
  /**
   * Controlled value. Single-date mode: ISO YYYY-MM-DD string. Range mode: tuple [start, end].
   */
  value?: string | [string, string];
  /** Default value for uncontrolled usage (same shape as `value`). */
  defaultValue?: string | [string, string];
  /** Event trio */
  onValueChange?: OnValueChange<string | [string, string]>;
  onValueCommit?: OnValueCommit<string | [string, string]>;
  /** FormControl field name (single-date mode only). */
  name?: string;
  /** Earliest selectable ISO date (YYYY-MM-DD). */
  minDate?: string;
  /** Latest selectable ISO date (YYYY-MM-DD). */
  maxDate?: string;
  /** Enable dual start/end selection mode. */
  range?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
  /** Density override; alias: `compact` maps to `density='compact'` */
  density?: 'compact' | 'standard' | 'comfortable';
  /** Legacy alias for density='compact'. */
  compact?: boolean;
}

/*───────────────────────────────────────────────────────────*/
const Wrapper = styled('div')<{ $bg: string; $text: string; $compact: boolean }>`
  ${({ $compact }) =>
    $compact ? 'display: block; width: 100%; max-width: 100%;' : 'display: inline-block;'}
  padding: 0.5rem;
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  /* Ensure calendar text uses valet typography (body) */
  font-family: var(
    --valet-font-body,
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    Helvetica,
    Arial,
    Noto Sans,
    sans-serif
  );
  font-weight: var(--valet-font-weight, 400);
  letter-spacing: var(--valet-font-tracking, normal);
  line-height: var(--valet-font-leading, 1.4);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0;
  border: none;
  background: ${({ $start, $end, $inRange, $primary, $secondary, $rangeBg }) =>
    $start ? $primary : $end ? $secondary : $inRange ? $rangeBg : 'transparent'};
  color: ${({ $start, $end, $inRange, $selText, $endText, $rangeText }) =>
    $start ? $selText : $end ? $endText : $inRange ? $rangeText : 'inherit'};
  border-radius: var(--valet-date-cell-radius, 4px);
  cursor: pointer;
  font: inherit;
  text-align: center;
  line-height: 1;
  /* Align day numbers neatly in columns */
  font-variant-numeric: tabular-nums;
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
  onValueChange,
  onValueCommit,
  range = false,
  name,
  minDate: minDateProp,
  maxDate: maxDateProp,
  preset: p,
  className,
  sx,
  density,
  compact,
  ...rest
}) => {
  const { theme } = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);
  const compactEffective = compact || density === 'compact';

  /* optional FormControl binding --------------------------- */
  // `useFieldState` (below) also reads this context; the direct read here keeps
  // the raw single-date store string available for the `Date`-based derivation
  // that A11Y S10 owns (ruling R8). The range tuple is bound explicitly in
  // `commitRange` because the hook is single-value typed.
  const form = useOptionalForm<Record<string, unknown>>();
  const formVal = form && name && !range ? (form.values[name] as string | undefined) : undefined;

  /**
   * Single resolution of the controlled/uncontrolled decision + single-date
   * form binding (ruling R9). Precedence is prop > form > internal, latched at
   * mount; the hand-rolled `initialCtl` effect guard is gone. `name` is passed
   * only in single-date mode, so the hook's write-through replaces the old
   * single-mode `form.setField`; range mode keeps its explicit tuple write.
   * The hook's own resolved value/internal state is unused — DateSelector keeps
   * its `Date`-based `startInt`/`endInt` state — so only `meta.isControlled`
   * and `setFieldValue` are consumed.
   */
  const [, setFieldValue, meta] = useFieldState<string | [string, string]>({
    value,
    defaultValue,
    fallback: '',
    name: range ? undefined : name,
    component: 'DateSelector',
  });
  const controlled = meta.isControlled;

  const parseDate = (v?: string) => (v ? new Date(v + 'T00:00') : new Date());

  const initial: string | [string, string] | undefined = value ?? formVal ?? defaultValue;
  const initialStart = Array.isArray(initial) ? initial[0] : (initial as string | undefined);
  const initialEnd = Array.isArray(initial) ? initial[1] : initialStart;

  const [startInt, setStartInt] = useState(parseDate(initialStart));
  const [endInt, setEndInt] = useState(parseDate(initialEnd));

  const today = new Date();
  const min = minDateProp ? parseDate(minDateProp) : new Date(today.getFullYear() - 120, 0, 1);
  const max = maxDateProp ? parseDate(maxDateProp) : new Date(today.getFullYear() + 120, 11, 31);

  const minYear = min.getFullYear();
  const maxYear = max.getFullYear();

  // An unseeded form key is now treated as controlled (useFieldState contract:
  // unseeded keys render `defaultValue ?? fallback`), so the controlled branch
  // falls through to `initialStart` (= value ?? formVal ?? defaultValue) to
  // honour `defaultValue` instead of snapping to today. (No formatLocalISO site
  // is touched here — ruling R8.)
  const startDate = controlled
    ? parseDate(Array.isArray(value) ? value[0] : (value ?? formVal ?? initialStart))
    : startInt;
  const endDate = range
    ? controlled
      ? parseDate(
          Array.isArray(value)
            ? (value[1] ?? (Array.isArray(defaultValue) ? defaultValue[1] : value?.[1]))
            : formatLocalISO(startDate),
        )
      : endInt
    : startDate;

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
    const iso = formatLocalISO(new Date(viewYear, viewMonth, d));
    if (!controlled) setStartInt(new Date(viewYear, viewMonth, d));
    // Single-mode form write-through is owned by the hook (`name` was passed to
    // useFieldState only in single mode); this replaces the old explicit
    // `form.setField(name, iso)`.
    setFieldValue(iso);
    const info: ChangeInfo<string | [string, string]> = {
      previousValue: Array.isArray(value) ? value : (value ?? formVal),
      phase: 'commit',
      // A day cell only commits via a click (ruling R10).
      source: 'pointer',
      name,
    };
    onValueChange?.(iso, { ...info, phase: 'input' });
    onValueCommit?.(iso, info);
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
    if (!controlled) setEndInt(end);
    const tuple: [string, string] = [formatLocalISO(start), formatLocalISO(end)];
    if (form && name) {
      // Bind range tuple into form store under the single field name. Range mode
      // is single-value typed away from the hook (`name` was passed to
      // useFieldState only in single mode), so the tuple write stays explicit.
      form.setField(
        name as keyof Record<string, [string, string] | undefined>,
        tuple as unknown as [string, string],
      );
    }
    const info: ChangeInfo<string | [string, string]> = {
      previousValue: Array.isArray(value) ? value : (value ?? formVal),
      phase: 'commit',
      // A day cell only commits via a click (ruling R10).
      source: 'pointer',
      name,
    };
    onValueChange?.(tuple, { ...info, phase: 'input' });
    onValueCommit?.(tuple, info);
  };

  // Dev-time warning: when used with FormControl, require `name` for binding.
  if (process.env.NODE_ENV !== 'production') {
    try {
      if (form && !name) {
        console.warn('DateSelector: provide `name` when used inside a FormControl to bind values.');
      }
    } catch {}
  }

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
      data-valet-component='DateSelector'
      $bg={theme.colors.backgroundAlt}
      $text={`var(--valet-text-color, ${theme.colors.text})` as string}
      $compact={!!compactEffective}
      className={cls}
      style={{ '--valet-date-radius': theme.radius(1), ...sx } as React.CSSProperties}
    >
      <Header $gap={theme.spacing(1)}>
        <div style={{ display: 'flex', gap: theme.spacing(0.5) }}>
          {!compactEffective && (
            <IconButton
              size='sm'
              variant='outlined'
              color='primaryText'
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
            size={compactEffective ? 'xs' : 'sm'}
            variant='outlined'
            color='primaryText'
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
            onValueChange={(v) => setViewMonth(Number(v))}
            sx={{ flex: 1, minWidth: 0 }}
          >
            {months.map((idx) => (
              <Select.Option
                key={monthNames[idx]}
                value={idx}
              >
                {compactEffective ? monthNames[idx].slice(0, 3) : monthNames[idx]}
              </Select.Option>
            ))}
          </Select>
          <Select
            size='xs'
            value={viewYear}
            onValueChange={(v) => {
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
            size={compactEffective ? 'xs' : 'sm'}
            variant='outlined'
            color='primaryText'
            icon='mdi:chevron-right'
            aria-label='Next month'
            onClick={() => changeMonth(1)}
            disabled={new Date(viewYear, viewMonth + 1, 1) > max}
          />
          {!compactEffective && (
            <IconButton
              size='sm'
              variant='outlined'
              color='primaryText'
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
      <Grid $compact={compactEffective}>
        {days.map((d) => (
          <DayLabel
            key={d}
            $compact={compactEffective}
          >
            {compactEffective ? d[0] : d}
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
              $compact={!!compactEffective}
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

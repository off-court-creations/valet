// ─────────────────────────────────────────────────────────────
// src/components/fields/DateSelector.tsx | valet
// interactive month calendar for picking dates
//
// FIELDS S9 (rulings R9/R10): the controlled/uncontrolled decision and the
// single-date FormControl binding are delegated to the shared `useFieldState`
// hook (precedence prop > form > internal, latched at mount, no mount-time
// store writes), replacing the hand-rolled `initialCtl` effect guard. The
// internal `Date` state and the `formatLocalISO` commit sites are left intact
// (ruling R8). Range mode keeps its explicit tuple write (the hook is single-
// value typed, so it owns the single-date string binding only — matching the
// pre-migration read semantics exactly). ChangeInfo.source is now 'pointer'
// (a day cell is only committed via a click) instead of the old hardcoded
// 'programmatic'.
//
// A11Y S10 (plan §3.6 S10, ruling R8 — last writer): Intl wiring. The
// hardcoded English `monthNames`/`days` constants and the Sunday-fixed
// `startDay` math are gone; month/weekday names, the first-day-of-week
// rotation, and the day-number DISPLAY digits all flow from the locale-aware
// helpers in `src/helpers/dateLocale.ts`. New `locale`/`firstDayOfWeek` props
// default to en-US / Sunday-start, preserving the previous output byte-for-
// byte (characterization-tested). The committed VALUE contract is untouched —
// `formatLocalISO` still emits ISO-8601 'YYYY-MM-DD' with Latin digits (veto
// register: ar-EG renders Arabic-Indic display digits while onChange emits
// Latin ISO).
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useRef, useState } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { CompactCtx, useCompact } from '../../system/compactContext';
import { preset } from '../../css/stylePresets';
import { IconButton } from './IconButton';
import { Select } from './Select';
import { useOptionalForm, useFormConfig } from './FormControl';
import { useFieldState } from '../../hooks/useControlledState';
import { formatLocalISO } from './dateUtils';
import {
  getMonthNames,
  getWeekdayNames,
  getFirstDayOfWeek,
  orderWeekdays,
  formatDayNumber,
} from '../../helpers/dateLocale';
import { makeMix } from '../../system/intentVars';
import { useComponentStrings } from '../../system/locale';
import type { DeepPartialStrings, ValetStrings } from '../../system/locale';
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
  /** Disable the whole calendar (field-level). Merges with a FormControl-wide
   *  `disabled`; distinct from the per-DATE out-of-range disable. */
  disabled?: boolean;
  /** Mark the field invalid (field-level). Merges with a name-keyed
   *  FormControl `errors` entry; drives `aria-invalid` and the error recolour. */
  error?: boolean;
  /** Earliest selectable ISO date (YYYY-MM-DD). */
  minDate?: string;
  /** Latest selectable ISO date (YYYY-MM-DD). */
  maxDate?: string;
  /** Enable dual start/end selection mode. */
  range?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
  /** Density scale for the calendar's own spacing and visual sizing. The small
   * (formerly `compact`) visual mode is now `density='tight'`; density never
   * zeroes layout. */
  density?: 'tight' | 'standard' | 'comfortable';
  /** Layout-compact relay: zeroes inherited layout spacing and cascades to
   * descendants via context. No longer a density alias. */
  compact?: boolean;
  /**
   * BCP-47 locale for the DISPLAY of month names, weekday headers, and day
   * numbers (via native `Intl`). Defaults to `'en-US'`, preserving the prior
   * English / Sunday-start output exactly. The committed VALUE is always ISO
   * 'YYYY-MM-DD' with Latin digits regardless of locale (e.g. `'ar-EG'` shows
   * Arabic-Indic display digits while `onValueChange` still emits Latin ISO).
   */
  locale?: string;
  /**
   * First day of the calendar week as an ISO weekday number
   * (**1 = Monday … 7 = Sunday**). When omitted, the locale's own first day is
   * used (`en-US` → 7/Sunday, `de-DE` → 1/Monday), keeping the default behavior
   * Sunday-first for the `en-US` default.
   */
  firstDayOfWeek?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /**
   * Instance-level overrides for this component's i18n strings (the month/year
   * navigation aria-labels). Wins over the `ValetLocaleProvider` value, which
   * in turn wins over the built-in English defaults (A11Y S8 resolution
   * contract; see `src/system/locale.tsx`). Month/weekday names are Intl's
   * domain (A11Y S10), driven by `locale`, not part of this string table.
   */
  labels?: DeepPartialStrings<ValetStrings['dateSelector']>;
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
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0;
  border: none;
  /* Mobile chrome kit — no blue tap flash, no iOS callout/selection. */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
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
  /* Coarse-pointer (touch) hit target — expand the small day cell to >=44px
     (40px under compact) WITHOUT changing the visual size; fine-pointer
     (desktop) is untouched. Logical absolute-centering (inset:0; margin:auto)
     centers the expander even when larger than the cell, RTL-safe. */
  @media (pointer: coarse) {
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      margin: auto;
      width: max(100%, var(--valet-date-hit, 44px));
      height: max(100%, var(--valet-date-hit, 44px));
    }
  }
  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

/*───────────────────────────────────────────────────────────*/
export const DateSelector: React.FC<DateSelectorProps> = ({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  range = false,
  name,
  disabled: ownDisabled = false,
  error: ownError = false,
  minDate: minDateProp,
  maxDate: maxDateProp,
  preset: p,
  className,
  labels,
  locale = 'en-US',
  firstDayOfWeek,
  sx,
  density,
  compact,
  ...rest
}) => {
  const { theme } = useTheme();
  const t = useComponentStrings('dateSelector', labels);
  const wrapRef = useRef<HTMLDivElement>(null);
  const effectiveCompact = useCompact(compact); // relay only (layout compaction)
  const tight = density === 'tight'; // drives the visual scale (D6)

  /* Form-wide config (own props win; the form config is the fallback). The
     FIELD-level disabled/error merge here; the per-DATE out-of-range disable
     (date < min || date > max) is a separate concern and is NOT merged. */
  const formConfig = useFormConfig();
  const effectiveDisabled = ownDisabled || formConfig.disabled;
  const effectiveError = Boolean(ownError) || (name != null && formConfig.errors[name] != null);
  /* Coarse-pointer hit floor for the small day-cell targets (40px under
     compact, else 44px) — wired onto the root and read by the Cell @media. */
  const hitVar = effectiveCompact ? '40px' : '44px';

  /* Intl-derived localization (A11Y S10) ------------------------------------
   * Display-only: month names, weekday headers, the first day of the week, and
   * the day-number digits all follow `locale`. The committed VALUE is untouched
   * (formatLocalISO → ISO Latin digits). Defaults to en-US / Sunday-start so
   * the prior English output is byte-identical. */
  const monthNames = useMemo(() => getMonthNames(locale, 'long'), [locale]);
  /* Non-tight weekday headers reproduce the previous 2-letter English form
   * (`Su`, `Mo`, …) via the locale's long names truncated to two characters;
   * tight takes the first character (the previous `d[0]` behavior). The base
   * array is Monday-first (helper contract), rotated to the resolved first day. */
  const weekdays = useMemo(() => {
    const base = getWeekdayNames(locale, 'long').map((d) => d.slice(0, 2));
    const firstDay = firstDayOfWeek ?? getFirstDayOfWeek(locale);
    return orderWeekdays(base, firstDay);
  }, [locale, firstDayOfWeek]);
  /* ISO weekday (1=Mon … 7=Sun) the grid starts on. */
  const weekStart = firstDayOfWeek ?? getFirstDayOfWeek(locale);

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

  /* Leading blank cells before the 1st, relative to the resolved first day of
   * the week. `getDay()` is JS-convention (0=Sun … 6=Sat); convert to ISO
   * (1=Mon … 7=Sun) and measure the gap from `weekStart`. With the en-US
   * default (weekStart=7/Sunday) this reduces to the previous `getDay()`. */
  const firstIsoWeekday = new Date(viewYear, viewMonth, 1).getDay() || 7;
  const startDay = (firstIsoWeekday - weekStart + 7) % 7;
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

  /* Colours — aligned to the shared intent maths (`makeMix`, the same blend
     used by Select/Checkbox) instead of the bespoke toRgb/mix/toHex calls.
     The selected-day accent recolours to the error token when the field is
     invalid (mirrors Select's error treatment); hover is always a lighter
     blend than the selected fill. The in-range tint is a subtle ~25% wash. */
  const startAccent = effectiveError ? theme.colors.error : theme.colors.primary;
  const startText = effectiveError ? theme.colors.errorText : theme.colors.primaryText;
  const rangeBg = makeMix(theme.colors.primary, theme.colors.background, 0.25);
  // Use the wrapper's background (backgroundAlt) and nudge ~4% toward text
  const hoverDefault = makeMix(theme.colors.backgroundAlt, theme.colors.text, 0.04);
  const hoverStart = makeMix(startAccent, theme.colors.text, 0.3);
  const hoverEnd = makeMix(theme.colors.secondary, theme.colors.text, 0.3);
  const hoverRange = makeMix(rangeBg, theme.colors.text, 0.2);

  return (
    <Wrapper
      {...rest}
      ref={wrapRef}
      data-valet-component='DateSelector'
      data-disabled={effectiveDisabled ? 'true' : 'false'}
      aria-disabled={effectiveDisabled || undefined}
      aria-invalid={effectiveError || undefined}
      $bg={theme.colors.backgroundAlt}
      $text={`var(--valet-text-color, ${theme.colors.text})` as string}
      $compact={tight}
      className={cls}
      style={{ '--valet-date-radius': theme.radius(1), ...sx } as React.CSSProperties}
    >
      <CompactCtx.Provider value={effectiveCompact}>
        <Header $gap={theme.spacing(1)}>
          <div style={{ display: 'flex', gap: theme.spacing(0.5) }}>
            {!tight && (
              <IconButton
                size='sm'
                variant='outlined'
                color='primaryText'
                icon='mdi:chevron-double-left'
                aria-label={t.previousYear}
                onClick={() => {
                  const yr = viewYear - 1;
                  let m = viewMonth;
                  if (yr === minYear && m < minMonth) m = minMonth;
                  setViewYear(yr);
                  setViewMonth(m);
                }}
                disabled={effectiveDisabled || new Date(viewYear - 1, 11, 31) < min}
              />
            )}
            <IconButton
              size={tight ? 'xs' : 'sm'}
              variant='outlined'
              color='primaryText'
              icon='mdi:chevron-left'
              aria-label={t.previousMonth}
              onClick={() => changeMonth(-1)}
              disabled={effectiveDisabled || new Date(viewYear, viewMonth, 0) < min}
            />
          </div>
          <div style={{ display: 'flex', gap: theme.spacing(0.5), flex: 1, minWidth: 0 }}>
            <Select
              size='xs'
              value={viewMonth}
              disabled={effectiveDisabled}
              onValueChange={(v) => setViewMonth(Number(v))}
              sx={{ flex: 1, minWidth: 0 }}
              aria-label='Month'
            >
              {months.map((idx) => (
                <Select.Option
                  key={monthNames[idx]}
                  value={idx}
                >
                  {tight ? monthNames[idx].slice(0, 3) : monthNames[idx]}
                </Select.Option>
              ))}
              {/* monthNames is locale-derived (Intl); tight still shows the
                first three characters, matching the previous 3-letter form. */}
            </Select>
            <Select
              size='xs'
              value={viewYear}
              disabled={effectiveDisabled}
              aria-label='Year'
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
              size={tight ? 'xs' : 'sm'}
              variant='outlined'
              color='primaryText'
              icon='mdi:chevron-right'
              aria-label={t.nextMonth}
              onClick={() => changeMonth(1)}
              disabled={effectiveDisabled || new Date(viewYear, viewMonth + 1, 1) > max}
            />
            {!tight && (
              <IconButton
                size='sm'
                variant='outlined'
                color='primaryText'
                icon='mdi:chevron-double-right'
                aria-label={t.nextYear}
                onClick={() => {
                  const yr = viewYear + 1;
                  let m = viewMonth;
                  if (yr === maxYear && m > maxMonth) m = maxMonth;
                  setViewYear(yr);
                  setViewMonth(m);
                }}
                disabled={effectiveDisabled || new Date(viewYear + 1, 0, 1) > max}
              />
            )}
          </div>
        </Header>
        <Grid $compact={tight}>
          {weekdays.map((d, i) => (
            <DayLabel
              key={`${d}-${i}`}
              $compact={tight}
            >
              {tight ? d[0] : d}
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
                $primary={startAccent}
                $secondary={theme.colors.secondary}
                $rangeBg={rangeBg}
                $hoverStart={hoverStart}
                $hoverEnd={hoverEnd}
                $hoverRange={hoverRange}
                $hoverDefault={hoverDefault}
                $selText={startText}
                $endText={theme.colors.secondaryText}
                $rangeText={theme.colors.primaryText}
                $compact={tight}
                style={
                  {
                    '--valet-date-cell-radius': theme.radius(1),
                    '--valet-date-hit': hitVar,
                  } as React.CSSProperties
                }
                onClick={() =>
                  !disabled && !effectiveDisabled && (range ? commitRange(day) : commit(day))
                }
                disabled={disabled || effectiveDisabled}
              >
                {/* DISPLAY-only locale digits; the committed VALUE stays ISO
                  Latin via formatLocalISO (veto register / ruling R7/R8). */}
                {formatDayNumber(day, locale)}
              </Cell>
            );
          })}
        </Grid>
      </CompactCtx.Provider>
    </Wrapper>
  );
};

export default DateSelector;

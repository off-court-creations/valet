// ─────────────────────────────────────────────────────────────
// src/components/widgets/DateSelector.tsx | valet
// Minimal calendar date selector
// ─────────────────────────────────────────────────────────────
import React, { forwardRef, useId, useState } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { useForm } from '../fields/FormControl';
import { IconButton } from '../fields/IconButton';
import type { Presettable } from '../../types';
import type { Theme } from '../../system/themeStore';

/*───────────────────────────────────────────────────────────*/
/* Props                                                     */
export interface DateSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Presettable {
  /** Controlled ISO date value */
  value?: string;
  /** Uncontrolled initial ISO date */
  defaultValue?: string;
  /** Callback fired when a date is selected */
  onChange?: (value: string) => void;
  /** Form field name for FormControl */
  name?: string;
  disabled?: boolean;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Wrapper = styled('div')<{ theme: Theme }>`
  display: inline-block;
  font-size: 0.875rem;
  user-select: none;
`;

const Header = styled('div')<{ theme: Theme }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const Grid = styled('table')<{ theme: Theme; $primary: string; $primaryText: string }>`
  border-collapse: collapse;
  width: 100%;
  th, td {
    width: 2rem;
    height: 2rem;
    padding: 0;
    text-align: center;
  }
  button {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  button:focus {
    outline: 2px solid ${({ $primary }) => $primary};
    outline-offset: 1px;
  }
  button[data-selected="true"] {
    background: ${({ $primary }) => $primary};
    color: ${({ $primaryText }) => $primaryText};
  }
`;

/*───────────────────────────────────────────────────────────*/
/* Helpers                                                   */
const parse = (v?: string): [number, number, number] => {
  if (!v) {
    const d = new Date();
    return [d.getFullYear(), d.getMonth(), d.getDate()];
  }
  const [y, m, d] = v.split('-').map((n) => parseInt(n, 10));
  return [y, m - 1, d];
};

const pad = (n: number) => n.toString().padStart(2, '0');

const iso = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;

const daysInMonth = (y: number, m: number) =>
  new Date(y, m + 1, 0).getDate();

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const DateSelector = forwardRef<HTMLDivElement, DateSelectorProps>(
  (
    {
      value: valueProp,
      defaultValue,
      onChange,
      name,
      disabled = false,
      preset: p,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const { theme } = useTheme();

    let form: ReturnType<typeof useForm<any>> | null = null;
    try { form = useForm<any>(); } catch {}

    const formVal = form && name ? (form.values[name] as string) : undefined;
    const controlled = formVal !== undefined || valueProp !== undefined;

    const [iy, im, id] = parse(controlled ? formVal ?? valueProp : defaultValue);
    const [viewYear, setViewYear] = useState(iy);
    const [viewMonth, setViewMonth] = useState(im);
    const [internal, setInternal] = useState(iso(iy, im, id));

    const current = controlled ? formVal ?? valueProp : internal;
    const [cy, cm, cd] = parse(current);

    const commit = (y: number, m: number, d: number) => {
      const v = iso(y, m, d);
      if (!controlled) setInternal(v);
      form?.setField(name as any, v);
      onChange?.(v);
    };

    const prevMonth = () => {
      setViewMonth((m) => {
        if (m === 0) { setViewYear((y) => y - 1); return 11; }
        return m - 1;
      });
    };
    const nextMonth = () => {
      setViewMonth((m) => {
        if (m === 11) { setViewYear((y) => y + 1); return 0; }
        return m + 1;
      });
    };

    const first = new Date(viewYear, viewMonth, 1).getDay();
    const count = daysInMonth(viewYear, viewMonth);
    const cells: (number | null)[] = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= count; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    const header = new Date(viewYear, viewMonth).toLocaleString(undefined, {
      month: 'long',
      year: 'numeric',
    });

    const presetCls = p ? preset(p) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

    const idPrefix = useId();

    return (
      <Wrapper {...rest} ref={ref} theme={theme} className={mergedCls} style={style}>
        <Header theme={theme}>
          <IconButton
            icon="mdi:chevron-left"
            onClick={prevMonth}
            aria-label="Previous month"
            disabled={disabled}
            size="sm"
          />
          <span id={`${idPrefix}-label`}>{header}</span>
          <IconButton
            icon="mdi:chevron-right"
            onClick={nextMonth}
            aria-label="Next month"
            disabled={disabled}
            size="sm"
          />
        </Header>
        <Grid
          theme={theme}
          $primary={theme.colors.secondary}
          $primaryText={theme.colors.secondaryText}
          aria-labelledby={`${idPrefix}-label`}
        >
          <thead>
            <tr>
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => (
              <tr key={i}>
                {w.map((day, j) => (
                  <td key={j}>
                    {day ? (
                      <button
                        type="button"
                        onClick={() => commit(viewYear, viewMonth, day)}
                        data-selected={
                          cy === viewYear &&
                          cm === viewMonth &&
                          cd === day
                        }
                        disabled={disabled}
                      >
                        {day}
                      </button>
                    ) : (
                      <span />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Grid>
      </Wrapper>
    );
  },
);

DateSelector.displayName = 'DateSelector';
export default DateSelector;

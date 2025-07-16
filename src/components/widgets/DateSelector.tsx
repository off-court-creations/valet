// ─────────────────────────────────────────────────────────────
// src/components/widgets/DateSelector.tsx  | valet
// interactive month calendar
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import type { Theme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { IconButton } from '../fields/IconButton';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
export interface DateSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Presettable {
  /** Controlled ISO date value "YYYY-MM-DD" */
  value?: string;
  /** Uncontrolled default value */
  defaultValue?: string;
  /** Called with ISO date when user selects a day */
  onChange?: (value: string) => void;
}

/*───────────────────────────────────────────────────────────*/
const Root = styled('div')<{ theme: Theme }>`
  display: inline-block;
  border: 1px solid ${({ theme }) => theme.colors.text + '44'};
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing(1)};
  font-size: 0.875rem;
`;

const Header = styled('div')<{ theme: Theme }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing(0.5)};
`;

const Label = styled('div')<{ theme: Theme }>`
  flex: 1;
  text-align: center;
  font-weight: 600;
`;

const Grid = styled('div')<{ theme: Theme }>`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
`;

const DayName = styled('div')<{ theme: Theme }>`
  text-align: center;
  font-weight: 600;
`;

const DayCell = styled('button')<{ theme: Theme; $faint: boolean; $selected: boolean }>`
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 4px;
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : 'transparent'};
  color: ${({ $selected, $faint, theme }) =>
    $selected ? theme.colors.primaryText : $faint ? theme.colors.text + '66' : theme.colors.text};
  cursor: pointer;
  font: inherit;
  line-height: 2rem;
  text-align: center;
  &:hover {
    background: ${({ $selected, theme }) =>
      $selected ? theme.colors.primary : theme.colors.primary + '22'};
  }
`;

/*───────────────────────────────────────────────────────────*/
const parse = (v?: string) => {
  if (!v) return new Date();
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

/*───────────────────────────────────────────────────────────*/
export const DateSelector: React.FC<DateSelectorProps> = ({
  value: valueProp,
  defaultValue,
  onChange,
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const controlled = valueProp !== undefined;

  const [selected, setSelected] = useState(() =>
    controlled ? parse(valueProp) : parse(defaultValue)
  );
  const [view, setView] = useState(() =>
    new Date((controlled ? parse(valueProp) : parse(defaultValue)).getTime())
  );

  useEffect(() => {
    if (controlled && valueProp) {
      setSelected(parse(valueProp));
      setView(new Date(parse(valueProp).getFullYear(), parse(valueProp).getMonth(), 1));
    }
  }, [controlled, valueProp]);

  const handleSelect = (d: Date) => {
    if (!controlled) setSelected(d);
    onChange?.(iso(d));
  };

  const changeMonth = (delta: number) => {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  };

  const monthLabel = view.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const startDay = new Date(view.getFullYear(), view.getMonth(), 1).getDay();

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const day = i - startDay + 1;
    cells.push(new Date(view.getFullYear(), view.getMonth(), day));
  }

  const presetClass = p ? preset(p) : '';
  const merged = [presetClass, className].filter(Boolean).join(' ') || undefined;

  return (
    <Root {...rest} theme={theme} className={merged} style={style}>
      <Header theme={theme}>
        <IconButton
          icon="mdi:chevron-left"
          size="sm"
          variant="outlined"
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
        />
        <Label theme={theme}>{monthLabel}</Label>
        <IconButton
          icon="mdi:chevron-right"
          size="sm"
          variant="outlined"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
        />
      </Header>
      <Grid theme={theme}>
        {['S','M','T','W','T','F','S'].map((d) => (
          <DayName key={d} theme={theme}>{d}</DayName>
        ))}
        {cells.map((d, idx) => {
          const faint = d.getMonth() !== view.getMonth();
          const sel = iso(d) === iso(selected);
          return (
            <DayCell
              key={idx}
              theme={theme}
              $faint={faint}
              $selected={sel}
              onClick={() => handleSelect(d)}
            >
              {d.getDate()}
            </DayCell>
          );
        })}
      </Grid>
    </Root>
  );
};

export default DateSelector;

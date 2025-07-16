// ─────────────────────────────────────────────────────────────
// src/components/widgets/DateSelector.tsx  | valet
// simple month calendar picker
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';
import { IconButton } from '../fields/IconButton';
import Icon from '../primitives/Icon';

/*───────────────────────────────────────────────────────────*/
export interface DateSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Presettable {
  value?: string;         // ISO date YYYY-MM-DD
  defaultValue?: string;  // initial uncontrolled value
  onChange?: (date: string) => void;
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
}

/*───────────────────────────────────────────────────────────*/
const Root = styled('div')<{ $pad: string }>`
  display: inline-flex;
  flex-direction: column;
  gap: ${({ $pad }) => $pad};
  padding: ${({ $pad }) => $pad};
`;

const Header = styled('div')<{ $gap: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ $gap }) => $gap};
`;

const Grid = styled('div')<{ $gap: string }>`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${({ $gap }) => $gap};
`;

const DayLabel = styled('div')<{ $text: string }>`
  text-align: center;
  font-size: 0.75rem;
  color: ${({ $text }) => $text};
`;

const DayButton = styled('button')<{
  $selected: boolean;
  $primary: string;
  $text: string;
}>`
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 4px;
  background: ${({ $selected, $primary }) =>
    $selected ? $primary : 'transparent'};
  color: ${({ $selected, $text }) =>
    $selected ? '#fff' : $text};
  cursor: pointer;
  font: inherit;
  padding: 0;
  &:hover {
    filter: brightness(1.1);
  }
`;

/*───────────────────────────────────────────────────────────*/
function parseDate(v?: string) {
  if (!v) return null;
  const [y, m, d] = v.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const monthNames = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const weekday = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/*───────────────────────────────────────────────────────────*/
export const DateSelector: React.FC<DateSelectorProps> = ({
  value,
  defaultValue,
  onChange,
  firstDayOfWeek = 0,
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue || '');
  const sel = controlled ? value || '' : internal;
  const selDate = parseDate(sel);
  const today = new Date();
  const initial = selDate || today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m); setViewYear(y);
  };

  const handleSelect = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const iso = fmtDate(d);
    if (!controlled) setInternal(iso);
    onChange?.(iso);
  };

  const pad = theme.spacing(1);
  const gap = theme.spacing(0.5);
  const presetClass = p ? preset(p) : '';

  const first = new Date(viewYear, viewMonth, 1);
  const offset = (first.getDay() - firstDayOfWeek + 7) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array.from({ length: offset + daysInMonth }, (_, i) => i - offset + 1);

  return (
    <Root
      {...rest}
      $pad={pad}
      className={[presetClass, className].filter(Boolean).join(' ')}
      style={style}
    >
      <Header $gap={gap}>
        <IconButton
          variant="outlined"
          size="sm"
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
        >
          <Icon icon="mdi:chevron-left" />
        </IconButton>
        <DayLabel $text={theme.colors.text}>
          {monthNames[viewMonth]} {viewYear}
        </DayLabel>
        <IconButton
          variant="outlined"
          size="sm"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
        >
          <Icon icon="mdi:chevron-right" />
        </IconButton>
      </Header>
      <Grid $gap={gap}>
        {weekday.map((d, i) => (
          <DayLabel key={i} $text={theme.colors.text}>
            {weekday[(i + firstDayOfWeek) % 7]}
          </DayLabel>
        ))}
        {cells.map((day, idx) =>
          day < 1 ? (
            <span key={idx} />
          ) : (
            <DayButton
              key={idx}
              onClick={() => handleSelect(day)}
              $selected={selDate?.getFullYear() === viewYear && selDate.getMonth() === viewMonth && selDate.getDate() === day}
              $primary={theme.colors.primary}
              $text={theme.colors.text}
            >
              {day}
            </DayButton>
          )
        )}
      </Grid>
    </Root>
  );
};

export default DateSelector;

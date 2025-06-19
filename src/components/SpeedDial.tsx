// ─────────────────────────────────────────────────────────────
// src/components/SpeedDial.tsx  | valet
// floating action button with expandable actions
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { styled } from '../css/createStyled';
import { preset } from '../css/stylePresets';
import { useTheme } from '../system/themeStore';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
export interface SpeedDialAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export interface SpeedDialProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Presettable {
  icon: React.ReactNode;
  actions: SpeedDialAction[];
  direction?: 'up' | 'down' | 'left' | 'right';
}

/*───────────────────────────────────────────────────────────*/
const Container = styled('div')<{ $gap: string }>`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  align-items: flex-end;
  gap: ${({ $gap }) => $gap};
`;

const ActionButton = styled('button')<{ $bg: string; $color: string }>`
  border: none;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  cursor: pointer;
`;


/*───────────────────────────────────────────────────────────*/
export const SpeedDial: React.FC<SpeedDialProps> = ({
  icon,
  actions,
  direction = 'up',
  preset: p,
  className,
  ...rest
}) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const presetClass = p ? preset(p) : '';
  const bg = theme.colors.primary;
  const text = theme.colors.primaryText;

  const dirMap = {
    up: 'column-reverse',
    down: 'column',
    left: 'row-reverse',
    right: 'row',
  } as const;

  return (
    <Container
      {...rest}
      $gap="0.5rem"
      style={{ flexDirection: dirMap[direction] }}
      className={[presetClass, className].filter(Boolean).join(' ')}
    >
      {open && actions.map((a, idx) => (
        <ActionButton
          key={idx}
          onClick={a.onClick}
          $bg={bg}
          $color={text}
          title={a.label}
        >
          {a.icon}
        </ActionButton>
      ))}
      <ActionButton
        onClick={() => setOpen(o => !o)}
        $bg={bg}
        $color={text}
        aria-label="Speed dial"
      >
        {icon}
      </ActionButton>
    </Container>
  );
};

export default SpeedDial;

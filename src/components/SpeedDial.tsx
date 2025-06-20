// ─────────────────────────────────────────────────────────────
// src/components/SpeedDial.tsx | valet
// Floating action button with expandable actions
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { styled }          from '../css/createStyled';
import { preset }          from '../css/stylePresets';
import { useTheme }        from '../system/themeStore';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
export interface SpeedDialAction {
  icon   : React.ReactNode;
  label  : string;
  onClick: () => void;
}

export interface SpeedDialProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Presettable {
  /** Icon for the main FAB (usually a ➕). */
  icon: React.ReactNode;
  /** Speed-dial actions revealed when the FAB is toggled. */
  actions: SpeedDialAction[];
  /** Direction in which actions should expand. */
  direction?: 'up' | 'down' | 'left' | 'right';
}

/*───────────────────────────────────────────────────────────*/
/* Primitives                                                */
const Container = styled('div')<{ $gap: string }>`
  position: fixed;
  bottom  : 1rem;
  right   : 1rem;
  display : flex;
  align-items: flex-end; /* Stick to bottom/right edge */
  gap: ${({ $gap }) => $gap};
`;

const ActionButton = styled('button')<{ $bg: string; $color: string }>`
  border       : none;
  width        : 3rem;
  height       : 3rem;
  border-radius: 50%;
  background   : ${({ $bg }) => $bg};
  color        : ${({ $color }) => $color};
  cursor       : pointer;
  /* Mobile tidy-ups */
  -webkit-tap-highlight-color: transparent; /* ⬅︎ kills blue flash */
  outline      : none;

  transition:
    background 0.2s ease,
    transform  0.1s ease;

  &:active:not(:disabled) { transform: scale(0.94); }
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const SpeedDial: React.FC<SpeedDialProps> = ({
  icon,
  actions,
  direction = 'up',
  preset: p,
  className,
  ...rest
}) => {
  const { theme }   = useTheme();
  const [open, setOpen] = useState(false);

  const presetCls = p ? preset(p) : '';
  const bg        = theme.colors.primary;
  const text      = theme.colors.primaryText;

  /* Keep the FAB last in DOM and choose flex-direction so it
     stays anchored (bottom/right) for every direction variant. */
  const dirMap = {
    up   : 'column',          // actions above, FAB bottom
    down : 'column-reverse',  // actions below, FAB top
    left : 'row',             // actions left,  FAB right
    right: 'row-reverse',     // actions right, FAB left
  } as const;

  return (
    <Container
      {...rest}
      $gap="0.5rem"
      style={{ flexDirection: dirMap[direction] }}
      className={[presetCls, className].filter(Boolean).join(' ')}
    >
      {/* — actions — */}
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

      {/* — main FAB — */}
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

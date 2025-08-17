// ─────────────────────────────────────────────────────────────
// src/components/widgets/SpeedDial.tsx | valet
// Floating action button with slide-out action animation
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import { useTheme } from '../../system/themeStore';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
export interface SpeedDialAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export interface SpeedDialProps extends React.HTMLAttributes<HTMLDivElement>, Presettable {
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
  bottom: 1rem;
  right: 1rem;
  /* Reserve a minimal footprint; actions are absolutely positioned */
  display: block;
  /* Geometry tokens for sizing/spacing */
  --sd-size: 3rem;
  --sd-gap: ${({ $gap }) => $gap};
`;

const MainButton = styled('button')<{
  $bg: string;
  $color: string;
  $open: boolean;
  $durBg: string;
  $durT: string;
  $ease: string;
}>`
  border: none;
  width: var(--sd-size);
  height: var(--sd-size);
  border-radius: 50%;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  cursor: pointer;
  /* Mobile tidy-ups */
  -webkit-tap-highlight-color: transparent; /* ⬅︎ kills blue flash */
  outline: none;

  transition:
    background ${({ $durBg }) => $durBg} ${({ $ease }) => $ease},
    transform ${({ $durT }) => $durT} ${({ $ease }) => $ease};

  &:active:not(:disabled) {
    transform: scale(0.94);
  }

  /* Subtle rotate on open to feel responsive (if icon allows) */
  transform: ${({ $open }) => ($open ? 'rotate(45deg)' : 'none')};
`;

type Dir = 'up' | 'down' | 'left' | 'right';

const ActionFab = styled('button')<{
  $bg: string;
  $color: string;
  $dir: Dir;
  $open: boolean;
  $delayMs: number;
  $dur: string;
  $ease: string;
  $durOp: string;
  $easeOp: string;
}>`
  position: absolute;
  bottom: 0; /* Anchor to main FAB corner */
  right: 0;
  border: none;
  width: var(--sd-size);
  height: var(--sd-size);
  border-radius: 50%;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  outline: none;

  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transform-origin: center;

  /* When open, translate each action away from the main FAB along direction.
     Distance per step = size + gap, multiplied by index via CSS var --i. */
  transform: ${({ $open, $dir }) => {
    const away = `calc((var(--sd-size) + var(--sd-gap)) * var(--i))`;
    if (!$open) return 'translate(0, 0) scale(0.6)';
    switch ($dir) {
      case 'up':
        return `translate(0, calc(${away} * -1))`;
      case 'down':
        return `translate(0, ${away})`;
      case 'left':
        return `translate(calc(${away} * -1), 0)`;
      case 'right':
        return `translate(${away}, 0)`;
    }
  }};

  transition:
    transform ${({ $dur }) => $dur} ${({ $ease }) => $ease},
    opacity ${({ $durOp }) => $durOp} ${({ $easeOp }) => $easeOp};
  transition-delay: ${({ $delayMs }) => `${$delayMs}ms`};
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
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  const presetCls = p ? preset(p) : '';
  const bg = theme.colors.primary;
  const text = theme.colors.primaryText;
  const easeStd = theme.motion.easing.standard;
  const easeEmph = theme.motion.easing.emphasized;
  const durBg = theme.motion.duration.base;
  const durMainT = theme.motion.duration.medium;
  const durActionT = theme.motion.duration.base;
  const durOpacity = theme.motion.duration.medium;

  const total = actions.length;

  return (
    <Container
      {...rest}
      $gap='0.5rem'
      className={[presetCls, className].filter(Boolean).join(' ')}
    >
      {/* — actions — kept mounted for buttery open/close — */}
      {actions.map((a, idx) => {
        const i = idx + 1; // 1-based step distance
        const openDelay = idx * 40; // ms stagger
        const closeDelay = (total - idx - 1) * 40;
        const delay = open ? openDelay : closeDelay;
        const cssVarStyle = { ['--i' as string]: String(i) } as unknown as React.CSSProperties;
        return (
          <ActionFab
            key={idx}
            onClick={a.onClick}
            $bg={bg}
            $color={text}
            $dir={direction}
            $open={open}
            $delayMs={delay}
            $dur={durActionT}
            $ease={easeEmph}
            $durOp={durOpacity}
            $easeOp={easeStd}
            style={cssVarStyle}
            title={a.label}
            aria-hidden={!open}
            tabIndex={open ? 0 : -1}
          >
            {a.icon}
          </ActionFab>
        );
      })}

      {/* — main FAB — */}
      <MainButton
        onClick={() => setOpen((o) => !o)}
        $bg={bg}
        $color={text}
        $open={open}
        $durBg={durBg}
        $durT={durMainT}
        $ease={easeStd}
        aria-label='Speed dial'
        style={{ position: 'relative', zIndex: 1 }}
      >
        {icon}
      </MainButton>
    </Container>
  );
};

export default SpeedDial;

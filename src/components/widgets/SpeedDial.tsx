// ─────────────────────────────────────────────────────────────
// src/components/widgets/SpeedDial.tsx | valet
// Floating action button with slide-out action animation
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useId, useRef, useState } from 'react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import { useTheme } from '../../system/themeStore';
import { useOverlay } from '../../system/overlay';
import { zVar } from '../../system/zIndex';
import type { Presettable, Sx } from '../../types';

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
  /** Inline styles via CSSProperties (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
/* Primitives                                                */
const Container = styled('div')<{ $gap: string }>`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  /* FAB sits below the app bar on the shared z-scale (OVERLAY S7). */
  z-index: ${zVar('fab')};
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
  -webkit-touch-callout: none; /* ⬅︎ prevent iOS callout on long-press */
  -webkit-user-select: none; /* ⬅︎ prevent iOS text selection */
  user-select: none; /* ⬅︎ prevent text selection in modern browsers */
  touch-action: manipulation; /* ⬅︎ hint to remove 300ms delay + suppress long-press */

  transition:
    background ${({ $durBg }) => $durBg} ${({ $ease }) => $ease},
    transform ${({ $durT }) => $durT} ${({ $ease }) => $ease};

  /* A11Y S5 — reduced motion: the open/close rotate and active scale snap
     to their end state instead of tweening (the FAB still rotates 45° when
     open, it just doesn't animate there). */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  /* Visible keyboard focus ring (WCAG 2.4.7) — mirrors the IconButton
     focus-visible pattern instead of suppressing the outline. */
  &:focus-visible {
    outline: var(--valet-focus-width, 2px) solid currentColor;
    outline-offset: var(--valet-focus-offset, 2px);
  }

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
  -webkit-touch-callout: none; /* prevent iOS callout on long-press */
  -webkit-user-select: none; /* prevent iOS text selection */
  user-select: none;
  touch-action: manipulation;

  /* Visible keyboard focus ring (WCAG 2.4.7) — mirrors the IconButton
     focus-visible pattern instead of suppressing the outline. */
  &:focus-visible {
    outline: var(--valet-focus-width, 2px) solid currentColor;
    outline-offset: var(--valet-focus-offset, 2px);
  }

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

  /* A11Y S5 — reduced motion: actions snap to their open/closed position
     (no slide, no staggered delay) but still appear and dismiss normally. */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    transition-delay: 0ms;
  }
`;

/* Disclosure group wrapper. `display: contents` keeps the role='group'
   in the accessibility tree while contributing no box of its own, so the
   absolutely-positioned ActionFabs still anchor to the fixed Container. */
const Group = styled('div')`
  display: contents;
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const SpeedDial: React.FC<SpeedDialProps> = ({
  icon,
  actions,
  direction = 'up',
  preset: p,
  className,
  sx,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const actionsId = useId();
  const fabRef = useRef<HTMLButtonElement | null>(null);

  /* Dismissal via the shared overlay stack (registry v2). SpeedDial is a
     disclosure, not a modal: no focus trap, no inert background. The dial
     registers on the open commit; Escape (top-most layer) and stack-aware
     outside-click both resolve to close. We keep `restoreFocusOnClose` off and
     refocus the FAB explicitly so KEYBOARD dismissal lands focus on the
     trigger (an outside CLICK should not yank focus back). The Container is the
     registered element, so clicks on the FAB or any action button count as
     inside the layer. Options resolve LIVE at event time. */
  const close = useCallback((refocusFab: boolean) => {
    setOpen(false);
    if (refocusFab) fabRef.current?.focus();
  }, []);

  const overlayRef = useOverlay(open, () => ({
    onRequestClose: (reason) => close(reason === 'escape'),
    trapFocus: false,
    restoreFocusOnClose: false,
    inertBackground: false,
    label: 'SpeedDial',
  }));

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
      ref={overlayRef}
      $gap='0.5rem'
      className={[presetCls, className].filter(Boolean).join(' ')}
      data-valet-component='SpeedDial'
      data-state={open ? 'open' : 'closed'}
      /* precedence: caller style < sx (API-TYPES S8) */
      style={{ ...(style as React.CSSProperties), ...(sx || {}) }}
    >
      {/* — actions — kept mounted for buttery open/close — */}
      <Group
        role='group'
        id={actionsId}
        aria-label='Speed dial actions'
      >
        {actions.map((a, idx) => {
          const i = idx + 1; // 1-based step distance
          const openDelay = idx * 40; // ms stagger
          const closeDelay = (total - idx - 1) * 40;
          const delay = open ? openDelay : closeDelay;
          const cssVarStyle = { ['--i' as string]: String(i) } as unknown as React.CSSProperties;
          return (
            <ActionFab
              key={idx}
              onClick={() => {
                // Close-on-action: collapse the dial and return focus to the
                // FAB so the UI lands in a stable state, then run the handler.
                close(true);
                a.onClick();
              }}
              onContextMenu={(e) => e.preventDefault()}
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
              aria-label={a.label}
              aria-hidden={!open}
              tabIndex={open ? 0 : -1}
            >
              {a.icon}
            </ActionFab>
          );
        })}
      </Group>

      {/* — main FAB — */}
      <MainButton
        ref={fabRef}
        onClick={() => setOpen((o) => !o)}
        onContextMenu={(e) => e.preventDefault()}
        $bg={bg}
        $color={text}
        $open={open}
        $durBg={durBg}
        $durT={durMainT}
        $ease={easeStd}
        aria-label='Speed dial'
        aria-expanded={open}
        aria-controls={actionsId}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {icon}
      </MainButton>
    </Container>
  );
};

export default SpeedDial;

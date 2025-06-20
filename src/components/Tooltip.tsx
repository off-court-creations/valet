// ─────────────────────────────────────────────────────────────
// src/components/Tooltip.tsx | valet
// Robust CSS-only tooltip (MUI-style API) – width-safe in flex columns
// ─────────────────────────────────────────────────────────────
import React, {
  ReactElement,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { styled }    from '../css/createStyled';
import { useTheme }  from '../system/themeStore';
import { preset }    from '../css/stylePresets';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */

type Placement = 'top' | 'bottom' | 'left' | 'right';
const GAP = 8;

const Wrapper = styled('span')`
  position: relative;
  display: inline-flex;
  /* ----- critical: never stretch in a flex column -------- */
  flex: 0 0 auto;
  align-self: flex-start;
`;

const Bubble = styled('div')<{
  $show: boolean;
  $placement: Placement;
}>`
  --gap: ${GAP}px;
  position: absolute;
  z-index: 9999;
  max-width: 22rem;
  padding: 0.4rem 0.7rem;
  border-radius: 4px;
  background: var(--tt-bg, #000);
  color: var(--tt-fg, #fff);
  font-size: 0.75rem;
  line-height: 1.3;
  pointer-events: none;

  opacity: ${({ $show }) => ($show ? 1 : 0)};
  transition: opacity 140ms ease, transform 140ms ease;

  /* placement geometry + enter/leave slide */
  ${({ $show, $placement }) =>
    ({
      top: `
        bottom: calc(100% + var(--gap));
        left: 50%;
        transform-origin: bottom center;
        transform: translate(-50%, ${$show ? '0' : '4px'});
      `,
      bottom: `
        top: calc(100% + var(--gap));
        left: 50%;
        transform-origin: top center;
        transform: translate(-50%, ${$show ? '0' : '-4px'});
      `,
      left: `
        right: calc(100% + var(--gap));
        top: 50%;
        transform-origin: center right;
        transform: translate(${ $show ? '0' : '4px'}, -50%);
      `,
      right: `
        left: calc(100% + var(--gap));
        top: 50%;
        transform-origin: center left;
        transform: translate(${ $show ? '0' : '-4px'}, -50%);
      `,
    } as Record<Placement, string>)[$placement]}
`;

const Arrow = styled('span')<{
  $placement: Placement;
}>`
  --s: 8px;
  position: absolute;
  width: var(--s);
  height: var(--s);
  background: var(--tt-bg, #000);
  transform: rotate(45deg);

  ${({ $placement }) =>
    ({
      top   : `bottom: calc(-0.5 * var(--s)); left: 50%; transform: translateX(-50%) rotate(45deg);`,
      bottom: `top:    calc(-0.5 * var(--s)); left: 50%; transform: translateX(-50%) rotate(45deg);`,
      left  : `right:  calc(-0.5 * var(--s)); top: 50%; transform: translateY(-50%) rotate(45deg);`,
      right : `left:   calc(-0.5 * var(--s)); top: 50%; transform: translateY(-50%) rotate(45deg);`,
    } as Record<Placement, string>)[$placement]}
`;

/*───────────────────────────────────────────────────────────*/
/* Public API                                                */

export interface TooltipProps extends Presettable {
  title: ReactNode;
  placement?: Placement;
  arrow?: boolean;
  enterDelay?: number;
  leaveDelay?: number;
  open?: boolean;
  defaultOpen?: boolean;
  disableHoverListener?: boolean;
  disableFocusListener?: boolean;
  disableTouchListener?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  children: ReactElement;
}

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */

export const Tooltip: React.FC<TooltipProps> = ({
  title,
  placement = 'top',
  arrow = true,
  enterDelay = 100,
  leaveDelay = 100,
  open: controlled,
  defaultOpen = false,
  disableHoverListener = false,
  disableFocusListener = false,
  disableTouchListener = false,
  onOpen,
  onClose,
  preset: presetKey,
  children,
}) => {
  const { theme } = useTheme();
  const id        = useId();
  const hasPreset = Boolean(presetKey);

  /* uncontrolled ↔ controlled gate */
  const [internalShow, setInternalShow] = useState(defaultOpen);
  const show = controlled ?? internalShow;

  /* timers */
  const inT  = useRef<ReturnType<typeof setTimeout>>();
  const outT = useRef<ReturnType<typeof setTimeout>>();
  const clear = () => { clearTimeout(inT.current); clearTimeout(outT.current); };

  const open  = () => { if (controlled === undefined) setInternalShow(true);  onOpen?.(); };
  const close = () => { if (controlled === undefined) setInternalShow(false); onClose?.(); };

  /* listeners */
  const handleEnter = () => { clear(); inT.current  = setTimeout(open,  enterDelay); };
  const handleLeave = () => { clear(); outT.current = setTimeout(close, leaveDelay); };

  useEffect(() => clear, []);

  /* preset classes */
  const presetClasses = presetKey ? preset(presetKey) : '';

  return (
    <Wrapper
      onMouseEnter={!disableHoverListener ? handleEnter : undefined}
      onMouseLeave={!disableHoverListener ? handleLeave : undefined}
      onFocus={!disableFocusListener ? open : undefined}
      onBlur={!disableFocusListener ? close : undefined}
      onTouchStart={!disableTouchListener ? open : undefined}
      onTouchEnd={!disableTouchListener ? close : undefined}
      aria-describedby={show ? `tooltip-${id}` : undefined}
    >
      {children}

      <Bubble
        $show={show}
        $placement={placement}
        role="tooltip"
        id={`tooltip-${id}`}
        className={presetClasses}
        style={
          hasPreset
            ? undefined
            : ({
                '--tt-bg': theme.colors.text,
                '--tt-fg': theme.colors.background,
              } as React.CSSProperties)
        }
      >
        {title}
        {arrow && <Arrow $placement={placement} />}
      </Bubble>
    </Wrapper>
  );
};

export default Tooltip;

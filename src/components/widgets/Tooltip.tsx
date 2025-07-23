// ─────────────────────────────────────────────────────────────
// src/components/widgets/Tooltip.tsx | valet
// Robust CSS-only tooltip (MUI-style API) – width-safe in flex columns
// ─────────────────────────────────────────────────────────────
import React, {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { styled }    from '../../css/createStyled';
import { useTheme }  from '../../system/themeStore';
import { preset }    from '../../css/stylePresets';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Global helpers                                            */

const LONG_PRESS_MS = 600;

let activeTooltip: (() => void) | null = null;

const registerTooltip = (close: () => void) => {
  if (activeTooltip && activeTooltip !== close) activeTooltip();
  activeTooltip = close;
};

const unregisterTooltip = (close: () => void) => {
  if (activeTooltip === close) activeTooltip = null;
};

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
    } as Record<Placement, string>)[$placement as Placement]}
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
    } as Record<Placement, string>)[$placement as Placement]}
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
  const wrapperRef = useRef<HTMLSpanElement>(null);

  /* uncontrolled ↔ controlled gate */
  const [internalShow, setInternalShow] = useState(defaultOpen);
  const show = controlled ?? internalShow;

  /* timers */
  const inT   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outT  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => {
    if (inT.current) clearTimeout(inT.current);
    if (outT.current) clearTimeout(outT.current);
  };

  const close = useCallback(() => {
    if (controlled === undefined) setInternalShow(false);
    onClose?.();
    unregisterTooltip(close);
  }, [controlled, onClose]);

  const open = useCallback(() => {
    if (activeTooltip && activeTooltip !== close) activeTooltip();
    if (controlled === undefined) setInternalShow(true);
    onOpen?.();
    registerTooltip(close);
  }, [controlled, onOpen, close]);

  const handleOutside = useCallback((e: PointerEvent) => {
    if (!wrapperRef.current?.contains(e.target as Node)) {
      close();
    }
  }, [close]);

  /* listeners */
  const handleEnter = () => {
    clear();
    inT.current = setTimeout(open, enterDelay);
  };
  const handleLeave = () => {
    clear();
    outT.current = setTimeout(close, leaveDelay);
  };

  /* long press touch support */
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOpen = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch' || disableTouchListener) return;
    wasOpen.current = show;
    if (touchTimer.current) clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(() => {
      if (!show) open();
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch' || disableTouchListener) return;
    if (touchTimer.current) clearTimeout(touchTimer.current);
    if (wasOpen.current) {
      close();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch' || disableTouchListener) return;
    if (touchTimer.current) clearTimeout(touchTimer.current);
  };

  useEffect(() => {
    return () => {
      clear();
      if (touchTimer.current) clearTimeout(touchTimer.current);
      unregisterTooltip(close);
    };
  }, [close]);

  useEffect(() => {
    if (controlled !== undefined) {
      if (show) registerTooltip(close);
      else unregisterTooltip(close);
    }
  }, [show, controlled, close]);

  useEffect(() => {
    if (!show) return;
    document.addEventListener('pointerdown', handleOutside);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
    };
  }, [show, handleOutside]);

  /* preset classes */
  const presetClasses = presetKey ? preset(presetKey) : '';

  return (
    <Wrapper
      ref={wrapperRef}
      onMouseEnter={!disableHoverListener ? handleEnter : undefined}
      onMouseLeave={!disableHoverListener ? handleLeave : undefined}
      onFocus={!disableFocusListener ? open : undefined}
      onBlur={!disableFocusListener ? close : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
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

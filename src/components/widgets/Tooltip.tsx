// ─────────────────────────────────────────────────────────────
// src/components/widgets/Tooltip.tsx | valet
// Robust CSS-only tooltip (MUI-style API) – width-safe in flex columns
// ─────────────────────────────────────────────────────────────
import React, {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { inheritSurfaceFontVars } from '../../system/inheritSurfaceFontVars';
import type { Presettable } from '../../types';

// Allow CSS custom properties on style objects
type CSSPropertiesWithVars = React.CSSProperties & { [key: `--${string}`]: string | number };

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
const GAP = 8; // used for DOMRect pixel math (positioning)

const Wrapper = styled('span')`
  position: relative;
  display: inline-flex;
  /* ----- critical: never stretch in a flex column -------- */
  flex: 0 0 auto;
  align-self: flex-start;
  /* Prevent iOS long‑press selection/callout on trigger wrapper */
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
`;

const Bubble = styled('div')<{
  $show: boolean;
  $placement: Placement;
  $padV: string;
  $padH: string;
  $radius: string;
  $animDist: string;
}>`
  position: fixed;
  z-index: 9999;
  max-width: 22rem;
  padding: ${({ $padV, $padH }) => `${$padV} ${$padH}`};
  border-radius: ${({ $radius }) => $radius};
  background: var(--tt-bg, #000);
  color: var(--tt-fg, #fff);
  font-size: 0.75rem;
  line-height: 1.3;
  pointer-events: none;
  /* Avoid iOS selection handles / callout in tooltip text */
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;

  opacity: ${({ $show }) => ($show ? 1 : 0)};
  transition:
    opacity 140ms ease,
    transform 140ms ease;

  transform-origin: ${({ $placement }) =>
    (
      ({
        top: 'bottom center',
        bottom: 'top center',
        left: 'center right',
        right: 'center left',
      }) as Record<Placement, string>
    )[$placement]};
  transform: ${({ $show, $placement, $animDist }) => {
    const dist = $show
      ? '0'
      : (
          {
            top: $animDist,
            bottom: `calc(-1 * ${$animDist})`,
            left: $animDist,
            right: `calc(-1 * ${$animDist})`,
          } as Record<Placement, string>
        )[$placement];
    return $placement === 'top' || $placement === 'bottom'
      ? `translate(-50%, ${dist})`
      : `translate(${dist}, -50%)`;
  }};
`;

const Arrow = styled('span')<{
  $placement: Placement;
  $size: string;
}>`
  position: absolute;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  background: var(--tt-bg, #000);
  transform: rotate(45deg);

  ${({ $placement }) =>
    (
      ({
        top: `bottom: calc(-0.5 * var(--valet-tooltip-arrow-size, 1rem)); left: 50%; transform: translateX(-50%) rotate(45deg);`,
        bottom: `top:    calc(-0.5 * var(--valet-tooltip-arrow-size, 1rem)); left: 50%; transform: translateX(-50%) rotate(45deg);`,
        left: `right:  calc(-0.5 * var(--valet-tooltip-arrow-size, 1rem)); top: 50%; transform: translateY(-50%) rotate(45deg);`,
        right: `left:   calc(-0.5 * var(--valet-tooltip-arrow-size, 1rem)); top: 50%; transform: translateY(-50%) rotate(45deg);`,
      }) as Record<Placement, string>
    )[$placement as Placement]}
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
  const id = useId();
  const hasPreset = Boolean(presetKey);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  /* uncontrolled ↔ controlled gate */
  const [internalShow, setInternalShow] = useState(defaultOpen);
  const show = controlled ?? internalShow;

  /* timers */
  const inT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outT = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const handleOutside = useCallback(
    (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        close();
      }
    },
    [close],
  );

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

  useLayoutEffect(() => {
    if (!show) return;
    // Mirror Surface font/typography vars into the portalled bubble
    if (bubbleRef.current) inheritSurfaceFontVars(bubbleRef.current);
    const calc = () => {
      const wrapper = wrapperRef.current;
      const bubble = bubbleRef.current;
      if (!wrapper || !bubble) return;
      const rect = wrapper.getBoundingClientRect();
      const b = bubble.getBoundingClientRect();
      let top = 0;
      let left = 0;
      switch (placement) {
        case 'top':
          top = rect.top - b.height - GAP;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + GAP;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - b.width - GAP;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + GAP;
          break;
      }
      setPos({ top, left });
    };
    calc();
    window.addEventListener('scroll', calc, true);
    window.addEventListener('resize', calc);
    return () => {
      window.removeEventListener('scroll', calc, true);
      window.removeEventListener('resize', calc);
    };
  }, [show, placement]);

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
      {createPortal(
        <Bubble
          ref={bubbleRef}
          $show={show}
          $placement={placement}
          $padV={theme.spacing(1)}
          $padH={theme.spacing(1.5)}
          $radius={theme.radius(1)}
          $animDist={theme.spacing(0.5)}
          role='tooltip'
          id={`tooltip-${id}`}
          className={presetClasses}
          style={
            {
              top: pos.top,
              left: pos.left,
              '--valet-tooltip-arrow-size': theme.spacing(1),
              ...(hasPreset
                ? undefined
                : {
                    '--tt-bg': theme.colors.text,
                    '--tt-fg': theme.colors.background,
                  }),
            } as CSSPropertiesWithVars
          }
        >
          {title}
          {arrow && (
            <Arrow
              $placement={placement}
              $size={theme.spacing(1)}
            />
          )}
        </Bubble>,
        document.body,
      )}
    </Wrapper>
  );
};

export default Tooltip;

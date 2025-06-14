// ─────────────────────────────────────────────────────────────────────────────
// src/components/Tooltip.tsx | valet
// Theme-aware, accessible <Tooltip /> that mirrors MUI's feature-set.
// No external runtime deps – leverages React portals + tiny placement maths.
// ─────────────────────────────────────────────────────────────────────────────
import React, {
  ReactElement,
  ReactNode,
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */

const TooltipBubble = styled('div')<{
  $bg?: string;
  $text?: string;
  $fade: boolean;
}>`
  position: fixed;
  z-index: 9999;
  max-width: 20rem;
  padding: 0.35rem 0.6rem;
  border-radius: 4px;
  ${({ $bg })   => $bg   && `background: ${$bg};`}
  ${({ $text }) => $text && `color: ${$text};`}
  font-size: 0.75rem;
  line-height: 1.3;
  pointer-events: none;
  opacity: ${({ $fade }) => ($fade ? 0 : 1)};
  transform: translateY(${({ $fade }) => ($fade ? '4px' : '0')});
  transition: opacity 150ms ease, transform 150ms ease;
`;

const Arrow = styled('span')<{
  $bg: string;
  $placement: Placement;
}>`
  position: absolute;
  width: 8px;
  height: 8px;
  background: ${({ $bg }) => $bg};
  transform: rotate(45deg);

  ${({ $placement }) =>
    $placement === 'top' &&
    `bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg);`}
  ${({ $placement }) =>
    $placement === 'bottom' &&
    `top: -4px; left: 50%; transform: translateX(-50%) rotate(45deg);`}
  ${({ $placement }) =>
    $placement === 'left' &&
    `right: -4px; top: 50%; transform: translateY(-50%) rotate(45deg);`}
  ${({ $placement }) =>
    $placement === 'right' &&
    `left: -4px; top: 50%; transform: translateY(-50%) rotate(45deg);`}
`;

/*───────────────────────────────────────────────────────────*/
/* Utility helpers                                           */

type Placement = 'top' | 'bottom' | 'left' | 'right';

const SPACING = 8; // gap between anchor and bubble

interface Coords {
  top: number;
  left: number;
}

const computeCoords = (
  anchor: DOMRect,
  bubble: { width: number; height: number },
  placement: Placement,
): Coords => {
  switch (placement) {
    case 'bottom':
      return {
        top: anchor.bottom + SPACING,
        left: anchor.left + anchor.width / 2 - bubble.width / 2,
      };
    case 'left':
      return {
        top: anchor.top + anchor.height / 2 - bubble.height / 2,
        left: anchor.left - bubble.width - SPACING,
      };
    case 'right':
      return {
        top: anchor.top + anchor.height / 2 - bubble.height / 2,
        left: anchor.right + SPACING,
      };
    case 'top':
    default:
      return {
        top: anchor.top - bubble.height - SPACING,
        left: anchor.left + anchor.width / 2 - bubble.width / 2,
      };
  }
};

/** Merge two event handlers without losing either. */
const mergeHandlers = <E extends React.SyntheticEvent<any>>(
  theirs?: (e: E) => void,
  ours?: (e: E) => void,
) => (e: E) => {
  theirs?.(e);
  ours?.(e);
};

/*───────────────────────────────────────────────────────────*/
/* Public API                                                */

export interface TooltipProps extends Presettable {
  /** Tooltip label / content. */
  title: ReactNode;
  /** Position relative to anchor. */
  placement?: Placement;
  /** Show arrow? Defaults to `true`. */
  arrow?: boolean;
  /** Delay before showing (ms). */
  enterDelay?: number;
  /** Delay before hiding (ms). */
  leaveDelay?: number;
  /** Controlled visibility prop. */
  open?: boolean;
  /** Uncontrolled default state. */
  defaultOpen?: boolean;
  /** Disable specific interaction triggers. */
  disableHoverListener?: boolean;
  disableFocusListener?: boolean;
  disableTouchListener?: boolean;
  /** Callbacks mirroring MUI. */
  onOpen?: () => void;
  onClose?: () => void;
  /** Exactly **one** element that receives the tooltip. */
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
  open: controlledOpen,
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
  const hasPreset = Boolean(presetKey);

  /* ----- preset → utility class names ---------------------- */
  const presetClasses = hasPreset ? preset(presetKey!) : '';

  /* ----- refs & state -------------------------------------- */
  const id = useId();
  const anchorRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  const uncontrolled = controlledOpen === undefined;
  const [openState, setOpenState] = useState(defaultOpen);
  const open = uncontrolled ? openState : controlledOpen!;
  const [coords, setCoords] = useState<Coords | null>(null);

  /* ----- timers for enter/leave delays --------------------- */
  const enterTimer = useRef<ReturnType<typeof setTimeout>>();
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>();

  const clearTimers = () => {
    clearTimeout(enterTimer.current);
    clearTimeout(leaveTimer.current);
  };

  /* ----- open / close helpers ------------------------------ */
  const doOpen = useCallback(() => {
    if (open) return;
    if (uncontrolled) setOpenState(true);
    onOpen?.();
  }, [open, uncontrolled, onOpen]);

  const doClose = useCallback(() => {
    if (!open) return;
    if (uncontrolled) setOpenState(false);
    onClose?.();
  }, [open, uncontrolled, onClose]);

  /* ----- event handlers ------------------------------------ */
  const handleMouseEnter = () => {
    clearTimers();
    enterTimer.current = setTimeout(doOpen, enterDelay);
  };
  const handleMouseLeave = () => {
    clearTimers();
    leaveTimer.current = setTimeout(doClose, leaveDelay);
  };
  const handleFocus = handleMouseEnter;
  const handleBlur = handleMouseLeave;
  const handleTouchStart = handleMouseEnter;
  const handleTouchEnd = handleMouseLeave;

  /* ----- clone child with merged handlers ------------------ */
  const childProps: any = {
    ref: (node: HTMLElement | null) => {
      anchorRef.current = node;
      const { ref } = children as any;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<any>).current = node;
    },
  };
  if (!disableHoverListener) {
    childProps.onMouseEnter = mergeHandlers(children.props.onMouseEnter, handleMouseEnter);
    childProps.onMouseLeave = mergeHandlers(children.props.onMouseLeave, handleMouseLeave);
  }
  if (!disableFocusListener) {
    childProps.onFocus = mergeHandlers(children.props.onFocus, handleFocus);
    childProps.onBlur = mergeHandlers(children.props.onBlur, handleBlur);
  }
  if (!disableTouchListener) {
    childProps.onTouchStart = mergeHandlers(children.props.onTouchStart, handleTouchStart);
    childProps.onTouchEnd = mergeHandlers(children.props.onTouchEnd, handleTouchEnd);
  }

  const childWithProps = cloneElement(children, childProps);

  /* ----- positioning --------------------------------------- */
  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !bubbleRef.current) return;

    const updatePosition = () => {
      if (!anchorRef.current || !bubbleRef.current) return;
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const bubbleRect = bubbleRef.current.getBoundingClientRect();
      setCoords(computeCoords(anchorRect, bubbleRect, placement));
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, placement]);

  /* Ensure timers cleared on unmount */
  useEffect(() => clearTimers, []);

  /* ----- portal content ------------------------------------ */
  const bubble = open ? (
    <TooltipBubble
      ref={bubbleRef}
      role="tooltip"
      id={`tooltip-${id}`}
      $bg={hasPreset ? undefined : theme.colors.text}
      $text={hasPreset ? undefined : theme.colors.background}
      $fade={!coords}
      className={presetClasses}
      style={coords || undefined}
    >
      {title}
      {arrow && (
        <Arrow
          $bg={hasPreset ? 'inherit' : theme.colors.text}
          $placement={placement}
        />
      )}
    </TooltipBubble>
  ) : null;

  return (
    <>
      {childWithProps}
      {bubble && createPortal(bubble, document.body)}
    </>
  );
};

export default Tooltip;

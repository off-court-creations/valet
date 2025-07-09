// ─────────────────────────────────────────────────────────────
// src/components/Drawer.tsx  | valet
// Minimal sliding drawer component akin to MUI's Drawer.
// Controlled/uncontrolled, with backdrop and escape handling.
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
export type DrawerAnchor = 'left' | 'right' | 'top' | 'bottom';

export interface DrawerProps extends Presettable {
  /** Controlled visibility */
  open?: boolean;
  /** Default for uncontrolled */
  defaultOpen?: boolean;
  /** Drawer side */
  anchor?: DrawerAnchor;
  /** Callback fired when user requests close */
  onClose?: () => void;
  /** Size (width or height depending on anchor) */
  size?: number | string;
  /** Disable closing via backdrop click */
  disableBackdropClick?: boolean;
  /** Disable closing via ESC key */
  disableEscapeKeyDown?: boolean;
  /** Show translucent backdrop */
  backdrop?: boolean;
  /** Render in place instead of portaling */
  persistent?: boolean;
  /** Drawer contents */
  children?: React.ReactNode;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */

const Backdrop = styled('div')<{$fade: boolean}>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  opacity: ${({ $fade }) => ($fade ? 0 : 1)};
  transition: opacity 200ms ease;
  z-index: 9998;
`;

const Panel = styled('div')<{
  $anchor: DrawerAnchor;
  $fade: boolean;
  $size: string;
  $bg: string;
  $text: string;
}>`
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  ${({ $anchor, $size }) =>
    $anchor === 'left' || $anchor === 'right'
      ? `width:${$size}; height:100%;`
      : `height:${$size}; width:100%;`}
  ${({ $anchor }) =>
    $anchor === 'left'
      ? 'top:0; left:0;'
      : $anchor === 'right'
      ? 'top:0; right:0;'
      : $anchor === 'top'
      ? 'top:0; left:0;'
      : 'bottom:0; left:0;'}
  transform: ${({ $anchor, $fade }) =>
    $anchor === 'left'
      ? `translateX(${$fade ? '-100%' : '0'})`
      : $anchor === 'right'
      ? `translateX(${$fade ? '100%' : '0'})`
      : $anchor === 'top'
      ? `translateY(${$fade ? '-100%' : '0'})`
      : `translateY(${$fade ? '100%' : '0'})`};
  transition: transform 200ms ease;
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */

export const Drawer: React.FC<DrawerProps> = ({
  open: controlledOpen,
  defaultOpen = false,
  anchor = 'left',
  onClose,
  size = '16rem',
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  backdrop = true,
  persistent = false,
  children,
  preset: presetKey,
}) => {
  const { theme } = useTheme();
  const presetClasses = presetKey ? preset(presetKey) : '';

  const uncontrolled = controlledOpen === undefined;
  const [openState, setOpenState] = useState(defaultOpen);
  const open = uncontrolled ? openState : controlledOpen!;
  const [fade, setFade] = useState(true);

  const requestClose = useCallback(() => {
    if (uncontrolled) setOpenState(false);
    onClose?.();
  }, [uncontrolled, onClose]);

  /* Mount / unmount side-effects */
  useLayoutEffect(() => {
    if (!open) return;
    setFade(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableEscapeKeyDown) {
        e.stopPropagation();
        requestClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      setFade(true);
    };
  }, [open, disableEscapeKeyDown, requestClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (disableBackdropClick) return;
    if (e.target === e.currentTarget) requestClose();
  };

  if (!open && !persistent) return null;

  const backdropNode =
    backdrop && open && !persistent ? (
      <Backdrop $fade={fade} onClick={handleBackdropClick} />
    ) : null;

  const panel = (
    <Panel
      $anchor={anchor}
      $fade={fade}
      $size={typeof size === 'number' ? `${size}px` : size}
      $bg={theme.colors.surface}
      $text={theme.colors.text}
      className={presetClasses}
    >
      {children}
    </Panel>
  );

  const content = (
    <>
      {backdropNode}
      {panel}
    </>
  );

  return persistent ? content : createPortal(content, document.body);
};

export default Drawer;

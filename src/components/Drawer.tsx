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
  /** Drawer remains visible without backdrop */
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
  $primary: string;
  $persistent: boolean;
}>`
  position: fixed;
  z-index: ${({ $persistent }) => ($persistent ? 9998 : 9999)};
  display: flex;
  flex-direction: column;
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  ${({ $anchor, $primary }) =>
    $anchor === 'left'
      ? `border-right:0.25rem solid ${$primary};`
      : $anchor === 'right'
      ? `border-left:0.25rem solid ${$primary};`
      : $anchor === 'top'
      ? `border-bottom:0.25rem solid ${$primary};`
      : `border-top:0.25rem solid ${$primary};`}
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
  transform: ${({ $anchor, $fade, $persistent }) =>
    $persistent
      ? 'none'
      : $anchor === 'left'
      ? `translateX(${$fade ? '-100%' : '0'})`
      : $anchor === 'right'
      ? `translateX(${$fade ? '100%' : '0'})`
      : $anchor === 'top'
      ? `translateY(${$fade ? '-100%' : '0'})`
      : `translateY(${$fade ? '100%' : '0'})`};
  transition: ${({ $persistent }) => ($persistent ? 'none' : 'transform 200ms ease')};
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
  persistent = false,
  children,
  preset: presetKey,
}) => {
  const { theme } = useTheme();
  const presetClasses = presetKey ? preset(presetKey) : '';

  const uncontrolled = controlledOpen === undefined;
  const [openState, setOpenState] = useState(defaultOpen);
  const open = persistent ? true : uncontrolled ? openState : controlledOpen!;
  const [fade, setFade] = useState(true);

  const requestClose = useCallback(() => {
    if (uncontrolled) setOpenState(false);
    onClose?.();
  }, [uncontrolled, onClose]);

  /* Mount / unmount side-effects */
  useLayoutEffect(() => {
    if (persistent || !open) return;
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
  }, [open, persistent, disableEscapeKeyDown, requestClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (persistent || disableBackdropClick) return;
    if (e.target === e.currentTarget) requestClose();
  };

  if (!open && !persistent) return null;

  const drawerElement = (
    <>
      {!persistent && <Backdrop $fade={fade} onClick={handleBackdropClick} />}
      <Panel
        $anchor={anchor}
        $fade={fade}
        $size={typeof size === 'number' ? `${size}px` : size}
        $bg={theme.colors.background}
        $text={theme.colors.text}
        $primary={theme.colors.primary}
        $persistent={persistent}
        className={presetClasses}
      >
        {children}
      </Panel>
    </>
  );

  return createPortal(drawerElement, document.body);
};

export default Drawer;

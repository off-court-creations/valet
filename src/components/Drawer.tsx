// ─────────────────────────────────────────────────────────────
// src/components/Drawer.tsx  | valet
// Minimal sliding drawer component akin to MUI's Drawer.
// Controlled/uncontrolled, with backdrop and escape handling.
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useLayoutEffect, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { useSurface } from '../system/surfaceStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';
import { IconButton } from './IconButton';

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
  /** Responsive behaviour (persistent in landscape, overlay in portrait) */
  responsive?: boolean;
  /** Icon for the portrait toggle button */
  toggleIcon?: string;
  /** Close button icon when portrait */
  closeIcon?: string;
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
  $responsive: boolean;
}>`
  position: fixed;
  z-index: ${({ $persistent }) => ($persistent ? 9998 : 9999)};
  display: flex;
  flex-direction: column;
  overflow-y: ${({ $anchor }) =>
    $anchor === 'left' || $anchor === 'right' ? 'auto' : 'visible'};
  overflow-x: ${({ $anchor }) =>
    $anchor === 'top' || $anchor === 'bottom' ? 'auto' : 'visible'};
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  box-shadow: ${({ $responsive }) =>
    $responsive ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.3)'};
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
  responsive = false,
  toggleIcon = 'mdi:menu',
  closeIcon = 'mdi:close',
  children,
  preset: presetKey,
}) => {
  const { theme } = useTheme();
  const surface = useSurface();
  const presetClasses = presetKey ? preset(presetKey) : '';

  const { width, height } = surface;
  const portrait = height > width;
  const responsiveMode = responsive && (anchor === 'left' || anchor === 'right');
  const orientationPersistent = responsiveMode && !portrait;
  const persistentEffective = persistent || orientationPersistent;

  const uncontrolled = controlledOpen === undefined;
  const [openState, setOpenState] = useState(defaultOpen);
  const open = persistentEffective
    ? true
    : uncontrolled
    ? openState
    : controlledOpen!;
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (orientationPersistent) setOpenState(true);
    else if (responsiveMode && portrait) setOpenState(false);
  }, [orientationPersistent, responsiveMode, portrait]);

  const requestClose = useCallback(() => {
    if (orientationPersistent) return;
    if (uncontrolled) setOpenState(false);
    onClose?.();
  }, [orientationPersistent, uncontrolled, onClose]);

  /* Mount / unmount side-effects */
  useLayoutEffect(() => {
    if (persistentEffective || !open) return;
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
  }, [open, persistentEffective, disableEscapeKeyDown, requestClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (persistentEffective || disableBackdropClick) return;
    if (e.target === e.currentTarget) requestClose();
  };

  // When persistent, offset the current surface so content isn't hidden
  useLayoutEffect(() => {
    const node = surface.element;
    if (!node) return;
    const horizontal = anchor === 'left' || anchor === 'right';
    if (persistentEffective && horizontal) {
      const px = typeof size === 'number' ? `${size}px` : size;
      const prop = anchor === 'left' ? 'marginLeft' : 'marginRight';
      const prev = (node.style as any)[prop];
      (node.style as any)[prop] = px;
      return () => {
        (node.style as any)[prop] = prev;
      };
    }
    return;
  }, [surface.element, persistentEffective, anchor, size]);

  if (!open && !persistentEffective) {
    if (responsiveMode && portrait) {
      return (
        <IconButton
          icon={toggleIcon}
          onClick={() => setOpenState(true)}
          style={{
            position: 'fixed',
            top: theme.spacing(1),
            [anchor]: theme.spacing(1),
            zIndex: 9999,
          }}
          aria-label="Open drawer"
        />
      );
    }
    return null;
  }

  const drawerElement = (
    <>
      {!persistentEffective && (
        <Backdrop $fade={fade} onClick={handleBackdropClick} />
      )}
      <Panel
        $anchor={anchor}
        $fade={fade}
        $size={typeof size === 'number' ? `${size}px` : size}
        $bg={theme.colors.background}
        $text={theme.colors.text}
        $primary={theme.colors.primary}
        $persistent={persistentEffective}
        $responsive={responsiveMode}
        className={presetClasses}
      >
        {responsiveMode && portrait && (
          <div
            style={{
              alignSelf: anchor === 'left' ? 'flex-end' : 'flex-start',
              padding: theme.spacing(0.5),
            }}
          >
            <IconButton
              icon={closeIcon}
              size="sm"
              variant="outlined"
              onClick={requestClose}
              aria-label="Close drawer"
            />
          </div>
        )}
        {children}
      </Panel>
    </>
  );

  return createPortal(drawerElement, document.body);
};

export default Drawer;

// ─────────────────────────────────────────────────────────────
// src/components/layout/Drawer.tsx  | valet
// Minimal sliding drawer component akin to MUI's Drawer.
// Controlled/uncontrolled, with backdrop and escape handling.
// patched: avoid resize thrash for persistent drawers
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useLayoutEffect, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { useSurface } from '../../system/surfaceStore';
import { shallow } from 'zustand/shallow';
import { preset } from '../../css/stylePresets';
import type { Presettable, Sx } from '../../types';
import { IconButton } from '../fields/IconButton';
import { withAlpha } from '../../helpers/color';
import { inheritSurfaceFontVars } from '../../system/inheritSurfaceFontVars';
import { getOverlayRoot, useOverlay } from '../../system/overlay';

/* Allow strongly-typed CSS custom properties (e.g. --valet-*) */
type CSSVarName = `--${string}`;
type CSSVarStyles = React.CSSProperties & Record<CSSVarName, string | number>;

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
  /** Adaptive behaviour (persistent in landscape, overlay in portrait) */
  adaptive?: boolean;
  /** Icon for the portrait toggle button */
  toggleIcon?: string;
  /** Close button icon when portrait */
  closeIcon?: string;
  /** Drawer contents */
  children?: React.ReactNode;
  /** Class applied to the Drawer panel root */
  className?: string;
  /** Inline styles applied to the Drawer panel root */
  style?: React.CSSProperties;
  /** sx convenience for inline styles with CSS var support */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */

const Backdrop = styled('div')<{ $fade: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  opacity: ${({ $fade }) => ($fade ? 0 : 1)};
  transition: opacity 200ms ease;
  z-index: var(--valet-zindex-modal-backdrop, 1390);
`;

const Panel = styled('div')<{
  $anchor: DrawerAnchor;
  $fade: boolean;
  $size: string;
  $bg: string;
  $text: string;
  $primary: string;
  $persistent: boolean;
  $adaptive: boolean;
}>`
  position: fixed;
  z-index: ${({ $persistent }) =>
    $persistent ? 'calc(var(--valet-zindex-modal, 1400) - 1)' : 'var(--valet-zindex-modal, 1400)'};
  display: flex;
  flex-direction: column;
  overflow-y: ${({ $anchor }) => ($anchor === 'left' || $anchor === 'right' ? 'auto' : 'visible')};
  overflow-x: ${({ $anchor }) => ($anchor === 'top' || $anchor === 'bottom' ? 'auto' : 'visible')};
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  box-shadow: ${({ $adaptive }) => ($adaptive ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.3)')};
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
  adaptive = false,
  toggleIcon = 'mdi:menu',
  closeIcon = 'mdi:close',
  children,
  preset: presetKey,
  className,
  style,
  sx,
}) => {
  const { theme } = useTheme();
  // Only subscribe to width/height when adaptive logic is enabled to
  // prevent unnecessary renders during horizontal window resize with
  // persistent drawers. Always read the surface element for offset.
  const { element } = useSurface((s) => ({ element: s.element }), shallow);
  // Orientation: use matchMedia to avoid flip-flop near square and
  // decouple from Surface size updates and margin changes.
  const [portrait, setPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !adaptive) return false;
    try {
      return window.matchMedia('(orientation: portrait)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!adaptive || typeof window === 'undefined') return;
    let mql: MediaQueryList | null = null;
    try {
      mql = window.matchMedia('(orientation: portrait)');
      const onChange = (e: MediaQueryListEvent) => {
        setPortrait(e.matches);
      };
      // Set initial synchronously (covers Safari oddities)
      setPortrait(mql.matches);
      type MediaQueryListLegacy = MediaQueryList & {
        addListener: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
        removeListener: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
      };
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', onChange);
      } else if (typeof (mql as MediaQueryListLegacy).addListener === 'function') {
        (mql as MediaQueryListLegacy).addListener(onChange);
      }
      return () => {
        if (!mql) return;
        if (typeof mql.removeEventListener === 'function') {
          mql.removeEventListener('change', onChange);
        } else if (typeof (mql as MediaQueryListLegacy).removeListener === 'function') {
          (mql as MediaQueryListLegacy).removeListener(onChange);
        }
      };
    } catch {
      // no-op
      return;
    }
  }, [adaptive]);
  // Track Surface's marginTop set by AppBar so persistent drawers sit below it
  const [offsetTop, setOffsetTop] = useState<number>(() => {
    if (!(element instanceof HTMLElement)) return 0;
    const mt = window.getComputedStyle(element).marginTop || '0';
    const n = parseFloat(mt);
    return Number.isFinite(n) ? n : 0;
  });

  useLayoutEffect(() => {
    if (!(element instanceof HTMLElement)) return;
    const el = element;

    const read = () => {
      const mt = window.getComputedStyle(el).marginTop || '0';
      const n = parseFloat(mt);
      const v = Number.isFinite(n) ? n : 0;
      setOffsetTop((prev) => (prev !== v ? v : prev));
    };

    // Initial read after mount/layout
    read();

    // Observe inline style mutations (AppBar updates marginTop imperatively)
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'style') {
          read();
          break;
        }
      }
    });
    try {
      mo.observe(el, { attributes: true, attributeFilter: ['style'] });
    } catch {
      // no-op
    }

    // Fallback: also re-check on resize as AppBar can change height with breakpoints
    const onResize = () => read();
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      mo.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [element]);
  const presetClasses = presetKey ? preset(presetKey) : '';
  const toggleBg = withAlpha(theme.colors.primary, 0.7);
  const adaptiveMode = adaptive && (anchor === 'left' || anchor === 'right');
  const orientationPersistent = adaptiveMode && !portrait;
  const persistentEffective = persistent || orientationPersistent;

  const uncontrolled = controlledOpen === undefined;
  const [openState, setOpenState] = useState(defaultOpen);
  const open = persistentEffective ? true : uncontrolled ? openState : controlledOpen!;
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (orientationPersistent) setOpenState(true);
    else if (adaptiveMode && portrait) setOpenState(false);
  }, [orientationPersistent, adaptiveMode, portrait]);

  const requestClose = useCallback(() => {
    if (orientationPersistent) return;
    if (uncontrolled) setOpenState(false);
    onClose?.();
  }, [orientationPersistent, uncontrolled, onClose]);

  /* Mount / unmount side-effects */
  useLayoutEffect(() => {
    if (!(open && !persistentEffective)) return;
    setFade(false);
    return () => setFade(true);
  }, [open, persistentEffective]);

  // Shared overlay wiring for overlay mode (not persistent)
  // (placed after panelRef declaration)

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (persistentEffective || disableBackdropClick) return;
    if (e.target === e.currentTarget) requestClose();
  };

  // When persistent, offset the current surface so content isn't hidden
  useLayoutEffect(() => {
    if (!(element instanceof HTMLElement)) return;

    const horizontal = anchor === 'left' || anchor === 'right';
    if (persistentEffective && horizontal) {
      const px = typeof size === 'number' ? `${size}px` : size;

      // type-safe instead of (as any)[prop]
      type MarginSide = 'marginLeft' | 'marginRight';
      const prop: MarginSide = anchor === 'left' ? 'marginLeft' : 'marginRight';

      const prev = element.style[prop];
      element.style[prop] = px;

      return () => {
        element.style[prop] = prev;
      };
    }
  }, [element, persistentEffective, anchor, size]);

  // Ref to the portalled panel root; used to mirror Surface font vars
  const panelRef = React.useRef<HTMLDivElement>(null);

  useOverlay(
    open && !persistentEffective && panelRef.current
      ? {
          element: panelRef.current,
          onRequestClose: () => requestClose(),
          disableOutsideClick: disableBackdropClick,
          disableEscapeKeyDown,
          trapFocus: false,
          restoreFocusOnClose: true,
          inertBackground: true,
          label: 'Drawer',
        }
      : null,
  );

  // Mirror Surface font/typography vars into the portalled panel
  useLayoutEffect(() => {
    if (panelRef.current) inheritSurfaceFontVars(panelRef.current);
  });

  if (!open && !persistentEffective) {
    if (adaptiveMode && portrait) {
      return (
        <IconButton
          icon={toggleIcon}
          onClick={() => setOpenState(true)}
          sx={
            {
              position: 'fixed',
              top: `calc(${theme.spacing(1)} + ${offsetTop}px)`,
              [anchor]: theme.spacing(1),
              zIndex: 9999,
              background: toggleBg,
            } as unknown as import('../../types').Sx
          }
          aria-label='Open drawer'
        />
      );
    }
    return null;
  }

  const drawerElement = (
    <>
      {!persistentEffective && (
        <Backdrop
          $fade={fade}
          onClick={handleBackdropClick}
        />
      )}
      <Panel
        ref={panelRef}
        $anchor={anchor}
        $fade={fade}
        $size={typeof size === 'number' ? `${size}px` : size}
        $bg={theme.colors.background}
        $text={theme.colors.text}
        $primary={theme.colors.primary}
        $persistent={persistentEffective}
        $adaptive={adaptiveMode}
        data-state='open'
        className={[presetClasses, className].filter(Boolean).join(' ')}
        data-valet-component='Drawer'
        style={
          {
            // Preserve top offset when docked on sides/top
            ...(anchor === 'left' || anchor === 'right' || anchor === 'top'
              ? { top: `${offsetTop}px` }
              : null),
            // When persistent and vertical, reduce height to avoid overlapping the AppBar area
            ...(persistentEffective && (anchor === 'left' || anchor === 'right')
              ? { height: `calc(100% - ${offsetTop}px)` }
              : null),
            ...(sx || {}),
            ...(style as React.CSSProperties),
          } as CSSVarStyles
        }
      >
        {adaptiveMode && portrait && (
          <div
            style={{
              alignSelf: anchor === 'left' ? 'flex-end' : 'flex-start',
              padding: theme.spacing(0.5),
            }}
          >
            <IconButton
              icon={closeIcon}
              size='sm'
              variant='outlined'
              onClick={requestClose}
              aria-label='Close drawer'
            />
          </div>
        )}
        {children}
      </Panel>
    </>
  );

  return createPortal(drawerElement, getOverlayRoot());
};

export default Drawer;

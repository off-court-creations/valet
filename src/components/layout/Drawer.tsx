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
import { warnOnce } from '../../system/devErrors';
import { zVar } from '../../system/zIndex';
import { useComponentStrings, useValetLocale } from '../../system/locale';
import type { DeepPartialStrings, ValetStrings } from '../../system/locale';
import { resolveAnchor } from './resolveAnchor';
import type { DrawerAnchorInput, PhysicalDrawerAnchor } from './resolveAnchor';

/* Allow strongly-typed CSS custom properties (e.g. --valet-*) */
type CSSVarName = `--${string}`;
type CSSVarStyles = React.CSSProperties & Record<CSSVarName, string | number>;

/*───────────────────────────────────────────────────────────*/
/**
 * Public anchor values. The four physical sides ('left'/'right'/'top'/
 * 'bottom') are direction-invariant; the additive logical 'start'/'end'
 * (A11Y S12) resolve to left/right per the active writing direction via
 * {@link resolveAnchor} — 'start' = leading edge, 'end' = trailing edge.
 */
export type DrawerAnchor = DrawerAnchorInput;

/** Physical anchor the styled panel paints with (post-resolution). */
type ResolvedAnchor = PhysicalDrawerAnchor;

export interface DrawerProps extends Presettable {
  /** Controlled visibility */
  open?: boolean;
  /** Default for uncontrolled */
  defaultOpen?: boolean;
  /**
   * Drawer side. Physical 'left'/'right'/'top'/'bottom' are
   * direction-invariant; the additive logical 'start'/'end' resolve to
   * left/right per the active writing direction (RTL-aware — 'start' is the
   * leading edge). Default 'left'.
   */
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
  /**
   * Accessible name for the dialog. Required (alongside `aria-labelledby`) for
   * non-persistent/overlay Drawers, which are real `role='dialog'` modals; a
   * dev warning fires when neither is provided. Ignored by persistent Drawers,
   * which are inline navigation regions, not dialogs.
   */
  'aria-label'?: string;
  /** Id of an element labelling the dialog (alternative to `aria-label`). */
  'aria-labelledby'?: string;
  /**
   * Instance-level overrides for this component's i18n strings (the portrait
   * open/close toggle-button aria-labels). Wins over the `ValetLocaleProvider`
   * value, which in turn wins over the built-in English defaults (A11Y S8
   * resolution contract; see `src/system/locale.tsx`). Distinct from the
   * dialog's accessible name, which comes from `aria-label`/`aria-labelledby`.
   */
  labels?: DeepPartialStrings<ValetStrings['drawer']>;
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
  z-index: ${zVar('modalBackdrop')};
`;

const Panel = styled('div')<{
  $anchor: ResolvedAnchor;
  $fade: boolean;
  $size: string;
  $bg: string;
  $text: string;
  $primary: string;
  $persistent: boolean;
  $adaptive: boolean;
}>`
  position: fixed;
  z-index: ${({ $persistent }) => ($persistent ? `calc(${zVar('modal')} - 1)` : zVar('modal'))};
  display: flex;
  flex-direction: column;
  overflow-y: ${({ $anchor }) => ($anchor === 'left' || $anchor === 'right' ? 'auto' : 'visible')};
  overflow-x: ${({ $anchor }) => ($anchor === 'top' || $anchor === 'bottom' ? 'auto' : 'visible')};
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  box-shadow: ${({ $adaptive }) => ($adaptive ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.3)')};
  /* rtl: physical-by-design — the accent border, edge-pinning and slide
     transform are all driven by the physical $anchor prop (left/right/top/
     bottom). A11Y S12 adds additive logical 'start'/'end' anchors that
     resolve to physical at the component boundary; the painted side stays
     physical so an explicit anchor='left' drawer never flips under RTL. */
  ${({ $anchor, $primary }) =>
    $anchor === 'left'
      ? `border-right:0.25rem solid ${$primary};` /* rtl: physical-by-design */
      : $anchor === 'right'
        ? `border-left:0.25rem solid ${$primary};` /* rtl: physical-by-design */
        : $anchor === 'top'
          ? `border-bottom:0.25rem solid ${$primary};`
          : `border-top:0.25rem solid ${$primary};`}
  ${({ $anchor, $size }) =>
    $anchor === 'left' || $anchor === 'right'
      ? `width:${$size}; height:100%;`
      : `height:${$size}; width:100%;`}
  ${
    ({ $anchor }) =>
      $anchor === 'left'
        ? 'top:0; left:0;' /* rtl: physical-by-design */
        : $anchor === 'right'
          ? 'top:0; right:0;' /* rtl: physical-by-design */
          : $anchor === 'top'
            ? 'top:0; left:0;' /* rtl: physical-by-design */
            : 'bottom:0; left:0;' /* rtl: physical-by-design */
  }
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
  anchor: anchorProp = 'left',
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
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  labels,
}) => {
  const { theme } = useTheme();
  const t = useComponentStrings('drawer', labels);
  /* Resolve the (possibly logical) anchor to a physical side for the active
     writing direction (A11Y S12). Everything downstream — the styled Panel's
     physical $anchor math, the persistent-drawer margin offset, the portrait
     toggle placement — consumes this PHYSICAL value, so 'start'/'end' follow
     `dir` while explicit 'left'/'right'/'top'/'bottom' stay put. */
  const { dir } = useValetLocale();
  const anchor = resolveAnchor(anchorProp, dir);
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

  // Shared overlay wiring (registry v2): Escape/outside dismissal + inert
  // background for overlay (non-persistent) mode. The ref-callback registers on
  // the first open commit (panel attach) — Escape/inert land in the same render
  // the panel mounts, not one render late (audit Modal.tsx:223, same shape).
  // Options resolve live at event time, so a swapped onClose fires fresh.
  const overlayActive = open && !persistentEffective;
  const overlayRef = useOverlay(overlayActive, () => ({
    onRequestClose: () => requestClose(),
    disableOutsideClick: disableBackdropClick,
    disableEscapeKeyDown,
    // S5: an overlay Drawer is a real modal dialog — trap Tab focus and move
    // focus into the panel on open (registerOverlayV2 focuses the first
    // focusable / the tabIndex=-1 panel). Fixes the stranded-focus bug: the
    // pre-S5 Drawer made the background inert but, with trapFocus:false, never
    // moved focus in, leaving focus on the now-inert trigger. Persistent
    // Drawers never reach here (overlayActive is false), so they keep their
    // non-dialog, non-trapping inline-navigation semantics.
    trapFocus: true,
    restoreFocusOnClose: true,
    inertBackground: true,
    label: 'Drawer',
  }));

  // Merge the overlay registration ref with the local panelRef.
  const setPanelRef = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
      overlayRef(node);
    },
    [overlayRef],
  );

  // Mirror Surface font/typography vars into the portalled panel
  useLayoutEffect(() => {
    if (panelRef.current) inheritSurfaceFontVars(panelRef.current);
  });

  // Dev-time a11y guard: an overlay Drawer is role='dialog'/aria-modal and so
  // must carry an accessible name. Persistent Drawers are inline regions, not
  // dialogs, and are exempt. warnOnce keeps it to a single message per name.
  useLayoutEffect(() => {
    if (!overlayActive) return;
    if (process.env.NODE_ENV === 'production') return;
    if (ariaLabel || ariaLabelledBy) return;
    warnOnce(
      'Drawer:accessible-name',
      'valet Drawer: an overlay (non-persistent) Drawer is a modal dialog and ' +
        'needs an accessible name. Provide `aria-label` or `aria-labelledby`.',
    );
  }, [overlayActive, ariaLabel, ariaLabelledBy]);

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
              /* Collapsed-drawer toggle sits at the app-bar chrome layer
                 (OVERLAY S7) so it stays tappable above page content. */
              zIndex: zVar('appbar'),
              background: toggleBg,
            } as unknown as import('../../types').Sx
          }
          aria-label={t.openDrawer}
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
        ref={setPanelRef}
        $anchor={anchor}
        $fade={fade}
        $size={typeof size === 'number' ? `${size}px` : size}
        $bg={theme.colors.background}
        $text={theme.colors.text}
        $primary={theme.colors.primary}
        $persistent={persistentEffective}
        $adaptive={adaptiveMode}
        data-state='open'
        // Dialog semantics for overlay (modal) Drawers only. Persistent
        // Drawers are inline navigation regions and intentionally carry no
        // dialog role / aria-modal / focusable container (R17, plan §3.4 S5).
        {...(persistentEffective
          ? null
          : {
              role: 'dialog' as const,
              'aria-modal': true,
              'aria-label': ariaLabel,
              'aria-labelledby': ariaLabelledBy,
              tabIndex: -1,
            })}
        className={[presetClasses, className].filter(Boolean).join(' ')}
        data-valet-component='Drawer'
        /* precedence: component-owned layout < caller style < sx (API-TYPES S8) */
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
            ...(style as React.CSSProperties),
            ...(sx || {}),
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
              aria-label={t.closeDrawer}
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

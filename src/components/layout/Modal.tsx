// ─────────────────────────────────────────────────────────────
// src/components/layout/Modal.tsx  | valet
// spacing refactor: container pad; rem→spacing; compact – 2025‑08‑12
// patched: DOM passthrough + sx; viewport-constrained height; a11y guard – 2025‑10‑29
// Accessible, theme-aware Modal component that supports both “dialog” and
// “alert” semantics. Fully controlled/uncontrolled, focus-trapping, backdrop &
// ESC/Click dismissal, no external deps.
// ─────────────────────────────────────────────────────────────
import React, { ReactNode, useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { getOverlayRoot, useOverlay } from '../../system/overlay';
import { inheritSurfaceFontVars } from '../../system/inheritSurfaceFontVars';
import type { Presettable, Sx } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */

const Backdrop = styled('div')<{ $fade: boolean }>`
  position: fixed;
  inset: 0;
  background: var(--valet-backdrop-bg, rgba(0, 0, 0, 0.55));
  backdrop-filter: blur(2px);
  opacity: ${({ $fade }) => ($fade ? 0 : 1)};
  transition: opacity var(--valet-modal-duration, 200ms) var(--valet-modal-easing, ease);
  /* Shared overlay token parity */
  z-index: var(--valet-zindex-modal-backdrop, 1390);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Box = styled('div')<{
  $bg: string;
  $text: string;
  $fade: boolean;
  $maxW?: string | number;
  $full: boolean;
  $pad: string;
}>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(${({ $fade }) => ($fade ? 0.92 : 1)});
  opacity: ${({ $fade }) => ($fade ? 0 : 1)};
  transition:
    opacity var(--valet-modal-duration, 200ms) var(--valet-modal-easing, ease),
    transform var(--valet-modal-duration, 200ms) var(--valet-modal-easing, ease);
  /* Dialog sits above backdrop and AppBar */
  z-index: var(--valet-zindex-modal, 1400);

  max-width: ${({ $maxW, $full }) => ($full ? 'none' : $maxW || '32rem')};
  /* Use CSS var so callers can adjust viewport margin */
  width: ${({ $full }) =>
    $full ? 'calc(100% - var(--valet-modal-viewport-margin, 2rem))' : 'auto'};
  padding: ${({ $pad }) => $pad};

  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  border-radius: var(--valet-modal-radius, 6px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  display: flex;
  flex-direction: column;
  /* Constrain height to viewport; allow internal section to scroll */
  max-height: calc(100dvh - var(--valet-modal-viewport-margin, 2rem));
  overflow: hidden;
  /* Ensure flex children can shrink for overflow */
  min-width: 0;
  min-height: 0;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    transform: translate(-50%, -50%) scale(1);
  }
`;

const Header = styled('header')<{ $pt: string; $px: string; $pb: string }>`
  padding-top: ${({ $pt }) => $pt};
  padding-right: ${({ $px }) => $px};
  padding-left: ${({ $px }) => $px};
  padding-bottom: ${({ $pb }) => $pb};
  font-weight: 600;
  font-size: 1.125rem;
`;

const Content = styled('section')<{ $px: string; $pb: string }>`
  padding-top: 0;
  padding-right: ${({ $px }) => $px};
  padding-left: ${({ $px }) => $px};
  padding-bottom: ${({ $pb }) => $pb};
  flex: 1 1 auto;
  overflow: auto;
`;

const Actions = styled('footer')<{ $pt: string; $px: string; $pb: string; $gap: string }>`
  padding-top: ${({ $pt }) => $pt};
  padding-right: ${({ $px }) => $px};
  padding-left: ${({ $px }) => $px};
  padding-bottom: ${({ $pb }) => $pb};
  display: flex;
  justify-content: flex-end;
  gap: ${({ $gap }) => $gap};
`;

/*───────────────────────────────────────────────────────────*/
/* Helpers                                                   */

/*───────────────────────────────────────────────────────────*/
/* Public API                                                */

export interface ModalProps
  extends Omit<React.ComponentProps<'div'>, 'style' | 'title'>,
    Presettable {
  /** Controlled visiblity */
  open?: boolean;
  /** Default for uncontrolled */
  defaultOpen?: boolean;
  /** Callback fired when the user requests to close (backdrop / ESC) */
  onClose?: () => void;
  /** Dialog semantics (default) or alertdialog semantics */
  variant?: 'dialog' | 'alert';
  /** Dialog title – used for aria-labelledby when provided */
  title?: ReactNode;
  /** Main body content */
  children?: ReactNode;
  /** Action buttons */
  actions?: ReactNode;
  /** Container padding override */
  pad?: number | string;
  /** Compact removes container + internal paddings */
  compact?: boolean;
  /** Disable closing via backdrop click */
  disableBackdropClick?: boolean;
  /** Disable closing via ESC key */
  disableEscapeKeyDown?: boolean;
  /** Max width when not fullWidth */
  maxWidth?: number | string;
  /** Stretch to full viewport width minus gutter */
  fullWidth?: boolean;
  /** Inline styles (with CSS var support). */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */

export const Modal: React.FC<ModalProps> = ({
  open: controlledOpen,
  defaultOpen = false,
  onClose,
  variant = 'dialog',
  title,
  children,
  actions,
  pad: padProp,
  compact = false,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  maxWidth,
  fullWidth = false,
  preset: presetKey,
  className,
  sx,
  ...rest
}) => {
  const { theme } = useTheme();
  const presetClasses = presetKey ? preset(presetKey) : '';

  /* ----- state ---------------------------------------------------------- */
  const uncontrolled = controlledOpen === undefined;
  const [openState, setOpenState] = useState(defaultOpen);
  const open = uncontrolled ? openState : controlledOpen!;
  const [fade, setFade] = useState(true); // enter animation flag

  /* ----- refs ----------------------------------------------------------- */
  const idTitle = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  // overlay handles focus capture/restore

  /* ----- open / close helpers ------------------------------------------ */
  const requestClose = useCallback(() => {
    if (uncontrolled) setOpenState(false);
    onClose?.();
  }, [uncontrolled, onClose]);

  /* ----- mount / unmount side-effects ----------------------------------- */
  useLayoutEffect(() => {
    if (!open) return;
    // start fade-in on mount
    setFade(false);
    // Ensure portalled dialog inherits Surface font/typography variables
    if (dialogRef.current) inheritSurfaceFontVars(dialogRef.current);
    // Dev-time a11y guard: dialog/alertdialog should have an accessible name
    if (process.env.NODE_ENV !== 'production') {
      try {
        const ariaLabel = (rest as unknown as Record<string, unknown>)?.['aria-label'] as
          | string
          | undefined;
        const ariaLabelledBy = (rest as unknown as Record<string, unknown>)?.['aria-labelledby'] as
          | string
          | undefined;
        const hasName = Boolean(title || ariaLabel || ariaLabelledBy);
        if (!hasName) {
          console.warn(
            'valet Modal: accessible name missing. Provide `title`, `aria-label`, or `aria-labelledby`.',
          );
        }
      } catch {
        /* no-op */
      }
    }
    return () => {
      setFade(true);
    };
  }, [open, disableEscapeKeyDown, requestClose, title, rest]);

  // Shared overlay wiring: focus trap, Escape/outside, inert background & restore focus
  useOverlay(
    open && dialogRef.current
      ? {
          element: dialogRef.current,
          anchors: [backdropRef.current!].filter(Boolean) as HTMLElement[],
          onRequestClose: () => requestClose(),
          disableOutsideClick: disableBackdropClick,
          disableEscapeKeyDown,
          trapFocus: true,
          restoreFocusOnClose: true,
          inertBackground: true,
          label: 'Modal',
        }
      : null,
  );

  /* ----- backdrop click ------------------------------------------------- */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (disableBackdropClick) return;
    if (e.target === e.currentTarget) requestClose();
  };

  /* Render nothing if closed */
  if (!open) return null;

  /* ----- portal content ------------------------------------------------- */
  const modalElement = (
    <>
      <Backdrop
        ref={backdropRef}
        $fade={fade}
        onClick={handleBackdropClick}
      />
      <Box
        {...rest}
        ref={dialogRef}
        data-valet-component='Modal'
        data-state='open'
        role={variant === 'alert' ? 'alertdialog' : 'dialog'}
        aria-modal='true'
        aria-labelledby={title ? idTitle : undefined}
        tabIndex={-1}
        $bg={theme.colors.backgroundAlt}
        $text={theme.colors.primaryText}
        $fade={fade}
        $maxW={maxWidth}
        $full={fullWidth}
        $pad={
          compact
            ? '0'
            : typeof padProp === 'number'
              ? theme.spacing(padProp)
              : (padProp ?? theme.spacing(1))
        }
        className={[presetClasses, className].filter(Boolean).join(' ')}
        style={
          {
            '--valet-modal-radius': theme.radius(1),
            '--valet-modal-duration': theme.motion.duration.base,
            '--valet-modal-easing': theme.motion.easing.standard,
            '--valet-modal-viewport-margin': theme.spacing(4),
            ...(sx as Sx),
          } as Sx
        }
      >
        {title && (
          <Header
            id={idTitle}
            $pt={compact ? '0' : theme.spacing(2)}
            $px={compact ? '0' : theme.spacing(3)}
            $pb={compact ? '0' : theme.spacing(2)}
          >
            {title}
          </Header>
        )}
        <Content
          $px={compact ? '0' : theme.spacing(3)}
          $pb={compact ? '0' : theme.spacing(3)}
        >
          {children}
        </Content>
        {actions && (
          <Actions
            $pt={compact ? '0' : theme.spacing(2)}
            $px={compact ? '0' : theme.spacing(3)}
            $pb={compact ? '0' : theme.spacing(3)}
            $gap={compact ? '0' : theme.spacing(1)}
          >
            {actions}
          </Actions>
        )}
      </Box>
    </>
  );

  return createPortal(modalElement, getOverlayRoot());
};

export default Modal;

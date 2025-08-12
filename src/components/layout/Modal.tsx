// ─────────────────────────────────────────────────────────────
// src/components/primitives/Modal.tsx | valet
// spacing refactor: container pad; rem→spacing; compact – 2025‑08‑12
// Accessible, theme-aware Modal component that supports both “dialog” and
// “alert” semantics. Fully controlled/uncontrolled, focus-trapping, backdrop &
// ESC/Click dismissal, no external deps.
// ─────────────────────────────────────────────────────────────
import React, { ReactNode, useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */

const Backdrop = styled('div')<{ $fade: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  opacity: ${({ $fade }) => ($fade ? 0 : 1)};
  transition: opacity 200ms ease;
  z-index: 9998;
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
    opacity 200ms ease,
    transform 200ms ease;
  z-index: 9999;

  max-width: ${({ $maxW, $full }) => ($full ? 'none' : $maxW || '32rem')};
  width: ${({ $full }) => ($full ? 'calc(100% - 2rem)' : 'auto')};
  padding: ${({ $pad }) => $pad};

  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  border-radius: var(--valet-modal-radius, 6px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  display: flex;
  flex-direction: column;
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

// Grab all focusable descendants (simplified)
const FOCUSABLE = 'button, [href], input, textarea, select, [tabindex]';
const getFocusable = (el: HTMLElement | null): HTMLElement[] =>
  el
    ? Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => !n.hasAttribute('disabled') && !n.getAttribute('aria-hidden'),
      )
    : [];

/*───────────────────────────────────────────────────────────*/
/* Public API                                                */

export interface ModalProps extends Presettable {
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
  const previouslyFocused = useRef<Element | null>(null);

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
    previouslyFocused.current = document.activeElement;

    const el = dialogRef.current;
    if (el) {
      // Focus first focusable or dialog itself
      const focusable = getFocusable(el);
      (focusable[0] || el).focus();
    }

    // Focus trap handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableEscapeKeyDown) {
        e.stopPropagation();
        requestClose();
      }
      if (e.key === 'Tab') {
        const nodes = getFocusable(dialogRef.current);
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey ? e.target === first : e.target === last) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      setFade(true);
      (previouslyFocused.current as HTMLElement | null)?.focus?.();
    };
  }, [open, disableEscapeKeyDown, requestClose]);

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
        $fade={fade}
        onClick={handleBackdropClick}
      />
      <Box
        ref={dialogRef}
        role={variant === 'alert' ? 'alertdialog' : 'dialog'}
        aria-modal='true'
        aria-labelledby={title ? idTitle : undefined}
        tabIndex={-1}
        $bg={theme.colors.surface}
        $text={theme.colors.text}
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
        className={presetClasses}
        style={{ '--valet-modal-radius': theme.radius(1) } as React.CSSProperties}
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

  return createPortal(modalElement, document.body);
};

export default Modal;

// ─────────────────────────────────────────────────────────────
// src/components/Snackbar.tsx | valet
// ephemeral bottom overlay message
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
export type SnackbarVertical = 'top' | 'bottom';
export type SnackbarHorizontal = 'left' | 'center' | 'right';
export interface SnackbarAnchor {
  vertical?: SnackbarVertical;
  horizontal?: SnackbarHorizontal;
}

export interface SnackbarProps extends Presettable {
  /** Controlled visibility */
  open?: boolean;
  /** Default for uncontrolled */
  defaultOpen?: boolean;
  /** Auto dismiss after ms */
  autoHideDuration?: number;
  /** Message contents */
  message: React.ReactNode;
  /** Optional action node */
  action?: React.ReactNode;
  /** Position of snackbar */
  anchor?: SnackbarAnchor;
  /** Close callback */
  onClose?: () => void;
}

/*───────────────────────────────────────────────────────────*/
const Root = styled('div')<{
  $open: boolean;
  $anchor: Required<SnackbarAnchor>;
}>`
  position: fixed;
  display: flex;
  align-items: center;
  max-width: min(24rem, calc(100vw - 2rem));
  padding: 0.75rem 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  background: var(--snackbar-bg);
  color: var(--snackbar-fg);
  border: 1px solid var(--snackbar-outline);
  z-index: 9999;
  transition: transform 0.25s ease, opacity 0.25s ease;

  ${({ $anchor }) => `${$anchor.vertical}: 1rem;`}
  ${({ $anchor }) =>
    $anchor.horizontal === 'center'
      ? 'left: 50%; translate: -50% 0;'
      : `${$anchor.horizontal}: 1rem;`}

  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: translate(
    ${({ $anchor }) =>
      $anchor.horizontal === 'center' ? '-50%' : '0'},
    ${({ $open, $anchor }) =>
      $open
        ? '0'
        : $anchor.vertical === 'bottom'
          ? '20px'
          : '-20px'}
  );
`;

/*───────────────────────────────────────────────────────────*/
export const Snackbar: React.FC<SnackbarProps> = ({
  open: controlled,
  defaultOpen = false,
  autoHideDuration,
  message,
  action,
  anchor,
  onClose,
  preset: p,
}) => {
  const { theme } = useTheme();
  const presetClasses = p ? preset(p) : '';

  const uncontrolled = controlled === undefined;
  const [openState, setOpenState] = useState(defaultOpen);
  const isOpen = uncontrolled ? openState : controlled!;
  const [mount, setMount] = useState(isOpen);

  const finalAnchor: Required<SnackbarAnchor> = {
    vertical: anchor?.vertical ?? 'bottom',
    horizontal: anchor?.horizontal ?? 'center',
  };

  const requestClose = () => {
    if (uncontrolled) setOpenState(false);
    onClose?.();
  };

  useLayoutEffect(() => {
    if (isOpen) setMount(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (autoHideDuration !== undefined) {
      const id = setTimeout(requestClose, autoHideDuration);
      return () => clearTimeout(id);
    }
  }, [isOpen, autoHideDuration]);

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => setMount(false), 250);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mount) return null;

  const node = (
    <Root
      $open={isOpen}
      $anchor={finalAnchor}
      className={presetClasses}
      style={{
        '--snackbar-bg': theme.colors.background,
        '--snackbar-fg': theme.colors.text,
        '--snackbar-outline': theme.colors.primary,
      } as React.CSSProperties}
      role="status"
      aria-live="polite"
    >
      <div style={{ flex: 1 }}>{message}</div>
      {action && <div>{action}</div>}
    </Root>
  );

  return createPortal(node, document.body);
};

export default Snackbar;

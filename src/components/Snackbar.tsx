// ─────────────────────────────────────────────────────────────
// src/components/Snackbar.tsx | valet
// ephemeral bottom overlay message
// ─────────────────────────────────────────────────────────────
import React, {
  Children,
  isValidElement,
  cloneElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { SurfaceCtx } from '../system/surfaceStore';
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
  $gap: string;
  $offset: string;
}>`
  position: fixed;
  display: flex;
  align-items: center;
  gap: ${({ $gap }) => $gap};
  max-width: min(24rem, calc(100vw - 2rem));
  padding: 0.75rem 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  background: var(--snackbar-bg);
  color: var(--snackbar-fg);
  transition: transform 200ms ease, opacity 200ms ease;
  ${({ $anchor, $offset }) => `${$anchor.vertical}: ${$offset};`}
      ? 'left: 50%;'

    ${({ $anchor }) => ($anchor.horizontal === 'center' ? '-50%' : '0')},
        ? '20px'
        : '-20px'}
  const surfaceCtx = useContext(SurfaceCtx);
  const portalTarget = surfaceCtx?.getState().element ?? document.body;

      const t = setTimeout(() => setMount(false), 200);

      $offset={theme.spacing.lg}
  return createPortal(node, portalTarget);
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

  const actionNode = action
    ? Children.map(action, (child, idx) => {
        if (idx === 0) {
          if (isValidElement(child)) {
            return cloneElement(child as React.ReactElement<any>, {
              style: {
                marginLeft: theme.spacing.sm,
                ...((child as any).props?.style ?? {}),
              },
            });
          }
          return <span style={{ marginLeft: theme.spacing.sm }}>{child}</span>;
        }
        return child;
      })
    : null;

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
      $gap={theme.spacing.sm}
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
      {actionNode && <div>{actionNode}</div>}
    </Root>
  );

  return createPortal(node, document.body);
};

export default Snackbar;

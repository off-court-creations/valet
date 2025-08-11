// ─────────────────────────────────────────────────────────────
// src/components/widgets/Snackbar.tsx | valet
// Fully-typed, theme-aware snackbar with fade + auto-dismiss
// – Uncontrolled or controlled (via `open` / `onClose`)
// – 200 ms fade-in / fade-out to match font + surface loads
// – Horizontal flex “stack” by default (gap = theme.spacing(1))
// – `noStack` disables flex layout entirely
// – Auto-hide (default 4 s) or user-managed lifetime
// – Exposes `useSnackbar()` hook so nested buttons can dismiss
// – Integrates with surfaceStore for smart z-axis ordering
// ─────────────────────────────────────────────────────────────
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { useSurface } from '../../system/surfaceStore';
import { shallow } from 'zustand/shallow';
import { preset } from '../../css/stylePresets';
import { Typography } from '../primitives/Typography';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Dismiss-context so nested children (e.g. IconButton) can
   close the snackbar without prop-drilling.                */
type DismissFn = () => void;
const SnackbarCtx = createContext<DismissFn | null>(null);
export const useSnackbar = () => useContext(SnackbarCtx);

/*───────────────────────────────────────────────────────────*/
/* Props                                                     */
export interface SnackbarProps extends React.HTMLAttributes<HTMLDivElement>, Presettable {
  /** Controlled open state – omit for uncontrolled */
  open?: boolean;
  /** Called when the snackbar has fully hidden */
  onClose?: () => void;
  /** Auto-hide after N ms – `null` disables (default = 4000 ms) */
  autoHideDuration?: number | null;
  /** Convenience message when no children supplied            */
  message?: React.ReactNode;
  /** Disable the internal flex stack (children render 1:1)    */
  noStack?: boolean;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitive                                          */
const Root = styled('div')<{
  $visible: boolean;
  $spacing: string;
  $outline: string;
  $bg: string;
  $flex: boolean;
}>`
  position: fixed;
  left: 50%;
  bottom: ${({ $spacing }) => $spacing};
  transform: translateX(-50%) translateY(${({ $visible }) => ($visible ? '0' : '0.75rem')});
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  transition:
    opacity 200ms ease,
    transform 200ms ease;

  background: ${({ $bg }) => $bg};
  outline: 0.25rem solid ${({ $outline }) => $outline};
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  max-width: 95vw;
  box-sizing: border-box;
  z-index: 1000;

  display: ${({ $flex }) => ($flex ? 'flex' : 'block')};
  flex-direction: row;
  align-items: center;
  gap: ${({ $flex, $spacing }) => ($flex ? $spacing : '0')};
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const Snackbar: React.FC<SnackbarProps> = ({
  /* Behaviour ---------------------------------------------*/
  open, // controlled flag
  onClose, // callback when fully hidden
  autoHideDuration = 4000,
  noStack = false,

  /* Content -----------------------------------------------*/
  message,
  children,

  /* Styling + passthrough ---------------------------------*/
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();

  // Select stable register/unregister fns from surface store
  const { registerChild, unregisterChild } = useSurface(
    (s) => ({
      registerChild: s.registerChild,
      unregisterChild: s.unregisterChild,
    }),
    shallow,
  );

  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  /* Controlled vs uncontrolled lifecycle ------------------*/
  const [internalOpen, setInternalOpen] = useState(open !== undefined ? open : true);
  const visible = open !== undefined ? open : internalOpen;
  const [exiting, setExiting] = useState(false);

  /* Unified close handler (supports fade-out first) --------*/
  const handleClose: DismissFn = useCallback(() => {
    if (open !== undefined) {
      /* Controlled mode – delegate responsibility upward    */
      onClose?.();
      return;
    }
    /* Uncontrolled – self-manage fade-out + unmount         */
    setExiting(true);
    setTimeout(() => {
      setInternalOpen(false);
      setExiting(false);
      onClose?.();
    }, 200); // match CSS transition
  }, [open, onClose]);

  /* Register with surfaceStore so pop-stack order remains
     intuitive alongside Dialogs, Popovers, Tooltips, etc.  */
  useLayoutEffect(() => {
    if (!ref.current) return;
    const node = ref.current;
    const noop = () => {};
    registerChild(id, node, noop);
    return () => {
      unregisterChild(id);
    };
  }, [id, registerChild, unregisterChild]);

  /* Auto-hide timer ---------------------------------------*/
  useEffect(() => {
    if (!visible || autoHideDuration == null) return;
    const timer = setTimeout(() => handleClose(), autoHideDuration);
    return () => clearTimeout(timer);
  }, [visible, autoHideDuration, handleClose]);

  /* Don’t render once fully hidden in uncontrolled mode ----*/
  if (!visible && !exiting) return null;

  /* Compose children --------------------------------------*/
  const body =
    children ??
    (message != null ? (
      <Typography
        variant='body'
        autoSize
      >
        {message}
      </Typography>
    ) : null);

  /* Final className (preset + custom) ---------------------*/
  const classes = [p ? preset(p) : '', className].filter(Boolean).join(' ') || undefined;

  /*────────────────────────────────────────────────────────*/
  return (
    <SnackbarCtx.Provider value={handleClose}>
      <Root
        ref={ref}
        {...rest}
        $visible={!exiting && visible}
        $flex={!noStack}
        $spacing={theme.spacing(1)}
        $outline={theme.colors.primary}
        $bg={theme.colors.background}
        className={classes}
        style={style}
      >
        {body}
      </Root>
    </SnackbarCtx.Provider>
  );
};

export default Snackbar;

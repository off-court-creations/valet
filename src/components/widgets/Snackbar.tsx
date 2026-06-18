// ─────────────────────────────────────────────────────────────
// src/components/widgets/Snackbar.tsx | valet
// Fully-typed, theme-aware snackbar with fade + auto-dismiss
// – Uncontrolled or controlled (via `open` / `onClose`)
// – 200 ms fade-in / fade-out to match font + surface loads
//   (controlled dismissals fade out too — they no longer just vanish)
// – Horizontal flex “stack” by default (gap = theme.spacing(1))
// – `noStack` disables flex layout entirely
// – Auto-hide (default 4 s) or user-managed lifetime; the auto-hide clock
//   PAUSES on hover AND focus and RESUMES with the remaining time (WCAG 2.2.1)
// – Announces via role='status'/aria-live='polite' (caller-overridable for
//   error toasts: role='alert'/aria-live='assertive')
// – Exposes `useSnackbar()` hook so nested buttons can dismiss
// – Integrates with surfaceStore for smart z-axis ordering
// NOTE: multi-message queueing is intentionally deferred (plan §3.6 S1 /
//   §3 "Logged deferrals"): one Snackbar renders one message at a time.
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
import { zVar } from '../../system/zIndex';
import type { Presettable, Sx } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Dismiss-context so nested children (e.g. IconButton) can
   close the snackbar without prop-drilling.                */
type DismissFn = () => void;
const SnackbarCtx = createContext<DismissFn | null>(null);
export const useSnackbar = () => useContext(SnackbarCtx);

/* Exit-fade duration — kept in lockstep with the CSS transition, which is
   driven by theme.motion.duration.base (≈200 ms). A numeric constant lets
   the close + controlled-exit timers reuse the same budget.              */
const EXIT_FADE_MS = 200;

/*───────────────────────────────────────────────────────────*/
/* Props                                                     */
export interface SnackbarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>,
    Presettable {
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
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitive                                          */
const Root = styled('div')<{
  $visible: boolean;
  $spacing: string;
  $outline: string;
  $outlineW: string;
  $bg: string;
  $flex: boolean;
  $padV: string;
  $padH: string;
  $offset: string;
  $radius: string;
  $dur: string;
  $ease: string;
}>`
  position: fixed;
  inset-inline-end: ${({ $spacing }) => $spacing};
  /* Mobile: clear the home indicator / gesture bar on notched phones. env()
     falls back to 0 everywhere else, so desktop positioning is unchanged. */
  bottom: calc(${({ $spacing }) => $spacing} + env(safe-area-inset-bottom, 0px));
  transform: translateY(${({ $visible, $offset }) => ($visible ? '0' : $offset)});
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  transition:
    opacity ${({ $dur }) => $dur} ${({ $ease }) => $ease},
    transform ${({ $dur }) => $dur} ${({ $ease }) => $ease};

  /* A11Y S5 — reduced motion: no slide-in/fade; the snackbar appears and
     disappears instantly. The auto-hide timer (and its hover/focus pause)
     is unaffected — only the visual tween is dropped. */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  background: ${({ $bg }) => $bg};
  outline: ${({ $outlineW }) => $outlineW} solid ${({ $outline }) => $outline};
  border-radius: ${({ $radius }) => $radius};
  padding: ${({ $padV, $padH }) => `${$padV} ${$padH}`};
  max-width: 95vw;
  box-sizing: border-box;
  z-index: ${zVar('snackbar')};

  display: ${({ $flex }) => ($flex ? 'flex' : 'block')};
  flex-direction: row;
  align-items: center;
  gap: ${({ $flex, $spacing }) => ($flex ? $spacing : '0')};

  /* A toast is transient (it auto-hides), so its text is never selectable. */
  user-select: none;
  -webkit-user-select: none;
  /* No blue tap-flash if the toast (or its action) is tapped on mobile. */
  -webkit-tap-highlight-color: transparent;
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
  sx,
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
  const controlled = open !== undefined;

  /* Controlled vs uncontrolled lifecycle ------------------*/
  const [internalOpen, setInternalOpen] = useState(controlled ? (open as boolean) : true);
  const requestedOpen = controlled ? (open as boolean) : internalOpen;

  /* `exiting` drives the fade-out in BOTH modes: uncontrolled self-manages
     the unmount; controlled keeps the (already-dismissed) node mounted at
     opacity 0 for one transition so it fades instead of vanishing.        */
  const [exiting, setExiting] = useState(false);

  /* Reconcile `exiting` with CONTROLLED `open` flips DURING render so the
     node stays mounted on the same commit. An effect-driven flip would let
     the render below return null first, remounting on the next tick — which
     is exactly the controlled-mode "skips the exit fade" bug (audit :176).
     Uncontrolled dismissals go through handleClose, so this is controlled-
     only — and must NOT react to the internal `internalOpen→false` settle. */
  const prevOpenRef = useRef(open);
  if (controlled) {
    if (prevOpenRef.current && !open && !exiting) {
      setExiting(true); // parent closed → start the fade (setState collapses in)
    } else if (!prevOpenRef.current && open && exiting) {
      setExiting(false); // parent re-opened mid-fade → cancel the exit
    }
  }
  prevOpenRef.current = open;

  // Stay mounted (faded) while exiting, even after the controlled flag drops.
  const visible = requestedOpen || exiting;
  // Local flag to drive CSS visibility so we can animate on enter
  const [show, setShow] = useState(false);

  /* Close-fade timer handle — cleaned on unmount so a dismissal in flight
     never fires setState after the component is gone (orphan fix).        */
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* Run the exit fade whenever we enter the `exiting` state: after one CSS
     transition, settle (drop internalOpen in uncontrolled mode) and report
     completion via onClose. Controlled dismissals fade here too. The timer
     is cleared on unmount (orphan fix) and on a parent re-open.           */
  useEffect(() => {
    if (!exiting) return;
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = undefined;
      setExiting(false);
      if (!controlled) setInternalOpen(false);
      onClose?.();
    }, EXIT_FADE_MS); // match CSS transition (theme.motion.duration.base ≈ 200 ms)
    return () => {
      if (closeTimerRef.current !== undefined) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = undefined;
      }
    };
    // onClose read fresh on settle; not a re-trigger dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exiting, controlled]);

  /* Unified close handler — start the fade-out; the effect above settles.
     (Uncontrolled or via useSnackbar(); controlled callers drop `open`.)  */
  const handleClose: DismissFn = useCallback(() => {
    setExiting(true);
  }, []);

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

  /* Pausable auto-hide timer ------------------------------*/
  /* Pause on hover AND focus (WCAG 2.2.1): track each independently and
     resume only when neither is active. We bank elapsed time so resuming
     restarts with the remainder, not the full duration.                   */
  const [paused, setPaused] = useState(false);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const remainingRef = useRef<number>(autoHideDuration ?? 0);
  const startedAtRef = useRef<number>(0);

  // A new visible message resets the remaining budget to the full duration.
  useEffect(() => {
    if (requestedOpen && autoHideDuration != null) remainingRef.current = autoHideDuration;
  }, [requestedOpen, autoHideDuration]);

  useEffect(() => {
    /* Don't run the clock while exiting, paused, or with auto-hide off. */
    if (!requestedOpen || exiting || paused || autoHideDuration == null) return;
    if (remainingRef.current <= 0) remainingRef.current = autoHideDuration;
    startedAtRef.current = Date.now();
    const wait = remainingRef.current;
    const timer = setTimeout(() => {
      remainingRef.current = 0;
      handleClose();
    }, wait);
    return () => {
      clearTimeout(timer);
      /* Bank the elapsed time so the next run resumes with the remainder. */
      const elapsed = Date.now() - startedAtRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    };
  }, [requestedOpen, exiting, paused, autoHideDuration, handleClose]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => {
    if (!hoveredRef.current && !focusedRef.current) setPaused(false);
  }, []);
  const onPointerEnter = useCallback(() => {
    hoveredRef.current = true;
    pause();
  }, [pause]);
  const onPointerLeave = useCallback(() => {
    hoveredRef.current = false;
    resume();
  }, [resume]);
  const onFocusCapture = useCallback(() => {
    focusedRef.current = true;
    pause();
  }, [pause]);
  const onBlurCapture = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      // Ignore focus moving between descendants of the snackbar.
      if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
      focusedRef.current = false;
      resume();
    },
    [resume],
  );

  /* Enter animation: when becoming visible, render hidden for a frame,
     then flip to visible so CSS transitions run (avoids pop-in). */
  useEffect(() => {
    if (visible && !exiting) {
      setShow(false);
      /* Effect-local nested id — a shared window global here let
         concurrent snackbars cancel each other's enter frame and
         stick at opacity 0. */
      let id2: number | undefined;
      const id = requestAnimationFrame(() => {
        // second RAF ensures layout is committed before transition
        id2 = requestAnimationFrame(() => setShow(true));
      });
      return () => {
        cancelAnimationFrame(id);
        if (id2 !== undefined) cancelAnimationFrame(id2);
      };
    } else {
      setShow(false);
    }
  }, [visible, exiting]);

  /* Don’t render once fully hidden ------------------------*/
  if (!visible) return null;

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
        /* Live region: announce on mount/update without stealing focus.
           Placed BEFORE the rest spread so callers can override role/aria-live
           (e.g. role='alert'/aria-live='assertive' for errors).             */
        role='status'
        aria-live='polite'
        {...rest}
        data-valet-component='Snackbar'
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onFocusCapture={onFocusCapture}
        onBlurCapture={onBlurCapture}
        $visible={!exiting && show}
        $flex={!noStack}
        $spacing={theme.spacing(1)}
        $outline={theme.colors.primary}
        $outlineW={theme.stroke(4)}
        $bg={theme.colors.background}
        $padV={theme.spacing(1)}
        $padH={theme.spacing(2)}
        $offset={theme.spacing(1.5)}
        $radius={theme.radius(1)}
        $dur={theme.motion.duration.base}
        $ease={theme.motion.easing.standard}
        className={classes}
        style={sx}
      >
        {body}
      </Root>
    </SnackbarCtx.Provider>
  );
};

export default Snackbar;

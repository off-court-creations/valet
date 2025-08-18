// ─────────────────────────────────────────────────────────────
// src/components/widgets/Pagination.tsx  | valet
// Tab-style pagination with stretch-follow elastic underline for active page
// Adds horizontal sliding window animation for « and » controls
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import Typography from '../primitives/Typography';
import { preset } from '../../css/stylePresets';
import { useTheme } from '../../system/themeStore';
import type { Presettable, Sx } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Public props                                              */
export interface PaginationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange' | 'style'>,
    Presettable {
  /** Total number of pages (≥ 1). */
  count: number;
  /** Currently-selected page (1-based). */
  page?: number;
  /** Called with **new page** when user clicks. */
  onChange?: (page: number) => void;
  /**
   * Limit how many page buttons are visible at once. When set and less than `count`,
   * pagination renders a sliding window of page numbers plus window scroll controls.
   * Does not affect the currently selected page.
   */
  visibleWindow?: number;
  /**
   * If true, forces the active page to remain visible by auto-shifting the window
   * whenever `page` changes outside the current window. Defaults to true.
   */
  autoFollowActive?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
/* Layout wrapper                                            */
const Root = styled('nav')<{
  $text: string;
  $gap: string;
  $padV: string;
  $padH: string;
  $durColor: string;
  $durOpacity: string;
  $ease: string;
}>`
  display: flex;
  gap: ${({ $gap }) => $gap};

  button {
    background: none;
    border: none;
    padding: ${({ $padV, $padH }) => `${$padV} ${$padH}`};
    cursor: pointer;
    color: ${({ $text }) => $text};
    font: inherit;
    line-height: 1;
    transition:
      color ${({ $durColor }) => $durColor} ${({ $ease }) => $ease},
      opacity ${({ $durOpacity }) => $durOpacity} ${({ $ease }) => $ease}; /* smooth fades for disabled/enabled */
  }

  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

/*───────────────────────────────────────────────────────────*/
/* Tab-style page trigger                                    */
const PageBtn = styled('button')<{
  $active: boolean;
  $primary: string;
  $text: string;
  $durColor: string;
  $durOpacity: string;
  $ease: string;
}>`
  position: relative;
  display: inline-flex;
  flex: 0 0 auto; /* prevent flex shrink during slides so text never wraps */
  align-items: center;
  white-space: nowrap; /* never wrap digits like 10 into two lines */
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  color: ${({ $active, $primary, $text }) => ($active ? $primary : $text)};
  transition:
    color ${({ $durColor }) => $durColor} ${({ $ease }) => $ease},
    opacity ${({ $durOpacity }) => $durOpacity} ${({ $ease }) => $ease};

  /* previous underline pseudo-element replaced by shared slider */

  /* Ensure embedded text never breaks mid-number while sliding */
  & > * {
    white-space: nowrap;
    word-break: keep-all;
    overflow-wrap: normal;
  }
`;

/* Pages wrapper (relative for underline positioning) */
const PagesWrap = styled('div')`
  position: relative;
  display: inline-flex;
`;

// Viewport that holds the sliding track. Width can be frozen during slide.
const PagesViewport = styled('div')<{ $width?: number; $height?: number }>`
  overflow: hidden;
  display: inline-block;
  vertical-align: middle; /* align with surrounding inline controls */
  line-height: 1; /* normalize inline-block baseline height */
  width: ${({ $width }) => ($width && $width > 0 ? `${Math.round($width)}px` : 'auto')};
  height: ${({ $height }) => ($height && $height > 0 ? `${Math.round($height)}px` : 'auto')};
`;

// Track containing one or two page groups that translate horizontally.
const PagesTrack = styled('div')<{
  $x: number;
  $dur: string;
  $ease: string;
}>`
  display: inline-flex;
  flex-wrap: nowrap;
  white-space: nowrap;
  will-change: transform;
  transform: ${({ $x }) => `translateX(${Math.round($x)}px)`};
  transition: transform ${({ $dur }) => $dur} ${({ $ease }) => $ease};
`;

// Hidden measurer used to compute the width of a page group without visual flicker
const HiddenMeasure = styled('div')`
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  left: -99999px;
  top: -99999px;
  display: inline-flex;
`;

/* Underline rail that slides under the active page */
const Underline = styled('div')<{
  $height: string;
  $x: number;
  $w: number;
  $transX: string;
  $transW: string;
  $easeX: string;
  $easeW: string;
  $opacity: number;
  $fadeDur: string;
  $fadeEase: string;
}>`
  position: absolute;
  left: 0;
  bottom: calc(-0.5 * var(--valet-underline-width, 2px));
  height: ${({ $height }) => $height};
  width: ${({ $w }) => `${Math.max(0, Math.round($w))}px`};
  transform: ${({ $x }) => `translateX(${Math.round($x)}px)`};
  transition:
    transform ${({ $transX }) => $transX} ${({ $easeX }) => $easeX},
    width ${({ $transW }) => $transW} ${({ $easeW }) => $easeW},
    opacity ${({ $fadeDur }) => $fadeDur} ${({ $fadeEase }) => $fadeEase};
  will-change: transform, width;
  pointer-events: none;
  overflow: visible;
  opacity: ${({ $opacity }) => (Number.isFinite($opacity) ? $opacity : 1)};
  /* visual */
  background: transparent; /* actual colour on the fill */
`;

const UnderlineFill = styled('div')<{
  $color: string;
  $scale: number;
  $scaleTrans: string;
  $scaleEase: string;
  $origin: 'left' | 'right' | 'center';
}>`
  width: 100%;
  height: 100%;
  background: ${({ $color }) => $color};
  border-radius: 0; /* Always a right-angle rectangle */
  transform-origin: ${({ $origin }) => $origin} center;
  transform: ${({ $scale }) => `scaleX(${Number.isFinite($scale) ? $scale : 1})`};
  transition: transform ${({ $scaleTrans }) => $scaleTrans} ${({ $scaleEase }) => $scaleEase};
  will-change: transform;
  backface-visibility: hidden;
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const Pagination: React.FC<PaginationProps> = ({
  count,
  page = 1,
  onChange,
  visibleWindow,
  autoFollowActive = true,
  preset: p,
  className,
  sx,
  ...rest
}) => {
  const { theme } = useTheme();
  const pages = React.useMemo(() => Array.from({ length: count }, (_, i) => i + 1), [count]);

  /* preset → utility class merge */
  const presetClass = p ? preset(p) : '';
  const mergedClass = [presetClass, className].filter(Boolean).join(' ') || undefined;

  // stable click handler shared by all page buttons (defined after animation refs)

  /* measure active page for underline position/width */
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const btnRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const [ux, setUx] = React.useState({ x: 0, w: 0 });
  const prevUxRef = React.useRef<{ x: number; w: number } | null>(null);

  // runtime animation channel for two-phase stretch → settle
  const [anim, setAnim] = React.useState({
    x: 0,
    w: 0,
    transX: '0ms',
    transW: '0ms',
    easeX: theme.motion.easing.linear,
    easeW: theme.motion.easing.linear,
    scale: 1,
    scaleTrans: '0ms',
    scaleEase: theme.motion.easing.linear,
    origin: 'center' as 'left' | 'right' | 'center',
  });
  const animatingRef = React.useRef(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const animationRunIdRef = React.useRef(0);
  const prevPageRef = React.useRef<number>(page);
  const currentPageRef = React.useRef<number>(page);
  // When true, the next page change will snap underline without stretch/settle animation
  const suppressNextUnderlineAnim = React.useRef(false);
  // Freeze underline position/size during edge handoff
  const underlineLockRef = React.useRef(false);

  // window sliding state (for « and »)
  const [isSliding, setIsSliding] = React.useState(false);
  // Distinguish slide kinds so we can preserve underline on edge-step
  const [slideKind, setSlideKind] = React.useState<
    | 'none'
    | 'window-left'
    | 'window-right'
    | 'edge-left'
    | 'edge-right'
    | 'intra-left'
    | 'intra-right'
  >('none');
  const [slideX, setSlideX] = React.useState(0);
  const [underlineVisible, setUnderlineVisible] = React.useState(true);
  // When hiding due to slide start, snap opacity to 0 (no fade out);
  // when revealing after measurement, allow fade in.
  const [underlineFadeInstant, setUnderlineFadeInstant] = React.useState(false);
  const [viewportW, setViewportW] = React.useState<number | undefined>(undefined);
  const [viewportH, setViewportH] = React.useState<number | undefined>(undefined);
  const [groupA, setGroupA] = React.useState<number[] | null>(null);
  const [groupB, setGroupB] = React.useState<number[] | null>(null);
  const slideDurMs = 320; // slightly slower to accentuate deceleration
  const slideEase = theme.motion.easing.emphasized; // stronger ease-out for more noticeable slow-down
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const [measureSet, setMeasureSet] = React.useState<number[] | null>(null);
  const measureRef = React.useRef<HTMLDivElement | null>(null);
  const pendingSlideRef = React.useRef<null | {
    dir: 'left' | 'right';
    nextStart: number;
    prevStart: number;
    currentPages: number[];
    nextPages: number[];
    after?: () => void;
  }>(null);

  // stable click handler shared by all page buttons
  const handlePageClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (animatingRef.current || isAnimating) return; // prevent page changes mid-animation
      const target = e.currentTarget as HTMLButtonElement;
      const n = Number(target.dataset.page || 0);
      if (!Number.isFinite(n) || n < 1) return;
      if (n === page) return;
      onChange?.(n);
    },
    [onChange, page, isAnimating],
  );

  // windowing state
  const [winStart, setWinStart] = React.useState(1);
  const winSize = Math.max(
    1,
    Number.isFinite(visibleWindow || 0) ? (visibleWindow as number) : count,
  );
  const hasWindow = visibleWindow !== undefined && winSize < count;
  const winEnd = Math.min(count, winStart + winSize - 1);

  // keep window in a valid range on mount/prop change
  React.useEffect(() => {
    if (!hasWindow) {
      setWinStart(1);
      return;
    }
    // clamp window if count or size changed
    setWinStart((s) => Math.max(1, Math.min(s, Math.max(1, count - winSize + 1))));
  }, [count, winSize, hasWindow]);

  // follow active page if requested (when outside window)
  React.useEffect(() => {
    if (!hasWindow || !autoFollowActive) return;
    if (page < winStart || page > winEnd) {
      const half = Math.floor(winSize / 2);
      const centeredStart = Math.max(1, Math.min(page - half, Math.max(1, count - winSize + 1)));
      setWinStart(centeredStart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasWindow, autoFollowActive, count, winSize]);

  const updateUnderline = React.useCallback(() => {
    const wrap = wrapRef.current;
    const btn = btnRefs.current[page] ?? null; // indexed by page number
    if (!wrap) return;
    // If locked (edge handoff), do not change underline geometry
    if (underlineLockRef.current) return;
    // During edge-step handoff, we intentionally keep the underline fixed.
    // Suppression flag is set just before `onChange` so avoid all realignments
    // until the page-change effect snaps the underline with 0ms transitions.
    if (suppressNextUnderlineAnim.current) {
      return;
    }
    if (!btn) {
      // active page not in current window
      // Preserve underline during edge-step slides, and also while we are
      // about to snap the underline (after edge-step) to avoid a blink.
      if (
        (isSliding && (slideKind === 'edge-left' || slideKind === 'edge-right')) ||
        suppressNextUnderlineAnim.current
      ) {
        return;
      }
      // Otherwise, hide underline by collapsing width
      setUx((u) => (u.w === 0 ? u : { x: 0, w: 0 }));
      setUnderlineFadeInstant(true);
      setUnderlineVisible(false);
      return;
    }
    const wRect = wrap.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    setUx({ x: bRect.left - wRect.left, w: bRect.width });
    // ensure underline is visible when the active button exists and we're not sliding
    if (!isSliding) {
      setUnderlineFadeInstant(false);
      setUnderlineVisible(true);
    }
  }, [page, isSliding, slideKind]);

  React.useLayoutEffect(() => {
    updateUnderline();
  }, [updateUnderline, count]);

  React.useLayoutEffect(() => {
    const ro = new ResizeObserver(() => updateUnderline());
    if (wrapRef.current) ro.observe(wrapRef.current);
    const handler = () => updateUnderline();
    window.addEventListener('resize', handler, { passive: true } as AddEventListenerOptions);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handler as EventListener);
    };
  }, [updateUnderline]);

  // Keep anim state in sync with measurements when not mid-animation

  // Keep underline aligned on container/label resizes when not mid-animation
  React.useEffect(() => {
    if (animatingRef.current) return;
    setAnim((a) => ({ ...a, x: ux.x, w: ux.w }));
    prevUxRef.current = { x: ux.x, w: ux.w };
  }, [ux.x, ux.w]);

  // Drive the stretch-follow animation whenever the page changes
  React.useEffect(() => {
    const wrap = wrapRef.current;
    const btn = btnRefs.current[page] ?? null;
    if (!wrap || !btn) return;

    const wRect = wrap.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    const target = { x: bRect.left - wRect.left, w: bRect.width };
    let prev = prevUxRef.current ?? { x: anim.x, w: anim.w };

    // If an edge-step slide just completed, snap underline to the new target without anim
    if (suppressNextUnderlineAnim.current) {
      suppressNextUnderlineAnim.current = false;
      animatingRef.current = false;
      setIsAnimating(false);
      setAnim((a) => ({
        ...a,
        x: target.x,
        w: target.w,
        transX: '0ms',
        transW: '0ms',
        easeX: theme.motion.easing.linear,
        easeW: theme.motion.easing.linear,
        scale: 1,
        scaleTrans: '0ms',
        scaleEase: theme.motion.easing.linear,
        origin: 'center',
      }));
      prevUxRef.current = { x: target.x, w: target.w };
      return;
    }

    // Special handling: if the previously active page was outside the current window,
    // make the underline "enter" from the visible edge (leftmost/rightmost button).
    // This creates the requested edge-origin animation when jumping across windows.
    if (
      hasWindow &&
      prevPageRef.current != null &&
      (prevPageRef.current < winStart || prevPageRef.current > winEnd)
    ) {
      const leftmostIdx = hasWindow ? Math.max(winStart, 1) : 1;
      const rightmostIdx = hasWindow ? Math.min(winEnd, count) : count;
      // Determine which edge to start from based on where the previous active page was
      const startFromRight = prevPageRef.current > winEnd; // previous was to the right → enter from right edge
      const edgePage = startFromRight ? rightmostIdx : leftmostIdx;
      const edgeBtn = btnRefs.current[edgePage] ?? null;
      if (edgeBtn) {
        const eRect = edgeBtn.getBoundingClientRect();
        prev = { x: eRect.left - wRect.left, w: eRect.width };
      }
    }

    // derive edges
    const prevL = prev.x;
    const prevR = prev.x + prev.w;
    const nextL = target.x;
    const nextR = target.x + target.w;

    const movingRight = nextL >= prevL; // general direction

    // distance to travel (far edge)
    const farDist = movingRight ? Math.abs(nextR - prevR) : Math.abs(nextL - prevL);

    // map distance to durations and pulse scale
    const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
    // Phase timings pulled from theme motion tokens (distance-aware)
    const { stretch, settle } = theme.motion.underline;
    const stretchMs = Math.round(
      clamp(stretch.baseMs + farDist * stretch.distanceCoef, stretch.minMs, stretch.maxMs),
    );
    const settleMs = Math.round(
      clamp(settle.baseMs + farDist * settle.distanceCoef, settle.minMs, settle.maxMs),
    );
    // Phase 2 is 50% faster than before (previously 2x settleMs)
    const settleDur = settleMs; // 50% of old duration
    // removed trailing jiggle pulse entirely

    // Phase 1: stretch only the closer edge using fill scaling
    animatingRef.current = true;
    setIsAnimating(true);
    // run id guards all timers/frames in this effect so quick page changes don't
    // leak state updates from stale animations
    const runId = (animationRunIdRef.current += 1);
    const prevW = Math.max(1, prevR - prevL);
    const scaleFactor = movingRight
      ? Math.max(0.0001, (nextR - prevL) / prevW)
      : Math.max(0.0001, (prevR - nextL) / prevW);

    if (movingRight) {
      // Baseline first to ensure smooth compositor-start for scale
      setAnim({
        x: prevL,
        w: prevW,
        transX: '0ms',
        transW: '0ms',
        easeX: theme.motion.easing.linear,
        easeW: theme.motion.easing.linear,
        scale: 1,
        scaleTrans: '0ms',
        scaleEase: theme.motion.easing.linear,
        origin: 'left',
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      void wrapRef.current?.offsetWidth;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (animationRunIdRef.current !== runId) return;
          setAnim((a) => ({
            ...a,
            scale: scaleFactor,
            scaleTrans: `${stretchMs}ms`,
            // No overshoot: keep leading edge from "reverberating"
            scaleEase: theme.motion.easing.emphasized,
            origin: 'left',
          }));
        });
      });
    } else {
      setAnim({
        // keep container static in phase 1
        x: prevL,
        w: prevW,
        transX: '0ms',
        transW: '0ms',
        easeX: theme.motion.easing.linear,
        easeW: theme.motion.easing.linear,
        // scale the fill toward the near edge
        scale: scaleFactor,
        scaleTrans: `${stretchMs}ms`,
        // No overshoot: keep leading edge from "reverberating"
        scaleEase: theme.motion.easing.emphasized,
        origin: 'right',
      });
    }

    const phase2 = () => {
      if (animationRunIdRef.current !== runId) return;
      // Snap container to stretched geometry equivalent and reset fill scale instantly
      if (movingRight) {
        // geometry visually is [prevL, nextR]
        const stretchedW = Math.max(0, nextR - prevL);
        setAnim((a) => ({
          ...a,
          x: prevL,
          w: stretchedW,
          transX: '0ms',
          transW: '0ms',
          scale: 1,
          scaleTrans: '0ms',
          scaleEase: theme.motion.easing.linear,
          origin: 'right', // anchor right; shrink from right keeps right edge fixed
        }));

        // Animate far edge (left) using transform scale from the right origin for smoother motion
        const targetScale = stretchedW > 0 ? target.w / stretchedW : 1;
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        void wrapRef.current?.offsetWidth;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (animationRunIdRef.current !== runId) return;
            setAnim((a) => ({
              ...a,
              scale: targetScale,
              scaleTrans: `${settleDur}ms`,
              scaleEase: theme.motion.easing.standard,
              origin: 'right',
            }));
          });
        });
      } else {
        // geometry visually is [nextL, prevR]
        const stretchedW = Math.max(0, prevR - nextL);
        setAnim((a) => ({
          ...a,
          x: nextL,
          w: stretchedW,
          transX: '0ms',
          transW: '0ms',
          scale: 1,
          scaleTrans: '0ms',
          scaleEase: theme.motion.easing.linear,
          origin: 'left', // leading edge anchored (moving left)
        }));

        // Animate far edge (right) using transform scale from the left origin for smoother motion
        const targetScale = stretchedW > 0 ? target.w / stretchedW : 1;
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        void wrapRef.current?.offsetWidth;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (animationRunIdRef.current !== runId) return;
            setAnim((a) => ({
              ...a,
              scale: targetScale,
              scaleTrans: `${settleDur}ms`,
              scaleEase: theme.motion.easing.standard,
              origin: 'left',
            }));
          });
        });
      }

      // remember final target for next baseline after settle duration
      window.setTimeout(() => {
        if (animationRunIdRef.current !== runId) return;
        // Snap container to final geometry and reset scale instantly
        setAnim((a) => ({
          ...a,
          x: nextL,
          w: target.w,
          transX: '0ms',
          transW: '0ms',
          scale: 1,
          scaleTrans: '0ms',
          scaleEase: theme.motion.easing.linear,
          origin: movingRight ? 'right' : 'left',
        }));
        prevUxRef.current = { x: nextL, w: target.w };
        animatingRef.current = false;
        // finalize without any trailing jiggle
        setIsAnimating(false);
      }, settleDur + 10);
    };

    const timer = window.setTimeout(phase2, stretchMs + 24); // buffer so near edge fully lands

    // cleanup if rapid page changes
    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Track previous page to detect cross-window jumps
  React.useEffect(() => {
    prevPageRef.current = page;
    currentPageRef.current = page;
  }, [page]);

  // memo visible pages to avoid recomputing on unrelated state changes
  const visiblePages = React.useMemo(
    () => (hasWindow ? pages.slice(winStart - 1, winEnd) : pages),
    [hasWindow, pages, winEnd, winStart],
  );

  // stable handlers for nav controls and window scroll
  // Edge-step helpers (slide by one at window boundaries) ---------------------------------
  const edgeSlideRight = React.useCallback(
    (after?: () => void) => {
      if (!hasWindow || isAnimating || isSliding) return;
      // cannot step right if already at final window end
      if (winEnd >= count) return;
      const wrapRect = wrapRef.current?.getBoundingClientRect();
      const wrapWidth = wrapRect?.width ?? 0;
      const wrapHeight = wrapRect?.height ?? undefined;
      // width of the leftmost visible page (element that slides out)
      const leftBtn = btnRefs.current[winStart] as HTMLButtonElement | null;
      let delta = leftBtn?.getBoundingClientRect().width ?? 0;
      if (!delta && wrapWidth && winSize) delta = wrapWidth / winSize;

      const currentPages = hasWindow ? pages.slice(winStart - 1, winEnd) : pages;
      const incoming = winEnd + 1;

      // Lock viewport to current size; mount [current | incoming]
      setViewportW(wrapWidth);
      setViewportH(wrapHeight);
      setGroupA(currentPages);
      setGroupB([incoming]);
      setIsSliding(true);
      setSlideKind('edge-right');
      setSlideX(0);
      // Animate left by the width of the first visible button
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSlideX(-Math.round(delta));
          window.setTimeout(() => {
            // Logically advance window by one
            setWinStart((s) => s + 1);
            requestAnimationFrame(() => {
              setIsSliding(false);
              setSlideKind('none');
              requestAnimationFrame(() => {
                updateUnderline();
                setGroupA(null);
                setGroupB(null);
                setViewportW(undefined);
                setViewportH(undefined);
                setSlideX(0);
                after?.();
              });
            });
          }, slideDurMs + 20);
        });
      });
    },
    [
      hasWindow,
      isAnimating,
      isSliding,
      winEnd,
      count,
      winStart,
      winSize,
      pages,
      slideDurMs,
      updateUnderline,
    ],
  );

  const edgeSlideLeft = React.useCallback(
    (after?: () => void) => {
      if (!hasWindow || isAnimating || isSliding) return;
      if (winStart <= 1) return;
      const prevStart = winStart - 1;
      const currentPages = hasWindow ? pages.slice(winStart - 1, winEnd) : pages;
      const nextPages = [prevStart]; // incoming single page on the left
      const wrapRect = wrapRef.current?.getBoundingClientRect();
      const wrapWidth = wrapRect?.width ?? 0;
      const wrapHeight = wrapRect?.height ?? undefined;
      // Lock viewport; we'll enter sliding mode after we measure to avoid a blank frame
      setViewportW(wrapWidth);
      setViewportH(wrapHeight);
      underlineLockRef.current = true; // keep underline pinned throughout
      // measure width of incoming single page, then perform left-slide from -width to 0
      pendingSlideRef.current = {
        dir: 'left',
        nextStart: prevStart,
        prevStart: winStart,
        currentPages,
        nextPages,
        after,
      };
      setSlideKind('edge-left');
      setMeasureSet(nextPages);
    },
    [hasWindow, isAnimating, isSliding, winStart, pages, winEnd],
  );

  // Intra-window nudge slide used for arrow navigation when window doesn't change
  const nudgeSlide = React.useCallback(
    (dir: 'left' | 'right', after: () => void) => {
      if (isAnimating || isSliding) return;
      const wrapRect = wrapRef.current?.getBoundingClientRect();
      const wrapWidth = wrapRect?.width ?? 0;
      const wrapHeight = wrapRect?.height ?? undefined;
      // measure width of the button that determines our nudge distance
      const activeBtn = btnRefs.current[page] as HTMLButtonElement | null;
      const neighbor = btnRefs.current[
        dir === 'right' ? page + 1 : page - 1
      ] as HTMLButtonElement | null;
      // Prefer neighbor width; fallback to active
      let delta =
        neighbor?.getBoundingClientRect().width ?? activeBtn?.getBoundingClientRect().width ?? 0;
      if (!delta && wrapWidth && winSize) delta = wrapWidth / winSize;

      // Lock the viewport and slide the existing set without changing window
      setViewportW(wrapWidth);
      setViewportH(wrapHeight);
      setGroupA(visiblePages);
      setGroupB([]);
      setUnderlineFadeInstant(true);
      setUnderlineVisible(false);
      setIsSliding(true);
      setSlideKind(dir === 'right' ? 'intra-right' : 'intra-left');
      setSlideX(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSlideX(dir === 'right' ? -Math.round(delta) : Math.round(delta));
          window.setTimeout(() => {
            // After slide completes, trigger the logical page change and snap back to base
            suppressNextUnderlineAnim.current = true;
            after();
            requestAnimationFrame(() => {
              setIsSliding(false);
              setSlideKind('none');
              requestAnimationFrame(() => {
                updateUnderline();
                setGroupA(null);
                setGroupB(null);
                setViewportW(undefined);
                setViewportH(undefined);
                setSlideX(0);
              });
            });
          }, slideDurMs + 20);
        });
      });
    },
    [isAnimating, isSliding, page, visiblePages, winSize, slideDurMs, updateUnderline],
  );

  const handlePrev = React.useCallback(() => {
    if (page <= 1) return;
    if (hasWindow) {
      if (winStart > 1) {
        // Slide window left by one regardless of active position
        edgeSlideLeft(() => {
          suppressNextUnderlineAnim.current = true;
          onChange?.(Math.max(1, page - 1));
        });
        return;
      }
      // At absolute left boundary; no hidden pages to the left → use manual click animation
      onChange?.(Math.max(1, page - 1));
      return;
    }
    onChange?.(Math.max(1, page - 1));
  }, [onChange, page, hasWindow, winStart, edgeSlideLeft, nudgeSlide]);

  const handleNext = React.useCallback(() => {
    if (page >= count) return;
    if (hasWindow) {
      if (winEnd < count) {
        // Slide window right by one regardless of active position
        edgeSlideRight(() => {
          suppressNextUnderlineAnim.current = true;
          onChange?.(Math.min(count, page + 1));
        });
        return;
      }
      // At absolute right boundary; no hidden pages to the right → manual click animation
      onChange?.(Math.min(count, page + 1));
      return;
    }
    onChange?.(Math.min(count, page + 1));
  }, [onChange, page, count, hasWindow, winEnd, edgeSlideRight, nudgeSlide]);

  const scrollLeft = React.useCallback(() => {
    if (isAnimating || isSliding) return;
    setUnderlineFadeInstant(true);
    setUnderlineVisible(false);
    setIsSliding(true);
    setSlideKind('window-left');
    const prevStart = Math.max(1, winStart - winSize);
    if (prevStart === winStart) {
      setIsSliding(false);
      setSlideKind('none');
      return;
    }
    const currentPages = visiblePages;
    const nextPages = hasWindow ? pages.slice(prevStart - 1, prevStart - 1 + winSize) : pages;
    const wrapRect = wrapRef.current?.getBoundingClientRect();
    const wrapWidth = wrapRect?.width ?? 0;
    const wrapHeight = wrapRect?.height ?? undefined;
    setViewportW(wrapWidth);
    setViewportH(wrapHeight);
    // measure width of the previous window to establish initial offset
    pendingSlideRef.current = {
      dir: 'left',
      nextStart: prevStart,
      prevStart: winStart,
      currentPages,
      nextPages,
    };
    setMeasureSet(nextPages);
  }, [hasWindow, isAnimating, isSliding, pages, visiblePages, winSize, winStart]);

  const scrollRight = React.useCallback(() => {
    if (isAnimating || isSliding) return;
    setUnderlineFadeInstant(true);
    setUnderlineVisible(false);
    setIsSliding(true);
    setSlideKind('window-right');
    const maxStart = Math.max(1, count - winSize + 1);
    const nextStart = Math.min(maxStart, winStart + winSize);
    if (nextStart === winStart) {
      setIsSliding(false);
      setSlideKind('none');
      return;
    }
    const currentPages = visiblePages;
    const nextPages = hasWindow ? pages.slice(nextStart - 1, nextStart - 1 + winSize) : pages;
    const wrapRect = wrapRef.current?.getBoundingClientRect();
    const wrapWidth = wrapRect?.width ?? 0;
    const wrapHeight = wrapRect?.height ?? undefined;
    setViewportW(wrapWidth);
    setViewportH(wrapHeight);
    // Arrange [current | next], animate X from 0 to -wrapWidth
    setGroupA(currentPages);
    setGroupB(nextPages);
    setSlideX(0);
    // ensure layout applied before animating
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSlideX(-wrapWidth);
        window.setTimeout(() => {
          // Update logical window, keep groups mounted until we flip isSliding
          setWinStart(nextStart);
          // First frame after animation: switch to static track content
          requestAnimationFrame(() => {
            setIsSliding(false);
            setSlideKind('none');
            // Next frame: measure underline and then clear temp groups/viewport locks
            requestAnimationFrame(() => {
              updateUnderline();
              // Reveal underline only if active page is visible in this window
              const willShow =
                page >= nextStart && page <= Math.min(count, nextStart + winSize - 1);
              setUnderlineVisible(willShow);
              // Reset slide position for next interaction (no visual effect when idle)
              setSlideX(0);
              setGroupA(null);
              setGroupB(null);
              setViewportW(undefined);
              setViewportH(undefined);
            });
          });
        }, slideDurMs + 20);
      });
    });
  }, [
    count,
    hasWindow,
    isAnimating,
    isSliding,
    pages,
    slideDurMs,
    visiblePages,
    winSize,
    winStart,
    updateUnderline,
    page,
  ]);

  // When measuring a hidden group completes, kick off a left-slide
  React.useLayoutEffect(() => {
    if (!measureSet || !measureRef.current || !pendingSlideRef.current) return;
    const widthPrev = measureRef.current.getBoundingClientRect().width;
    const req = pendingSlideRef.current;
    pendingSlideRef.current = null;
    setMeasureSet(null);
    // Arrange [prev | current], start with X = -prevWidth (current visible), animate to 0
    setIsSliding(true); // enter sliding mode with groups ready to render
    setGroupA(req.nextPages);
    setGroupB(req.currentPages);
    setSlideX(-widthPrev);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSlideX(0);
        window.setTimeout(() => {
          // Update logical window, keep groups until flip
          setWinStart(req.nextStart);
          setSlideX(0);
          // First frame: exit sliding mode
          requestAnimationFrame(() => {
            setIsSliding(false);
            setSlideKind('none');
            // Next frame: trigger after-callback first to set suppression flag
            // and allow the parent to update `page`; then, a frame later,
            // snap underline to the new leftmost active page (0ms) while locked.
            requestAnimationFrame(() => {
              req.after?.();
              requestAnimationFrame(() => {
                if (req.dir === 'left') {
                  const wrap = wrapRef.current;
                  const newPage = currentPageRef.current;
                  const btn = btnRefs.current[newPage] ?? null;
                  if (wrap && btn) {
                    const wRect = wrap.getBoundingClientRect();
                    const bRect = btn.getBoundingClientRect();
                    const targetX = bRect.left - wRect.left;
                    const targetW = bRect.width;
                    setAnim((a) => ({
                      ...a,
                      x: targetX,
                      w: targetW,
                      transX: '0ms',
                      transW: '0ms',
                      easeX: theme.motion.easing.linear,
                      easeW: theme.motion.easing.linear,
                      scale: 1,
                      scaleTrans: '0ms',
                      scaleEase: theme.motion.easing.linear,
                      origin: 'center',
                    }));
                    prevUxRef.current = { x: targetX, w: targetW };
                  }
                  underlineLockRef.current = false; // unlock after we pin to new page
                } else {
                  updateUnderline();
                }
                // Do not change underline visibility for edge-left; keep it steady
                setGroupA(null);
                setGroupB(null);
                setViewportW(undefined);
                setViewportH(undefined);
              });
            });
          });
        }, slideDurMs + 20);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureSet, updateUnderline, page, winSize, count]);

  // Keep a stable ref callback per page index to avoid recreating closures
  const refCache = React.useRef(new Map<number, (el: HTMLButtonElement | null) => void>());
  const getBtnRef = React.useCallback((n: number) => {
    const cache = refCache.current;
    const hit = cache.get(n);
    if (hit) return hit;
    const fn = (el: HTMLButtonElement | null) => {
      btnRefs.current[n] = el;
    };
    cache.set(n, fn);
    return fn;
  }, []);

  return (
    <Root
      {...rest}
      aria-label='pagination'
      $text={theme.colors.text}
      $gap={theme.spacing(1)}
      $padV={theme.spacing(1)}
      $padH={theme.spacing(1.5)}
      $durColor={theme.motion.duration.medium}
      $durOpacity={theme.motion.duration.base}
      $ease={theme.motion.easing.standard}
      className={mergedClass}
      style={
        {
          '--valet-underline-width': theme.stroke(4),
          ...(sx as object),
        } as React.CSSProperties
      }
    >
      {/* Outside: window scroll left (moves whole window) */}
      {hasWindow && (
        <button
          aria-label='Scroll pages left'
          onClick={scrollLeft}
          disabled={winStart <= 1 || isAnimating}
        >
          «
        </button>
      )}

      {/* Inside: single-step previous page (icon) */}
      <button
        aria-label='Previous page'
        onClick={handlePrev}
        disabled={page === 1 || isAnimating || isSliding}
      >
        ‹
      </button>

      {/* Page numbers – now rendered inside a sliding viewport/track */}
      <PagesWrap ref={wrapRef}>
        {/* Hidden measurer for computing group width without flashing */}
        {measureSet && (
          <HiddenMeasure ref={measureRef}>
            {measureSet.map((n) => (
              <PageBtn
                key={`m-${n}`}
                ref={getBtnRef(n)}
                data-page={n}
                onClick={handlePageClick}
                disabled
                $active={n === page}
                $primary={theme.colors.primary}
                $text={theme.colors.text}
                $durColor={theme.motion.duration.medium}
                $durOpacity={theme.motion.duration.base}
                $ease={theme.motion.easing.standard}
                aria-hidden
              >
                <Typography
                  variant='button'
                  family='mono'
                  whitespace='pre'
                  noSelect
                  bold={n === page}
                >
                  {n}
                </Typography>
              </PageBtn>
            ))}
          </HiddenMeasure>
        )}

        <PagesViewport
          $width={viewportW}
          $height={viewportH}
        >
          <PagesTrack
            ref={trackRef}
            $x={isSliding ? slideX : 0}
            $dur={isSliding ? `${slideDurMs}ms` : '0ms'}
            $ease={slideEase}
          >
            {isSliding
              ? [
                  ...(groupA || []).map((n) => (
                    <PageBtn
                      key={`a-${n}`}
                      ref={getBtnRef(n)}
                      data-page={n}
                      onClick={handlePageClick}
                      disabled
                      $active={n === page}
                      $primary={theme.colors.primary}
                      $text={theme.colors.text}
                      $durColor={theme.motion.duration.medium}
                      $durOpacity={theme.motion.duration.base}
                      $ease={theme.motion.easing.standard}
                      aria-hidden
                    >
                      <Typography
                        variant='button'
                        family='mono'
                        whitespace='pre'
                        noSelect
                        bold={n === page}
                      >
                        {n}
                      </Typography>
                    </PageBtn>
                  )),
                  ...(groupB || []).map((n) => (
                    <PageBtn
                      key={`b-${n}`}
                      ref={getBtnRef(n)}
                      data-page={n}
                      onClick={handlePageClick}
                      disabled
                      $active={n === page}
                      $primary={theme.colors.primary}
                      $text={theme.colors.text}
                      $durColor={theme.motion.duration.medium}
                      $durOpacity={theme.motion.duration.base}
                      $ease={theme.motion.easing.standard}
                      aria-hidden
                    >
                      <Typography
                        variant='button'
                        family='mono'
                        whitespace='pre'
                        noSelect
                        bold={n === page}
                      >
                        {n}
                      </Typography>
                    </PageBtn>
                  )),
                ]
              : visiblePages.map((n) => (
                  <PageBtn
                    key={n}
                    ref={getBtnRef(n)}
                    data-page={n}
                    onClick={handlePageClick}
                    disabled={isAnimating || isSliding}
                    $active={n === page}
                    $primary={theme.colors.primary}
                    $text={theme.colors.text}
                    $durColor={theme.motion.duration.medium}
                    $durOpacity={theme.motion.duration.base}
                    $ease={theme.motion.easing.standard}
                    aria-current={n === page ? 'page' : undefined}
                  >
                    <Typography
                      variant='button'
                      family='mono'
                      whitespace='pre'
                      noSelect
                      bold={n === page}
                    >
                      {n}
                    </Typography>
                  </PageBtn>
                ))}
          </PagesTrack>
        </PagesViewport>

        {/* Underline slider – always mounted, visibility faded to avoid flicker */}
        <Underline
          aria-hidden
          $x={anim.x}
          $w={anim.w}
          $height={theme.stroke(4)}
          $transX={anim.transX}
          $transW={anim.transW}
          $easeX={anim.easeX}
          $easeW={anim.easeW}
          $opacity={underlineVisible ? 1 : 0}
          $fadeDur={underlineFadeInstant ? '0ms' : theme.motion.duration.medium}
          $fadeEase={theme.motion.easing.standard}
        >
          <UnderlineFill
            key={`pulse-${page}`}
            $color={theme.colors.primary}
            $scale={anim.scale}
            $scaleTrans={anim.scaleTrans}
            $scaleEase={anim.scaleEase}
            $origin={anim.origin}
          />
        </Underline>
      </PagesWrap>

      {/* Inside: single-step next page (icon) */}
      <button
        aria-label='Next page'
        onClick={handleNext}
        disabled={page === count || isAnimating || isSliding}
      >
        ›
      </button>

      {/* Outside: window scroll right (moves whole window) */}
      {hasWindow && (
        <button
          aria-label='Scroll pages right'
          onClick={scrollRight}
          disabled={winEnd >= count || isAnimating || isSliding}
        >
          »
        </button>
      )}
    </Root>
  );
};

export default Pagination;

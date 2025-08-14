// ─────────────────────────────────────────────────────────────
// src/components/widgets/Pagination.tsx  | valet
// Tab-style pagination with stretch-follow elastic underline for active page
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled, keyframes } from '../../css/createStyled';
import Typography from '../primitives/Typography';
import { preset } from '../../css/stylePresets';
import { useTheme } from '../../system/themeStore';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Public props                                              */
export interface PaginationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'>,
    Presettable {
  /** Total number of pages (≥ 1). */
  count: number;
  /** Currently-selected page (1-based). */
  page?: number;
  /** Called with **new page** when user clicks. */
  onChange?: (page: number) => void;
}

/*───────────────────────────────────────────────────────────*/
/* Layout wrapper                                            */
const Root = styled('nav')<{ $text: string; $gap: string; $padV: string; $padH: string }>`
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
}>`
  position: relative;
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  color: ${({ $active, $primary, $text }) => ($active ? $primary : $text)};

  /* previous underline pseudo-element replaced by shared slider */
`;

/* Pages wrapper (relative for underline positioning) */
const PagesWrap = styled('div')`
  position: relative;
  display: inline-flex;
`;

/* Underline rail that slides under the active page */
const Underline = styled('div')<{
  $height: string;
  $radius: string;
  $color: string;
  $x: number;
  $w: number;
  $transX: string;
  $transW: string;
  $easeX: string;
  $easeW: string;
  $pulseAmp: number;
}>`
  position: absolute;
  left: 0;
  bottom: calc(-0.5 * var(--valet-underline-width, 2px));
  height: ${({ $height }) => $height};
  width: ${({ $w }) => `${Math.max(0, Math.round($w))}px`};
  transform: ${({ $x }) => `translateX(${Math.round($x)}px)`};
  transition:
    transform ${({ $transX }) => $transX} ${({ $easeX }) => $easeX},
    width ${({ $transW }) => $transW} ${({ $easeW }) => $easeW};
  will-change: transform, width;
  pointer-events: none;
  overflow: visible;
  /* visual */
  background: transparent; /* actual colour on the fill */
  /* expose pulse amplitude to children */
  --valet-pulse-amp: ${({ $pulseAmp }) => $pulseAmp};
`;

/* Subtle elastic pulse width using amplitude var --valet-pulse-amp */
const elasticPulse = keyframes`
  0% { transform: scaleX(1); }
  45% { transform: scaleX(calc(1 + var(--valet-pulse-amp, 0.06))); }
  70% { transform: scaleX(calc(1 - (var(--valet-pulse-amp, 0.06) * 0.55))); }
  100% { transform: scaleX(1); }
`;

const UnderlineFill = styled('div')<{
  $radius: string;
  $color: string;
  $scale: number;
  $scaleTrans: string;
  $scaleEase: string;
  $origin: 'left' | 'right' | 'center';
}>`
  width: 100%;
  height: 100%;
  background: ${({ $color }) => $color};
  border-radius: ${({ $radius }) => `${$radius} ${$radius} 0 0`};
  transform-origin: ${({ $origin }) => $origin} center;
  transform: ${({ $scale }) => `scaleX(${Number.isFinite($scale) ? $scale : 1})`};
  transition: transform ${({ $scaleTrans }) => $scaleTrans} ${({ $scaleEase }) => $scaleEase};
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const Pagination: React.FC<PaginationProps> = ({
  count,
  page = 1,
  onChange,
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const pages = Array.from({ length: count }, (_, i) => i + 1);

  /* preset → utility class merge */
  const presetClass = p ? preset(p) : '';
  const mergedClass = [presetClass, className].filter(Boolean).join(' ') || undefined;

  const nav = (p: number) => () => onChange?.(p);

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
    easeX: 'linear',
    easeW: 'linear',
    pulseAmp: 0.06,
    scale: 1,
    scaleTrans: '0ms',
    scaleEase: 'linear',
    origin: 'center' as 'left' | 'right' | 'center',
    pulsing: false,
  });
  const animatingRef = React.useRef(false);

  const updateUnderline = React.useCallback(() => {
    const wrap = wrapRef.current;
    const btn = btnRefs.current[page] ?? null; // indexed by page number
    if (!wrap || !btn) return;
    const wRect = wrap.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    setUx({ x: bRect.left - wRect.left, w: bRect.width });
  }, [page]);

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

  // Keep anim state in sync on mount and when measurements change without a page change
  React.useLayoutEffect(() => {
    // On first measurement, snap anim to ux
    setAnim((a) => ({ ...a, x: ux.x, w: ux.w }));
    prevUxRef.current = { x: ux.x, w: ux.w };
  }, []);

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
    const prev = prevUxRef.current ?? { x: anim.x, w: anim.w };

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
    const stretchMs = Math.round(clamp(150 + farDist * 0.6, 180, 520));
    const settleMs = Math.round(clamp(120 + farDist * 0.45, 140, 420));
    // keep pulse subtle: amplitude ~2%..8%
    const pulseAmp = clamp(0.03 + farDist / 2000, 0.02, 0.08);

    // Phase 1: stretch only the closer edge using fill scaling
    animatingRef.current = true;
    const prevW = Math.max(1, prevR - prevL);
    const scaleFactor = movingRight
      ? Math.max(0.0001, (nextR - prevL) / prevW)
      : Math.max(0.0001, (prevR - nextL) / prevW);

    setAnim({
      // keep container static in phase 1
      x: prevL,
      w: prevW,
      transX: '0ms',
      transW: '0ms',
      easeX: 'linear',
      easeW: 'linear',
      pulseAmp,
      // scale the fill toward the near edge
      scale: scaleFactor,
      scaleTrans: `${stretchMs}ms`,
      scaleEase: 'cubic-bezier(0.2, 0.8, 0.2, 1.1)',
      origin: movingRight ? 'left' : 'right',
      pulsing: false,
    });

    const phase2 = () => {
      // Snap container to stretched geometry equivalent and reset fill scale instantly
      if (movingRight) {
        // geometry visually is [prevL, nextR]
        setAnim((a) => ({
          ...a,
          x: prevL,
          w: Math.max(0, nextR - prevL),
          transX: '0ms',
          transW: '0ms',
          scale: 1,
          scaleTrans: '0ms',
          scaleEase: 'linear',
          origin: 'center',
        }));

        // Animate far edge (left) to nextL while right stays fixed
        requestAnimationFrame(() => {
          setAnim((a) => ({
            ...a,
            x: nextL,
            w: target.w,
            transX: `${settleMs}ms`,
            transW: `${settleMs}ms`,
            easeX: 'cubic-bezier(0.2, 0.7, 0.1, 1)',
            easeW: 'cubic-bezier(0.2, 0.7, 0.1, 1)',
          }));
        });
      } else {
        // geometry visually is [nextL, prevR]
        setAnim((a) => ({
          ...a,
          x: nextL,
          w: Math.max(0, prevR - nextL),
          transX: '0ms',
          transW: '0ms',
          scale: 1,
          scaleTrans: '0ms',
          scaleEase: 'linear',
          origin: 'center',
        }));

        // Animate far edge (right) to nextR by changing width only
        requestAnimationFrame(() => {
          setAnim((a) => ({
            ...a,
            w: target.w,
            transX: '0ms',
            transW: `${settleMs}ms`,
            easeX: 'linear',
            easeW: 'cubic-bezier(0.2, 0.7, 0.1, 1)',
          }));
        });
      }

      // remember final target for next baseline after settle duration
      window.setTimeout(() => {
        prevUxRef.current = { x: nextL, w: target.w };
        animatingRef.current = false;
        // trigger subtle pulse only on the trailing edge: set origin to leading edge
        setAnim((a) => ({ ...a, origin: movingRight ? 'right' : 'left', pulsing: true }));
        window.setTimeout(() => setAnim((a) => ({ ...a, pulsing: false })), 320);
      }, settleMs + 10);
    };

    const timer = window.setTimeout(phase2, stretchMs + 24); // buffer so near edge fully lands

    // cleanup if rapid page changes
    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <Root
      {...rest}
      aria-label='pagination'
      $text={theme.colors.text}
      $gap={theme.spacing(1)}
      $padV={theme.spacing(1)}
      $padH={theme.spacing(1.5)}
      className={mergedClass}
      style={
        {
          '--valet-underline-width': theme.stroke(4),
          '--valet-underline-radius': theme.radius(0.5),
          ...(style as object),
        } as React.CSSProperties
      }
    >
      {/* Prev/Next – simple text buttons (no underline) */}
      <button
        onClick={nav(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Prev
      </button>

      {/* Page numbers – tab-style with shared sliding underline */}
      <PagesWrap ref={wrapRef}>
        {pages.map((n) => (
          <PageBtn
            key={n}
            ref={(el) => {
              btnRefs.current[n] = el;
            }}
            onClick={nav(n)}
            $active={n === page}
            $primary={theme.colors.primary}
            $text={theme.colors.text}
            aria-current={n === page ? 'page' : undefined}
          >
            <Typography
              variant='button'
              family='mono'
              noSelect
              bold={n === page}
            >
              {n}
            </Typography>
          </PageBtn>
        ))}

        {/* Underline slider */}
        <Underline
          aria-hidden
          $x={anim.x}
          $w={anim.w}
          $height={theme.stroke(4)}
          $radius={theme.radius(0.5)}
          $color={theme.colors.primary}
          $transX={anim.transX}
          $transW={anim.transW}
          $easeX={anim.easeX}
          $easeW={anim.easeW}
          $pulseAmp={anim.pulseAmp}
        >
          {/* remount on page change to replay pulse */}
          <UnderlineFill
            key={`pulse-${page}`}
            $radius={theme.radius(0.5)}
            $color={theme.colors.primary}
            $scale={anim.scale}
            $scaleTrans={anim.scaleTrans}
            $scaleEase={anim.scaleEase}
            $origin={anim.origin}
            style={{
              animationName: anim.pulsing ? elasticPulse : 'none',
              animationDuration: '360ms',
              animationTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1.05)',
            }}
          />
        </Underline>
      </PagesWrap>

      <button
        onClick={nav(Math.min(count, page + 1))}
        disabled={page === count}
      >
        Next
      </button>
    </Root>
  );
};

export default Pagination;

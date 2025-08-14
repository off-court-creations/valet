// ─────────────────────────────────────────────────────────────
// src/components/widgets/Pagination.tsx  | valet
// Tab-style pagination with stretch-and-snap underline for active page
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
}>`
  position: absolute;
  left: 0;
  bottom: calc(-0.5 * var(--valet-underline-width, 2px));
  height: ${({ $height }) => $height};
  width: ${({ $w }) => `${Math.max(0, Math.round($w))}px`};
  transform: ${({ $x }) => `translateX(${Math.round($x)}px)`};
  transition:
    transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1),
    width 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform, width;
  pointer-events: none;
  overflow: visible;

  /* visual */
  background: transparent; /* actual colour on the fill */
`;

/* Elastic pulse on underline width via child to avoid transform clobber */
const elasticPulse = keyframes`
  0% { transform: scaleX(1); }
  50% { transform: scaleX(1.3); }
  70% { transform: scaleX(0.9); }
  100% { transform: scaleX(1); }
`;

const UnderlineFill = styled('div')<{
  $radius: string;
  $color: string;
}>`
  width: 100%;
  height: 100%;
  background: ${({ $color }) => $color};
  border-radius: ${({ $radius }) => `${$radius} ${$radius} 0 0`};
  transform-origin: center;
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
  const prevRef = React.useRef({ page, x: 0, w: 0 });
  const timerRef = React.useRef<number | undefined>(undefined);

  const measure = React.useCallback((p: number) => {
    const wrap = wrapRef.current;
    const btn = btnRefs.current[p] ?? null;
    if (!wrap || !btn) return null;
    const wRect = wrap.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    return { x: bRect.left - wRect.left, w: bRect.width };
  }, []);

  React.useLayoutEffect(() => {
    const target = measure(page);
    if (!target) return;
    const prev = prevRef.current;

    // skip animation on first render or when page unchanged
    if (prev.page === page) {
      setUx(target);
      prevRef.current = { page, ...target };
      return;
    }

    const rightPrev = prev.x + prev.w;
    const rightTarget = target.x + target.w;

    if (page > prev.page) {
      // moving right: stretch towards new right edge
      setUx({ x: prev.x, w: rightTarget - prev.x });
    } else {
      // moving left: stretch towards new left edge
      setUx({ x: target.x, w: rightPrev - target.x });
    }

    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setUx(target);
      prevRef.current = { page, ...target };
    }, 260);
  }, [page, measure]);

  React.useLayoutEffect(() => {
    const target = measure(page);
    if (!target) return;
    setUx(target);
    prevRef.current = { page, ...target };
  }, [count, measure, page]);

  React.useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      const target = measure(page);
      if (!target) return;
      setUx(target);
      prevRef.current = { page, ...target };
    });
    if (wrapRef.current) ro.observe(wrapRef.current);
    const handler = () => {
      const target = measure(page);
      if (!target) return;
      setUx(target);
      prevRef.current = { page, ...target };
    };
    window.addEventListener('resize', handler, { passive: true } as AddEventListenerOptions);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handler as EventListener);
    };
  }, [measure, page]);

  React.useEffect(() => () => window.clearTimeout(timerRef.current), []);

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
          $x={ux.x}
          $w={ux.w}
          $height={theme.stroke(4)}
          $radius={theme.radius(0.5)}
          $color={theme.colors.primary}
        >
          {/* remount on page change to replay pulse */}
          <UnderlineFill
            key={`pulse-${page}`}
            $radius={theme.radius(0.5)}
            $color={theme.colors.primary}
            style={{
              animationName: elasticPulse,
              animationDuration: '360ms',
              animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
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

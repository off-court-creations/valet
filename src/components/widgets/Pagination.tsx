// ─────────────────────────────────────────────────────────────
// src/components/widgets/Pagination.tsx  | valet
// Tab-style pagination with sliding elastic underline for active page
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
    transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
    width 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform, width;
  pointer-events: none;
  overflow: visible;

  /* visual */
  background: transparent; /* actual colour on the fill */
`;

/* Elastic pulse on underline width via child to avoid transform clobber */
const elasticPulse = keyframes`
  0% { transform: scaleX(1); }
  45% { transform: scaleX(1.5); }
  65% { transform: scaleX(0.75); }
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
              animationTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
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

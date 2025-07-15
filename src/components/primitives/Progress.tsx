// ─────────────────────────────────────────────────────────────
// src/components/primitives/Progress.tsx  | valet
// strict‑optional clean build
// ─────────────────────────────────────────────────────────────
import React, { forwardRef } from 'react';
import { styled, keyframes }           from '../../css/createStyled';
import { useTheme }                    from '../../system/themeStore';
import { preset }                      from '../../css/stylePresets';
import type { Presettable }            from '../../types';
import type { Theme }                  from '../../system/themeStore';

/*───────────────────────────────────────────────────────────*/
/* Public API                                                */
export type ProgressVariant = 'linear' | 'circular';
export type ProgressMode    = 'determinate' | 'indeterminate' | 'buffer';
export type ProgressSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    Presettable {
  /** Linear (default) or Circular. */
  variant?: ProgressVariant;
  /** determinate (default), indeterminate, or (linear-only) buffer. */
  mode?: ProgressMode;
  /** 0 – 100 value for determinate / buffer foreground. */
  value?: number;
  /** 0 – 100 secondary/buffer value (linear‑buffer only). */
  buffer?: number;
  /** xs – xl token or custom CSS size */
  size?: ProgressSize | number | string;
  /** Show numeric % inside Circular centre. */
  showLabel?: boolean;
  /** Colour override (defaults to theme.primary). */
  color?: string | undefined;
}

/*───────────────────────────────────────────────────────────*/
/* Size tokens, strongly typed                               */
interface CircularToken { box: string; stroke: string }
interface LinearToken   { h: string }

type Tokens = {
  circular: Record<ProgressSize, CircularToken>;
  linear  : Record<ProgressSize, LinearToken>;
};

const geom = (_t: Theme): Tokens => ({
  circular: {
    xs: { box: '0.75rem', stroke: '0.09375rem' },
    sm: { box: '1.5rem',  stroke: '0.1875rem'  },
    md: { box: '2.25rem', stroke: '0.25rem'    },
    lg: { box: '3rem',    stroke: '0.375rem'   },
    xl: { box: '3.75rem', stroke: '0.46875rem' },
  },
  linear: {
    xs: { h: '0.125rem'  },
    sm: { h: '0.25rem'   },
    md: { h: '0.375rem'  },
    lg: { h: '0.5rem'    },
    xl: { h: '0.625rem'  },
  },
});

const toPx = (val: string): number =>
  val.endsWith('rem')
    ? parseFloat(val) * 16
    : val.endsWith('px')
      ? parseFloat(val)
      : parseFloat(val);

/*───────────────────────────────────────────────────────────*/
/* Indeterminate keyframes                                   */
const rotate360 = keyframes`
  100% { transform: rotate(360deg); }
`;
const dash = keyframes`
  0%   { stroke-dasharray: 1, 150; stroke-dashoffset: 0;   }
  50%  { stroke-dasharray: 90,150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90,150; stroke-dashoffset: -124;}
`;
const indetBar1 = keyframes`
  0%   { left: -35%; right: 100%; }
  60%  { left: 100%; right: -90%; }
  100% { left: 100%; right: -90%; }
`;
const indetBar2 = keyframes`
  0%   { left: -200%; right: 100%; }
  60%  { left: 107%;  right: -8%;  }
  100% { left: 107%;  right: -8%;  }
`;

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Root = styled('div')`
  display: inline-block;
  position: relative;
  vertical-align: middle;
`;

// ─── Circular ─────────────────────────────────────────────
const CircleWrap = styled('div')<{ $d: string }>`
  width: ${({ $d }) => $d};
  height: ${({ $d }) => $d};
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

/* label inside circle */
const CenterLabel = styled('span')<{ $font: string }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font: ${({ $font }) => $font};
  color: var(--valet-text-color, currentColor);
  user-select: none;
  pointer-events: none;
`;

// ─── Linear ───────────────────────────────────────────────
const Track = styled('div')<{ $h: string }>`
  width: 100%;
  height: ${({ $h }) => $h};
  background: #0003;
  border-radius: 9999px;
  overflow: hidden;
  position: relative;
`;

const Bar = styled('div')<{
  $color: string;
  $indet?: boolean;
  $index?: 1 | 2;
}>`
  position: absolute;
  top: 0;
  bottom: 0;
  background: ${({ $color }) => $color};
  transition: width 0.2s linear;
  ${({ $indet, $index }) =>
    $indet &&
    ($index === 1
      ? `animation: ${indetBar1} 2.1s infinite ease-out;`
      : `animation: ${indetBar2} 2.1s infinite ease-in;`)}
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      variant    = 'linear',
      mode       = 'determinate',
      value      = 0,
      buffer     = 0,
      size       = 'md',
      showLabel  = false,
      color,
      preset: p,
      className,
      style,
      ...divProps
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const tokens    = geom(theme);
    const primary   = (color ?? theme.colors.primary) as string;

    /* preset → classes merge */
    const presetCls = p ? preset(p) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

    /* accessibility roles / ARIA values */
    const ariaProps =
      mode === 'indeterminate'
        ? { role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100 }
        : {
            role: 'progressbar',
            'aria-valuemin': 0,
            'aria-valuemax': 100,
            'aria-valuenow': Math.round(value),
          };

    /*─────────────────────────────────────────────────────────*/
    /* CIRCULAR                                                */
    /*─────────────────────────────────────────────────────────*/
    if (variant === 'circular') {
      let box: string;
      let stroke: string;

      if (typeof size === 'number') {
        box = `${size}px`;
        stroke = `calc(${box} / 8)`;
      } else if (tokens.circular[size as ProgressSize]) {
        ({ box, stroke } = tokens.circular[size as ProgressSize]);
      } else {
        box = size as string;
        stroke = `calc(${box} / 8)`;
      }

      const boxPx =
        typeof size === 'number'
          ? size
          : tokens.circular[size as ProgressSize]
            ? toPx(tokens.circular[size as ProgressSize].box)
            : toPx(size as string);
      const strokePx =
        typeof size === 'number'
          ? boxPx / 8
          : tokens.circular[size as ProgressSize]
            ? toPx(tokens.circular[size as ProgressSize].stroke)
            : boxPx / 8;

      const radius = (boxPx - strokePx) / 2;
      const circ   = 2 * Math.PI * radius;
      const offset = ((100 - value) / 100) * circ;

      const svgProps =
        mode === 'indeterminate'
          ? { style: { animation: `${rotate360} 1.5s linear infinite` } }
          : {};

      const circleProps =
        mode === 'indeterminate'
          ? {
              style: {
                strokeDasharray: '80,200',
                strokeDashoffset: 0,
                animation: `${dash} 1.5s ease-in-out infinite`,
              },
            }
          : {
              strokeDasharray : circ,
              strokeDashoffset: offset,
              transition      : 'stroke-dashoffset 0.2s linear',
            };

      return (
        <Root
          {...divProps}
          {...ariaProps}
          ref={ref}
          className={mergedCls}
          style={style}
        >
          <CircleWrap $d={box}>
            <svg
              width={box}
              height={box}
              viewBox={`0 0 ${boxPx} ${boxPx}`}
              {...svgProps}
            >
              <circle
                cx={boxPx / 2}
                cy={boxPx / 2}
                r={radius}
                fill="none"
                stroke={primary}
                strokeWidth={strokePx}
                strokeLinecap="round"
                {...circleProps}
              />
            </svg>
            {showLabel && mode !== 'indeterminate' && (
              <CenterLabel $font={theme.typography.body.md}>
                {Math.round(value)}%
              </CenterLabel>
            )}
          </CircleWrap>
        </Root>
      );
    }

    /*─────────────────────────────────────────────────────────*/
    /* LINEAR                                                  */
    /*─────────────────────────────────────────────────────────*/
    let h: string;

    if (typeof size === 'number') {
      h = `${size / 6}px`;
    } else if (tokens.linear[size as ProgressSize]) {
      h = tokens.linear[size as ProgressSize].h;
    } else {
      h = `calc(${size} / 6)`;
    }
    const barStyle: React.CSSProperties = {
      width : `${value}%`,
      right : 'auto',
      left  : 0,
    };
    const bufferStyle: React.CSSProperties = {
      width : `${buffer}%`,
      right : 'auto',
      left  : 0,
      background: primary + '55',
    };

    return (
      <Root
        {...divProps}
        {...ariaProps}
        ref={ref}
        className={mergedCls}
        style={style}
      >
        <Track $h={h}>
          {/* BUFFER BAR */}
          {mode === 'buffer' && (
            <Bar $color={primary + '55'} style={bufferStyle} />
          )}
          {/* MAIN BAR */}
          {mode === 'indeterminate' ? (
            <>
              <Bar $color={primary} $indet $index={1} />
              <Bar $color={primary} $indet $index={2} />
            </>
          ) : (
            <Bar $color={primary} style={barStyle} />
          )}
        </Track>
      </Root>
    );
  },
);

Progress.displayName = 'Progress';
export default Progress;

// ─────────────────────────────────────────────────────────────
// src/components/widgets/Progress.tsx  | valet
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
export type ProgressSize    = 'sm' | 'md' | 'lg';

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
  /** sm (IconButton sm), md (default), or lg. */
  size?: ProgressSize;
  /** Show numeric % inside Circular centre. */
  showLabel?: boolean;
  /** Colour override (defaults to theme.primary). */
  color?: string | undefined;
}

/*───────────────────────────────────────────────────────────*/
/* Size tokens, strongly typed                               */
interface CircularToken { box: number; stroke: number }
interface LinearToken   { h: number }

type Tokens = {
  circular: Record<ProgressSize, CircularToken>;
  linear  : Record<ProgressSize, LinearToken>;
};

const geom = (_t: Theme): Tokens => ({
  circular: {
    sm: { box: 24, stroke: 3 },
    md: { box: 36, stroke: 4 },
    lg: { box: 48, stroke: 6 },
  },
  linear: {
    sm: { h: 4 },
    md: { h: 6 },
    lg: { h: 8 },
  },
});

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
const CircleWrap = styled('div')<{ $d: number }>`
  width: ${({ $d }) => $d}px;
  height:${({ $d }) => $d}px;
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
const Track = styled('div')<{ $h: number }>`
  width: 100%;
  height: ${({ $h }) => $h}px;
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
      const { box, stroke } = tokens.circular[size];
      const radius          = (box - stroke) / 2;
      const circ            = 2 * Math.PI * radius;
      const offset          = ((100 - value) / 100) * circ;

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
              viewBox={`0 0 ${box} ${box}`}
              {...svgProps}
            >
              <circle
                cx={box / 2}
                cy={box / 2}
                r={radius}
                fill="none"
                stroke={primary}
                strokeWidth={stroke}
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
    const { h } = tokens.linear[size];
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

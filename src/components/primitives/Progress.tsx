// ─────────────────────────────────────────────────────────────
// src/components/primitives/Progress.tsx  | valet
// Redesign: simpler API, better aesthetics, stronger a11y
// ─────────────────────────────────────────────────────────────
import React, { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { styled, keyframes } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import type { Presettable, Sx } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Keyframes                                                 */
const rotate360 = keyframes`
  100% { transform: rotate(360deg); }
`;
const dashSpin = keyframes`
  0%   { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50%  { stroke-dasharray: 90,150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90,150; stroke-dashoffset: -124; }
`;
// The indeterminate bar sweeps left→right across the track; the sweep is a
// directional animation, not an inline-axis layout. Full interactive RTL
// (mirroring the sweep direction) is a logged deferral.
const indetBarA = keyframes`
  0%   { left: -35%; right: 100%; } /* rtl: physical-by-design */
  60%  { left: 100%; right: -90%; } /* rtl: physical-by-design */
  100% { left: 100%; right: -90%; } /* rtl: physical-by-design */
`;
const indetBarB = keyframes`
  0%   { left: -200%; right: 100%; } /* rtl: physical-by-design */
  60%  { left: 107%;  right: -8%;  } /* rtl: physical-by-design */
  100% { left: 107%;  right: -8%;  } /* rtl: physical-by-design */
`;

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Root = styled('div')`
  display: inline-block;
  position: relative;
  vertical-align: middle;
`;

// Linear parts
const Track = styled('div')<{ $h: string; $track: string }>`
  width: 100%;
  height: ${({ $h }) => $h};
  background: ${({ $track }) => $track};
  border-radius: var(--valet-progress-radius, 9999px);
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
  transition: width 160ms linear;
  border-radius: inherit;
  ${({ $indet, $index }) =>
    $indet &&
    ($index === 1
      ? `animation: ${indetBarA} 2.1s infinite ease-out;`
      : `animation: ${indetBarB} 2.1s infinite ease-in;`)}
  /* A11Y S5 — reduced motion: stop the sweeping indeterminate animation
     and degrade to a static, still-visible band so the progressbar reads
     as "busy" rather than blanking out. The first lane is shown as a
     centered ~40% fill; the second is suppressed (it would only overlap). */
  @media (prefers-reduced-motion: reduce) {
    ${({ $indet, $index }) =>
      $indet &&
      ($index === 1 ? 'animation: none; inset-inline: 30%;' : 'animation: none; display: none;')}
  }
`;

// Circular parts
const RingWrap = styled('div')<{ $d: string }>`
  width: ${({ $d }) => $d};
  height: ${({ $d }) => $d};
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;
const Center = styled('div')`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
`;
const ContentSizer = styled('div')`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
`;
const CenterLabel = styled('span')<{ $font: string }>`
  font: ${({ $font }) => $font};
  color: var(--valet-text-color, currentColor);
`;

/*───────────────────────────────────────────────────────────*/
/* Helpers                                                   */
const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));
const toCssSize = (v: number | string | undefined, fallback: string) =>
  v == null ? fallback : typeof v === 'number' ? `${v}px` : v;

/*───────────────────────────────────────────────────────────*/
/* Public API                                                */
export interface ProgressBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>,
    Presettable {
  /** 0–100. Omit for indeterminate. */
  value?: number;
  /** Secondary/buffer value for streaming. */
  buffer?: number;
  /** Height of the bar (px, rem, etc.). */
  height?: number | string | undefined;
  /** Override primary color. */
  color?: string | undefined;
  /** Inline styles (supports CSS vars). */
  sx?: Sx;
}

export interface ProgressRingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>,
    Presettable {
  /** 0–100. Omit for indeterminate. */
  value?: number;
  /** Diameter (px, rem, etc.). */
  size?: number | string | undefined;
  /** Stroke thickness (px, rem, etc.). */
  thickness?: number | string | undefined;
  /** Override primary color. */
  color?: string | undefined;
  /** Center content; if omitted, optionally show a percent label via `label`. */
  children?: React.ReactNode;
  /** Label inside the ring center. true shows 0–100%; function formats it; or pass a node. */
  label?: boolean | ((v: number) => React.ReactNode) | React.ReactNode;
  /** Auto-size ring to fit around child content (default true when children present and size not set). */
  fitChild?: boolean;
  /** Extra clearance around child when auto-sizing (px). */
  childClearance?: number;
  /** Inline styles (supports CSS vars). */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
/* Components                                                */
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, buffer, height, color, className, preset: p, sx, ...rest }, ref) => {
    const { theme } = useTheme();
    const primary = (color ?? theme.colors.primary) as string;
    const track = `color-mix(in srgb, ${primary} 20%, transparent)`;
    const h = toCssSize(height, '0.375rem');

    const ariaProps =
      value == null
        ? { role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100 }
        : {
            role: 'progressbar',
            'aria-valuemin': 0,
            'aria-valuemax': 100,
            'aria-valuenow': Math.round(clamp(value)),
          };

    const presetCls = p ? preset(p) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

    const barStyle: React.CSSProperties =
      value == null ? {} : { width: `${clamp(value)}%`, insetInlineStart: 0 };
    const bufferStyle: React.CSSProperties =
      buffer == null ? {} : { width: `${clamp(buffer)}%`, insetInlineStart: 0 };

    return (
      <Root
        {...rest}
        {...ariaProps}
        ref={ref}
        data-valet-component='ProgressBar'
        data-state={value == null ? 'indeterminate' : 'determinate'}
        className={mergedCls}
        style={sx}
      >
        <Track
          $h={h}
          $track={track}
        >
          {buffer != null && (
            <Bar
              $color={primary + '55'}
              style={bufferStyle}
            />
          )}
          {value == null ? (
            <>
              <Bar
                $color={primary}
                $indet
                $index={1}
              />
              <Bar
                $color={primary}
                $indet
                $index={2}
              />
            </>
          ) : (
            <Bar
              $color={primary}
              style={barStyle}
            />
          )}
        </Track>
      </Root>
    );
  },
);
ProgressBar.displayName = 'ProgressBar';

export const ProgressRing = forwardRef<HTMLDivElement, ProgressRingProps>(
  (
    {
      value,
      size,
      thickness,
      color,
      className,
      preset: p,
      sx,
      children,
      label,
      fitChild = true,
      childClearance,
      ...rest
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const primary = (color ?? theme.colors.primary) as string;
    // A11Y S5 — these two ring animations live in inline JS style (the SVG
    // rotate + the stroke dash spin), so the @media guard in styled CSS can't
    // reach them; gate them on the live preference instead.
    const reduceMotion = usePrefersReducedMotion();

    const dDefault = toCssSize(size, '2.25rem');
    // Convert dimension and thickness to px to compute circumference.
    // Assume 1rem = 16px for deterministic sizing.
    const toPx = (val: string): number =>
      val.endsWith('rem')
        ? parseFloat(val) * 16
        : val.endsWith('px')
          ? parseFloat(val)
          : parseFloat(val);

    const [autoDPx, setAutoDPx] = useState<number | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    // Auto-size to child content when present and no explicit size
    useLayoutEffect(() => {
      if (!children) return;
      if (!fitChild) return;
      if (size != null) return; // respect explicit size
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const childD = Math.max(rect.width, rect.height);
      const clearance = childClearance ?? 2; // px
      if (Number.isNaN(childD) || childD <= 0) return;
      if (thickness != null) {
        const sPxLocal = toPx(typeof thickness === 'number' ? `${thickness}px` : thickness);
        const dPxLocal = Math.ceil(childD + 2 * clearance + sPxLocal);
        setAutoDPx((prev) => (prev === dPxLocal ? prev : dPxLocal));
      } else {
        const inner = childD + 2 * clearance;
        const dPxLocal = Math.ceil((inner * 8) / 7); // since s = d/8
        setAutoDPx((prev) => (prev === dPxLocal ? prev : dPxLocal));
      }
    }, [children, fitChild, size, thickness, childClearance]);

    const dPx = autoDPx ?? toPx(typeof size === 'number' ? `${size}px` : dDefault);
    const stroke = toCssSize(thickness, `${Math.max(2, Math.round(dPx / 8))}px`);
    const sPx = toPx(stroke);
    const radius = Math.max(0, (dPx - sPx) / 2);
    const circ = 2 * Math.PI * radius;

    const isIndeterminate = value == null;
    const pct = clamp(value ?? 0);
    const offset = ((100 - pct) / 100) * circ;

    const track = `color-mix(in srgb, ${primary} 20%, transparent)`;

    const ariaProps = isIndeterminate
      ? { role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100 }
      : {
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(pct),
        };

    const presetCls = p ? preset(p) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

    let centerNode: React.ReactNode = null;
    if (children == null && label) {
      if (typeof label === 'function') centerNode = label(pct);
      else if (label === true)
        centerNode = <CenterLabel $font={theme.typography.body.md}>{pct}%</CenterLabel>;
      else centerNode = label;
    }

    return (
      <Root
        {...rest}
        {...ariaProps}
        ref={ref}
        data-valet-component='ProgressRing'
        data-state={isIndeterminate ? 'indeterminate' : 'determinate'}
        className={mergedCls}
        style={sx}
      >
        <RingWrap $d={autoDPx ? `${autoDPx}px` : dDefault}>
          <svg
            width={autoDPx ? `${autoDPx}px` : dDefault}
            height={autoDPx ? `${autoDPx}px` : dDefault}
            viewBox={`0 0 ${dPx} ${dPx}`}
            style={
              isIndeterminate && !reduceMotion
                ? { animation: `${rotate360} 1.4s linear infinite` }
                : undefined
            }
          >
            {/* Track */}
            <circle
              cx={dPx / 2}
              cy={dPx / 2}
              r={radius}
              fill='none'
              stroke={track}
              strokeWidth={sPx}
            />
            {/* Progress */}
            <circle
              cx={dPx / 2}
              cy={dPx / 2}
              r={radius}
              fill='none'
              stroke={primary}
              strokeWidth={sPx}
              strokeLinecap='round'
              {...(isIndeterminate
                ? {
                    // Reduced motion: drop the dash spin but keep a static arc
                    // (~25% of the circumference) so the ring reads as busy.
                    style: reduceMotion
                      ? {
                          strokeDasharray: `${circ * 0.25},${circ}`,
                          strokeDashoffset: 0,
                        }
                      : {
                          strokeDasharray: '80,200',
                          strokeDashoffset: 0,
                          animation: `${dashSpin} 1.4s ease-in-out infinite`,
                        },
                  }
                : {
                    strokeDasharray: circ,
                    strokeDashoffset: offset,
                    style: { transition: 'stroke-dashoffset 160ms linear' },
                  })}
            />
          </svg>
          {children ? (
            <Center>
              <ContentSizer ref={contentRef}>{children}</ContentSizer>
            </Center>
          ) : centerNode ? (
            <Center>
              <ContentSizer>{centerNode}</ContentSizer>
            </Center>
          ) : null}
        </RingWrap>
      </Root>
    );
  },
);
ProgressRing.displayName = 'ProgressRing';

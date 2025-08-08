// ─────────────────────────────────────────────────────────────
// src/components/primitives/Skeleton.tsx  | valet
// Adaptive skeleton placeholder with content-aware sizing
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState, forwardRef } from 'react';
import { styled, keyframes } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

export type SkeletonVariant = 'text' | 'rect' | 'circle';

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Presettable {
  /** Show placeholder while true */
  loading?: boolean;
  /** Override detected placeholder shape */
  variant?: SkeletonVariant;
}

/*───────────────────────────────────────────────────────────*/
/* Animation                                                  */
const pulse = keyframes`
  0%   { opacity: 0.6; }
  50%  { opacity: 1;   }
  100% { opacity: 0.6; }
`;

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Wrapper = styled('span')`
  display: inline-block;
  position: relative;
`;

const Placeholder = styled('span')<{
  $bg: string;
  $radius: string;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: ${({ $radius }) => $radius};
  background: ${({ $bg }) => $bg};
  animation: ${pulse} 1.5s ease-in-out infinite;
  pointer-events: none;
`;

/*───────────────────────────────────────────────────────────*/
/* Helpers                                                   */
function inferVariant(child: React.ReactNode): SkeletonVariant {
  if (!child) return 'rect';
  if (typeof child === 'string') return 'text';
  if (React.isValidElement(child)) {
    const t: any = child.type;
    const name =
      typeof t === 'string'
        ? t
        : t.displayName || t.name || '';
    if (/avatar|icon|img/i.test(name)) return 'circle';
    if (/typography|span|p|h[1-6]|text/i.test(name)) return 'text';
  }
  return 'rect';
}

function radiusFor(v: SkeletonVariant): string {
  switch (v) {
    case 'circle':
      return '50%';
    case 'text':
      return '0.125rem';
    default:
      return '0.25rem';
  }
}

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(
  (
    {
      loading = true,
      variant,
      preset: p,
      className,
      children,
      style,
      ...rest
    },
    ref,
  ) => {
    const child = React.Children.count(children) === 1 ? children : null;
    const resolved = variant || inferVariant(child);
    const radius = radiusFor(resolved);

    const { theme } = useTheme();
    const bg = theme.colors.backgroundAlt;

    const fadeMs = 400;
    const [show, setShow] = useState(loading);
    useEffect(() => {
      if (!loading) {
        const t = setTimeout(() => setShow(false), fadeMs);
        return () => clearTimeout(t);
      }
      setShow(true);
    }, [loading]);

    const presetCls = p ? preset(p) : '';

    const el = child as React.ReactElement<any> | null;

    return (
      <Wrapper
        {...rest}
        ref={ref}
        style={style}
        className={[presetCls, className].filter(Boolean).join(' ')}
        aria-busy={loading}
      >
        {show && (
          <Placeholder
            aria-hidden="true"
            $bg={bg}
            $radius={radius}
            style={{
              opacity: loading ? 1 : 0,
              transform: loading ? 'none' : 'scale(0.98)',
              transition: `opacity ${fadeMs}ms ease, transform ${fadeMs}ms ease`,
            }}
          />
        )}
        {el &&
          React.cloneElement(el, {
            'aria-hidden': loading,
            style: {
              ...el.props.style,
              ...(loading && resolved === 'text'
                ? { display: 'inline-block', width: 'fit-content' }
                : null),
              visibility: loading ? 'hidden' : undefined,
              opacity: loading ? 0 : 1,
              transition: `opacity ${fadeMs}ms ease`,
            },
          } as any)}
      </Wrapper>
    );
  },
);

Skeleton.displayName = 'Skeleton';
export default Skeleton;

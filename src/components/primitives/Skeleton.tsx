// ─────────────────────────────────────────────────────────────
// src/components/primitives/Skeleton.tsx  | valet
// Adaptive skeleton placeholder with content-aware sizing
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState, forwardRef, useRef } from 'react';
import { styled, keyframes } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

export type SkeletonVariant = 'text' | 'rect' | 'circle';

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement>, Presettable {
  /** Show placeholder while true */
  loading?: boolean;
  /** Override detected placeholder shape */
  variant?: SkeletonVariant;
  /** Optional icon rendered while loading */
  icon?: React.ReactNode;
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
  align-self: flex-start;
  width: fit-content;
`;

const Placeholder = styled('span')<{
  $bg: string;
  $radius: string;
  $loading: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: ${({ $radius }) => $radius};
  background: ${({ $bg }) => $bg};
  z-index: 1;
  animation: ${({ $loading }) => ($loading ? `${pulse} 1.5s ease-in-out infinite` : 'none')};
  pointer-events: none;
`;

/*───────────────────────────────────────────────────────────*/
/* Helpers                                                   */
function inferVariant(child: React.ReactNode): SkeletonVariant {
  if (!child) return 'rect';
  if (typeof child === 'string') return 'text';
  if (React.isValidElement(child)) {
    const t = (child as React.ReactElement).type;
    type Named = { displayName?: string; name?: string };
    const name =
      typeof t === 'string'
        ? t
        : ((t as unknown as Named).displayName ?? (t as unknown as Named).name ?? '');
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
  ({ loading, variant, icon, preset: p, className, children, style, ...rest }, ref) => {
    const child = React.Children.count(children) === 1 ? children : null;
    const resolved = variant || inferVariant(child);
    const radius = radiusFor(resolved);

    const { theme } = useTheme();
    const bg = theme.colors.backgroundAlt;

    const isControlled = loading !== undefined;
    const [internalLoading, setInternalLoading] = useState(loading ?? true);
    const activeLoading = isControlled ? (loading as boolean) : internalLoading;

    const fadeMs = 400;
    const [show, setShow] = useState(activeLoading);
    const phRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
      if (!activeLoading) {
        const node = phRef.current;
        if (node) {
          const handler = () => setShow(false);
          node.addEventListener('transitionend', handler, { once: true });
        }
      } else {
        setShow(true);
      }
    }, [activeLoading]);

    useEffect(() => {
      if (isControlled) setInternalLoading(loading as boolean);
    }, [isControlled, loading]);

    const presetCls = p ? preset(p) : '';

    type AnyProps = Record<string, unknown>;
    const el = child as React.ReactElement<AnyProps> | null;

    return (
      <Wrapper
        {...rest}
        ref={ref}
        style={style}
        className={[presetCls, className].filter(Boolean).join(' ')}
        aria-busy={activeLoading}
      >
        {show && (
          <Placeholder
            ref={phRef}
            aria-hidden='true'
            $bg={bg}
            $radius={radius}
            $loading={activeLoading}
            style={{
              opacity: activeLoading ? 1 : 0,
              transition: `opacity ${fadeMs}ms ease`,
              willChange: 'opacity',
            }}
          >
            {activeLoading && icon}
          </Placeholder>
        )}
        {el &&
          React.cloneElement(el, {
            'aria-hidden': activeLoading,
            style: {
              ...(el.props.style as Record<string, unknown> | undefined),
              ...(activeLoading && resolved === 'text'
                ? { display: 'inline-block', width: 'fit-content' }
                : null),
              visibility: activeLoading ? 'hidden' : undefined,
              opacity: activeLoading ? 0 : 1,
              transition: `opacity ${fadeMs}ms ease`,
              willChange: 'opacity',
            },
            ...(isControlled
              ? null
              : {
                  onLoad: (e: unknown) => {
                    const orig = (el.props as AnyProps)['onLoad'];
                    if (typeof orig === 'function') {
                      (orig as (arg: unknown) => void)(e);
                    }
                    setInternalLoading(false);
                  },
                  onError: (e: unknown) => {
                    const orig = (el.props as AnyProps)['onError'];
                    if (typeof orig === 'function') {
                      (orig as (arg: unknown) => void)(e);
                    }
                    setInternalLoading(false);
                  },
                }),
          } as AnyProps)}
      </Wrapper>
    );
  },
);

Skeleton.displayName = 'Skeleton';
export default Skeleton;

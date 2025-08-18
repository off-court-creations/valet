// ─────────────────────────────────────────────────────────────
// src/components/primitives/Icon.tsx  | valet
// strict‑optional safe typings
// ─────────────────────────────────────────────────────────────
import React, { ReactElement, isValidElement, PropsWithChildren } from 'react';
import { Icon as Iconify } from '@iconify/react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import type { Presettable, Sx } from '../../types';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'>,
    Presettable {
  /** Iconify icon name, e.g. "mdi:home". */
  icon?: string;
  /**
   * Custom SVG:
   * • **string** – raw `<path …>` data (wrapped in 24×24 viewBox)
   * • **ReactElement** – a full `<svg>` element
   */
  svg?: string | ReactElement<React.SVGProps<SVGSVGElement>>;
  /** Icon size token or explicit CSS size. */
  size?: IconSize | number | string;
  /** Explicit colour override; otherwise inherits `currentColor`. */
  color?: string | undefined;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

const Wrapper = styled('span')<{ $size: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};

  & > svg {
    width: 100%;
    height: 100%;
    flex-shrink: 0;
  }
`;

const sizeMap: Record<IconSize, string> = {
  xs: '0.75em',
  sm: '1em',
  md: '1.5em',
  lg: '2.5em',
  xl: '4em',
};

export const Icon: React.FC<PropsWithChildren<IconProps>> = ({
  icon,
  svg,
  size = 'md',
  color,
  preset: p,
  className,
  sx,
  children,
  ...spanRest
}) => {
  const presetClasses = p ? preset(p) : '';
  const finalSize = typeof size === 'number' ? `${size}px` : (sizeMap[size as IconSize] ?? size);
  const colourStyle = color ? { color } : undefined;

  let content: ReactElement | null = null;

  if (icon) {
    content = (
      <Iconify
        icon={icon}
        width='100%'
        height='100%'
        color='currentColor'
        aria-hidden={spanRest['aria-label'] ? undefined : true}
        focusable='false'
      />
    );
  } else if (isValidElement(svg)) {
    const svgEl = svg as ReactElement<React.SVGProps<SVGSVGElement>>;
    content = React.cloneElement(svgEl, {
      width: '100%',
      height: '100%',
      fill: svgEl.props.fill ?? 'currentColor',
    });
  } else if (typeof svg === 'string') {
    content = (
      <svg
        width='100%'
        height='100%'
        viewBox='0 0 24 24'
        fill='currentColor'
        dangerouslySetInnerHTML={{ __html: svg.trim() }}
      />
    );
  } else if (isValidElement(children)) {
    const child = children as ReactElement<React.SVGProps<SVGSVGElement>>;
    content = React.cloneElement(child, {
      width: '100%',
      height: '100%',
      fill: child.props.fill ?? 'currentColor',
    });
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('<Icon /> requires `icon`, `svg`, or children containing an <svg>.');
    }
    return null;
  }

  return (
    <Wrapper
      $size={finalSize}
      className={[presetClasses, className].filter(Boolean).join(' ')}
      style={{ ...colourStyle, ...sx }}
      {...spanRest}
    >
      {content}
    </Wrapper>
  );
};

export default Icon;

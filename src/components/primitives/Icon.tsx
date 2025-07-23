// ─────────────────────────────────────────────────────────────
// src/components/primitives/Icon.tsx  | valet
// strict‑optional safe typings
// ─────────────────────────────────────────────────────────────
import React, {
  ReactElement,
  SVGProps,
  isValidElement,
  PropsWithChildren,
} from 'react';
import { Icon as Iconify }     from '@iconify/react';
import { styled }              from '../../css/createStyled';
import { preset }              from '../../css/stylePresets';
import type { Presettable }    from '../../types';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/*───────────────────────────────────────────────────────────*/
/* Public props                                              */
/*  – We extend span-level attributes so they match <Wrapper> */
export interface IconProps
  extends React.HTMLAttributes<HTMLSpanElement>,
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
}

/*───────────────────────────────────────────────────────────*/
/* Styled wrapper so presets & CSS vars can style the icon   */
const Wrapper = styled('span')<{ $size: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  svg {
    width : ${({ $size }) => $size};
    height: ${({ $size }) => $size};
    flex-shrink: 0;
  }
`;

const sizeMap: Record<IconSize, string> = {
  xs: '0.75rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2.5rem',
  xl: '4rem',
};

/*───────────────────────────────────────────────────────────*/
export const Icon: React.FC<PropsWithChildren<IconProps>> = ({
  icon,
  svg,
  size = 'md',
  color,
  preset: p,
  className,
  style,
  children,
  ...spanRest
}) => {
  /* ----- preset → utility class names -------------------- */
  const presetClasses = p ? preset(p) : '';

  /* ----- normalise size & colour ------------------------- */
  const finalSize =
    typeof size === 'number'
      ? `${size}px`
      : sizeMap[size as IconSize] ?? size;
  const colourStyle = color ? { color } : undefined;

  /*─────────────────────────────────────────────────────────*/
  /* Decide what goes INSIDE <Wrapper>                       */
  /*─────────────────────────────────────────────────────────*/
  let content: ReactElement | null = null;

  if (icon) {
    content = (
      <Iconify
        icon={icon}
        width="100%"          /* Wrapper controls final px/rem size */
        height="100%"
        color="currentColor"  /* inherits Wrapper.text-color */
        aria-hidden={spanRest['aria-label'] ? undefined : true}
        focusable="false"
      />
    );
  } else if (isValidElement(svg)) {
    const svgEl = svg as ReactElement<React.SVGProps<SVGSVGElement>>;
    content = React.cloneElement(svgEl, {
      width : svgEl.props.width  ?? finalSize,
      height: svgEl.props.height ?? finalSize,
      fill  : svgEl.props.fill   ?? 'currentColor',
    });
  } else if (typeof svg === 'string') {
    content = (
      <svg
        width={finalSize}
        height={finalSize}
        viewBox="0 0 24 24"
        fill="currentColor"
        dangerouslySetInnerHTML={{ __html: svg.trim() }}
      />
    );
  } else if (isValidElement(children)) {
    const child = children as ReactElement<React.SVGProps<SVGSVGElement>>;
    content = React.cloneElement(child, {
      width : child.props.width  ?? finalSize,
      height: child.props.height ?? finalSize,
      fill  : child.props.fill   ?? 'currentColor',
    });
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('<Icon /> requires `icon`, `svg`, or children containing an <svg>.');
    }
    return null;
  }

  /*─────────────────────────────────────────────────────────*/
  /* Render <Wrapper>                                        */
  /*─────────────────────────────────────────────────────────*/
  return (
    <Wrapper
      $size={finalSize}
      className={[presetClasses, className].filter(Boolean).join(' ')}
      style={{ ...colourStyle, ...style }}
      {...spanRest}
    >
      {content}
    </Wrapper>
  );
};

export default Icon;

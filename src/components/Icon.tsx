// ─────────────────────────────────────────────────────────────
// src/components/Icon.tsx
// ─────────────────────────────────────────────────────────────
import React, {
    ReactElement,
    isValidElement,
    PropsWithChildren,
  } from 'react';
  import { Icon as Iconify }       from '@iconify/react';
  import { styled }                from '../css/createStyled';
  import { preset }                from '../css/stylePresets';
  import type { Presettable }      from '../types';
  
  /*───────────────────────────────────────────────────────────*/
  /* Public props                                              */
  /*  – We extend span-level attributes so they match <Wrapper> */
  export interface IconProps
    extends React.HTMLAttributes<HTMLSpanElement>,
      Presettable {
    /** Iconify icon name, e.g. `"mdi:home"`. */
    icon?: string;
    /**
     * Custom SVG:
     * • **string** – raw `<path …>` data (wrapped in 24×24 viewBox)
     * • **ReactElement** – a full `<svg>` element
     */
    svg?: string | ReactElement<SVGSVGElement>;
    /** Icon size. `number` ⇒ `"Npx"`, `string` ⇒ any CSS length. Default `"1em"`. */
    size?: number | string;
    /** Explicit colour override; otherwise inherits `currentColor`. */
    color?: string;
  }
  
  /*───────────────────────────────────────────────────────────*/
  /* Styled wrapper so presets & CSS vars can style the icon   */
  const Wrapper = styled('span')<{ $size: string }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 0;      /* trims extra vertical space */
    svg {
      width : ${p => p.$size};
      height: ${p => p.$size};
      flex-shrink: 0;
    }
  `;
  
  /*───────────────────────────────────────────────────────────*/
  export const Icon: React.FC<PropsWithChildren<IconProps>> = ({
    icon,
    svg,
    size      = '1em',
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
    const finalSize   = typeof size === 'number' ? `${size}px` : size;
    const colourStyle = color ? { color } : undefined;
  
    /*─────────────────────────────────────────────────────────*/
    /* Decide what goes INSIDE <Wrapper>                       */
    /*─────────────────────────────────────────────────────────*/
    let content: ReactElement;
  
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
      const svgEl = svg as ReactElement<any>;
      content     = React.cloneElement(svgEl, {
        width : finalSize,
        height: finalSize,
        fill  : svgEl.props.fill ?? 'currentColor',
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
      const child = children as ReactElement<any>;
      content     = React.cloneElement(child, {
        width : child.props.width  ?? finalSize,
        height: child.props.height ?? finalSize,
        fill  : child.props.fill   ?? 'currentColor',
      });
  
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '<Icon /> requires `icon`, `svg`, or children containing an <svg>.'
        );
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
  
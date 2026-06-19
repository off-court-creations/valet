// ─────────────────────────────────────────────────────────────
// src/components/primitives/Icon.tsx  | valet
// strict‑optional safe typings
// ─────────────────────────────────────────────────────────────
import React, { ReactElement, isValidElement, PropsWithChildren } from 'react';
import { Icon as Iconify } from '@iconify/react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import { parseSvgString } from '../../helpers/svgSafe';
import type { Presettable, Sx } from '../../types';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'>,
    Presettable {
  /** Iconify icon name, e.g. "mdi:home". */
  icon?: string;
  /**
   * Custom SVG:
   * • **string** – passed through the {@link parseSvgString} allowlist
   *   parser. Accepted forms: bare path `d`-data (`"M12 2L2 22h20z"`,
   *   wrapped in a 24×24 viewBox) or `<path>`-only markup, optionally
   *   inside one `<svg>` wrapper. The result is rendered as real React
   *   `<svg>`/`<path>` elements — never via `innerHTML`. Anything outside
   *   that grammar renders nothing and dev-warns.
   * • **ReactElement** – a full `<svg>` element you already trust.
   *
   * **BREAKING (Q6):** full-SVG strings (`<svg>…</svg>` containing anything
   * other than `<path>`, or any string with entities/comments/scripts) no
   * longer render here — they are an XSS vector through the old
   * `dangerouslySetInnerHTML` sink. For trusted full-SVG markup, pass a
   * ReactElement or use {@link IconProps.dangerouslySetSvg}.
   */
  svg?: string | ReactElement<React.SVGProps<SVGSVGElement>>;
  /**
   * Escape hatch for **trusted** raw SVG markup. Reproduces the pre-0.35
   * `svg` string behavior exactly: the markup is injected verbatim via
   * `dangerouslySetInnerHTML`, so it can execute scripts/event handlers and
   * load remote references. The name is the warning — only ever pass markup
   * you fully control (never model output or user input). For untrusted or
   * agent-generated markup use {@link IconProps.svg}, which is parsed.
   */
  dangerouslySetSvg?: string;
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
  /* Prevent text selection and touch callouts on mobile */
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;

  & > svg {
    width: 100%;
    height: 100%;
    flex-shrink: 0;
    /* Ensure the SVG itself is also non-selectable/non-draggable */
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-user-drag: none;
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
  dangerouslySetSvg,
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
  /* Full-SVG markup injected directly into the Wrapper <span> (see the
     dangerouslySetSvg branch). Kept separate from `content` because a full
     document must NOT be re-wrapped in another <svg>. */
  let dangerousHTML: string | null = null;

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
    /* Trusted-shape string: the allowlist parser turns it into structured
       attribute records (or null). We render those as real React elements —
       the markup is never re-serialized to innerHTML, so a parser misjudge
       can never reach an HTML sink. Anything outside the grammar → null. */
    const parsed = parseSvgString(svg);
    if (parsed) {
      content = (
        <svg
          width='100%'
          height='100%'
          viewBox={parsed.root.viewBox ?? '0 0 24 24'}
          fill={parsed.root.fill ?? 'currentColor'}
          stroke={parsed.root.stroke}
          strokeWidth={parsed.root.strokeWidth}
          fillRule={parsed.root.fillRule as React.SVGProps<SVGSVGElement>['fillRule']}
          clipRule={parsed.root.clipRule as React.SVGProps<SVGSVGElement>['clipRule']}
        >
          {parsed.paths.map((path, i) => (
            <path
              key={i}
              d={path.d}
              fill={path.fill}
              stroke={path.stroke}
              strokeWidth={path.strokeWidth}
              fillRule={path.fillRule as React.SVGProps<SVGPathElement>['fillRule']}
              clipRule={path.clipRule as React.SVGProps<SVGPathElement>['clipRule']}
            />
          ))}
        </svg>
      );
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '<Icon svg="…" /> rejected: the string is not bare path `d`-data or `<path>`-only markup. ' +
            'For untrusted/agent-generated markup keep it within that grammar; for trusted full-SVG markup ' +
            'pass a React element or use the `dangerouslySetSvg` escape hatch.',
        );
      }
      return null;
    }
  } else if (typeof dangerouslySetSvg === 'string') {
    /* Explicit, named escape hatch (Q6): reproduces the pre-0.35 raw
       innerHTML behavior for caller-trusted markup. The prop name is the
       warning — this can execute scripts; never pass untrusted input. */
    const trimmed = dangerouslySetSvg.trim();
    if (/<svg[\s>]/i.test(trimmed)) {
      /* A full SVG document carries its own viewBox (and often fixed
         width/height). Wrapping it in our 24×24 <svg> maps its coordinate
         system into 24 user units and clips it to a sliver. Instead inject it
         straight into the Wrapper <span>: the asset's own viewBox drives
         scaling and the Wrapper's `& > svg { width/height: 100% }` rule
         neutralizes any fixed width/height, so it fills `size` exactly. The
         test matches an <svg> anywhere, so a leading <?xml?>/doctype/comment
         prolog (real .svg files have one) is tolerated. */
      dangerousHTML = trimmed;
    } else {
      /* Partial markup (bare <path>/`d`-data, no <svg> root) still needs an
         svg context, the 24×24 icon viewBox, and currentColor inheritance. */
      content = (
        <svg
          width='100%'
          height='100%'
          viewBox='0 0 24 24'
          fill='currentColor'
          dangerouslySetInnerHTML={{ __html: trimmed }}
        />
      );
    }
  } else if (isValidElement(children)) {
    const child = children as ReactElement<React.SVGProps<SVGSVGElement>>;
    content = React.cloneElement(child, {
      width: '100%',
      height: '100%',
      fill: child.props.fill ?? 'currentColor',
    });
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '<Icon /> requires `icon`, `svg`, `dangerouslySetSvg`, or children containing an <svg>.',
      );
    }
    return null;
  }

  return (
    <Wrapper
      $size={finalSize}
      data-valet-component='Icon'
      className={[presetClasses, className].filter(Boolean).join(' ')}
      style={{ ...colourStyle, ...sx }}
      draggable={false}
      {...spanRest}
      {...(dangerousHTML != null ? { dangerouslySetInnerHTML: { __html: dangerousHTML } } : {})}
    >
      {dangerousHTML != null ? null : content}
    </Wrapper>
  );
};

export default Icon;

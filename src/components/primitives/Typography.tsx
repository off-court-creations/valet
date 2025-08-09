// ─────────────────────────────────────────────────────────────
// src/components/primitives/Typography.tsx | valet
// patch: force text wrapping; add noSelect prop – 2025‑07‑17
// ─────────────────────────────────────────────────────────────
import React from 'react';
import type { JSX } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { useSurface } from '../../system/surfaceStore';
import { shallow } from 'zustand/shallow';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

export type Variant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body'
  | 'subtitle'
  | 'button';

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    Presettable {
  variant?: Variant;
  bold?: boolean;
  italic?: boolean;
  centered?: boolean;
  noSelect?: boolean;
  fontSize?: string;
  scale?: number;
  autoSize?: boolean;
  color?: string;
  /** Choose a theme font family */
  family?: 'heading' | 'body' | 'mono' | 'button';
  fontFamily?: string;
}

const mapping: Record<Variant, keyof JSX.IntrinsicElements> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body: 'p',
  subtitle: 'span',
  button: 'span',
};

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  bold = false,
  italic = false,
  fontSize,
  scale,
  autoSize = false,
  color,
  family,
  fontFamily,
  centered,
  noSelect = false,
  preset: p,
  className,
  children,
  ...props
}) => {
  const Tag = mapping[variant];
  const { theme } = useTheme();
  const breakpoint = useSurface((s) => s.breakpoint, shallow);

  const defaultSize = theme.typography[variant].md;
  let size = autoSize ? theme.typography[variant][breakpoint] : defaultSize;
  if (scale != null) size = `calc(${size} * ${scale})`;
  if (fontSize) size = fontSize;

  const presetClasses = p ? preset(p) : '';

  const Component = React.useMemo(
    () => styled(Tag)<{
      $variant: Variant;
      $color?: string;
      $fontFamily?: string;
      $family?: 'heading' | 'body' | 'mono' | 'button';
      $size: string;
      $bold: boolean;
      $italic: boolean;
      $center?: boolean;
      $noSelect: boolean;
    }>`
      margin: 0;
      color: ${({ $color }) => $color || 'var(--valet-text-color, inherit)'};
      font-size: ${({ $size }) => $size};
      font-weight: ${({ $bold }) => ($bold ? 700 : 400)};
      font-style: ${({ $italic }) => ($italic ? 'italic' : 'normal')};
      line-height: ${({ $variant }) => ($variant === 'button' ? 1 : 1.4)};
      font-family: ${({ $fontFamily, $family, $variant }) =>
        $fontFamily ||
        ($family
          ? `var(--valet-font-${$family})`
          : `var(--valet-font-${
              $variant === 'button'
                ? 'button'
                : $variant.startsWith('h')
                  ? 'heading'
                  : 'body'
            })`)};
      ${({ $center }) =>
        $center &&
        `
            text-align: center;
            align-self: center;
            margin-inline: auto;
          `};
      ${({ $noSelect }) =>
        $noSelect &&
        `
            user-select: none;
            -webkit-user-select: none;
            -ms-user-select: none;
            -webkit-touch-callout: none;
          `};

      /* Newline & wrapping guards */
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
      max-width: 100%;
    `,
    [Tag],
  );

  return (
    <Component
      {...props}
      $color={color}
      $fontFamily={fontFamily}
      $family={family}
      $variant={variant}
      $size={size}
      $bold={bold}
      $italic={italic}
      $center={centered}
      $noSelect={noSelect}
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      {children}
    </Component>
  );
};

export default Typography;

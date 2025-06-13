// src/components/Typography.tsx | valet

import React from 'react';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { useSurface } from './Surface';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';

export type Variant =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'body' | 'subtitle';

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    Presettable {
  variant?: Variant;
  bold?: boolean;
  italic?: boolean;
  fontSize?: string;
  scale?: number;
  autoSize?: boolean;
  color?: string;
  fontFamily?: string;
}

const mapping: Record<Variant, keyof JSX.IntrinsicElements> = {
  h1: 'h1', h2: 'h2', h3: 'h3',
  h4: 'h4', h5: 'h5', h6: 'h6',
  body: 'p', subtitle: 'span',
};

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  bold = false,
  italic = false,
  fontSize,
  scale,
  autoSize = false,
  color,
  fontFamily,
  preset: p,
  className,
  children,
  ...props
}) => {
  const Tag = mapping[variant];
  const { theme } = useTheme();
  const { breakpoint } = useSurface();

  const defaultSize = theme.typography[variant].md;
  let size = autoSize ? theme.typography[variant][breakpoint] : defaultSize;
  if (scale != null) size = `calc(${defaultSize} * ${scale})`;
  if (fontSize) size = fontSize;

  const presetClasses = p ? preset(p) : '';

  const Component = React.useMemo(() => styled(Tag)<{
    $variant: Variant;
    $color?: string;
    $fontFamily?: string;
    $size: string;
    $bold: boolean;
    $italic: boolean;
  }>`
    margin: 0;
    color: ${({ $color }) => $color || 'var(--valet-text-color)'};
    font-size: ${({ $size }) => $size};
    font-weight: ${({ $bold }) => ($bold ? 700 : 400)};
    font-style: ${({ $italic }) => ($italic ? 'italic' : 'normal')};
    line-height: 1.4;
    font-family: ${({ $fontFamily, $variant }) =>
      $fontFamily || `var(--valet-font-${$variant.startsWith('h') ? 'heading' : 'body'})`};
  `, [Tag]);

  return (
    <Component
      {...props}
      $color={color}
      $fontFamily={fontFamily}
      $variant={variant}
      $size={size}
      $bold={bold}
      $italic={italic}
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      {children}
    </Component>
  );
};

export default Typography;

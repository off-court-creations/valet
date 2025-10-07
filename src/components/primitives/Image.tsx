// ─────────────────────────────────────────────────────────────
// src/components/primitives/Image.tsx  | valet
// Simple, excellent <Image /> — no SSR, no skeletons
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import type { Presettable, Sx } from '../../types';

export interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'width' | 'height' | 'style' | 'alt'>,
    Presettable {
  /** Image source URL */
  src: string;
  /** Required alt text. Use empty string for decorative images. */
  alt: string;
  /** CSS width value (number ⇒ px) */
  width?: number | string;
  /** CSS height value (number ⇒ px) */
  height?: number | string;
  /** Object-fit value (maps to CSS object-fit) */
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Object-position value (e.g., 'center', 'top', '50% 25%') */
  objectPosition?: string;
  /** CSS aspect-ratio value (number ⇒ n/1) */
  aspectRatio?: number | string;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

const Img = styled('img')<{
  $w?: string;
  $h?: string;
  $fit: string;
  $ratio?: string;
  $pos?: string;
}>`
  display: block;
  width: ${({ $w }) => $w || 'auto'};
  height: ${({ $h }) => $h || 'auto'};
  max-width: 100%;
  object-fit: ${({ $fit }) => $fit};
  object-position: ${({ $pos }) => $pos || 'center'};
  aspect-ratio: ${({ $ratio }) => $ratio || 'auto'};
  user-select: none;
  -webkit-user-drag: none;
`;

// Note: No wrapper here. Rounding/clipping should be applied by callers
// via a parent wrapper with `overflow: hidden` if required.

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      fit = 'cover',
      objectPosition,
      aspectRatio,
      preset: p,
      className,
      sx,
      draggable,
      onDragStart,
      loading: loadingAttr = 'lazy',
      decoding: decodingAttr = 'async',
      ...rest
    },
    ref,
  ) => {
    const presetCls = p ? preset(p) : '';
    const w = typeof width === 'number' ? `${width}px` : width;
    const h = typeof height === 'number' ? `${height}px` : height;
    const ratio = typeof aspectRatio === 'number' ? `${aspectRatio} / 1` : aspectRatio;

    return (
      <Img
        {...rest}
        ref={ref}
        src={src}
        alt={alt}
        $w={w}
        $h={h}
        $fit={fit}
        $ratio={ratio}
        $pos={objectPosition}
        loading={loadingAttr}
        decoding={decodingAttr}
        className={[presetCls, className].filter(Boolean).join(' ')}
        style={sx}
        draggable={draggable ?? false}
        onDragStart={(e) => {
          if (!(draggable ?? false)) e.preventDefault();
          onDragStart?.(e);
        }}
      />
    );
  },
);

Image.displayName = 'Image';

export default Image;

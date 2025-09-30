// ─────────────────────────────────────────────────────────────
// src/components/primitives/Image.tsx  | valet
// Simple, native-lazy <Image /> with sane defaults
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import type { Presettable, Sx } from '../../types';

export interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'width' | 'height' | 'style'>,
    Presettable {
  /** Image source URL */
  src: string;
  /** CSS width value (number ⇒ px) */
  width?: number | string;
  /** CSS height value (number ⇒ px) */
  height?: number | string;
  /** Object-fit value */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Use native browser lazy-loading */
  lazy?: boolean;
  /** Optional lightweight placeholder shown behind while loading */
  placeholder?: string;
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
}>`
  display: block;
  width: ${({ $w }) => $w || 'auto'};
  height: ${({ $h }) => $h || 'auto'};
  max-width: 100%;
  object-fit: ${({ $fit }) => $fit};
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
      width,
      height,
      objectFit = 'cover',
      lazy = false,
      // placeholder: kept for backward-compat; intentionally unused (no background rendering)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      placeholder,
      aspectRatio,
      preset: p,
      className,
      sx,
      draggable,
      onDragStart,
      loading: loadingAttr,
      decoding: decodingAttr,
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
        $w={w}
        $h={h}
        $fit={objectFit}
        $ratio={ratio}
        loading={lazy ? 'lazy' : loadingAttr}
        decoding={decodingAttr ?? 'async'}
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

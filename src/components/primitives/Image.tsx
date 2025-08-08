// ─────────────────────────────────────────────────────────────
// src/components/primitives/Image.tsx  | valet
// responsive, lazy-loading <Image /> component
// ─────────────────────────────────────────────────────────────
import React, { useRef, useState, useEffect } from 'react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

export interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'width' | 'height'>,
    Presettable {
  /** Image source URL */
  src: string;
  /** CSS width value (number ⇒ px) */
  width?: number | string;
  /** CSS height value (number ⇒ px) */
  height?: number | string;
  /** Object-fit value */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Border radius */
  rounded?: number | string;
  /** Lazy load image when visible */
  lazy?: boolean;
  /** Placeholder src until loaded */
  placeholder?: string;
}

const Img = styled('img')<{
  $w?: string;
  $h?: string;
  $fit: string;
  $radius?: string;
}>`
  display: block;
  width: ${({ $w }) => $w || 'auto'};
  height: ${({ $h }) => $h || 'auto'};
  object-fit: ${({ $fit }) => $fit};
  border-radius: ${({ $radius }) => $radius || 0};
  user-select: none;
  -webkit-user-drag: none;
`;

export const Image: React.FC<ImageProps> = ({
  src,
  width,
  height,
  objectFit = 'cover',
  rounded,
  lazy = false,
  placeholder,
  preset: p,
  className,
  style,
  draggable,
  onDragStart,
  loading: loadingAttr,
  ...rest
}) => {
  const [ready, setReady] = useState(!lazy);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!lazy || ready || !('IntersectionObserver' in window)) return;
    const img = ref.current;
    if (!img) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setReady(true);
    }, { threshold: 0.1 });
    io.observe(img);
    return () => io.disconnect();
  }, [lazy, ready]);

  const presetCls = p ? preset(p) : '';
  const w = typeof width === 'number' ? `${width}px` : width;
  const h = typeof height === 'number' ? `${height}px` : height;
  const r = typeof rounded === 'number' ? `${rounded}px` : rounded;

  return (
    <Img
      {...rest}
      ref={ref}
      src={ready ? src : placeholder}
      $w={w}
      $h={h}
      $fit={objectFit}
      $radius={r}
      loading={lazy ? 'lazy' : loadingAttr}
      className={[presetCls, className].filter(Boolean).join(' ')}
      style={style}
      draggable={draggable ?? false}
      onDragStart={(e) => {
        e.preventDefault();
        onDragStart?.(e);
      }}
    />
  );
};

export default Image;

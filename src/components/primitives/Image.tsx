// ─────────────────────────────────────────────────────────────
// src/components/primitives/Image.tsx  | valet
// SSR-safe styled <img>: theme-aware `radius`, intrinsic-size CLS hints,
// `priority` for LCP, and an opt-in onError `fallback`. No skeletons by design.
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import { useTheme } from '../../system/themeStore';
import type { Presettable, Sx } from '../../types';

export interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'width' | 'height' | 'style' | 'alt'>,
    Presettable {
  /** Image source URL */
  src: string;
  /** Required alt text. Use empty string for decorative images. */
  alt: string;
  /**
   * CSS width (number ⇒ px). When BOTH `width` and `height` are numeric they are
   * ALSO emitted as the native HTML width/height attributes, so the browser can
   * reserve layout space and avoid CLS. A string value (e.g. '50%', '20rem') is
   * CSS-only and does NOT set the intrinsic-size attributes.
   */
  width?: number | string;
  /** CSS height (number ⇒ px). See {@link ImageProps.width} re: native attrs. */
  height?: number | string;
  /** Object-fit value (maps to CSS object-fit) */
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Object-position value (e.g., 'center', 'top', '50% 25%') */
  objectPosition?: string;
  /**
   * CSS aspect-ratio. A number is the literal width/height ratio — pass a real
   * ratio like `16 / 9` or `4 / 3` (NOT `16`, which is 16:1). Strings pass
   * through verbatim (e.g. '16 / 9').
   */
  aspectRatio?: number | string;
  /**
   * Corner radius. Number ⇒ `theme.radius(n)` (scales with density); string ⇒
   * verbatim CSS. Rounds the image itself — no wrapper needed. (A parent with
   * `overflow: hidden` is still the way to CLIP overflowing/child content.)
   */
  radius?: number | string;
  /**
   * Mark as a high-priority (above-the-fold / LCP) image: sets `loading='eager'`
   * and `fetchPriority='high'`. An explicit `loading`/`fetchPriority` still wins.
   * Default false (images load lazy + decode async).
   */
  priority?: boolean;
  /**
   * Opt-in node rendered if the image fails to load (onError). When unset, a
   * failed image behaves exactly like a native `<img>` — no wrapper, no state.
   * The caller sizes the fallback node.
   */
  fallback?: React.ReactNode;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

// Responsive images: `srcSet`, `sizes`, and `fetchPriority` are supported as-is
// via the native <img> passthrough (this interface extends ImgHTMLAttributes).
// Caller-provided srcSet/sizes is valet's only responsive story — it is a
// framework-agnostic kit with no build-step/CDN image optimizer.

const Img = styled('img')<{
  $w?: string;
  $h?: string;
  $fit: string;
  $ratio?: string;
  $pos?: string;
  $radius?: string;
}>`
  display: block;
  width: ${({ $w }) => $w || 'auto'};
  height: ${({ $h }) => $h || 'auto'};
  max-width: 100%;
  object-fit: ${({ $fit }) => $fit};
  object-position: ${({ $pos }) => $pos || 'center'};
  aspect-ratio: ${({ $ratio }) => $ratio || 'auto'};
  ${({ $radius }) => ($radius ? `border-radius: ${$radius};` : '')}
  user-select: none;
  -webkit-user-drag: none;
`;

// Note: No wrapper here. Clipping of overflowing/child content should be applied
// by callers via a parent wrapper with `overflow: hidden`; rounding the image
// itself is `radius`.

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
      radius,
      priority = false,
      fallback,
      preset: p,
      className,
      sx,
      draggable,
      onDragStart,
      onError: externalOnError,
      loading,
      fetchPriority,
      decoding: decodingAttr = 'async',
      ...rest
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const [hadError, setHadError] = useState(false);

    const presetCls = p ? preset(p) : '';
    const w = typeof width === 'number' ? `${width}px` : width;
    const h = typeof height === 'number' ? `${height}px` : height;
    const ratio =
      aspectRatio == null
        ? undefined
        : typeof aspectRatio === 'number'
          ? `${aspectRatio}`
          : aspectRatio;
    const r =
      radius == null ? undefined : typeof radius === 'number' ? theme.radius(radius) : radius;

    // CLS: only when BOTH dimensions are numeric can we emit the native
    // intrinsic-size attribute PAIR (the browser derives the ratio from both).
    const bothNumeric = typeof width === 'number' && typeof height === 'number';
    const nativeW = bothNumeric ? (width as number) : undefined;
    const nativeH = bothNumeric ? (height as number) : undefined;

    // `priority` drives the defaults; an explicit loading/fetchPriority wins.
    const resolvedLoading = loading ?? (priority ? 'eager' : 'lazy');
    const resolvedFetchPriority = fetchPriority ?? (priority ? 'high' : undefined);

    // Error fallback is OPT-IN: only when `fallback` is provided do we attach the
    // internal onError + flip to the fallback. Unset ⇒ today's bare <img> (no
    // internal handler, no state-driven branch) — SSR-safe, first paint is the img.
    const handleError: React.ReactEventHandler<HTMLImageElement> | undefined =
      fallback != null
        ? (e) => {
            setHadError(true);
            externalOnError?.(e);
          }
        : externalOnError;

    if (hadError && fallback != null) return <>{fallback}</>;

    return (
      <Img
        {...rest}
        ref={ref}
        src={src}
        alt={alt}
        data-valet-component='Image'
        width={nativeW}
        height={nativeH}
        $w={w}
        $h={h}
        $fit={fit}
        $ratio={ratio}
        $pos={objectPosition}
        $radius={r}
        loading={resolvedLoading}
        fetchPriority={resolvedFetchPriority}
        decoding={decodingAttr}
        onError={handleError}
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

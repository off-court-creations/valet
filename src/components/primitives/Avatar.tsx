// ─────────────────────────────────────────────────────────────
// src/components/primitives/Avatar.tsx  | valet
// User avatar with optional Gravatar fallback
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import { useTheme } from '../../system/themeStore';
import type { Presettable, Sx } from '../../types';
import { md5 } from '../../helpers/md5';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarVariant = 'plain' | 'outline';

export interface AvatarProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'style'>,
    Presettable {
  /** Image URL override. */
  src?: string;
  /** Email used for Gravatar lookup when src missing. */
  email?: string;
  /** Display name used to derive initials for offline fallback. */
  name?: string;
  /** Size token controlling relative dimensions. */
  size?: AvatarSize;
  /** Visual style variant. */
  variant?: AvatarVariant;
  /** Fallback style when no avatar exists. */
  gravatarDefault?: string;
  /** When true and no `src` is provided, prefer offline fallback instead of Gravatar. */
  preferFallback?: boolean;
  /** Offline fallback strategy when showing a non-network avatar. */
  fallback?: 'initials' | 'placeholder';
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

const sizeMap: Record<AvatarSize, string> = {
  xs: '1.5rem',
  sm: '2rem',
  md: '3rem',
  lg: '4rem',
  xl: '6rem',
};

const Img = styled('img')<{
  $size: string;
  $variant: AvatarVariant;
  $stroke: string;
}>`
  display: inline-block;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  border-radius: 50%;
  object-fit: cover;
  ${({ $variant, $stroke }) =>
    $variant === 'outline' ? `box-shadow: 0 0 0 0.25rem ${$stroke};` : ''}
`;

const Fallback = styled('div')<{
  $size: string;
  $variant: AvatarVariant;
  $stroke: string;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  border-radius: 50%;
  ${({ $variant, $stroke }) =>
    $variant === 'outline' ? `box-shadow: 0 0 0 0.25rem ${$stroke};` : ''}
  user-select: none;
  overflow: hidden;
`;

const Initials = styled('span')<{
  $color: string;
}>`
  font: 600 0.45em var(--valet-font-heading, system-ui, sans-serif);
  color: ${({ $color }) => $color};
`;

export const Avatar: React.FC<AvatarProps> = ({
  src,
  email,
  name,
  size = 'md',
  variant = 'plain',
  gravatarDefault = 'identicon',
  preferFallback = false,
  fallback = 'initials',
  preset: p,
  className,
  sx,
  loading = 'lazy',
  ...rest
}) => {
  const rem = sizeMap[size];
  const px = Math.round(parseFloat(rem) * 16);

  const [hadError, setHadError] = useState(false);

  const finalSrc = useMemo(() => {
    if (src) return src;
    if (preferFallback) return undefined;
    // Compute a stable hash so Gravatar serves a default image instead of a 404.
    const hash = md5((email ?? '').trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?s=${px}&d=${encodeURIComponent(gravatarDefault)}`;
  }, [src, email, gravatarDefault, px, preferFallback]);

  const { theme } = useTheme();
  const stroke = theme.colors.backgroundAlt;

  const presetCls = p ? preset(p) : '';
  const altText = (rest as React.ImgHTMLAttributes<HTMLImageElement>).alt;
  const ariaLabelText = (rest as unknown as Record<string, unknown>)['aria-label'] as
    | string
    | undefined;

  const computedInitials = useMemo(() => {
    const srcText = name || altText || ariaLabelText || email || '';
    const words = srcText.trim().split(/\s+/).filter(Boolean);
    const letters = words.length >= 2 ? words[0][0] + words[1][0] : srcText.slice(0, 2);
    return letters.toUpperCase();
  }, [name, altText, ariaLabelText, email]);

  const bg = useMemo(() => {
    // Derive a semi-stable background from name/email hash; fall back to theme backgroundAlt
    const key = (name || email || 'avatar').toLowerCase();
    const h = Math.abs(md5(key).charCodeAt(0) + md5(key).charCodeAt(1)) % 360;
    return `hsl(${h} 45% 40%)`;
  }, [name, email]);

  const fg = '#fff';

  if (!hadError && finalSrc) {
    return (
      <Img
        {...rest}
        src={finalSrc}
        data-valet-component='Avatar'
        $size={rem}
        $variant={variant}
        $stroke={stroke}
        loading={loading}
        onError={() => setHadError(true)}
        style={sx}
        className={[presetCls, className].filter(Boolean).join(' ')}
      />
    );
  }

  return (
    <Fallback
      {...(rest as unknown as React.HTMLAttributes<HTMLDivElement>)}
      role='img'
      aria-label={altText || ariaLabelText || name || 'avatar'}
      data-valet-component='Avatar'
      $size={rem}
      $variant={variant}
      $stroke={stroke}
      style={{ background: bg, ...sx }}
      className={[presetCls, className].filter(Boolean).join(' ')}
    >
      {fallback === 'placeholder' ? (
        <svg
          width='60%'
          height='60%'
          viewBox='0 0 24 24'
          fill={fg}
          aria-hidden='true'
        >
          <path d='M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 2.239-7 5v3h14v-3c0-2.761-3.134-5-7-5z' />
        </svg>
      ) : (
        <Initials $color={fg}>{computedInitials}</Initials>
      )}
    </Fallback>
  );
};

export default Avatar;

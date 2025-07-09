// ─────────────────────────────────────────────────────────────
// src/components/Avatar.tsx  | valet
// User avatar with optional Gravatar fallback
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../css/createStyled';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';
import { md5 } from '../helpers/md5';

export type AvatarSize = 'xs' | 's' | 'm' | 'l' | 'xl';

export interface AvatarProps
  extends React.ImgHTMLAttributes<HTMLImageElement>,
    Presettable {
  /** Image URL override. */
  src?: string;
  /** Email used for Gravatar lookup when src missing. */
  email?: string;
  /** Size token controlling relative dimensions. */
  size?: AvatarSize;
  /** Fallback style when no avatar exists. */
  gravatarDefault?: string;
}

const sizeMap: Record<AvatarSize, string> = {
  xs: '1.5rem',
  s : '2rem',
  m : '3rem',
  l : '4rem',
  xl: '6rem',
};

const Img = styled('img')<{ $size: string }>`
  display: inline-block;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  border-radius: 50%;
  object-fit: cover;
`;

export const Avatar: React.FC<AvatarProps> = ({
  src,
  email,
  size = 'm',
  gravatarDefault = 'identicon',
  preset: p,
  className,
  ...rest
}) => {
  const rem = sizeMap[size];
  const px = Math.round(parseFloat(rem) * 16);

  let finalSrc = src;
  if (!finalSrc) {
    const hash = email ? md5(email.trim().toLowerCase()) : '';
    finalSrc = `https://www.gravatar.com/avatar/${hash}?s=${px}&d=${encodeURIComponent(gravatarDefault)}`;
  }

  const presetCls = p ? preset(p) : '';
  return (
    <Img
      {...rest}
      src={finalSrc}
      $size={rem}
      className={[presetCls, className].filter(Boolean).join(' ')}
    />
  );
};

export default Avatar;

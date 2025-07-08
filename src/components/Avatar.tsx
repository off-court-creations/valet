// ─────────────────────────────────────────────────────────────
// src/components/Avatar.tsx  | valet
// User avatar with optional Gravatar fallback
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../css/createStyled';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';
import { md5 } from '../helpers/md5';

export interface AvatarProps
  extends React.ImgHTMLAttributes<HTMLImageElement>,
    Presettable {
  /** Image URL override. */
  src?: string;
  /** Email used for Gravatar lookup when src missing. */
  email?: string;
  /** Square pixel size. Defaults to 48. */
  size?: number;
  /** Fallback style when no avatar exists. */
  gravatarDefault?: string;
}

const Img = styled('img')<{ $size: number }>`
  display: inline-block;
  width: ${({ $size }) => `${$size}px`};
  height: ${({ $size }) => `${$size}px`};
  border-radius: 50%;
  object-fit: cover;
`;

export const Avatar: React.FC<AvatarProps> = ({
  src,
  email,
  size = 48,
  gravatarDefault = 'identicon',
  preset: p,
  className,
  ...rest
}) => {
  let finalSrc = src;
  if (!finalSrc) {
    const hash = email ? md5(email.trim().toLowerCase()) : '';
    finalSrc = `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${encodeURIComponent(gravatarDefault)}`;
  }
  const presetCls = p ? preset(p) : '';
  return (
    <Img
      {...rest}
      src={finalSrc}
      $size={size}
      className={[presetCls, className].filter(Boolean).join(' ')}
    />
  );
};

export default Avatar;

// ─────────────────────────────────────────────────────────────
// src/components/Avatar.tsx  | valet
// simple user avatar with Gravatar fallback
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../css/createStyled';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';
import { md5 } from '../helpers/md5';

export interface AvatarProps
  extends React.ImgHTMLAttributes<HTMLImageElement>,
    Presettable {
  /** Email used for Gravatar lookup. */
  email?: string;
  /** Image source URL. Overrides Gravatar. */
  src?: string;
  /** Width/height in CSS units. Default 40. */
  size?: number | string;
  /** Round image with 50% border radius. */
  round?: boolean;
}

const Img = styled('img')<{ $size: string; $round: boolean }>`
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  border-radius: ${({ $round }) => ($round ? '50%' : '4px')};
  object-fit: cover;
`;

export const Avatar: React.FC<AvatarProps> = ({
  email,
  src,
  size = 40,
  round = true,
  preset: p,
  className,
  style,
  alt,
  ...rest
}) => {
  const finalSize = typeof size === 'number' ? `${size}px` : size;
  const sizePx = parseInt(finalSize, 10) || 80;
  const gravatar = email
    ? `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=identicon&s=${sizePx}`
    : undefined;
  const presetCls = p ? preset(p) : '';
  return (
    <Img
      src={src || gravatar}
      alt={alt ?? ''}
      $size={finalSize}
      $round={round}
      className={[presetCls, className].filter(Boolean).join(' ')}
      style={style}
      {...rest}
    />
  );
};

export default Avatar;

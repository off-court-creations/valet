// ─────────────────────────────────────────────────────────────
// src/components/Breadcrumbs.tsx  | valet
// simple breadcrumb navigation component
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
export interface Crumb {
  label: React.ReactNode;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export interface BreadcrumbsProps
  extends React.HTMLAttributes<HTMLElement>,
    Presettable {
  items: Crumb[];
  separator?: React.ReactNode;
}

/*───────────────────────────────────────────────────────────*/
const Nav = styled('nav')<{ $color: string }>`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
  color: ${({ $color }) => $color};

  a {
    color: inherit;
    text-decoration: none;
  }
`;

/*───────────────────────────────────────────────────────────*/
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator = '/',
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const presetClass = p ? preset(p) : '';

  return (
    <Nav
      {...rest}
      aria-label="breadcrumbs"
      $color={theme.colors.text}
      className={[presetClass, className].filter(Boolean).join(' ')}
      style={style}
    >
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span aria-hidden="true">{separator}</span>}
          {item.href ? (
            <a href={item.href} onClick={item.onClick}>{item.label}</a>
          ) : (
            <span>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </Nav>
  );
};

export default Breadcrumbs;

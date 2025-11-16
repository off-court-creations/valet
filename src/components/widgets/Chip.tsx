// ─────────────────────────────────────────────────────────────
// src/components/widgets/Chip.tsx  | valet
// Compact label with optional icon/avatar and removal action
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import type { Presettable, Sx } from '../../types';
import { useTheme } from '../../system/themeStore';
import type { Theme } from '../../system/themeStore';
import { Icon } from '../primitives/Icon';
import { toRgb, mix, toHex } from '../../helpers/color';
import { Typography } from '../primitives/Typography';

export type ChipSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ChipVariant = 'filled' | 'outlined' | 'plain';
type Intent =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | (string & {});

export interface ChipProps
  extends Presettable,
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'style' | 'children' | 'onClick' | 'role' | 'tabIndex'
    > {
  label: React.ReactNode;
  size?: ChipSize;
  variant?: ChipVariant;
  /** Semantic color intent mapping to theme tokens. */
  intent?: Intent;
  /** Explicit color override (theme token or CSS color). */
  color?: string;
  icon?: string; // iconify name for leading icon
  avatar?: React.ReactNode; // custom leading element
  onDelete?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  sx?: Sx;
}

const sizeMap: Record<
  ChipSize,
  { h: string; padX: string; gap: string; fz: string; icon: number }
> = {
  xs: { h: '1.25rem', padX: '0.375rem', gap: '0.25rem', fz: '0.75rem', icon: 12 },
  sm: { h: '1.5rem', padX: '0.5rem', gap: '0.25rem', fz: '0.8125rem', icon: 14 },
  md: { h: '2rem', padX: '0.75rem', gap: '0.375rem', fz: '0.9rem', icon: 16 },
  lg: { h: '2.5rem', padX: '0.875rem', gap: '0.5rem', fz: '1rem', icon: 18 },
  xl: { h: '3rem', padX: '1rem', gap: '0.5rem', fz: '1.125rem', icon: 20 },
};

const Root = styled('div')<{
  $bg: string;
  $fg: string;
  $bd: string;
  $variant: ChipVariant;
  $h: string;
  $padX: string;
  $gap: string;
  $disabled?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  width: auto;
  max-width: 100%;
  min-width: 0;
  flex: 0 0 auto;
  align-self: flex-start;
  height: ${({ $h }) => $h};
  padding: 0 ${({ $padX }) => $padX};
  gap: ${({ $gap }) => $gap};
  border-radius: 999px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'default')};
  user-select: none;
  transition:
    background-color 120ms ease,
    color 120ms ease,
    box-shadow 120ms ease;
  white-space: nowrap;
  ${({ $variant, $bg, $fg, $bd }) =>
    $variant === 'filled'
      ? `background: ${$bg}; color: ${$fg};`
      : $variant === 'outlined'
        ? `background: transparent; color: ${$bg}; box-shadow: inset 0 0 0 1px ${$bd};`
        : `background: transparent; color: ${$bg};`}
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  &:focus-visible {
    outline: 2px solid var(--valet-focus-ring, currentColor);
    outline-offset: 2px;
  }
`;

const LabelWrap = styled('div')`
  display: inline-block;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DeleteBtn = styled('button')<{ $fz: number }>`
  appearance: none;
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0 0 0 0.125rem;
  width: ${({ $fz }) => `${Math.round($fz + 6)}px`};
  height: ${({ $fz }) => `${Math.round($fz + 6)}px`};
  border-radius: 50%;
  cursor: pointer;
  color: currentColor;
  opacity: 0.9;
  &:hover {
    opacity: 1;
  }
`;

function resolveColors(theme: Theme, intent?: Intent, override?: string) {
  const colors = theme.colors as Record<string, string>;
  const token = override
    ? colors[override] || override
    : intent
      ? colors[String(intent)]
      : undefined;
  const bg = token ?? theme.colors.backgroundAlt;
  const equals = (a?: string, b?: string) => (a || '').toUpperCase() === (b || '').toUpperCase();
  const fg = equals(bg, theme.colors.primary)
    ? theme.colors.primaryText
    : equals(bg, theme.colors.secondary)
      ? theme.colors.secondaryText
      : equals(bg, theme.colors.tertiary)
        ? theme.colors.tertiaryText
        : equals(bg, theme.colors.error)
          ? theme.colors.errorText
          : theme.colors.text;
  return { bg, fg, bd: bg };
}

export const Chip: React.FC<ChipProps> = ({
  label,
  size = 'md',
  variant = 'filled',
  intent,
  color,
  icon,
  avatar,
  onDelete,
  disabled,
  className,
  preset: p,
  sx,
  ...rest
}) => {
  const { theme } = useTheme();
  const s = sizeMap[size];
  const { bg, fg, bd } = resolveColors(theme, intent, color);
  const presetCls = p ? preset(p) : '';
  const sizeScaleMap: Record<ChipSize, number> = {
    xs: 0.85,
    sm: 0.9,
    md: 1,
    lg: 1.1,
    xl: 1.2,
  };
  // Chips are static descriptors; strip any attempted interactivity props so the DOM stays inert.
  const domProps = { ...rest } as Record<string, unknown>;

  if (process.env.NODE_ENV !== 'production') {
    if ('onClick' in domProps) {
      console.warn(
        'Chip: `onClick` is unsupported. Chips are static descriptors — use a Button or Menu action instead.',
      );
    }
    if ('role' in domProps || 'tabIndex' in domProps) {
      console.warn(
        'Chip: interactive roles/tabIndex are ignored. Chips are never focusable inputs.',
      );
    }
  }

  delete (domProps as { onClick?: unknown }).onClick;
  delete (domProps as { role?: unknown }).role;
  delete (domProps as { tabIndex?: unknown }).tabIndex;

  return (
    <Root
      {...(domProps as React.HTMLAttributes<HTMLDivElement>)}
      $bg={bg}
      $fg={fg}
      $bd={bd}
      $variant={variant}
      $h={s.h}
      $padX={s.padX}
      $gap={s.gap}
      $disabled={disabled}
      style={
        {
          '--valet-intent-bg': bg,
          '--valet-intent-fg': fg,
          '--valet-intent-border': bd,
          '--valet-intent-focus': theme.colors.primary,
          '--valet-intent-bg-hover':
            variant === 'filled' ? toHex(mix(toRgb(bg), toRgb(fg), 0.12)) : 'transparent',
          '--valet-intent-bg-active':
            variant === 'filled' ? toHex(mix(toRgb(bg), toRgb(fg), 0.2)) : 'transparent',
          '--valet-intent-fg-disabled': toHex(mix(toRgb(fg), toRgb(theme.colors.background), 0.5)),
          ...(sx as object),
        } as React.CSSProperties
      }
      className={[presetCls, className].filter(Boolean).join(' ')}
      aria-disabled={disabled || undefined}
    >
      {avatar ||
        (icon ? (
          <Icon
            icon={icon}
            size={s.icon}
          />
        ) : null)}
      <LabelWrap>
        <Typography
          variant='button'
          noSelect
          scale={sizeScaleMap[size]}
        >
          {label}
        </Typography>
      </LabelWrap>
      {onDelete && !disabled ? (
        <DeleteBtn
          aria-label='Remove'
          title='Remove'
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(e);
          }}
          $fz={s.icon}
        >
          <Icon
            icon='mdi:close'
            size={s.icon}
          />
        </DeleteBtn>
      ) : null}
    </Root>
  );
};

export default Chip;

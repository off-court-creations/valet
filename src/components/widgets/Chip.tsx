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
import { Typography } from '../primitives/Typography';

export type ChipSize = 's' | 'm' | 'l';
export type ChipVariant = 'filled' | 'outlined';
export type ChipColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'error'
  | 'success'
  | 'warning'
  | 'info';

export interface ChipProps
  extends Presettable,
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'style' | 'children' | 'onClick' | 'role' | 'tabIndex'
    > {
  label: React.ReactNode;
  size?: ChipSize;
  variant?: ChipVariant;
  color?: ChipColor;
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
  s: { h: '1.5rem', padX: '0.5rem', gap: '0.25rem', fz: '0.8125rem', icon: 14 },
  m: { h: '2rem', padX: '0.75rem', gap: '0.375rem', fz: '0.9rem', icon: 16 },
  l: { h: '2.5rem', padX: '0.875rem', gap: '0.5rem', fz: '1rem', icon: 18 },
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
      : `background: transparent; color: ${$fg}; box-shadow: inset 0 0 0 1px ${$bd};`}
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

function resolveColors(theme: Theme, color?: ChipColor) {
  const c = color || 'default';
  const map: Record<ChipColor, { bg: string; fg: string; bd: string }> = {
    default: { bg: theme.colors.backgroundAlt, fg: theme.colors.text, bd: theme.colors.divider },
    primary: { bg: theme.colors.primary, fg: theme.colors.primaryText, bd: theme.colors.primary },
    secondary: {
      bg: theme.colors.secondary,
      fg: theme.colors.secondaryText,
      bd: theme.colors.secondary,
    },
    tertiary: {
      bg: theme.colors.tertiary,
      fg: theme.colors.tertiaryText,
      bd: theme.colors.tertiary,
    },
    error: { bg: theme.colors.error, fg: theme.colors.errorText, bd: theme.colors.error },
    success: {
      bg: theme.colors.success || theme.colors.primary,
      fg: theme.colors.primaryText,
      bd: theme.colors.success || theme.colors.primary,
    },
    warning: {
      bg: theme.colors.warning || theme.colors.secondary,
      fg: theme.colors.secondaryText,
      bd: theme.colors.warning || theme.colors.secondary,
    },
    info: {
      bg: theme.colors.info || theme.colors.tertiary,
      fg: theme.colors.tertiaryText,
      bd: theme.colors.info || theme.colors.tertiary,
    },
  };
  return map[c];
}

export const Chip: React.FC<ChipProps> = ({
  label,
  size = 'm',
  variant = 'filled',
  color = 'default',
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
  const { bg, fg, bd } = resolveColors(theme, color);
  const presetCls = p ? preset(p) : '';
  const sizeScaleMap: Record<ChipSize, number> = { s: 0.9, m: 1, l: 1.1 };
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
      style={sx}
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

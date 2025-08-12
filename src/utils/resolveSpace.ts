// ──────────────────────────────────────────────────────────────
// src/utils/resolveSpace.ts | valet
// map number or string spacing with theme.spacing
// ──────────────────────────────────────────────────────────────
import type { Theme } from '../system/themeStore';

export const resolveSpace = (
  value: number | string | undefined,
  theme: Theme,
  compact?: boolean,
  fallback = 1,
): string => {
  if (compact) return '0';
  if (typeof value === 'number') return theme.spacing(value);
  if (typeof value === 'string') return value;
  return theme.spacing(fallback);
};

export default resolveSpace;

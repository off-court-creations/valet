// ─────────────────────────────────────────────────────────────
// src/hooks/useResponsiveDrawer.ts  | valet
// persistent drawers when wide enough
// ─────────────────────────────────────────────────────────────
import { useMemo } from 'react';
import { useSurface } from '../components/Surface';

/**
 * Determines if a Drawer should stay persistent based on
 * current Surface width and desired ratio.
 *
 * @param size  Drawer size in px or any CSS length.
 * @param ratio Portion of the Surface width required for persistence.
 */
export function useResponsiveDrawer(
  size: number | string,
  ratio = 0.4,
): boolean {
  const { width } = useSurface();

  const toPx = (val: number | string): number => {
    if (typeof val === 'number') return val;
    const n = parseFloat(val);
    if (val.endsWith('px')) return n;
    if (val.endsWith('rem') || val.endsWith('em')) {
      const base =
        typeof window !== 'undefined'
          ? parseFloat(getComputedStyle(document.documentElement).fontSize)
          : 16;
      return n * base;
    }
    if (val.endsWith('vw')) return (n / 100) * window.innerWidth;
    if (val.endsWith('vh')) return (n / 100) * window.innerHeight;
    return n;
  };

  const px = useMemo(() => toPx(size), [size]);

  return px <= width * ratio;
}

export default useResponsiveDrawer;

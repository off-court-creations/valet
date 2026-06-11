// ─────────────────────────────────────────────────────────────
// src/components/layout/Surface.tsx  | valet
// overhaul: density-controlled spacing via --valet-space – 2025-08-12
// perf: shallow selector, measure() bail, rAF-coalesced observers
// ─────────────────────────────────────────────────────────────
import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { shallow } from 'zustand/shallow';
import { Breakpoint, Density, useTheme } from '../../system/themeStore';
import { useFonts } from '../../system/fontStore';
import LoadingBackdrop from '../widgets/LoadingBackdrop';
import {
  createSurfaceStore,
  SurfaceCtx,
  useSurface as useSurfaceState,
} from '../../system/surfaceStore';
import { preset } from '../../css/stylePresets';
import { valetError } from '../../system/devErrors';
import type { Presettable, Sx } from '../../types';

/* Allow strongly-typed CSS custom properties (e.g. --valet-*) */
type CSSVarName = `--${string}`;
type CSSVarStyles = React.CSSProperties & Record<CSSVarName, string | number>;

/*───────────────────────────────────────────────────────────*/
export interface SurfaceProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>,
    Presettable {
  /** Fixed-position full-screen surface when true (default). */
  fullscreen?: boolean;
  /** Optional density override for spacing scale */
  density?: Density;
  /** Alias: when true, maps to density='compact' (no override when false). */
  compact?: boolean;
  /**
   * When true, block content visibility until fonts load (FOIT).
   * Defaults to false for immediate first paint using fallbacks.
   */
  blockUntilFonts?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
export const Surface: React.FC<SurfaceProps> = ({
  children,
  sx,
  preset: p,
  className,
  fullscreen = true,
  density,
  compact: compactAlias,
  blockUntilFonts = false,
  ...props
}) => {
  /* Prevent nested surfaces ------------------------------------------- */
  const parent = useContext(SurfaceCtx);
  if (parent)
    throw valetError(
      'Surface',
      'Nested <Surface> components are not allowed — each screen mounts exactly one. Remove the inner <Surface> and use <Box> or <Panel> for sub-regions.',
      'surface',
    );

  /* Local reactive store (width / height / breakpoint) ----------------- */
  const storeRef = useRef<ReturnType<typeof createSurfaceStore> | null>(null);
  if (!storeRef.current) storeRef.current = createSurfaceStore();
  const useStore = storeRef.current;

  const ref = useRef<HTMLDivElement>(null);
  const { theme, density: globalDensity } = useTheme();
  const fontsReady = useFonts((s) => s.ready);
  const [showBackdrop, setShowBackdrop] = useState(blockUntilFonts ? !fontsReady : false);
  const [fade, setFade] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  const presetClasses = p ? preset(p) : '';

  const { width, height } = useStore(
    (s) => ({
      width: s.width,
      height: s.height,
    }),
    shallow,
  );

  /* Helper: resolve breakpoint for given width ------------------------- */
  const bpFor = useCallback(
    (w: number): Breakpoint =>
      (Object.entries(theme.breakpoints) as [Breakpoint, number][]).reduce<Breakpoint>(
        (acc, [key, min]) => (w >= min ? key : acc),
        'xs',
      ),
    [theme.breakpoints],
  );

  /* Measure size whenever the element or its children change ----------- */
  /* Scroll cannot change the surface's own geometry, so there is no
     scroll listener here — ResizeObserver + MutationObserver cover
     every case measure() can act on. */
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    useStore.setState({ element: node });
    const measure = () => {
      const rect = node.getBoundingClientRect();
      const width = rect.width;
      const height = Math.round(rect.height);
      const breakpoint = bpFor(width);
      const hasScrollbar = node.scrollHeight > node.clientHeight;
      const s = useStore.getState();
      /* Bail without notifying subscribers when nothing changed. */
      if (
        s.width === width &&
        s.height === height &&
        s.breakpoint === breakpoint &&
        s.hasScrollbar === hasScrollbar
      )
        return;
      useStore.setState({ width, height, breakpoint, hasScrollbar });
    };
    /* rAF-coalesce observer storms into one measure per frame. */
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };
    const ro = new ResizeObserver(schedule);
    const mo = new MutationObserver(schedule);
    ro.observe(node);
    mo.observe(node, { childList: true, subtree: true });
    measure();
    return () => {
      ro.disconnect();
      mo.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [bpFor, useStore]);

  /* Font-loading backdrop handling ------------------------------------- */
  useEffect(() => {
    if (!blockUntilFonts) {
      setShowBackdrop(false);
      setShowSpinner(false);
      return;
    }
    if (!fontsReady) {
      setShowBackdrop(true);
      setFade(false);
      setShowSpinner(false);
      return;
    }
    setFade(true);
    const t = setTimeout(() => setShowBackdrop(false), 200);
    setShowSpinner(false);
    return () => clearTimeout(t);
  }, [fontsReady, blockUntilFonts]);

  useEffect(() => {
    if (!blockUntilFonts) {
      setShowSpinner(false);
      return;
    }
    if (fontsReady) {
      setShowSpinner(false);
      return;
    }
    const t = setTimeout(() => {
      if (!useFonts.getState().ready) setShowSpinner(true);
    }, 1250);
    return () => clearTimeout(t);
  }, [fontsReady, blockUntilFonts]);

  /* Defaults + CSS custom properties ----------------------------------- */
  const defaults: React.CSSProperties = {
    background: theme.colors.background,
    color: theme.colors.text,
  };

  const cssVars: CSSVarStyles = {
    '--valet-bg': theme.colors.background,
    '--valet-text-color': theme.colors.text,
    // Quote family names to preserve spaces; include sensible fallbacks
    '--valet-font-heading': `'${theme.fonts.heading}', sans-serif`,
    '--valet-font-body': `'${theme.fonts.body}', sans-serif`,
    '--valet-font-mono': `'${theme.fonts.mono}', monospace`,
    '--valet-font-button': `'${theme.fonts.button}', sans-serif`,
  };

  /* Layout: fixed full-screen or flow-based ---------------------------- */
  const layoutStyles: React.CSSProperties = fullscreen
    ? {
        position: 'fixed',
        inset: 0,
        paddingTop: 'env(safe-area-inset-top)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        overflow: 'auto', // ← never show scrollbars on a surface
      }
    : {
        position: 'relative',
        width: '100%',
        height: 'auto',
        overflow: 'auto',
      };

  const gap = theme.spacing(1);

  /* Density → --valet-space ------------------------------------------- */
  // Public density tokens: 'compact' | 'standard' | 'comfortable'.
  // Alias: compact?: true ⇒ density='compact'.
  const effectiveDensity: Density =
    (density as Density | undefined) ?? (compactAlias ? 'compact' : globalDensity);
  const scale =
    effectiveDensity === 'comfortable' ? 1.15 : effectiveDensity === 'standard' ? 1.0 : 0.9;
  const spaceVar = `calc(${theme.spacingUnit} * ${scale})`;

  const containerStyle: CSSVarStyles = {
    ...layoutStyles,
    ...defaults,
    ...cssVars,
    '--valet-space': spaceVar,
    '--valet-radius': theme.radiusUnit,
    '--valet-stroke': theme.strokeUnit,
    '--valet-divider': theme.colors.divider,
    '--valet-focus-width': theme.stroke(2),
    '--valet-focus-offset': theme.stroke(2),
    '--valet-divider-stroke': theme.stroke(1),
    '--valet-focus-ring-color': theme.colors.primary,
    '--valet-screen-width': `${width}px`,
    '--valet-screen-height': `${Math.round(height)}px`,
    ...(sx ?? {}),
  };

  return (
    <SurfaceCtx.Provider value={useStore}>
      <div
        ref={ref}
        {...props}
        data-valet-surface-root=''
        data-valet-component='Surface'
        className={[presetClasses, className].filter(Boolean).join(' ')}
        style={containerStyle}
      >
        {showBackdrop && (
          <LoadingBackdrop
            fading={fade}
            showSpinner={showSpinner}
          />
        )}
        {/* Inner wrapper gains padding but NO scrollbars */}
        <div
          style={{
            visibility: blockUntilFonts ? (fontsReady ? 'visible' : 'hidden') : 'visible',
            padding: gap,
            maxWidth: '100%',
            maxHeight: '100%',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </div>
      </div>
    </SurfaceCtx.Provider>
  );
};

export default Surface;
export { useSurfaceState as useSurface };

// ─────────────────────────────────────────────────────────────
// src/components/layout/Surface.tsx  | valet
// overhaul: density-controlled spacing via --valet-space – 2025-08-12
// ─────────────────────────────────────────────────────────────
import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Breakpoint, Density, useTheme } from '../../system/themeStore';
import { useFonts } from '../../system/fontStore';
import LoadingBackdrop from '../widgets/LoadingBackdrop';
import {
  createSurfaceStore,
  SurfaceCtx,
  useSurface as useSurfaceState,
} from '../../system/surfaceStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

/* Allow strongly-typed CSS custom properties (e.g. --valet-*) */
type CSSVarName = `--${string}`;
type CSSVarStyles = React.CSSProperties & Record<CSSVarName, string | number>;

/*───────────────────────────────────────────────────────────*/
export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement>, Presettable {
  /** Fixed-position full-screen surface when true (default). */
  fullscreen?: boolean;
  /** Optional density override for spacing scale */
  density?: Density;
}

/*───────────────────────────────────────────────────────────*/
export const Surface: React.FC<SurfaceProps> = ({
  children,
  style,
  preset: p,
  className,
  fullscreen = true,
  density,
  ...props
}) => {
  /* Prevent nested surfaces ------------------------------------------- */
  const parent = useContext(SurfaceCtx);
  if (parent) throw new Error('Nested <Surface> components are not allowed');

  /* Local reactive store (width / height / breakpoint) ----------------- */
  const storeRef = useRef<ReturnType<typeof createSurfaceStore> | null>(null);
  if (!storeRef.current) storeRef.current = createSurfaceStore();
  const useStore = storeRef.current;

  const ref = useRef<HTMLDivElement>(null);
  const { theme, density: globalDensity } = useTheme();
  const fontsReady = useFonts((s) => s.ready);
  const [showBackdrop, setShowBackdrop] = useState(!fontsReady);
  const [fade, setFade] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  const presetClasses = p ? preset(p) : '';

  const { width, height } = useStore((s) => ({
    width: s.width,
    height: s.height,
  }));

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
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    useStore.setState((s) => ({ ...s, element: node }));
    const measure = () => {
      const rect = node.getBoundingClientRect();
      useStore.setState((s) => ({
        ...s,
        width: rect.width,
        height: Math.round(rect.height),
        breakpoint: bpFor(rect.width),
      }));
    };
    const ro = new ResizeObserver(measure);
    const mo = new MutationObserver(measure);
    ro.observe(node);
    mo.observe(node, { childList: true, subtree: true });
    measure();
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [bpFor, useStore]);

  /* Font-loading backdrop handling ------------------------------------- */
  useEffect(() => {
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
  }, [fontsReady]);

  useEffect(() => {
    if (fontsReady) {
      setShowSpinner(false);
      return;
    }
    const t = setTimeout(() => {
      if (!useFonts.getState().ready) setShowSpinner(true);
    }, 1250);
    return () => clearTimeout(t);
  }, [fontsReady]);

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
  const dens: Density = density ?? globalDensity;
  const scale = dens === 'comfortable' ? 1 : dens === 'compact' ? 0.75 : dens === 'tight' ? 0.5 : 0;
  const spaceVar = `calc(${theme.spacingUnit} * ${scale})`;

  const containerStyle: CSSVarStyles = {
    ...layoutStyles,
    ...defaults,
    ...cssVars,
    '--valet-space': spaceVar,
    '--valet-radius': theme.radiusUnit,
    '--valet-stroke': theme.strokeUnit,
    '--valet-focus-width': theme.stroke(2),
    '--valet-focus-offset': theme.stroke(2),
    '--valet-divider-stroke': theme.stroke(1),
    '--valet-screen-width': `${width}px`,
    '--valet-screen-height': `${Math.round(height)}px`,
    ...(style ?? {}),
  };

  return (
    <SurfaceCtx.Provider value={useStore}>
      <div
        ref={ref}
        {...props}
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
            visibility: fontsReady ? 'visible' : 'hidden',
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

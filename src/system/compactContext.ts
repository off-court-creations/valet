// ─────────────────────────────────────────────────────────────
// src/system/compactContext.ts | valet
// compact cascade: a container with `compact` zeros its own layout
// spacing AND forces every spacing-aware descendant to do the same,
// propagated by React context. Orthogonal to the density scale — see
// `Density` in themeStore.ts (compact zeros spacing; density scales it).
// ─────────────────────────────────────────────────────────────
import { createContext, useContext } from 'react';

/**
 * Inherited `compact` flag for a subtree. Default `false` (no provider in scope
 * ⇒ normal spacing). A spacing-aware container reads it with {@link useCompact}
 * and, when it owns a `compact` prop, re-provides the resolved value to its
 * descendants via `CompactCtx.Provider`. Context crosses React portals by tree
 * position, so portalled content (Modal, Select menu) inherits correctly.
 */
export const CompactCtx = createContext<boolean>(false);

/**
 * Resolve the effective `compact` for a component, blending its own prop with
 * the inherited value:
 *
 * - `own === true`      → forced compact (and propagated where the component provides).
 * - `own === false`     → explicit opt-out, even inside a compact ancestor.
 * - `own === undefined` → inherit the nearest ancestor's value.
 */
export const useCompact = (own?: boolean): boolean => {
  const inherited = useContext(CompactCtx);
  return own ?? inherited;
};

export default useCompact;

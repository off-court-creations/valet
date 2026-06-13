// ─────────────────────────────────────────────────────────────
// src/components/layout/resolveAnchor.ts | valet
// A11Y S12 — pure anchor resolver for Drawer's additive logical
// 'start'/'end' anchor values.
//
// The Drawer paints with PHYSICAL geometry ($anchor drives the
// accent border, edge-pinning and slide transform — see Drawer.tsx,
// all annotated `rtl: physical-by-design`). To offer direction-aware
// placement WITHOUT touching that physical math, the public `anchor`
// prop additionally accepts the logical values 'start'/'end'; this
// helper collapses them to a physical side at the component boundary
// given the active writing direction.
//
//   dir='ltr':  start → left,  end → right
//   dir='rtl':  start → right, end → left
//
// 'left'/'right'/'top'/'bottom' pass through UNCHANGED in every
// direction, so an explicit physical anchor never flips under RTL —
// only the logical 'start'/'end' values follow `dir`. This keeps the
// existing API byte-compatible while adding opt-in logical anchors.
// ─────────────────────────────────────────────────────────────
import type { ValetDir } from '../../system/locale';

/** Physical drawer sides — the only values the painting logic understands. */
export type PhysicalDrawerAnchor = 'left' | 'right' | 'top' | 'bottom';

/** Logical drawer sides — resolved to physical via {@link resolveAnchor}. */
export type LogicalDrawerAnchor = 'start' | 'end';

/** Public anchor prop: physical sides plus additive logical 'start'/'end'. */
export type DrawerAnchorInput = PhysicalDrawerAnchor | LogicalDrawerAnchor;

/**
 * Resolve a (possibly logical) drawer anchor to a physical side for the given
 * writing direction. Pure — no DOM, no React, no side effects.
 *
 * • 'start'/'end' map to left/right per `dir` (LTR: start=left, end=right;
 *   RTL: start=right, end=left).
 * • 'left'/'right'/'top'/'bottom' are returned unchanged — explicit physical
 *   anchors are direction-invariant by design.
 *
 * @param anchor the public `anchor` prop value.
 * @param dir    the active writing direction ('ltr' | 'rtl').
 */
export function resolveAnchor(anchor: DrawerAnchorInput, dir: ValetDir): PhysicalDrawerAnchor {
  if (anchor === 'start') return dir === 'rtl' ? 'right' : 'left';
  if (anchor === 'end') return dir === 'rtl' ? 'left' : 'right';
  return anchor;
}

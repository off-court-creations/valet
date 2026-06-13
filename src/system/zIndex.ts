// ─────────────────────────────────────────────────────────────
// src/system/zIndex.ts | valet
// One TS-defined z-index scale for the whole library (OVERLAY S7,
// adopted Q3(a)). Every overlaying surface stacks on this single
// ordered scale instead of the ad-hoc literals it grew from
// (AppBar 10000, Snackbar 1000, Tooltip 1200, Drawer 9999 …).
//
// Layer order (low → high):
//   fab 1050 < appbar 1100 < modalBackdrop 1390 < modal 1400
//   < dropdown 1450 < snackbar 1500 < tooltip 1600
//
// Rationale (matches Modal's own long-standing code comment): the
// AppBar dims *under* a modal backdrop, while transient feedback —
// dropdown menus, snackbars and tooltips — float *above* modals so
// they remain visible while a dialog is open. Tooltips sit highest
// because they can be triggered from anything, snackbars above the
// menus they may need to confirm.
//
// The values are exposed three ways:
//   • `VALET_ZINDEX` — the const record, the single source of truth
//     (public, re-exported from the package root for consumers who
//     need to interleave their own layers);
//   • `zVar(layer)` — emits `var(--valet-zindex-<layer>, <fallback>)`
//     so a host app can override any layer by setting the custom
//     property on a wrapping element, falling back to the baked-in
//     number when it is unset;
//   • `--valet-zindex-*` custom-property names via `zIndexVarName`.
//
// REPO RULE (enforced by zIndex.repo.test.ts): no styled template or
// inline style anywhere else in src/ may use a literal z-index ≥ 1000.
// Overlaying layers route through `zVar(...)` (or the bare custom
// property when only a string is wanted) so the scale stays the one
// place the order is defined.
// ─────────────────────────────────────────────────────────────

/** Ordered z-index scale. Keys are the canonical layer names. */
export const VALET_ZINDEX = {
  /** Floating action button (SpeedDial) — sits below the app bar. */
  fab: 1050,
  /** Application bar — dims beneath a modal backdrop. */
  appbar: 1100,
  /** Modal scrim/backdrop. */
  modalBackdrop: 1390,
  /** Modal / Drawer panel. */
  modal: 1400,
  /** Select (and future popup) dropdown menus — above modals. */
  dropdown: 1450,
  /** Snackbar / toast notifications — above dropdowns. */
  snackbar: 1500,
  /** Tooltips — the top of the stack. */
  tooltip: 1600,
} as const;

/** Canonical layer name (a key of {@link VALET_ZINDEX}). */
export type ZIndexLayer = keyof typeof VALET_ZINDEX;

/** camelCase layer → kebab-case CSS custom-property suffix. */
function kebab(layer: ZIndexLayer): string {
  return layer.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * The `--valet-zindex-<layer>` custom-property name for a layer.
 * e.g. `zIndexVarName('modalBackdrop') === '--valet-zindex-modal-backdrop'`.
 */
export function zIndexVarName(layer: ZIndexLayer): string {
  return `--valet-zindex-${kebab(layer)}`;
}

/**
 * Emit `var(--valet-zindex-<layer>, <fallback>)` for use as a CSS
 * `z-index` value. The fallback is the scale's baked-in number, so the
 * layer renders correctly with no provider while still honouring a
 * host override of the custom property.
 */
export function zVar(layer: ZIndexLayer): string {
  return `var(${zIndexVarName(layer)}, ${VALET_ZINDEX[layer]})`;
}

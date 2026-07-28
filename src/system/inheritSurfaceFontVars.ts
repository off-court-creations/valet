// ─────────────────────────────────────────────────────────────
// src/system/inheritSurfaceFontVars.ts  | valet
// mirror Surface presentation CSS variables into a portal root
// ─────────────────────────────────────────────────────────────

/**
 * Copies inherited presentation CSS variables from a source element (typically
 * a Surface root) onto a target root (e.g., a portal container) so portalled
 * content keeps matching typography, layout, and focus-ring tokens.
 */
export function inheritSurfaceFontVars(target: HTMLElement, source?: HTMLElement | null) {
  const src = source ?? document.querySelector('[data-valet-surface-root]') ?? document.body;
  if (!src || !target) return;
  const cs = getComputedStyle(src as Element);

  const keys = [
    '--valet-font-heading',
    '--valet-font-body',
    '--valet-font-mono',
    '--valet-font-button',
    '--valet-text-color',
    '--valet-bg',
    '--valet-space',
    '--valet-radius',
    '--valet-stroke',
    '--valet-focus-width',
    '--valet-focus-offset',
    '--valet-focus-ring-color',
    '--valet-font-weight',
    '--valet-font-tracking',
    '--valet-font-leading',
  ];

  for (const k of keys) {
    const v = cs.getPropertyValue(k);
    if (v) target.style.setProperty(k, v);
  }
}

export default inheritSurfaceFontVars;

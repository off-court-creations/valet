// ─────────────────────────────────────────────────────────────
// src/system/inheritSurfaceFontVars.ts  | valet
// mirror Surface font/typography CSS variables into a portal root
// ─────────────────────────────────────────────────────────────

/**
 * Copies typography-related CSS variables from a source element (typically a
 * Surface root) onto a target root (e.g., a portal container) to ensure
 * portalled content inherits matching font stacks and text metrics.
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

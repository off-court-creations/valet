// ─────────────────────────────────────────────────────────────
// src/system/navigationFocus.ts  | valet
// Shared navigation-focus marker and ordinary-HTML ring fallback
// ─────────────────────────────────────────────────────────────
import { getStyleRegistry, insertRuleText } from '../css/sheet';

/** Device-neutral marker placed on the real element focused by valet navigation. */
export const NAVIGATION_FOCUS_ATTRIBUTE = 'data-valet-navigation-focus';

/** Selector fragment for component rules that should mirror `:focus-visible`. */
export const NAVIGATION_FOCUS_SELECTOR = `&[${NAVIGATION_FOCUS_ATTRIBUTE}='true']:focus` as const;

/** Selector fragment for focus proxies such as Checkbox and Radio indicators. */
export const NAVIGATION_FOCUS_MATCH = `[${NAVIGATION_FOCUS_ATTRIBUTE}='true']:focus` as const;

const NAVIGATION_FOCUS_RULE_ID = '@archway/valet/navigation-focus/v1';

/**
 * Install one low-specificity fallback ring for ordinary focusable HTML.
 *
 * Components keep their own, more-specific focus visuals; this rule makes the
 * marker useful on native/custom controls that do not ship a valet style rule.
 * The rule is static, so it cannot expand the immortal CSS rule space.
 */
export function ensureNavigationFocusRule(): void {
  const { injected } = getStyleRegistry();
  if (injected.has(NAVIGATION_FOCUS_RULE_ID)) return;

  insertRuleText(
    `[${NAVIGATION_FOCUS_ATTRIBUTE}='true']:focus` +
      `:where(:not(:disabled):not([aria-disabled='true'])){` +
      'outline:var(--valet-focus-width,2px) solid ' +
      'var(--valet-focus-ring-color,var(--valet-intent-focus,currentColor));' +
      'outline-offset:var(--valet-focus-offset,2px);' +
      '}',
  );
  injected.add(NAVIGATION_FOCUS_RULE_ID);
}

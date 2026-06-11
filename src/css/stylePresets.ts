// ─────────────────────────────────────────────────────────────
// src/css/stylePresets.ts  | valet
// registry of reusable style presets via definePreset()
// ─────────────────────────────────────────────────────────────
import { hashStr } from './hash';
import { normalizeCSS } from './normalize';
import { Theme, useTheme } from '../system/themeStore';
import { insertRuleText } from './sheet';
import { warnOnce } from '../system/devErrors';

type CSSFn = (theme: Theme) => string;

interface PresetEntry {
  cssFn: CSSFn;
  class: string;
  /* Normalized CSS last written for the current theme */
  css: string;
  /* Live rule when a DOM is present; undefined in Node/SSR */
  rule: CSSStyleRule | undefined;
}

const registry = new Map<string, PresetEntry>(); // name → entry
let subscribed = false;

/* ─────────────────────────────────────────────── */
/**
 * Swap a live rule's FULL text in place (same sheet index, preserving
 * cascade order). Setting `rule.style.cssText` would update only the
 * top-level declaration block — nested rules (`&:hover`, at-rules)
 * would keep serving stale theme values. Insert-before-delete keeps
 * the old rule intact if the new text fails to parse; `replaced`
 * tells callers whether the new text actually took, so they never
 * cache CSS that is not in the sheet (a stale cache would make the
 * next identical recompute a silent no-op).
 */
function replaceRuleText(
  rule: CSSStyleRule | undefined,
  ruleText: string,
): { rule: CSSStyleRule | undefined; replaced: boolean } {
  const sheet = rule?.parentStyleSheet;
  if (!rule || !sheet) {
    /* No live rule (Node/SSR) — record/insert like any new rule */
    return { rule: insertRuleText(ruleText) as CSSStyleRule | undefined, replaced: true };
  }
  const index = Array.prototype.indexOf.call(sheet.cssRules, rule);
  if (index === -1) {
    return { rule: insertRuleText(ruleText) as CSSStyleRule | undefined, replaced: true };
  }
  try {
    sheet.insertRule(ruleText, index);
    sheet.deleteRule(index + 1);
    return { rule: sheet.cssRules[index] as CSSStyleRule, replaced: true };
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('valet: failed to replace CSS rule:\n%s', ruleText, err);
    }
    return { rule, replaced: false }; // the old rule is still in place
  }
}

/* ─────────────────────────────────────────────── */
function ensureSubscription() {
  if (subscribed) return;
  subscribed = true;
  /* Re-run every preset whenever the theme changes */
  useTheme.subscribe(({ theme }) => {
    for (const entry of registry.values()) {
      if (!entry.rule) continue;
      const nextCSS = normalizeCSS(entry.cssFn(theme));
      if (nextCSS === entry.css) continue;
      /* Re-insert the FULL rule text so nested rules pick up the theme */
      const result = replaceRuleText(entry.rule, `.${entry.class}{${nextCSS}}`);
      entry.rule = result.rule;
      /* Only cache CSS that made it into the sheet — a failed swap keeps
         the old text so the next recompute retries instead of skipping */
      if (result.replaced) entry.css = nextCSS;
    }
  });
}

/* ─────────────────────────────────────────────── */
export function definePreset(name: string, cssFn: CSSFn) {
  ensureSubscription();

  /* Stable class name = readable prefix + hash of the NAME, so the
     class never changes when a preset is redefined */
  const prefix = name.toLowerCase().replace(/[^a-z0-9_-]+/g, '');
  const className = `zp-${prefix}-${hashStr(name)}`;

  /* Render against the current theme */
  const { theme } = useTheme.getState();
  const css = normalizeCSS(cssFn(theme));
  const ruleText = `.${className}{${css}}`;

  const existing = registry.get(name);
  if (existing) {
    /* Replace-on-redefine (ruling R5): warn-and-keep would serve stale
       CSS after HMR re-registers module-scope presets, so the latest
       registration always wins — and this never throws. */
    warnOnce(
      `stylePresets:redefine:${name}`,
      `valet: definePreset(“${name}”) called more than once — replacing the previous registration. This is expected under HMR; otherwise rename one of the presets.`,
    );
    existing.cssFn = cssFn;
    if (css !== existing.css) {
      const result = replaceRuleText(existing.rule, ruleText);
      existing.rule = result.rule;
      if (result.replaced) existing.css = css;
    }
    return;
  }

  const rule = insertRuleText(ruleText) as CSSStyleRule | undefined;
  registry.set(name, { cssFn, class: className, css, rule });
}

/* One-liner helper to apply one or many presets */
export function preset(names: string | string[]) {
  return (Array.isArray(names) ? names : [names])
    .map((n) => {
      const entry = registry.get(n);
      if (!entry) throw new Error(`Unknown style preset “${n}”`);
      return entry.class;
    })
    .join(' ');
}

export function presetHas(names: string | string[], property: string): boolean {
  const list = Array.isArray(names) ? names : [names];
  for (const name of list) {
    const entry = registry.get(name);
    if (entry && entry.rule?.style.getPropertyValue(property)) {
      return true;
    }
  }
  return false;
}

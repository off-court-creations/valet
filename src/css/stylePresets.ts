// ─────────────────────────────────────────────────────────────
// src/css/stylePresets.ts  | valet
// registry of reusable style presets via definePreset()
// ─────────────────────────────────────────────────────────────
import { hashStr } from './hash';
import { Theme, useTheme } from '../system/themeStore';
import { styleCache, globalSheet } from './createStyled';

type CSSFn = (theme: Theme) => string;

interface PresetEntry {
  cssFn: CSSFn;
  class: string;
  rule: CSSStyleRule;
}

const registry = new Map<string, PresetEntry>(); // name → entry
let subscribed = false;

/* ─────────────────────────────────────────────── */
function normalise(css: string) {
  return css.trim().replace(/\s+/g, ' ').replace(/; ?}/g, '}');
}

function ensureSubscription() {
  if (subscribed) return;
  subscribed = true;
  /* Re-run every preset whenever the theme changes */
  useTheme.subscribe(({ theme }) => {
    for (const { cssFn, class: cls, rule } of registry.values()) {
      const nextCSS = normalise(cssFn(theme));
      rule.style.cssText = nextCSS;
    }
  });
}

/* ─────────────────────────────────────────────── */
export function definePreset(name: string, cssFn: CSSFn) {
  if (registry.has(name)) {
    throw new Error(`Style preset “${name}” already exists`);
  }

  ensureSubscription();

  /* Stable class name = readable prefix + hash */
  const prefix = name.toLowerCase().replace(/[^a-z0-9_-]+/g, '');
  const className = `zp-${prefix}-${hashStr(name)}`;

  /* Initial render */
  const { theme } = useTheme.getState();
  const rawCSS = normalise(cssFn(theme));

  const ruleText = `.${className}{${rawCSS}}`;
  const index = globalSheet.insertRule(ruleText, globalSheet.cssRules.length);
  const rule = globalSheet.cssRules[index] as CSSStyleRule;
  styleCache.set(className, rawCSS);

  registry.set(name, { cssFn, class: className, rule });
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
    if (entry && entry.rule.style.getPropertyValue(property)) {
      return true;
    }
  }
  return false;
}

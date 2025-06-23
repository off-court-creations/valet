// ─────────────────────────────────────────────────────────────
// src/css/stylePresets.ts  | valet
// registry of reusable style presets via definePreset()
// ─────────────────────────────────────────────────────────────
import hash                 from '@emotion/hash';
import { Theme, useTheme }  from '../system/themeStore';
import { styleCache, globalSheet } from './createStyled';

type CSSFn = (theme: Theme) => string;

interface PresetEntry {
  cssFn : CSSFn;
  class : string;
  rule  : CSSStyleRule;
}

const registry  = new Map<string, PresetEntry>();   // name → entry
let   subscribed = false;

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

  /* Stable class name = hash of the preset name (not the CSS) */
  const className = `zp-${hash(name)}`;

  /* Initial render */
  const { theme } = useTheme.getState();
  const rawCSS    = normalise(cssFn(theme));

  const ruleText = `.${className}{${rawCSS}}`;
  const index    = globalSheet.insertRule(ruleText, globalSheet.cssRules.length);
  const rule     = globalSheet.cssRules[index] as CSSStyleRule;
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

// src/css/stylePresets.ts | valet
import hash from '@emotion/hash';
import { Theme } from '../system/themeStore';
import { styleCache } from './createStyled';
import { useTheme } from '../system/themeStore';

/*───────────────────────────────────────────────────────────────────*/
type CSSFn = (theme: Theme) => string;
const registry = new Map<string, string>(); // name → className

function normalizeCSS(css: string): string {
  return css.trim().replace(/\s+/g, ' ').replace(/; ?}/g, '}');
}

function injectPresetClass(className: string, css: string) {
  if (styleCache.has(className)) return;
  const style = document.createElement('style');
  style.textContent = `.${className}{${css}}`;
  document.head.appendChild(style);
  styleCache.set(className, css);
}

export function definePreset(name: string, css: CSSFn) {
  if (registry.has(name)) {
    throw new Error(`Style preset “${name}” already exists`);
  }

  const { theme } = useTheme.getState();
  const rawCSS = css(theme);
  const normalized = normalizeCSS(rawCSS);
  const className = `zp-${hash(normalized)}`;

  injectPresetClass(className, normalized);
  registry.set(name, className);
}

/** Return one or many classNames for manual composition. */
export function preset(names: string | string[]) {
  const result = (Array.isArray(names) ? names : [names])
    .map((n) => {
      const cls = registry.get(n);
      if (!cls) throw new Error(`Unknown style preset “${n}”`);
      return cls;
    })
    .join(' ');
  return result;
}

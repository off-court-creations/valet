import hash from '@emotion/hash';
import { Theme } from '../system/themeStore';
import { styleCache } from './createStyled';
import { useTheme } from '../system/themeStore';

/*───────────────────────────────────────────────────────────────────*/
type CSSFn = (theme: Theme) => string;
const registry = new Map<string, string>();         // name → className

export function definePreset(name: string, css: CSSFn) {
  if (registry.has(name)) {
    throw new Error(`Style preset “${name}” already exists`);
  }
  const { theme } = useTheme.getState();            // access store without hook
  const rawCSS    = css(theme);
  const className = `zp-${hash(rawCSS)}`;

  // one-time style injection
  if (!styleCache.has(className)) {
    const style = document.createElement('style');
    style.textContent = `.${className}{${rawCSS}}`;
    document.head.appendChild(style);
    styleCache.set(className, rawCSS);
  }
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

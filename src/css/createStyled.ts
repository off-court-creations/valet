// src/css/createStyled.ts
import React from 'react';
import hash from '@emotion/hash';

const styleCache = new Map<string, string>();
const injected = new Set<string>();

function injectClass(className: string, css: string) {
  if (injected.has(className)) return;
  const style = document.createElement('style');
  style.textContent = `.${className}{${css}}`;
  document.head.appendChild(style);
  injected.add(className);
}

function normalizeCSS(css: string): string {
  return css.trim().replace(/\s+/g, ' ').replace(/; ?}/g, '}');
}

function getClassName(css: string): string {
  const normalized = normalizeCSS(css);
  if (styleCache.has(normalized)) return styleCache.get(normalized)!;

  const className = `z-${hash(normalized)}`;
  injectClass(className, normalized);
  styleCache.set(normalized, className);
  return className;
}

function filterStyledProps<P extends Record<string, any>>(raw: P) {
  const clean: Record<string, any> = {};
  for (const k in raw) if (!k.startsWith('$')) clean[k] = raw[k];
  return clean;
}

/*───────────────────────────────────────────────────────────────*/
export function styled<Tag extends keyof JSX.IntrinsicElements>(tag: Tag) {
  return function styledFactory<ExtraProps extends Record<string, any> = {}>(
    strings: TemplateStringsArray,
    ...exprs: Array<
      | string
      | number
      | false
      | null
      | undefined
      | ((props: ExtraProps & JSX.IntrinsicElements[Tag]) =>
          string | number | false | null | undefined)
    >
  ) {
    type DomRef = Tag extends keyof HTMLElementTagNameMap
      ? HTMLElementTagNameMap[Tag]
      : HTMLElement;

    type StyledProps = ExtraProps &
      JSX.IntrinsicElements[Tag] & {
        className?: string;
      };

    const StyledComponent = React.forwardRef<DomRef, StyledProps>((props, ref) => {
      let rawCSS = '';

      for (let i = 0; i < strings.length; i++) {
        rawCSS += strings[i];
        if (i < exprs.length) {
          const val = typeof exprs[i] === 'function'
            ? (exprs[i] as (p: any) => any)(props)  // 👈 Key fix: safe call with `any`
            : exprs[i];
          rawCSS += val ?? '';
        }
      }

      const className = getClassName(rawCSS);
      const merged = [className, props.className].filter(Boolean).join(' ');
      const domProps = filterStyledProps(props);

      return React.createElement(tag, {
        ...domProps,
        className: merged,
        ref,
      });
    });

    StyledComponent.displayName = `styled(${String(tag)})`;
    return StyledComponent;
  };
}

export { styleCache };

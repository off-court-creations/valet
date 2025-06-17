// ─────────────────────────────────────────────────────────────────────────────
// src/css/createStyled.ts | valet
// Tiny CSS-in-JS helper powering Valet primitives. Now exports `styled` +
// `keyframes`, giving our components Emotion-style animation ergonomics.
//
// • Atomic – each unique rule hashed → single class / keyframes injection
// • Zero deps at runtime (only dev-time hash util)
// • Filters out `$prop` transient values so they never hit the DOM
//
// © 2025 Off-Court Creations – MIT licence
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import hash  from '@emotion/hash';

/*───────────────────────────────────────────────────────────*/
/* Internal caches                                           */
const styleCache = new Map<string, string>(); // normal rules
const injected   = new Set<string>();         // injected IDs

function inject(cssId: string, css: string) {
  if (injected.has(cssId)) return;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  injected.add(cssId);
}

function normalizeCSS(css: string): string {
  return css.trim().replace(/\s+/g, ' ').replace(/; ?}/g, '}');
}

function filterStyledProps<P extends Record<string, any>>(raw: P) {
  const clean: Record<string, any> = {};
  for (const k in raw) if (!k.startsWith('$')) clean[k] = raw[k];
  return clean;
}

/*───────────────────────────────────────────────────────────*/
/* styled<tag>`…` factory                                    */
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

    const StyledComponent = React.forwardRef<DomRef, StyledProps>(
      (props, ref) => {
        /* Build raw CSS string (inc. interpolations) ------------------- */
        let rawCSS = '';
        for (let i = 0; i < strings.length; i++) {
          rawCSS += strings[i];
          if (i < exprs.length) {
            const val =
              typeof exprs[i] === 'function'
                ? (exprs[i] as (p: any) => any)(props)
                : exprs[i];
            rawCSS += val ?? '';
          }
        }

        const normalized = normalizeCSS(rawCSS);
        let className = styleCache.get(normalized);
        if (!className) {
          className = `z-${hash(normalized)}`;
          inject(`.${className}`, `.${className}{${normalized}}`);
          styleCache.set(normalized, className);
        }

        const merged = [className, props.className].filter(Boolean).join(' ');
        const domProps = filterStyledProps(props);

        return React.createElement(tag, {
          ...domProps,
          className: merged,
          ref,
        });
      },
    );

    StyledComponent.displayName = `styled(${String(tag)})`;
    return StyledComponent;
  };
}

/*───────────────────────────────────────────────────────────*/
/* keyframes template literal                               */
export function keyframes(
  strings: TemplateStringsArray,
  ...exprs: Array<string | number | false | null | undefined>
): string {
  /* Build raw keyframe body ------------------------------------------- */
  let rawCSS = '';
  for (let i = 0; i < strings.length; i++) {
    rawCSS += strings[i];
    if (i < exprs.length) rawCSS += exprs[i] ?? '';
  }

  const normalized = normalizeCSS(rawCSS);
  const animName   = `z-kf-${hash(normalized)}`;

  /* Only inject once --------------------------------------------------- */
  if (!injected.has(animName)) {
    inject(
      animName,
      `@keyframes ${animName}{${normalized}}`,
    );
  }

  return animName; // used as animation-name
}

/*───────────────────────────────────────────────────────────*/
export { styleCache };

// ─────────────────────────────────────────────────────────────
// src/css/createStyled.ts | valet
// Tiny CSS-in-JS helper powering Valet primitives. Now exports `styled` +
// `keyframes`, giving our components Emotion-style animation ergonomics.
//
// • Atomic – each unique rule hashed → single class / keyframes injection
// • Zero deps at runtime (only dev-time hash util)
// • Filters out `$prop` transient values so they never hit the DOM
//
// © 2025 Off-Court Creations – MIT licence
// ─────────────────────────────────────────────────────────────
import React, { useContext, useLayoutEffect, useRef } from 'react';
import hash  from '@emotion/hash';
import { SurfaceCtx } from '../system/surfaceStore';

/*───────────────────────────────────────────────────────────*/
/* Internal caches                                           */
const styleCache = new Map<string, string>(); // normal rules
const injected   = new Set<string>();         // injected IDs

let styleTag: HTMLStyleElement | null = null;

function ensureTag(): HTMLStyleElement | null {
  if (typeof document === 'undefined') return null;
  if (!styleTag) {
    styleTag = document.getElementById('valet-css') as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'valet-css';
      document.head.appendChild(styleTag);
    }
  }
  return styleTag;
}

function inject(cssId: string, css: string) {
  if (injected.has(cssId)) return;
  const tag = ensureTag();
  if (!tag) return;
  const sheet = tag.sheet as CSSStyleSheet;
  try {
    sheet.insertRule(css, sheet.cssRules.length);
  } catch {
    tag.appendChild(document.createTextNode(css));
  }
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
        const localRef = useRef<DomRef | null>(null)
        const surface = useContext(SurfaceCtx)
        const idRef = useRef(`el-${Math.random().toString(36).slice(2)}`)

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

        const merged = [className, props.className].filter(Boolean).join(' ')
        const domProps = filterStyledProps(props)

        useLayoutEffect(() => {
          const el = localRef.current
          if (!surface || !el) return
          const id = idRef.current
          const measure = () => {
            const rect = el.getBoundingClientRect()
            const sEl = surface.getState().element
            const sRect = sEl ? sEl.getBoundingClientRect() : { top: 0, left: 0 }
            const scrollTop = sEl ? sEl.scrollTop : 0
            const scrollLeft = sEl ? sEl.scrollLeft : 0
            const top = rect.top - sRect.top + scrollTop
            const left = rect.left - sRect.left + scrollLeft
            surface.getState().updateChild(id, {
              width: rect.width,
              height: rect.height,
              top,
              left,
            })
            el.style.setProperty('--valet-el-width', `${rect.width}px`)
            el.style.setProperty('--valet-el-height', `${rect.height}px`)
          }
          surface.getState().registerChild(id, {
            width: 0,
            height: 0,
            top: 0,
            left: 0,
          })
          const ro = new ResizeObserver(measure)
          ro.observe(el)
          measure()
          return () => {
            ro.disconnect()
            surface.getState().unregisterChild(id)
          }
        }, [surface])

        return React.createElement(tag, {
          ...domProps,
          className: merged,
          ref: (node: DomRef | null) => {
            localRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) (ref as any).current = node
          },
        })
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

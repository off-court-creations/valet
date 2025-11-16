// ─────────────────────────────────────────────────────────────
// src/css/createStyled.ts | valet
// Tiny CSS-in-JS helper powering valet primitives. Now exports `styled` +
// `keyframes`, giving our components Emotion-style animation ergonomics.
//
// • Atomic – each unique rule hashed → single class / keyframes injection
// • Zero deps at runtime (only dev-time hash util)
// • Filters out `$prop` transient values so they never hit the DOM
//
// © 2025 Off-Court Creations – MIT licence
// ─────────────────────────────────────────────────────────────
import React, { useContext, useLayoutEffect, useRef } from 'react';
import type { JSX } from 'react';
import { hashStr } from './hash';
import { SurfaceCtx } from '../system/surfaceStore';

function labelize(raw: string) {
  return raw.toLowerCase().replace(/[^a-z0-9_-]+/g, '') || 'el';
}

/*───────────────────────────────────────────────────────────*/
/* Internal caches                                           */
const styleCache = new Map<string, string>(); // normal rules
const injected = new Set<string>(); // injected IDs

/* Single global stylesheet for all rules ------------------------------ */
const styleEl = document.createElement('style');
document.head.appendChild(styleEl);
const globalSheet = styleEl.sheet as CSSStyleSheet;

function inject(cssId: string, css: string) {
  if (injected.has(cssId)) return;
  globalSheet.insertRule(css, globalSheet.cssRules.length);
  injected.add(cssId);
}

function normalizeCSS(css: string): string {
  return css.trim().replace(/\s+/g, ' ').replace(/; ?}/g, '}');
}

/* Remove transient props that start with `$` -------------------------- */
type TransientPropKey = `$${string}`;
type WithoutTransient<P> = {
  [K in keyof P as K extends string ? (K extends TransientPropKey ? never : K) : K]: P[K];
};

function filterStyledProps<P extends Record<string, unknown>>(raw: P): WithoutTransient<P> {
  const clean: Record<string, unknown> = {};
  for (const k in raw) if (!k.startsWith('$')) clean[k] = raw[k];
  return clean as WithoutTransient<P>;
}

/*───────────────────────────────────────────────────────────*/
/* styled<tag>`…` factory                                    */
export function styled<Tag extends keyof JSX.IntrinsicElements>(tag: Tag) {
  return function styledFactory<ExtraProps extends Record<string, unknown> = Record<never, never>>(
    strings: TemplateStringsArray,
    ...exprs: Array<
      | string
      | number
      | false
      | null
      | undefined
      | ((
          props: ExtraProps & JSX.IntrinsicElements[Tag],
        ) => string | number | false | null | undefined)
    >
  ) {
    type DomRef = Tag extends keyof HTMLElementTagNameMap
      ? HTMLElementTagNameMap[Tag]
      : HTMLElement;

    type StyledProps = ExtraProps &
      JSX.IntrinsicElements[Tag] & {
        className?: string;
      };

    type PropsArg = React.PropsWithoutRef<StyledProps>;

    type Interpolation =
      | string
      | number
      | false
      | null
      | undefined
      | ((props: PropsArg) => string | number | false | null | undefined);

    const StyledComponent = React.forwardRef<DomRef, StyledProps>((props, ref) => {
      const localRef = useRef<DomRef | null>(null);
      const surface = useContext(SurfaceCtx);
      const idRef = useRef(`el-${Math.random().toString(36).slice(2)}`);

      /* Build raw CSS string (inc. interpolations) ------------------- */
      let rawCSS = '';
      for (let i = 0; i < strings.length; i++) {
        rawCSS += strings[i];
        if (i < exprs.length) {
          const piece = exprs[i] as Interpolation;
          if (typeof piece === 'function') {
            const fn = piece as (p: PropsArg) => string | number | false | null | undefined;
            rawCSS += fn(props) ?? '';
          } else {
            rawCSS += piece ?? '';
          }
        }
      }

      const normalized = normalizeCSS(rawCSS);
      let className = styleCache.get(normalized);
      if (!className) {
        // Tag is constrained to intrinsic tags, so it's a string
        const rawLabel = tag as string;
        const label = labelize(rawLabel);
        className = `z-${label}-${hashStr(normalized)}`;
        inject(`.${className}`, `.${className}{${normalized}}`);
        styleCache.set(normalized, className);
      }

      const merged = [className, props.className].filter(Boolean).join(' ');
      const rawProps = filterStyledProps<PropsArg>(props);
      // Support polymorphic `as` to override the intrinsic tag. Strip it from DOM props.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { as: asProp, ...domProps } = rawProps as any as PropsArg & { as?: React.ElementType };

      useLayoutEffect(() => {
        const el = localRef.current;
        if (!surface || !el) return;
        const root = surface.getState().element;
        // Skip registration for elements rendered outside the surface root
        // (e.g. portalled overlays like Drawer/Modal). This avoids tracking
        // and ResizeObserver churn during window resizes.
        if (!root || !root.contains(el)) return;
        const id = idRef.current;
        surface.getState().registerChild(id, el, (m) => {
          el.style.setProperty('--valet-el-width', `${m.width}px`);
          el.style.setProperty('--valet-el-height', `${Math.round(m.height)}px`);
        });
        return () => {
          surface.getState().unregisterChild(id);
        };
      }, [surface]);

      const elementTag = (asProp as unknown as keyof JSX.IntrinsicElements) || tag;
      return React.createElement(elementTag, {
        ...(domProps as unknown as JSX.IntrinsicElements[Tag] & ExtraProps),
        className: merged,
        ref: (node: DomRef | null) => {
          localRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref && 'current' in ref) {
            (ref as React.MutableRefObject<DomRef | null>).current = node;
          }
        },
      });
    });

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
  const animName = `z-kf-${hashStr(normalized)}`;

  /* Only inject once --------------------------------------------------- */
  if (!injected.has(animName)) {
    inject(animName, `@keyframes ${animName}{${normalized}}`);
  }

  return animName; // used as animation-name
}

/*───────────────────────────────────────────────────────────*/
export { styleCache, globalSheet };

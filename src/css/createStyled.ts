// src/css/createStyled.ts | valet
import React from 'react';
import hash from '@emotion/hash';

const styleCache = new Map<string, string>();

/*───────────────────────────────────────────────────────────*/
/** Remove props that start with '$' so they don't hit the DOM */
function filterStyledProps<P extends Record<string, any>>(raw: P) {
  const clean: Record<string, any> = {};
  for (const k in raw) if (!k.startsWith('$')) clean[k] = raw[k];
  return clean;
}

/*───────────────────────────────────────────────────────────*/
/** valet’s lightweight `styled` with prop interpolation    */
export function styled<Tag extends keyof JSX.IntrinsicElements>(tag: Tag) {
  return function styledFactory<ExtraProps = {}>(
    strings: TemplateStringsArray,
    ...exprs: Array<
      | string
      | number
      | false
      | null
      | undefined
      | ((
          props: ExtraProps & JSX.IntrinsicElements[Tag]
        ) => string | number | false | null | undefined)
    >
  ) {
    /* Infer the correct DOM element type for this tag */
    type DomRef = Tag extends keyof HTMLElementTagNameMap
      ? HTMLElementTagNameMap[Tag]
      : HTMLElement;

    type StyledProps = ExtraProps &
      JSX.IntrinsicElements[Tag] & {
        className?: string; // allow external class merges
      };

    /* ForwardRef adds `ref` support + correct TS types */
    const StyledComponent = React.forwardRef<DomRef, StyledProps>(
      (props, ref) => {
        /* Build final CSS for THESE props */
        let css = '';
        for (let i = 0; i < strings.length; i++) {
          css += strings[i];
          if (i < exprs.length) {
            const piece = exprs[i];
            const val =
              typeof piece === 'function'
                ? (piece as any)(props) // prop-driven interpolation
                : piece;
            css += val ?? '';
          }
        }

        /* Cache & inject (one <style> per unique rule set) */
        let className = styleCache.get(css);
        if (!className) {
          className = `z-${hash(css)}`;
          const styleTag = document.createElement('style');
          styleTag.textContent = `.${className}{${css}}`;
          document.head.appendChild(styleTag);
          styleCache.set(css, className);
        }

        /* Merge incoming className with our generated one */
        const mergedClass = [className, props.className]
          .filter(Boolean)
          .join(' ');

        /* Strip internal props (those starting with `$`) */
        const domProps = filterStyledProps(props);

        return React.createElement(tag, {
          ...domProps,
          className: mergedClass,
          ref, // forward the ref into the real DOM node
        });
      }
    );

    StyledComponent.displayName = `styled(${String(tag)})`;
    return StyledComponent;
  };
}

export { styleCache };

// ─────────────────────────────────────────────────────────────
// src/css/compile.ts | valet
// Pure template→CSS concatenation shared by `styled` and `keyframes`.
//
// • Function interpolations receive the full props object
// • `false` stays in the Interpolation union as the veto register
//   (`${cond && 'color:red'}`) but is dropped at concat — alongside
//   null/undefined — so it can never fuse into `falsedisplay:flex`
// • Falsy-but-valid values are preserved: 0 renders, '' is a no-op
//
// © 2025 Off-Court Creations – MIT licence
// ─────────────────────────────────────────────────────────────

/** Values an interpolation may yield; `false`/null/undefined are vetoes. */
export type InterpolationValue = string | number | false | null | undefined;

/** A template expression: a plain value, or a function of the full props. */
export type Interpolation<Props> = InterpolationValue | ((props: Props) => InterpolationValue);

/**
 * Join template strings and interpolations into raw (un-normalized) CSS.
 * Strings and expression results are concatenated in template order;
 * `false`, `null` and `undefined` results are dropped explicitly.
 */
export function compileTemplate<Props>(
  strings: TemplateStringsArray,
  exprs: ReadonlyArray<Interpolation<Props>>,
  props: Props,
): string {
  let rawCSS = '';
  for (let i = 0; i < strings.length; i++) {
    rawCSS += strings[i];
    if (i < exprs.length) {
      const piece = exprs[i];
      const value = typeof piece === 'function' ? piece(props) : piece;
      if (value === false || value == null) continue;
      rawCSS += value;
    }
  }
  return rawCSS;
}

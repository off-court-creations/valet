// ─────────────────────────────────────────────────────────────
// src/helpers/svgSafe.ts | valet
// Strict allowlist parser for Icon's string `svg` prop (SECURITY S4)
//
// Replaces the dangerouslySetInnerHTML sink: input is parsed into
// structured attribute records that a component renders as real React
// elements. The parsed markup is NEVER re-serialized into an HTML
// string, so nothing the parser misjudges can reach an innerHTML sink.
//
// Accepted grammar (everything else → null):
//   1. Bare path d-data       — `M12 2L2 22h20z`
//   2. `<path …/>` markup     — one or more sibling <path> elements,
//      optionally inside a single non-nested <svg> wrapper
//
// Deliberately hand-rolled instead of DOMParser/innerHTML:
//   • pure string processing → runs in plain Node (no DOM, no jsdom)
//   • no parser differentials — HTML parsers case-fold tag names,
//     decode entities, and auto-repair broken markup; this grammar
//     does none of that, so what we validate is what React renders
//   • fail-safe by construction — anything outside the tiny grammar
//     rejects the whole input rather than passing residue through
// ─────────────────────────────────────────────────────────────

/** React-ready attributes for the outer `<svg>` element. */
export interface SafeSvgRootAttrs {
  viewBox?: string;
  width?: string;
  height?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
  fillRule?: string;
  clipRule?: string;
}

/** React-ready attributes for one `<path>` element. `d` is mandatory. */
export interface SafeSvgPathAttrs {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
  fillRule?: string;
  clipRule?: string;
}

/** Structured parse result — spread `root` onto `<svg>`, map `paths` to `<path>`. */
export interface SafeSvg {
  root: SafeSvgRootAttrs;
  paths: SafeSvgPathAttrs[];
}

/*──────────── value validators ────────────*/

/* Path data: must begin with a moveto (M/m) per the SVG spec; the rest is
 * restricted to path commands, digits, exponents, signs, separators.     */
const PATH_DATA = /^[Mm][0-9eE+\-.,\sMmZzLlHhVvCcSsQqTtAa]*$/;

/* Paint values: keyword (`none`, `currentColor`, named colours), hex, or a
 * literal rgb()/hsl() form. No `url(#…)` func-IRIs — reference smuggling
 * (gradients/patterns/filters defined elsewhere) is out of scope for icons. */
const PAINT =
  /^(?:[a-zA-Z]+|#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(?:rgb|rgba|hsl|hsla)\([0-9.,%\s/-]*\))$/;

/* Plain non-negative number with an optional benign unit. */
const LENGTH = /^(?:\d+|\d*\.\d+)(?:px|em|rem|%)?$/;

/* Exactly four numbers. */
const VIEWBOX = /^\s*[-+]?[0-9.]+(?:[\s,]+[-+]?[0-9.]+){3}\s*$/;

const FILL_RULE = /^(?:nonzero|evenodd)$/;

const SVG_NS = 'http://www.w3.org/2000/svg';

/*──────────── attribute allowlists ────────────*/

/* Allowlist rationale — every entry is pure geometry or paint, with a value
 * grammar that cannot express URLs, scripts, CSS, or element references:
 *   d, viewBox, width, height        → geometry (numeric grammars)
 *   fill, stroke, stroke-width,
 *   fill-rule, clip-rule             → paint (keyword/colour grammars)
 *   xmlns                            → validated to be exactly the SVG
 *                                      namespace, then DROPPED (React
 *                                      supplies the namespace itself)
 * Excluded by design:
 *   on*                              → script execution
 *   href / xlink:href                → javascript:/data: URL sinks
 *   style                            → CSS injection (url(), exfil)
 *   class / id                       → stylesheet targeting, DOM clobber
 *   transform/filter/mask/clip-path  → func-IRI reference carriers
 * Split per element: `d` is meaningless on <svg>, `width`/`height` and
 * `viewBox` are meaningless on <path>, so neither accepts the other's set. */

interface AttrSpec {
  /** React prop name to emit, or null to validate-and-drop (xmlns). */
  prop: keyof SafeSvgRootAttrs | keyof SafeSvgPathAttrs | null;
  validate: (value: string) => boolean;
}

/* Maps (not plain objects) so hostile attribute names like `constructor`
 * or `__proto__` can never hit Object.prototype. Keys are case-sensitive:
 * SVG is XML, so `viewBox` is `viewBox` and `D` is nothing.              */
const PATH_ATTRS = new Map<string, AttrSpec>([
  ['d', { prop: 'd', validate: (v) => PATH_DATA.test(v) }],
  ['fill', { prop: 'fill', validate: (v) => PAINT.test(v) }],
  ['stroke', { prop: 'stroke', validate: (v) => PAINT.test(v) }],
  ['stroke-width', { prop: 'strokeWidth', validate: (v) => LENGTH.test(v) }],
  ['fill-rule', { prop: 'fillRule', validate: (v) => FILL_RULE.test(v) }],
  ['clip-rule', { prop: 'clipRule', validate: (v) => FILL_RULE.test(v) }],
]);

const SVG_ATTRS = new Map<string, AttrSpec>([
  ['viewBox', { prop: 'viewBox', validate: (v) => VIEWBOX.test(v) }],
  ['xmlns', { prop: null, validate: (v) => v === SVG_NS }],
  ['width', { prop: 'width', validate: (v) => LENGTH.test(v) }],
  ['height', { prop: 'height', validate: (v) => LENGTH.test(v) }],
  ['fill', { prop: 'fill', validate: (v) => PAINT.test(v) }],
  ['stroke', { prop: 'stroke', validate: (v) => PAINT.test(v) }],
  ['stroke-width', { prop: 'strokeWidth', validate: (v) => LENGTH.test(v) }],
  ['fill-rule', { prop: 'fillRule', validate: (v) => FILL_RULE.test(v) }],
  ['clip-rule', { prop: 'clipRule', validate: (v) => FILL_RULE.test(v) }],
]);

/*──────────── scanner primitives ────────────*/

/* ASCII-only on purpose: exotic whitespace (U+00A0, U+2028, …) and unicode
 * confusable attribute names (ｄ, ԁ) fall outside both classes and reject. */
const WS = /[ \t\r\n\f]/;
const NAME_CHAR = /[A-Za-z-]/;

/*──────────── parser ────────────*/

/**
 * Parses a trusted-shape icon string into structured SVG data.
 * Returns null for anything outside the strict grammar — callers must
 * treat null as "do not render" (Icon wiring lands in SECURITY S5).
 */
export function parseSvgString(input: string): SafeSvg | null {
  if (typeof input !== 'string') return null;
  const src = input.trim();
  if (src === '') return null;
  return src.startsWith('<') ? parseMarkup(src) : parseBarePathData(src);
}

/** Form 1 — bare path d-data becomes a single path in the default viewBox. */
function parseBarePathData(src: string): SafeSvg | null {
  if (!PATH_DATA.test(src)) return null;
  return { root: {}, paths: [{ d: src }] };
}

/** Form 2 — `<path>` siblings, optionally wrapped in one `<svg>`. */
function parseMarkup(src: string): SafeSvg | null {
  /* Wholesale rejects — none of these constructs belong in icon markup:
   *   &   → entity / character-reference smuggling (we never decode)
   *   <!  → comments, CDATA sections, DOCTYPE / <!ENTITY tricks
   *   <?  → processing instructions                                    */
  if (src.includes('&') || src.includes('<!') || src.includes('<?')) return null;

  let pos = 0;
  const len = src.length;

  const skipWs = (): void => {
    while (pos < len && WS.test(src[pos])) pos += 1;
  };

  /* Consumes `<tag` only on an exact (case-sensitive) match — `<SvG` and
   * `<PaTh` rely on HTML case-folding we refuse to reproduce.           */
  const tryOpen = (tag: string): boolean => {
    if (src[pos] !== '<') return false;
    if (src.slice(pos + 1, pos + 1 + tag.length) !== tag) return false;
    const next = src[pos + 1 + tag.length];
    if (next !== undefined && NAME_CHAR.test(next)) return false; // `<pathX…`
    pos += 1 + tag.length;
    return true;
  };

  /* Consumes `</tag …>` (whitespace allowed before `>`). */
  const tryClose = (tag: string): boolean => {
    if (!src.startsWith(`</${tag}`, pos)) return false;
    const next = src[pos + 2 + tag.length];
    if (next !== undefined && NAME_CHAR.test(next)) return false; // `</pathX…`
    pos += 2 + tag.length;
    skipWs();
    if (src[pos] !== '>') return false;
    pos += 1;
    return true;
  };

  /* Parses `name="value"` pairs up to the `>` / `/>` terminator, mapping
   * allowlisted names to React props. Any violation rejects the input:
   * unknown/duplicate names, unquoted values, missing whitespace, or a
   * value failing its validator.                                        */
  const readAttrs = (allow: Map<string, AttrSpec>): Record<string, string> | null => {
    const out: Record<string, string> = {};
    const seen = new Set<string>();
    for (;;) {
      const before = pos;
      skipWs();
      if (pos >= len) return null;
      const ch = src[pos];
      if (ch === '>' || ch === '/') return out;
      if (before === pos) return null; // attrs must be whitespace-separated
      const start = pos;
      while (pos < len && NAME_CHAR.test(src[pos])) pos += 1;
      const name = src.slice(start, pos);
      const spec = name === '' ? undefined : allow.get(name);
      if (!spec || seen.has(name)) return null;
      seen.add(name);
      if (src[pos] !== '=') return null;
      pos += 1;
      const quote = src[pos];
      if (quote !== '"' && quote !== "'") return null;
      pos += 1;
      const vStart = pos;
      while (pos < len && src[pos] !== quote && src[pos] !== '<') pos += 1;
      if (src[pos] !== quote) return null;
      const value = src.slice(vStart, pos);
      pos += 1;
      if (!spec.validate(value)) return null;
      if (spec.prop !== null) out[spec.prop] = value;
    }
  };

  /* Consumes the tag terminator: 'self' for `/>`, 'open' for `>`. */
  const readTagEnd = (): 'self' | 'open' | null => {
    if (src[pos] === '/') {
      if (src[pos + 1] !== '>') return null;
      pos += 2;
      return 'self';
    }
    if (src[pos] === '>') {
      pos += 1;
      return 'open';
    }
    return null;
  };

  skipWs();

  /* Optional single outer <svg> wrapper. */
  let root: Record<string, string> = {};
  let wrapped = false;
  if (tryOpen('svg')) {
    const attrs = readAttrs(SVG_ATTRS);
    if (!attrs) return null;
    if (readTagEnd() !== 'open') return null; // `<svg/>` carries no paths
    root = attrs;
    wrapped = true;
  }

  /* Zero or more sibling <path> elements — and NOTHING else. <image>,
   * <set>, <animate>, <script>, <foreignObject>, a nested <svg>, … all
   * fail tryOpen here and reject the whole input below.                 */
  const paths: SafeSvgPathAttrs[] = [];
  for (;;) {
    skipWs();
    if (!tryOpen('path')) break;
    const attrs = readAttrs(PATH_ATTRS);
    if (!attrs) return null;
    const end = readTagEnd();
    if (end === null) return null;
    if (end === 'open') {
      /* <path> may not have children — only an immediate close tag. */
      skipWs();
      if (!tryClose('path')) return null;
    }
    if (typeof attrs.d !== 'string') return null; // a path without geometry
    paths.push(attrs as unknown as SafeSvgPathAttrs); // keys come from PATH_ATTRS specs
  }

  if (wrapped && !tryClose('svg')) return null;

  skipWs();
  if (pos !== len) return null; // trailing content → reject everything
  if (paths.length === 0) return null; // nothing renderable

  return { root: root as SafeSvgRootAttrs, paths };
}

export default parseSvgString;

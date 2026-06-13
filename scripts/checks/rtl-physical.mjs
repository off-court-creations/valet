// ─────────────────────────────────────────────────────────────
// scripts/checks/rtl-physical.mjs | valet
// A11Y S11 — RTL logical-properties gate (`npm run check:rtl`).
//
// Fails on UNANNOTATED physical CSS properties inside styled()/keyframes()
// templates under src/components and src/css. The logical-properties sweep
// (A11Y S11) migrated the mechanical subset of physical usages to their
// logical equivalents (margin-left → margin-inline-start, padding-right →
// padding-inline-end, border-left → border-inline-start, text-align:left →
// text-align:start, left/right positioning → inset-inline[-start/-end]).
//
// Genuinely physical positioning — slide/translate animation origins,
// measured-pixel (getBoundingClientRect) portal/underline anchoring, off-
// screen measurement parking, and viewport-centering math — is exempted by
// an inline `/* rtl: physical-by-design */` annotation on the same line or
// the line immediately preceding the physical declaration. Those are listed
// as judgment calls in the overhaul plan (Drawer slide transforms,
// Pagination underline math, Slider thumb positioning, …) and full
// interactive RTL (drag math, animated underline) is a logged deferral.
//
// LTR is pixel-identical by construction: logical properties resolve to the
// exact same box in `dir: ltr`. This gate exists to catch the real risk —
// a typo or a missed shorthand reintroducing a physical property.
//
// Style mirrors the ENGINE S3 nested-selector source gate
// (src/css/nestedSelectors.test.ts): a source-level lexer pulls every
// styled('tag')`…` / keyframes`…` template (and the string literals returned
// from their interpolations) out of the .ts/.tsx source and scans those
// fragments for physical declarations — jsdom resolves logical/physical
// props inconsistently, so this works on sources, not computed styles.
//
// CLI:  node scripts/checks/rtl-physical.mjs           → exit 1 on any
//                                                          unannotated hit
//       node scripts/checks/rtl-physical.mjs --list    → print every hit
//                                                          (annotated + not)
// ─────────────────────────────────────────────────────────────
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/*───────────────────────────────────────────────────────────*/
/* Annotation                                                */

export const PHYSICAL_ANNOTATION = 'rtl: physical-by-design';

/*───────────────────────────────────────────────────────────*/
/* Physical property detection                               */

// Physical longhands the sweep replaces with logical equivalents, plus the
// physical inset properties. Each entry is matched as a CSS *property* — i.e.
// `<name>` followed by optional whitespace and a `:` at a declaration head.
// `text-align` is special-cased (only the left/right *values* are physical).
const PHYSICAL_PROPS = [
  'margin-left',
  'margin-right',
  'padding-left',
  'padding-right',
  'border-left',
  'border-right',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'left',
  'right',
];

const PROP_RE = new RegExp(
  // (^|[^-\w]) so `inset-inline-start`, `border-inline-start`,
  // `margin-inline-end`, `scroll-padding-left`-style longer names and the
  // `-left`/`-right` tails of already-logical props never match the bare
  // `left`/`right`/`margin-left` tokens.
  `(?:^|[^-\\w])(${PHYSICAL_PROPS.map((p) => p.replace('-', '\\-')).join('|')})\\s*:`,
  'i',
);

const TEXT_ALIGN_RE = /(?:^|[^-\w])text-align\s*:\s*(left|right)\b/i;

/**
 * Return the physical property/value flagged on a single CSS-declaration
 * line, or null. Operates on raw source text (comments preserved) so the
 * caller can also inspect the line for an annotation.
 */
export function physicalHit(line) {
  // Strip block comments on the line itself so the comment body
  // (`/* rtl: physical-by-design */`, prose mentioning `left:`) never trips
  // the scanner — the annotation is checked separately, on the raw line.
  const code = line.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/, '');
  const ta = TEXT_ALIGN_RE.exec(code);
  if (ta) return `text-align: ${ta[1].toLowerCase()}`;
  const m = PROP_RE.exec(code);
  if (m) return m[1].toLowerCase();
  return null;
}

/*───────────────────────────────────────────────────────────*/
/* Template extraction (source-level lexer)                  */
/* Mirrors src/css/nestedSelectors.test.ts but keeps each template's source
/* SLICE (comments included) so annotations stay visible. */

function skipString(src, i, quote) {
  i += 1;
  while (i < src.length) {
    if (src[i] === '\\') i += 2;
    else if (src[i] === quote) return i + 1;
    else i += 1;
  }
  throw new Error('unterminated string literal');
}

function skipGenerics(src, i) {
  if (src[i] !== '<') return i;
  let depth = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "'" || c === '"') {
      i = skipString(src, i, c);
      continue;
    }
    if (c === '=' && src[i + 1] === '>') {
      i += 2;
      continue;
    }
    if (c === '<') depth += 1;
    if (c === '>') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  throw new Error('unterminated generic argument list');
}

/**
 * Lex a template literal starting at the opening backtick. Returns the source
 * offset just past the closing backtick, the template's STATIC text (every
 * `${…}` interpolation expression blanked to whitespace so its JS — object
 * keys like `left:`, ternaries — never reads as CSS, while line numbers and
 * the source offset stay exact), and every string-literal fragment returned
 * from inside those interpolations.
 */
function lexTemplate(src, start) {
  const fragments = [];
  const out = [];
  let i = start + 1;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      out.push(c, src[i + 1] ?? '');
      i += 2;
      continue;
    }
    if (c === '`') {
      return { end: i + 1, text: out.join(''), fragments };
    }
    if (c === '$' && src[i + 1] === '{') {
      const interpStart = i;
      i = lexInterpolation(src, i + 2, fragments);
      // Replace the whole `${…}` span with whitespace, preserving newlines so
      // line numbers computed from this static text match the source.
      for (let j = interpStart; j < i; j += 1) out.push(src[j] === '\n' ? '\n' : ' ');
      continue;
    }
    out.push(c);
    i += 1;
  }
  throw new Error('unterminated template literal');
}

/**
 * Lex `${…}`; collect string/template-literal CONTENTS (with their source
 * start offset, so violations map back to a real line) into `fragments`.
 */
function lexInterpolation(src, i, fragments) {
  let depth = 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "'" || c === '"') {
      const end = skipString(src, i, c);
      fragments.push({ start: i + 1, text: src.slice(i + 1, end - 1) });
      i = end;
      continue;
    }
    if (c === '`') {
      const nested = lexTemplate(src, i);
      fragments.push({ start: i + 1, text: nested.text });
      fragments.push(...nested.fragments);
      i = nested.end;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2);
      i = close === -1 ? src.length : close + 2;
      continue;
    }
    if (c === '{') depth += 1;
    if (c === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  throw new Error('unterminated interpolation');
}

// styled('tag')  or  keyframes`…`
const TAGGED_CALL = /\bstyled\(\s*['"][a-zA-Z][a-zA-Z0-9]*['"]\s*\)|\bkeyframes\b/g;

/**
 * Extract every styled()/keyframes() template from a source file as a list of
 * `{ start, text }` source slices (template body + each interpolation string
 * fragment). `start` is the source offset of the slice's first character, so
 * line numbers and annotation lookups resolve against the original file.
 */
export function extractTemplates(src) {
  const slices = [];
  TAGGED_CALL.lastIndex = 0;
  for (let m = TAGGED_CALL.exec(src); m; m = TAGGED_CALL.exec(src)) {
    let i = m.index + m[0].length;
    if (m[0].startsWith('styled')) i = skipGenerics(src, i);
    while (src[i] === ' ' || src[i] === '\n' || src[i] === '\r' || src[i] === '\t') i += 1;
    if (src[i] !== '`') continue; // call without a tagged template
    const { end, text, fragments } = lexTemplate(src, i);
    slices.push({ start: i + 1, text });
    for (const f of fragments) slices.push(f);
    TAGGED_CALL.lastIndex = end;
  }
  return slices;
}

/*───────────────────────────────────────────────────────────*/
/* Per-file scan                                             */

/**
 * Classify every 1-based source line as comment/blank vs. code, tracking
 * `/* … *​/` blocks across line boundaries. `commentOnly[L]` is true when the
 * line carries no code outside comments/whitespace; `marker[L]` is true when
 * the `rtl: physical-by-design` annotation text appears on it (the marker is
 * always written inside a comment, so it is detected on the raw line).
 */
function classifyLines(src) {
  const lines = src.split('\n');
  const commentOnly = new Array(lines.length + 1).fill(false);
  const marker = new Array(lines.length + 1).fill(false);
  let inBlock = false;
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    marker[i + 1] = raw.includes(PHYSICAL_ANNOTATION);
    let code = '';
    let j = 0;
    let blockHere = inBlock;
    while (j < raw.length) {
      if (inBlock) {
        const close = raw.indexOf('*/', j);
        if (close === -1) {
          j = raw.length;
        } else {
          inBlock = false;
          j = close + 2;
        }
        continue;
      }
      if (raw[j] === '/' && raw[j + 1] === '*') {
        inBlock = true;
        blockHere = true;
        j += 2;
        continue;
      }
      if (raw[j] === '/' && raw[j + 1] === '/') break; // line comment to EOL
      code += raw[j];
      j += 1;
    }
    void blockHere;
    commentOnly[i + 1] = code.trim() === '';
  }
  return { commentOnly, marker };
}

/**
 * Scan one file's source. Returns { violations, annotated } where each entry
 * is { line, property, annotated }.
 *
 * A physical hit on line L is annotated iff the `rtl: physical-by-design`
 * marker appears on L itself, or anywhere in the contiguous run of
 * comment-only/blank source lines immediately preceding L (so a single-line
 * trailing marker, a marker on the line above, and a multi-line annotation
 * block all count). The walk stops at the first line carrying real code.
 *
 * Comment-only lines never produce hits (annotation prose may mention
 * `left:`), and each (line, property) pair is reported once even when a
 * declaration appears in both the static body and an interpolation fragment.
 */
export function scanSource(src) {
  const { commentOnly, marker } = classifyLines(src);
  const lineStart = (offset) => src.slice(0, offset).split('\n').length;
  const annotatedOn = (line) => {
    if (marker[line]) return true;
    for (let p = line - 1; p >= 1 && (commentOnly[p] || marker[p]); p -= 1) {
      if (marker[p]) return true;
    }
    return false;
  };

  const seen = new Set();
  const violations = [];
  const annotated = [];
  for (const slice of extractTemplates(src)) {
    const lines = slice.text.split('\n');
    const baseLine = lineStart(slice.start);
    for (let k = 0; k < lines.length; k += 1) {
      const line = baseLine + k;
      if (commentOnly[line]) continue; // annotation prose, not a declaration
      const property = physicalHit(lines[k]);
      if (!property) continue;
      const key = `${line}:${property}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = { line, property, annotated: annotatedOn(line) };
      (entry.annotated ? annotated : violations).push(entry);
    }
  }
  return { violations, annotated };
}

/*───────────────────────────────────────────────────────────*/
/* Repo scan                                                 */

const SRC_ROOT = fileURLToPath(new URL('../../src', import.meta.url));
const SCAN_DIRS = ['components', 'css'];

function listSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(full));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    if (/\.test\.(ts|tsx)$/.test(entry.name) || entry.name.endsWith('.d.ts')) continue;
    out.push(full);
  }
  return out;
}

export function scanRepo() {
  const violations = [];
  const annotated = [];
  let filesScanned = 0;
  for (const sub of SCAN_DIRS) {
    for (const file of listSourceFiles(join(SRC_ROOT, sub))) {
      filesScanned += 1;
      const rel = relative(SRC_ROOT, file).split(sep).join('/');
      const res = scanSource(readFileSync(file, 'utf8'));
      for (const v of res.violations) violations.push({ file: rel, ...v });
      for (const a of res.annotated) annotated.push({ file: rel, ...a });
    }
  }
  return { violations, annotated, filesScanned };
}

/*───────────────────────────────────────────────────────────*/
/* CLI                                                       */

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const { violations, annotated, filesScanned } = scanRepo();
  if (process.argv.includes('--list')) {
    for (const a of annotated) {
      console.log(`  ok   ${a.file}:${a.line} → ${a.property} (physical-by-design)`);
    }
  }
  if (violations.length > 0) {
    console.error(
      `\n✗ rtl-physical: ${violations.length} unannotated physical ` +
        `${violations.length === 1 ? 'property' : 'properties'} in ` +
        `styled()/keyframes() templates:\n`,
    );
    for (const v of violations) {
      console.error(`    ${v.file}:${v.line} → ${v.property}`);
    }
    console.error(
      `\n  Use the logical equivalent (margin-inline-start, padding-inline-end,\n` +
        `  border-inline-start, text-align: start/end, inset-inline[-start/-end])\n` +
        `  or annotate a genuinely physical declaration with\n` +
        `  /* ${PHYSICAL_ANNOTATION} */ on its line or the line above it.\n`,
    );
    process.exit(1);
  }
  console.log(
    `✓ rtl-physical: ${filesScanned} files scanned, no unannotated physical ` +
      `properties (${annotated.length} annotated physical-by-design).`,
  );
}

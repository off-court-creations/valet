// ─────────────────────────────────────────────────────────────
// src/components/dataValetComponentMarker.repo.test.ts | valet
// AI-PROXY regression gate — every rendering component exposes a
// machine-readable `data-valet-component='<Name>'` attribute on its
// root rendered element, serving the "treats AI proxies as first-class
// users" principle. This source-scan gate FAILS if a rendering
// component file under src/components stops carrying the literal
// `data-valet-component=` marker.
//
// Scope: every non-test `.tsx` under src/components is a rendering
// component (the tree has no barrels/index files; `.ts` siblings like
// dateUtils.ts / sliderMath.ts / resolveAnchor.ts are pure helpers and
// are intentionally NOT scanned). The check is file-level: a file
// passes if it contains the literal substring `data-valet-component=`
// anywhere. A file that legitimately owns no markerable root (see
// ALLOWLIST below) is exempt.
//
// Heuristic — literal substring, deliberately: we look for the exact
// token `data-valet-component=`. We do NOT strip comments/strings,
// because (a) the marker is a JSX attribute that only ever appears in
// real render output here, and (b) the cost of a false "already has
// it" via a stray comment is acceptable for a green-keeping gate while
// the cost of a brittle JS lexer is not. The companion test below
// proves the matcher's shape on synthetic inputs.
//
// Modelled on system/zIndex.repo.test.ts: a source-level scan, not
// computed DOM, so a regression is caught at review time regardless of
// whether the component is ever mounted in jsdom.
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/*───────────────────────────────────────────────────────────*/
/* Marker matcher                                             */

/** The literal JSX attribute every rendering component must carry. */
const MARKER = 'data-valet-component=';

function hasMarker(src: string): boolean {
  return src.includes(MARKER);
}

/*───────────────────────────────────────────────────────────*/
/* Allowlist — documented exceptions                          */

/**
 * Files exempt from the marker gate, keyed by repo-relative path
 * (POSIX separators, relative to src/components). Keep this SMALL:
 * an entry means the component owns no consistent plain-DOM root it
 * could mark without breaking rendering (RULES 4 & 5). Each WHY is the
 * one-line reason; full detail lives in the verification runbook.
 */
const ALLOWLIST: Record<string, string> = {
  // Class error boundary: primary render path returns this.props.children
  // pass-through (render() `if (error === null) return this.props.children`);
  // its only owned DOM node is the conditional default-fallback
  // <div role='alert'>, which renders only on caught error and is not a
  // consistent root. Children pass-through w/ no owned wrapper → RULES 4 & 5.
  'widgets/ValetErrorBoundary.tsx': 'class error boundary — children pass-through, no consistent owned root',
  // Root rendered element is <Panel>, which hardcodes its own
  // data-valet-component='Panel' AFTER its {...rest} spread, so a forwarded
  // marker would be clobbered; Dropzone owns no plain DOM root of its own
  // (input/Icon/instructions are children INSIDE Panel). Adding a wrapper
  // is forbidden (RULE 4).
  'widgets/Dropzone.tsx': 'root is <Panel> (already marked); owns no plain root node — RULE 4',
  // Returns <Modal><Panel><Stack>…; Modal/Panel/Stack each already carry
  // their own markers and KeyModal owns no plain root wrapper. Must not
  // clobber the child Modal marker nor add a wrapper — RULE 4.
  'widgets/KeyModal.tsx': 'root is <Modal> (already marked); owns no plain root node — RULE 4',
  // Returns a Fragment whose outermost DOM node is <Panel> (already marked);
  // the toolbar/messages/input are siblings inside it, so LLMChat owns no single
  // plain root wrapper to mark without misidentifying an inner element — RULE 4.
  'widgets/LLMChat.tsx': 'root is <Panel> (already marked); owns no single plain root — RULE 4',
  // Returns <Panel> (already marked) wrapping its content; owns no plain root of
  // its own without clobbering Panel's marker or adding a wrapper — RULE 4.
  'widgets/RichChat.tsx': 'root is <Panel> (already marked); owns no plain root node — RULE 4',
};

/*───────────────────────────────────────────────────────────*/
/* File discovery                                             */

const COMPONENTS_ROOT = fileURLToPath(new URL('.', import.meta.url));

/** Every non-test `.tsx` under src/components is a rendering component. */
function listComponentFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listComponentFiles(full));
      continue;
    }
    if (!entry.name.endsWith('.tsx')) continue; // .ts siblings are helpers
    if (/\.test\.tsx$/.test(entry.name)) continue;
    out.push(full);
  }
  return out;
}

function relOf(file: string): string {
  return relative(COMPONENTS_ROOT, file).split(sep).join('/');
}

function scanRepo(): { files: string[]; missing: string[] } {
  const files: string[] = [];
  const missing: string[] = [];
  for (const file of listComponentFiles(COMPONENTS_ROOT)) {
    const rel = relOf(file);
    files.push(rel);
    if (rel in ALLOWLIST) continue;
    if (!hasMarker(readFileSync(file, 'utf8'))) missing.push(rel);
  }
  return { files, missing };
}

/*───────────────────────────────────────────────────────────*/
/* Suite                                                     */

describe('data-valet-component marker (AI-PROXY)', () => {
  it('the matcher accepts the literal attribute and rejects its absence', () => {
    expect(hasMarker("<div data-valet-component='Foo' />")).toBe(true);
    expect(hasMarker('<div data-valet-component="Foo" />')).toBe(true);
    expect(hasMarker('<div className="x" />')).toBe(false);
    expect(hasMarker('// the phrase data-valet-component without an equals sign')).toBe(false);
    // Documented heuristic limitation: a comment containing the FULL token
    // counts as present. Acceptable for a green-keeping gate (see header).
    expect(hasMarker('// see data-valet-component= elsewhere')).toBe(true);
  });

  it('extraction canary — the scan reaches real component files', () => {
    const { files } = scanRepo();
    expect(files).toContain('primitives/Typography.tsx');
    expect(files).toContain('layout/Panel.tsx');
    expect(files).toContain('widgets/Parallax.tsx');
    // helper .ts siblings are excluded
    expect(files).not.toContain('fields/dateUtils.ts');
    expect(files.length).toBeGreaterThan(40);
  });

  it('every allowlisted file still exists (no stale exemptions)', () => {
    const { files } = scanRepo();
    for (const rel of Object.keys(ALLOWLIST)) {
      expect(files, `stale allowlist entry: ${rel}`).toContain(rel);
    }
  });

  it('every rendering component file carries data-valet-component=', () => {
    const { missing } = scanRepo();
    expect(missing).toEqual([]);
  });
});

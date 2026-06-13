// ─────────────────────────────────────────────────────────────
// scripts/mcp/extractors.test.mjs  | valet
// Fixture regressions for the Wave 0.1 extractor fixes (node env):
// • extract-ts — required props over intersections (TextField.name bug),
//   polymorphic `as` prop, header-comment summaries (no placeholders)
// • extract-docs — route-table docsUrls (real SPA routes, not file paths)
// • extract-glossary — candidate list + recursive fallback, hard failures
// • merge — dotted subcomponents inherit the parent page's docsUrl
// • merge — curated sidecar summary is authoritative (MCP-TRUTH S10): it wins
//   over the TS header summary; blank sidecar summaries fall back to the
//   header; dotted subcomponents inherit the parent sidecar summary.
// Plus the S9 schema-1.7 regression: the always-empty `actions` field is
// gone from extraction and merge output (plan §3.9 S9).
// ─────────────────────────────────────────────────────────────
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { extractFromTs } from './extract-ts.mjs';
import { extractFromDocs, extractRouteTable } from './extract-docs.mjs';
import { extractGlossary } from './extract-glossary.mjs';
import { merge } from './merge.mjs';

// ── fixture helpers ──────────────────────────────────────────
const roots = [];

function makeRoot(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  roots.push(root);
  return root;
}

function write(root, rel, data) {
  const file = path.join(root, ...rel.split('/'));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}

afterAll(() => {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
});

// ── extract-ts ───────────────────────────────────────────────
const FIXTURE_TSCONFIG = JSON.stringify({
  compilerOptions: {
    target: 'ES2020',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    jsx: 'preserve',
    strict: true,
    noEmit: true,
    skipLibCheck: true,
  },
  include: ['src'],
});

// Mirrors src/types.ts FieldBaseProps: `name` optional in the shared base
const FIXTURE_TYPES = `export interface FieldBaseProps {
  /** Optional in the shared field base — the intersection must win. */
  name?: string;
  label?: string;
}
`;

// Mirrors TextField's union-of-intersections shape (the audited bug:
// the first PropertySignature is the optional base \`name?\`, so
// hasQuestionToken() alone reported the required \`name\` as optional)
const PROBE_FIELD_SUMMARY = 'Field probe: required name over an optional shared base';
const FIXTURE_PROBE_FIELD = `// ─────────────────────────────────────────────────────────────
// src/components/fields/ProbeField.tsx | valet
// ${PROBE_FIELD_SUMMARY}
// ─────────────────────────────────────────────────────────────
import type { FieldBaseProps } from '../../types';

export type ProbeFieldProps =
  | (FieldBaseProps & {
      multiline?: false;
      /** Field name is required to bind and identify the value. */
      name: string;
    })
  | (FieldBaseProps & {
      multiline: true;
      name: string;
      rows?: number;
    });

export const ProbeField = (props: ProbeFieldProps) => <div>{props.name}</div>;
`;

// Mirrors Box: createPolymorphicComponent<'div', OwnProps> — `as` lives on
// PolymorphicProps, not OwnProps, so prop resolution never saw it
const PROBE_BOX_SUMMARY = 'Layout primitive probe; the workhorse container';
const FIXTURE_PROBE_BOX = `// ─────────────────────────────────────────────────────────────
// src/components/layout/ProbeBox.tsx | valet
// ${PROBE_BOX_SUMMARY}
// ─────────────────────────────────────────────────────────────
interface ProbeBoxOwnProps {
  compact?: boolean;
}

declare function createPolymorphicComponent<E extends string, P>(
  render: (props: P) => unknown,
): (props: P) => null;

export const ProbeBox = createPolymorphicComponent<'div', ProbeBoxOwnProps>(
  (props: ProbeBoxOwnProps) => <div data-compact={props.compact} />,
);

// Constant exports beside a component (LLMChat's DEFAULT_MODELS regression)
// must never be extracted as components.
export const PROBE_DEFAULTS: Record<string, string[]> = { probe: ['a'] };
`;

// Under schema ≤1.6 this fixture would have produced
// actions: [{ name: 'focus' }, { name: 'scrollIntoView' }] via the
// useImperativeHandle heuristic — the field must now never appear.
const PROBE_HANDLE_SUMMARY = 'Widget probe with an imperative handle';
const FIXTURE_PROBE_HANDLE = `// ─────────────────────────────────────────────────────────────
// src/components/widgets/ProbeHandle.tsx | valet
// ${PROBE_HANDLE_SUMMARY}
// ─────────────────────────────────────────────────────────────
declare function useImperativeHandle(ref: unknown, factory: () => unknown): void;

export interface ProbeHandleProps {
  label?: string;
  handleRef?: unknown;
}

export const ProbeHandle = (props: ProbeHandleProps) => {
  useImperativeHandle(props.handleRef, () => ({
    focus: () => {},
    scrollIntoView: () => {},
  }));
  return <div>{props.label}</div>;
};
`;

// A1 regression (getComment normalizer): when a prop's JSDoc contains an
// inline {@link}, ts-morph returns getComment()/tag.getComment() as a
// (string|JSDocNode)[], not a string. The pre-A1 code did
// \`.map(d => d.getComment() || '').join('\\n')\` → '[object Object]' in the
// description, and \`(tag.getComment() || '').trim()\` → TypeError swallowed by a
// bare catch{}, dropping the whole prop's @deprecated detection. This fixture
// FAILS on the pre-A1 code: \`linked\`'s description would be '[object Object]'
// and \`oldName\`'s deprecated flag would be lost.
const PROBE_LINK_SUMMARY = 'Probe for inline {@link} JSDoc normalization';
const FIXTURE_PROBE_LINK = `// ─────────────────────────────────────────────────────────────
// src/components/widgets/ProbeLink.tsx | valet
// ${PROBE_LINK_SUMMARY}
// ─────────────────────────────────────────────────────────────
export interface ProbeLinkProps {
  /**
   * Fired on change — the unified {@link ProbeLinkProps.newName}, emitting the
   * selected value.
   */
  linked?: (value: string) => void;
  /**
   * @deprecated Renamed to {@link ProbeLinkProps.newName | \`newName\`} (Q1).
   * The \`oldName\` alias keeps working through 0.x and is removed at 1.0.
   */
  oldName?: string;
  newName?: string;
}

export const ProbeLink = (props: ProbeLinkProps) => <div>{props.newName}</div>;
`;

// A2 regression (phantom-prop filter): the destructured-param-with-default
// path invented a public prop for ANY destructured binding that had a default,
// even when the name wasn't a member of the public props type. That minted
// phantom \`type:'unknown'\` props (Drawer.anchorProp, Avatar.loading) and, for
// renamed bindings, attached the default to the wrong (phantom) name instead
// of the real prop. A separate bug double-counted quoted keys: an interface
// member declared as \`'aria-label'?: string\` was emitted once quoted (from the
// member loop) and once unquoted (from the inherited-symbol loop, whose
// propSet.has() check compared the two different spellings and missed).
//
// This fixture exercises all three behaviors and FAILS on the pre-A2 code:
// • \`anchor: anchorProp = 'left'\` — renamed binding: pre-A2 emitted a phantom
//   \`anchorProp\` (type:'unknown', default:'left') and left the real \`label\`-
//   less \`anchor\` without its default. A2: default lands on \`anchor\`, no
//   \`anchorProp\`.
// • \`loading = 'lazy'\` — a DOM-passthrough attribute (from the extended
//   ImgHTMLAttributes) that the extractor records via domPassthrough, NOT as an
//   enumerated prop, so it's absent from the public-prop set. Pre-A2 invented
//   \`loading\` (type:'unknown'); A2 drops it.
// • \`'aria-label'\` — declared quoted on the interface; pre-A2 emitted both
//   \`'aria-label'\` (quoted) and \`aria-label\` (unquoted). A2: exactly one,
//   unquoted.
const PROBE_PHANTOM_SUMMARY = 'Probe for the phantom-prop filter (destructured defaults)';
const FIXTURE_PROBE_PHANTOM = `// ─────────────────────────────────────────────────────────────
// src/components/widgets/ProbePhantom.tsx | valet
// ${PROBE_PHANTOM_SUMMARY}
// ─────────────────────────────────────────────────────────────
import React from 'react';

export type ProbeAnchor = 'left' | 'right' | 'start' | 'end';

export interface ProbePhantomProps
  extends Pick<React.ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  /** Physical/logical side. */
  anchor?: ProbeAnchor;
  /** Accessible name for the dialog. */
  'aria-label'?: string;
  children?: React.ReactNode;
}

export const ProbePhantom: React.FC<ProbePhantomProps> = ({
  anchor: anchorProp = 'left',
  loading = 'lazy',
  'aria-label': ariaLabel,
  children,
}) => <div aria-label={ariaLabel} data-anchor={anchorProp} data-loading={loading}>{children}</div>;
`;

// A3 regression (call-site deprecation derivation): the authoritative
// alias→canonical map is parsed from the deprecate.ts call sites, NOT from
// JSDoc. resolveDeprecatedProp(component, canonicalName, canonical,
// deprecatedName, deprecated) is a string-literal argument tuple that cannot
// array-coerce/throw the way an inline {@link} @deprecated comment can, so a
// prop flagged at the call site is marked deprecated even when its JSDoc has
// NO @deprecated tag at all. deprecateProp(component, oldName, newName) covers
// the presence-warn shape (Switch.onChange → onValueChange).
//
// This fixture mirrors the 7 known real aliases (Table.selectable/rowKey,
// Accordion.open/defaultOpen/onOpenChange, List.selectable/getKey) in
// miniature and FAILS on pre-A3 code: `selectable`/`rowKey`/`open` carry no
// @deprecated JSDoc, so without the call-site derivation they would be served
// as first-class canonical API. The canonical replacement comes from arg1
// (resolveDeprecatedProp) / arg2 (deprecateProp).
const FIXTURE_PROBE_DEPRECATE_SHIM = `export function resolveDeprecatedProp<T>(
  _component: string,
  _canonicalName: string,
  canonical: T | undefined,
  _deprecatedName: string,
  deprecated: T | undefined,
): T | undefined {
  return canonical !== undefined ? canonical : deprecated;
}
export function deprecateProp(_component: string, _oldName: string, _newName: string): void {}
`;

const PROBE_DEPRECATE_SUMMARY = 'Probe for call-site deprecation derivation';
const FIXTURE_PROBE_DEPRECATE = `// ─────────────────────────────────────────────────────────────
// src/components/widgets/ProbeDeprecate.tsx | valet
// ${PROBE_DEPRECATE_SUMMARY}
// ─────────────────────────────────────────────────────────────
import { resolveDeprecatedProp, deprecateProp } from '../../deprecate-shim';

export interface ProbeDeprecateProps {
  /** Canonical selection vocabulary. */
  selectionMode?: 'none' | 'single' | 'multiple';
  /** NO @deprecated tag here — the call site is the only source of truth. */
  selectable?: boolean;
  getItemKey?: (row: unknown) => string;
  /** Also no @deprecated tag. */
  getKey?: (row: unknown) => string;
  onValueChange?: (v: string) => void;
  /** Deprecated alias resolved via deprecateProp (presence warn). */
  onChange?: (v: string) => void;
}

export const ProbeDeprecate = ({
  selectionMode,
  selectable: selectableProp,
  getItemKey,
  getKey: getKeyProp,
  onValueChange,
  onChange,
}: ProbeDeprecateProps) => {
  const mode = resolveDeprecatedProp(
    'ProbeDeprecate',
    'selectionMode',
    selectionMode,
    'selectable',
    selectableProp,
  );
  const key = resolveDeprecatedProp('ProbeDeprecate', 'getItemKey', getItemKey, 'getKey', getKeyProp);
  if (onChange !== undefined) {
    deprecateProp('ProbeDeprecate', 'onChange', 'onValueChange');
  }
  return <div data-mode={String(mode)} data-key={String(Boolean(key))} onClick={() => onValueChange?.('x')} />;
};
`;

describe('extractFromTs', () => {
  let res;

  beforeAll(() => {
    const root = makeRoot('valet-extract-ts-');
    write(root, 'tsconfig.json', FIXTURE_TSCONFIG);
    write(root, 'src/types.ts', FIXTURE_TYPES);
    write(root, 'src/components/fields/ProbeField.tsx', FIXTURE_PROBE_FIELD);
    write(root, 'src/components/layout/ProbeBox.tsx', FIXTURE_PROBE_BOX);
    write(root, 'src/components/widgets/ProbeHandle.tsx', FIXTURE_PROBE_HANDLE);
    write(root, 'src/components/widgets/ProbeLink.tsx', FIXTURE_PROBE_LINK);
    write(root, 'src/components/widgets/ProbePhantom.tsx', FIXTURE_PROBE_PHANTOM);
    write(root, 'src/deprecate-shim.ts', FIXTURE_PROBE_DEPRECATE_SHIM);
    write(root, 'src/components/widgets/ProbeDeprecate.tsx', FIXTURE_PROBE_DEPRECATE);
    res = extractFromTs(root);
  });

  it('reports intersection-required props as required (TextField.name regression)', () => {
    const byName = new Map(res.ProbeField.props.map((p) => [p.name, p]));
    // required in every union variant, optional only in the shared base
    expect(byName.get('name')?.required).toBe(true);
    // optional everywhere stays optional
    expect(byName.get('label')?.required).toBe(false);
    // required in only one union variant stays conservatively optional
    expect(byName.get('multiline')?.required).toBe(false);
  });

  it('surfaces the polymorphic `as` prop with its default element', () => {
    const asProp = res.ProbeBox.props.find((p) => p.name === 'as');
    expect(asProp).toBeDefined();
    expect(asProp.type).toBe('React.ElementType');
    expect(asProp.required).toBe(false);
    expect(asProp.default).toBe("'div'");
    expect(res.ProbeBox.domPassthrough).toEqual({ element: 'div', omitted: [] });
  });

  it('derives summaries from header comments — never the placeholder', () => {
    expect(res.ProbeField.summary).toBe(PROBE_FIELD_SUMMARY);
    expect(res.ProbeBox.summary).toBe(PROBE_BOX_SUMMARY);
    for (const entry of Object.values(res)) {
      expect(entry.summary).not.toBe(`${entry.name} component`);
    }
  });

  it('ignores SCREAMING_SNAKE constant exports beside components (DEFAULT_MODELS regression)', () => {
    expect(res.PROBE_DEFAULTS).toBeUndefined();
    expect(Object.keys(res)).not.toContain('PROBE_DEFAULTS');
  });

  it('schema 1.7: emits no `actions` field, even for useImperativeHandle components', () => {
    // The probe deliberately uses the exact pattern the deleted heuristic
    // matched; nothing in the extraction may resurrect the field.
    expect(res.ProbeHandle).toBeDefined();
    for (const entry of Object.values(res)) {
      expect(entry).not.toHaveProperty('actions');
    }
  });

  it('A1: normalizes inline {@link} JSDoc — real description, no [object Object] (corrupt-desc regression)', () => {
    const linked = res.ProbeLink.props.find((p) => p.name === 'linked');
    expect(linked).toBeDefined();
    // Pre-A1: '[object Object]' (the (string|JSDocNode)[] String-coerced).
    expect(linked.description).not.toMatch(/\[object Object\]/);
    expect(linked.description).toContain('Fired on change');
    // the inline {@link} target is flattened into the prose, not dropped
    expect(linked.description).toContain('ProbeLinkProps.newName');
    expect(linked.description).toContain('emitting the');
  });

  it('A1: recovers @deprecated when its tag comment contains an inline {@link} (lost-flag regression)', () => {
    const oldName = res.ProbeLink.props.find((p) => p.name === 'oldName');
    expect(oldName).toBeDefined();
    // Pre-A1: tag.getComment() is an array → (…).trim() threw into the bare
    // catch{}, so deprecated was never set. It must be true now.
    expect(oldName.deprecated).toBe(true);
  });

  it('A2: drops a destructured-default that is not a public-prop-type member (phantom regression)', () => {
    const names = res.ProbePhantom.props.map((p) => p.name);
    // `loading = 'lazy'` is a DOM-passthrough attribute, not an enumerated
    // public prop — pre-A2 invented it as type:'unknown'. It must be absent.
    expect(names).not.toContain('loading');
    // and nothing in this component may be left as the type:'unknown' tell.
    for (const p of res.ProbePhantom.props) {
      expect(p.type).not.toBe('unknown');
    }
  });

  it('A2: attaches a default to the real prop for a renamed binding (anchorProp regression)', () => {
    const names = res.ProbePhantom.props.map((p) => p.name);
    // `anchor: anchorProp = 'left'` destructures the public `anchor` prop —
    // the local alias `anchorProp` must NOT become a phantom prop.
    expect(names).not.toContain('anchorProp');
    const anchor = res.ProbePhantom.props.find((p) => p.name === 'anchor');
    expect(anchor).toBeDefined();
    // the default lands on the real prop, with its declared type intact
    expect(anchor.default).toBe("'left'");
    expect(anchor.type).toBe('ProbeAnchor');
  });

  it('A2: de-dupes a quoted/unquoted prop key, emitting it once unquoted (aria-label regression)', () => {
    const names = res.ProbePhantom.props.map((p) => p.name);
    // pre-A2: both "'aria-label'" (quoted, from the member loop) and
    // 'aria-label' (unquoted, from the inherited-symbol loop) appeared.
    expect(names).not.toContain("'aria-label'");
    expect(names.filter((n) => n === 'aria-label')).toHaveLength(1);
  });

  it('A3: flags a resolveDeprecatedProp alias as deprecated with the replacement, derived from the call site even when JSDoc is absent', () => {
    const byName = new Map(res.ProbeDeprecate.props.map((p) => [p.name, p]));
    // `selectable` carries NO @deprecated JSDoc — pre-A3 it was served as
    // first-class API. The call site resolveDeprecatedProp('ProbeDeprecate',
    // 'selectionMode', …, 'selectable', …) is the only source of truth.
    expect(byName.get('selectable')?.deprecated).toEqual({ replacement: 'selectionMode' });
    // arg1 (canonicalName) is the replacement, not arg3 (the deprecated name).
    expect(byName.get('getKey')?.deprecated).toEqual({ replacement: 'getItemKey' });
    // the canonical names themselves are never flagged.
    expect(byName.get('selectionMode')?.deprecated).toBeUndefined();
    expect(byName.get('getItemKey')?.deprecated).toBeUndefined();
  });

  it('A3: derives a deprecateProp(component, oldName, newName) alias with newName as the replacement', () => {
    const byName = new Map(res.ProbeDeprecate.props.map((p) => [p.name, p]));
    // deprecateProp('ProbeDeprecate', 'onChange', 'onValueChange')
    expect(byName.get('onChange')?.deprecated).toEqual({ replacement: 'onValueChange' });
    expect(byName.get('onValueChange')?.deprecated).toBeUndefined();
  });

  it('A3: emits the schema-1.7 deprecated shape (true | {replacement}), never a bare boolean when a replacement is known', () => {
    for (const p of res.ProbeDeprecate.props) {
      if (p.deprecated == null) continue;
      // shared.ts:40 — `true | { reason?, replacement? }`
      expect(p.deprecated === true || typeof p.deprecated === 'object').toBe(true);
      if (typeof p.deprecated === 'object') {
        expect(typeof p.deprecated.replacement).toBe('string');
      }
    }
  });
});

// ── extract-docs ─────────────────────────────────────────────
const FIXTURE_APP = `const page = (load) => load;
const BoxDemo = page(() => import('./pages/components/layout/BoxDemo'));
const OrphanDemo = page(() => import('./pages/components/layout/OrphanDemo'));
declare const Routes: never, Route: never;
export default function App() {
  return (
    <Routes>
      <Route path='/box-demo' element={<BoxDemo />} />
      <Route path='*' element={<BoxDemo />} />
    </Routes>
  );
}
`;

const FIXTURE_BOX_DEMO = `export default function BoxDemo() {
  return <div>Box demo page</div>;
}
`;

describe('extract-docs route table', () => {
  let root;

  beforeAll(() => {
    root = makeRoot('valet-extract-docs-');
    write(root, 'docs/src/App.tsx', FIXTURE_APP);
    write(root, 'docs/src/pages/components/layout/BoxDemo.tsx', FIXTURE_BOX_DEMO);
    write(
      root,
      'docs/src/pages/components/layout/OrphanDemo.tsx',
      'export default function OrphanDemo() { return <div />; }\n',
    );
  });

  it('maps lazy page imports to real SPA routes, skipping catch-alls', () => {
    const { routes, routeByPageFile } = extractRouteTable(root);
    expect(routes).toEqual({ '/box-demo': 'docs/src/pages/components/layout/BoxDemo.tsx' });
    expect(routeByPageFile['docs/src/pages/components/layout/BoxDemo.tsx']).toBe('/box-demo');
  });

  it('emits navigable docsUrls (the shipped ones were source-file paths)', () => {
    const docs = extractFromDocs(root);
    expect(docs.Box?.docsUrl).toBe('/box-demo');
    // the old broken format: '/components/layout/BoxDemo'
    expect(docs.Box?.docsUrl).not.toMatch(/Demo$/);
    // a page outside the route table with no extracted content is dropped
    expect(docs.Orphan).toBeUndefined();
  });

  it('writes the _routes.json artifact under the given root for validate cross-checks', () => {
    extractFromDocs(root);
    const artifact = JSON.parse(
      fs.readFileSync(path.join(root, 'mcp-data', '_routes.json'), 'utf8'),
    );
    expect(artifact.source).toBe('docs/src/App.tsx');
    expect(artifact.routes['/box-demo']).toBe('docs/src/pages/components/layout/BoxDemo.tsx');
    expect(Object.keys(artifact.routes)).not.toContain('*');
  });
});

// ── extract-glossary ─────────────────────────────────────────
const FIXTURE_GLOSSARY = `export const GLOSSARY = [
  { term: 'surface', definition: 'Per-route root container.', category: 'layout' },
  { term: 'preset', definition: 'Named style bundle.', aliases: ['style preset'] },
];
export default function Glossary() { return <div />; }
`;

describe('extractGlossary', () => {
  it('extracts entries from the current getting-started location, sorted by term', () => {
    const root = makeRoot('valet-glossary-');
    write(root, 'docs/src/pages/getting-started/Glossary.tsx', FIXTURE_GLOSSARY);
    const entries = extractGlossary(root);
    expect(entries.map((e) => e.term)).toEqual(['preset', 'surface']);
    expect(entries[0].aliases).toEqual(['style preset']);
    expect(entries[1].category).toBe('layout');
  });

  it('finds a moved Glossary.tsx via the recursive fallback', () => {
    const root = makeRoot('valet-glossary-moved-');
    write(root, 'docs/src/pages/reference/Glossary.tsx', FIXTURE_GLOSSARY);
    expect(extractGlossary(root).map((e) => e.term)).toEqual(['preset', 'surface']);
  });

  it('throws when no Glossary.tsx exists (empty glossary is unshippable)', () => {
    const root = makeRoot('valet-glossary-missing-');
    write(root, 'docs/src/pages/getting-started/NotGlossary.tsx', 'export default () => null;\n');
    expect(() => extractGlossary(root)).toThrow(/no Glossary\.tsx found/);
  });

  it('throws when the page parses but yields zero entries', () => {
    const root = makeRoot('valet-glossary-empty-');
    write(
      root,
      'docs/src/pages/getting-started/Glossary.tsx',
      'export const GLOSSARY = [];\nexport default function Glossary() { return null; }\n',
    );
    expect(() => extractGlossary(root)).toThrow(/zero entries/);
  });
});

// ── merge: dotted-subcomponent docsUrl inheritance ───────────
describe('merge docsUrl resolution', () => {
  const tsEntry = (name) => ({
    name,
    category: 'widgets',
    slug: `components/widgets/${name.toLowerCase()}`,
    summary: `${name} probe summary`,
    props: [],
    cssVars: [],
    cssPresets: [],
    events: [],
    slots: [],
    sourceFiles: [],
  });
  const docsEntry = (docsUrl) => ({ docsUrl, propsRows: [], examples: [], bestPractices: [] });

  it('dotted subcomponents document on their parent page; own pages win', () => {
    const tsMap = {
      Tabs: tsEntry('Tabs'),
      'Tabs.Tab': tsEntry('Tabs.Tab'),
      'Select.Option': tsEntry('Select.Option'),
      Lone: tsEntry('Lone'),
    };
    const docsMap = {
      Tabs: docsEntry('/tabs'),
      'Select.Option': docsEntry('/select-option'),
    };
    const out = merge(tsMap, docsMap, '0.0.0-test', {});
    expect(out['Tabs.Tab'].docsUrl).toBe('/tabs');
    expect(out['Select.Option'].docsUrl).toBe('/select-option');
    expect(out.Tabs.docsUrl).toBe('/tabs');
    expect(out.Lone.docsUrl).toBeUndefined();
  });

  it('sidecar meta docsUrl still applies when neither page nor parent has one', () => {
    const out = merge({ 'Menu.Item': tsEntry('Menu.Item') }, {}, '0.0.0-test', {
      'Menu.Item': { docs: { docsUrl: '/menu' } },
    });
    expect(out['Menu.Item'].docsUrl).toBe('/menu');
  });
});

// ── merge: curated sidecar summary wins (MCP-TRUTH S10) ──────
describe('merge summary precedence', () => {
  const tsEntry = (name, summary) => ({
    name,
    category: 'widgets',
    slug: `components/widgets/${name.toLowerCase()}`,
    summary,
    props: [],
    cssVars: [],
    cssPresets: [],
    events: [],
    slots: [],
    sourceFiles: [],
  });

  it('prefers the curated sidecar summary over the TS header summary', () => {
    const out = merge(
      { Widget: tsEntry('Widget', 'raw header comment – 2025-01-01') },
      {},
      '0.0.0-test',
      {
        Widget: { summary: 'Sharp, agent-actionable one-liner.' },
      },
    );
    expect(out.Widget.summary).toBe('Sharp, agent-actionable one-liner.');
  });

  it('falls back to the TS header summary when the sidecar summary is blank/whitespace', () => {
    const out = merge({ Widget: tsEntry('Widget', 'header summary') }, {}, '0.0.0-test', {
      Widget: { summary: '   ' },
    });
    expect(out.Widget.summary).toBe('header summary');
  });

  it('falls back to the placeholder only when neither sidecar nor header supplies one', () => {
    const out = merge({ Widget: tsEntry('Widget', undefined) }, {}, '0.0.0-test', {});
    expect(out.Widget.summary).toBe('Widget component');
  });

  it('dotted subcomponents accept their own dotted-name sidecar summary', () => {
    const out = merge(
      { 'Tabs.Tab': tsEntry('Tabs.Tab', 'parent header comment') },
      {},
      '0.0.0-test',
      { 'Tabs.Tab': { summary: 'A clickable tab trigger inside Tabs.' } },
    );
    expect(out['Tabs.Tab'].summary).toBe('A clickable tab trigger inside Tabs.');
  });

  it('dotted subcomponents inherit the parent sidecar summary when they lack their own', () => {
    const out = merge(
      {
        Tabs: tsEntry('Tabs', 'tabs header comment'),
        'Tabs.Panel': tsEntry('Tabs.Panel', 'tabs header comment'),
      },
      {},
      '0.0.0-test',
      { Tabs: { summary: 'Tabbed interface curated summary.' } },
    );
    // the parent's curated summary wins over the subcomponent's raw header
    expect(out['Tabs.Panel'].summary).toBe('Tabbed interface curated summary.');
    expect(out.Tabs.summary).toBe('Tabbed interface curated summary.');
  });

  it('a dotted subcomponent sidecar wins over the inherited parent summary', () => {
    const out = merge(
      {
        Tabs: tsEntry('Tabs', 'tabs header'),
        'Tabs.Tab': tsEntry('Tabs.Tab', 'tabs header'),
      },
      {},
      '0.0.0-test',
      {
        Tabs: { summary: 'Parent summary.' },
        'Tabs.Tab': { summary: 'Subcomponent summary.' },
      },
    );
    expect(out['Tabs.Tab'].summary).toBe('Subcomponent summary.');
  });
});

// ── merge: schema 1.7 — `actions` dropped from the corpus ────
describe('merge schema 1.7 (actions removed)', () => {
  const tsEntry = (name, extra = {}) => ({
    name,
    category: 'widgets',
    slug: `components/widgets/${name.toLowerCase()}`,
    summary: `${name} probe summary`,
    props: [],
    cssVars: [],
    cssPresets: [],
    events: [],
    slots: [],
    sourceFiles: [],
    ...extra,
  });

  it('stamps every merged doc with schemaVersion 1.7', () => {
    const out = merge({ Probe: tsEntry('Probe') }, {}, '0.0.0-test', {});
    expect(out.Probe.schemaVersion).toBe('1.7');
  });

  it('emits no `actions` key, and drops a legacy actions array from a stale TS extraction', () => {
    const out = merge(
      {
        Probe: tsEntry('Probe'),
        Legacy: tsEntry('Legacy', { actions: [{ name: 'focus' }] }),
      },
      {},
      '0.0.0-test',
      {},
    );
    expect(out.Probe).not.toHaveProperty('actions');
    // a pre-1.7 _ts-extract.json (or cached map) carrying actions must not
    // leak the field back into the served corpus
    expect(out.Legacy).not.toHaveProperty('actions');
  });
});

// ─────────────────────────────────────────────────────────────
// scripts/mcp/extractors.test.mjs  | valet
// Fixture regressions for the Wave 0.1 extractor fixes (node env):
// • extract-ts — required props over intersections (TextField.name bug),
//   polymorphic `as` prop, header-comment summaries (no placeholders)
// • extract-docs — route-table docsUrls (real SPA routes, not file paths)
// • extract-glossary — candidate list + recursive fallback, hard failures
// • merge — dotted subcomponents inherit the parent page's docsUrl
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

describe('extractFromTs', () => {
  let res;

  beforeAll(() => {
    const root = makeRoot('valet-extract-ts-');
    write(root, 'tsconfig.json', FIXTURE_TSCONFIG);
    write(root, 'src/types.ts', FIXTURE_TYPES);
    write(root, 'src/components/fields/ProbeField.tsx', FIXTURE_PROBE_FIELD);
    write(root, 'src/components/layout/ProbeBox.tsx', FIXTURE_PROBE_BOX);
    write(root, 'src/components/widgets/ProbeHandle.tsx', FIXTURE_PROBE_HANDLE);
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

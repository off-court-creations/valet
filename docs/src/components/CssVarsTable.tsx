// ─────────────────────────────────────────────────────────────
// docs/src/components/CssVarsTable.tsx  | valet-docs
// Render CSS variables table from MCP component metadata
// ─────────────────────────────────────────────────────────────
import { useMemo } from 'react';
import type React from 'react';
import { Panel, Table } from '@archway/valet';
import type { TableColumn } from '@archway/valet';

type MCPComponentDoc = {
  slug: string;
  name: string;
  cssVars?: string[];
};

export type CssVarsTableProps = {
  slug?: string;
  name?: string;
};

const modules = import.meta.glob('../../../mcp-data/components/*.json', { eager: true });

function buildIndex(): Record<string, MCPComponentDoc> {
  const out: Record<string, MCPComponentDoc> = {};
  for (const [path, mod] of Object.entries(modules)) {
    const data = (mod as { default?: unknown })?.default ?? mod;
    const json = data as MCPComponentDoc;
    let slug = json?.slug;
    if (!slug) {
      const fname =
        path
          .split('/')
          .pop()
          ?.replace(/\.json$/, '') || '';
      slug = fname.split('_').join('/');
    }
    if (slug) out[slug] = json;
  }
  return out;
}

export default function CssVarsTable({ slug, name }: CssVarsTableProps) {
  const bySlug = useMemo(buildIndex, []);
  const doc = useMemo(() => {
    if (slug && bySlug[slug]) return bySlug[slug];
    if (name) return Object.values(bySlug).find((d) => d.name === name);
    return undefined;
  }, [bySlug, name, slug]);

  const vars = (doc?.cssVars ?? []).filter(
    (v): v is string => typeof v === 'string' && v.trim().length > 0,
  );
  if (!doc || vars.length === 0) return null;

  type Row = { variable: React.ReactNode };
  const rows: Row[] = vars.map((v) => ({ variable: <code>{v}</code> }));
  const columns: TableColumn<Row>[] = [{ header: 'Variable', accessor: 'variable' }];

  return (
    <Panel fullWidth>
      <Table<Row>
        data={rows}
        columns={columns}
        constrainHeight={false}
      />
    </Panel>
  );
}

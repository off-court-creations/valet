// ─────────────────────────────────────────────────────────────
// docs/src/components/PropsTable.tsx  | valet-docs
// Render component prop reference tables from MCP data (mcp-data/components)
// ─────────────────────────────────────────────────────────────
import { useMemo } from 'react';
import type React from 'react';
import { Panel, Table } from '@archway/valet';
import type { TableColumn } from '@archway/valet';

type MCPProp = {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  description?: string;
};

type MCPComponentDoc = {
  name: string;
  slug: string;
  props?: MCPProp[];
};

export type PropsTableProps = {
  slug?: string; // e.g., 'components/widgets/table'
  name?: string; // fallback lookup by name
};

// Import all MCP component JSON docs and build a lookup by slug
// Note: path resolved from this file: docs/src/components → project root is ../../../
const modules = import.meta.glob('../../../mcp-data/components/*.json', { eager: true });

function buildSlugIndex(): Record<string, MCPComponentDoc> {
  const map: Record<string, MCPComponentDoc> = {};
  for (const [path, mod] of Object.entries(modules)) {
    const data = (mod as { default?: unknown })?.default ?? mod;
    const json = data as MCPComponentDoc;
    // Prefer explicit slug in JSON; otherwise derive from filename
    let slug = json?.slug;
    if (!slug) {
      const fname =
        path
          .split('/')
          .pop()
          ?.replace(/\.json$/, '') || '';
      // components_fields_button → components/fields/button
      slug = fname.split('_').join('/');
    }
    if (slug) map[slug] = json;
  }
  return map;
}

export default function PropsTable({ slug, name }: PropsTableProps) {
  const bySlug = useMemo(buildSlugIndex, []);

  const doc: MCPComponentDoc | undefined = useMemo(() => {
    if (slug && bySlug[slug]) return bySlug[slug];
    if (name) {
      const match = Object.values(bySlug).find((d) => d.name === name);
      if (match) return match;
    }
    return undefined;
  }, [bySlug, name, slug]);

  const rows = useMemo(() => {
    const propDefs = (doc?.props ?? []) as MCPProp[];
    return propDefs.map((p) => ({
      prop: <code>{p.name}</code>,
      type: <code>{p.type}</code>,
      required: p.required ? 'yes' : '—',
      default: p.default ?? '—',
      description: p.description ?? '',
    }));
  }, [doc]);

  type Row = {
    prop: React.ReactNode;
    type: React.ReactNode;
    required: string;
    default: string;
    description: string;
  };

  const columns: TableColumn<Row>[] = useMemo(
    () => [
      { header: 'Prop', accessor: 'prop' },
      { header: 'Type', accessor: 'type' },
      { header: 'Required', accessor: 'required' },
      { header: 'Default', accessor: 'default' },
      { header: 'Description', accessor: 'description' },
    ],
    [],
  );

  if (!doc || rows.length === 0) return null;

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

// ─────────────────────────────────────────────────────────────
// docs/src/components/EventsTable.tsx  | valet-docs
// Render events table from MCP component metadata
// ─────────────────────────────────────────────────────────────
import { useMemo } from 'react';
import { Panel, Table } from '@archway/valet';
import type { TableColumn } from '@archway/valet';

type MCPEvent = {
  name: string;
  payloadType?: string;
  description?: string;
};

type MCPComponentDoc = {
  slug: string;
  name: string;
  events?: MCPEvent[];
};

export type EventsTableProps = {
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

export default function EventsTable({ slug, name }: EventsTableProps) {
  const bySlug = useMemo(buildIndex, []);
  const doc = useMemo(() => {
    if (slug && bySlug[slug]) return bySlug[slug];
    if (name) return Object.values(bySlug).find((d) => d.name === name);
    return undefined;
  }, [bySlug, name, slug]);

  const events = (doc?.events ?? []).filter((e) => e && typeof e.name === 'string');
  if (!doc || events.length === 0) return null;

  type Row = { event: string; payload: string; description: string };
  const rows: Row[] = events.map((e) => ({
    event: e.name,
    payload: e.payloadType ?? '—',
    description: e.description ?? '',
  }));

  const columns: TableColumn<Row>[] = [
    { header: 'Event', accessor: 'event' },
    { header: 'Payload', accessor: 'payload' },
    { header: 'Description', accessor: 'description' },
  ];

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

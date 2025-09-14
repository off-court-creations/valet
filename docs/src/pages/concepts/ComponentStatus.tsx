// ─────────────────────────────────────────────────────────────
// src/pages/concepts/ComponentStatus.tsx  | valet-docs
// Status matrix of all components with sidecars, rendered via <Table/>
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel, Table, type TableColumn } from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import type { DocMeta } from '../../types';
import {
  COMPONENTS_STATUS,
  sortComponents,
  type ComponentStatus,
} from '../../data/componentsStatus';

export const meta: DocMeta = {
  id: 'component-status',
  title: 'Component Status',
  description: 'Current stability status for every valet component with a meta sidecar.',
  pageType: 'reference',
  tldr: 'Single table of all components and their current stability status.',
};

export default function ComponentStatusPage() {
  const data = [...COMPONENTS_STATUS].sort(sortComponents);

  const columns: TableColumn<ComponentStatus>[] = [
    { header: 'Component', accessor: 'name', sortable: true },
    { header: 'Category', accessor: 'category', sortable: true },
    { header: 'Status', accessor: 'status', sortable: true },
    { header: 'Slug', accessor: 'slug', sortable: true },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Component Status
        </Typography>
        <Typography>
          This page reflects the status declared in each component&apos;s <code>*.meta.json</code>{' '}
          sidecar. It is also embedded into the MCP data so external tools can reason about
          stability.
        </Typography>
        <Panel fullWidth>
          <Table
            data={data}
            columns={columns}
            striped
            hoverable
            dividers
            initialSort={{ index: 1 }}
            constrainHeight
          />
        </Panel>
        {null}
      </Stack>
    </Surface>
  );
}

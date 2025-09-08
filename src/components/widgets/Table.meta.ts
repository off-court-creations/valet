// ─────────────────────────────────────────────────────────────
// src/components/widgets/Table.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'Table',
  aliases: ['table', 'datagrid', 'data-grid'],
  usage: {
    purpose:
      'Present datasets in rows and columns with sorting, selection, and scrolling that respects available height.',
    whenToUse: [
      'Comparing values across records',
      'User tasks require scanning columns, selecting rows, or bulk actions',
      'Bounded height where content should scroll inside the component',
    ],
    whenNotToUse: [
      'Document‑like content or rich prose (use Typography/Panel)',
      'Hierarchical data that expands per row (use Tree)',
    ],
    alternatives: ['List', 'Grid', 'Tree'],
  },
});

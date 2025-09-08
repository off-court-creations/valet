// ─────────────────────────────────────────────────────────────
// src/components/widgets/Tree.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'Tree',
  aliases: ['tree', 'treeview'],
  usage: {
    purpose: 'Explore hierarchical data with expand/collapse and selection.',
    whenToUse: [
      'File systems, org charts, nested categories',
      'When users need to traverse parent/child relationships',
    ],
    whenNotToUse: [
      'Flat lists of items (use List)',
      'Tabular datasets that benefit from columns (use Table)',
    ],
    alternatives: ['List', 'Table'],
  },
});

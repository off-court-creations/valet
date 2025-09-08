// ─────────────────────────────────────────────────────────────
// src/components/layout/List.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'List',
  aliases: ['list', 'ul', 'ol'],
  usage: {
    purpose: 'Semantic list of items with consistent spacing and a11y.',
    whenToUse: [
      'Menus, option lists, settings, simple feeds',
      'Collections where each item is a small self‑contained row',
    ],
    whenNotToUse: [
      'Dense tabular data (use Table)',
      'Two‑dimensional arrangements (use Grid)',
      'Deep hierarchies (use Tree)',
    ],
    alternatives: ['Table', 'Grid', 'Tree'],
  },
});

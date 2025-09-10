// ─────────────────────────────────────────────────────────────
// src/components/fields/MetroSelect.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'MetroSelect',
  aliases: ['chip', 'segmented', 'segment'],
  usage: {
    purpose: 'Segmented/chip‑based selector for compact, scannable choices (single or multiple).',
    whenToUse: [
      'Tag pickers, filters, and quick toggles where visibility matters',
      'Small to medium sets where chips communicate state effectively',
    ],
    whenNotToUse: [
      'Long option lists (use Select)',
      'Exactly one choice when radio clarity is preferred (use Radio)',
    ],
    alternatives: ['Select', 'Radio', 'Checkbox'],
  },
});

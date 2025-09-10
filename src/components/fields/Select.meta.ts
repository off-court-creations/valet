// ─────────────────────────────────────────────────────────────
// src/components/fields/Select.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'Select',
  aliases: ['dropdown', 'combobox', 'select'],
  usage: {
    purpose: 'Choose one option from many with a compact popup.',
    whenToUse: [
      'Medium to large option sets that don’t fit as Radio',
      'Forms where space is limited and search/typeahead may help',
    ],
    whenNotToUse: [
      'Multiple selections with visible chips (use MetroSelect)',
      'Very small sets where all options should be visible (use Radio)',
    ],
    alternatives: ['Radio', 'MetroSelect'],
  },
});

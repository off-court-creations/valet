// ─────────────────────────────────────────────────────────────
// src/components/layout/Accordion.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'Accordion',
  aliases: ['accordion'],
  usage: {
    purpose: 'Progressive disclosure for long or optional content sections.',
    whenToUse: [
      'Collapse ancillary details to keep pages scannable',
      'FAQ or documentation sections with independent panels',
    ],
    whenNotToUse: [
      'Rapidly switching between multiple views (use Tabs)',
      'Content that must be visible simultaneously',
    ],
    alternatives: ['Tabs', 'Panel'],
  },
});

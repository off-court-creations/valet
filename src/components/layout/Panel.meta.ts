// ─────────────────────────────────────────────────────────────
// src/components/layout/Panel.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'Panel',
  aliases: ['panel', 'card', 'section'],
  usage: {
    purpose: 'Card‑like container to group related content with padding and optional elevation.',
    whenToUse: [
      'Segment a page into readable sections',
      'Show a list/grid of cards with consistent styling',
      'Visually elevate important content without creating a new page',
    ],
    whenNotToUse: ['Whole‑page containers (use Surface)', 'Blocking interactions (use Modal)'],
    alternatives: ['Box', 'Surface', 'Modal'],
  },
});

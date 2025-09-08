// ─────────────────────────────────────────────────────────────
// src/components/primitives/Divider.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Divider',
  aliases: ['divider', 'rule', 'hr'],
  usage: {
    purpose: 'Visual separation between groups of content.',
    whenToUse: ['Break up lists, settings, or stacked sections', 'Create a subtle boundary without extra spacing wrappers'],
    whenNotToUse: ['As a substitute for vertical rhythm (prefer gap/padding on layout components)'],
    alternatives: ['Box', 'Panel']
  }
});
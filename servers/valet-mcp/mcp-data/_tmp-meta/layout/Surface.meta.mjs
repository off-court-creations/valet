// ─────────────────────────────────────────────────────────────
// src/components/layout/Surface.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Surface',
  aliases: ['surface', 'hero'],
  usage: {
    purpose: 'Top‑level route container that owns screen state and provides CSS variables to children.',
    whenToUse: ['Wrap a page/route to provide responsive state and sizing vars', 'Create a hero section that controls contextual background and theme', 'Constrain scroll behavior of complex widgets (e.g., Table) within the page'],
    whenNotToUse: ['Nested surfaces (not supported — only one Surface per route)', 'Small layout groups (use Box or Panel)'],
    alternatives: ['Box', 'Panel']
  }
});
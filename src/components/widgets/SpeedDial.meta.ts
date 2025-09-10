// ─────────────────────────────────────────────────────────────
// src/components/widgets/SpeedDial.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'SpeedDial',
  aliases: ['speeddial', 'speed-dial', 'fab'],
  usage: {
    purpose: 'Floating action button that expands into quick actions.',
    whenToUse: [
      'Mobile contexts where a primary action has related secondary actions',
      'Space‑constrained UIs that benefit from a single entry point to multiple actions',
    ],
    whenNotToUse: [
      'Desktop toolbars or menus where actions can be labeled',
      'Contexts with more than ~5 actions (use menus/toolbars)',
    ],
    alternatives: ['AppBar', 'Button'],
  },
});

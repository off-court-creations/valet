// ─────────────────────────────────────────────────────────────
// src/components/layout/Stack.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Stack',
  aliases: ['stack'],
  usage: {
    purpose: 'One‑dimensional layout with consistent gaps and alignment.',
    whenToUse: ['Lay out items vertically or horizontally with uniform spacing', 'Build forms, toolbars, and settings panels quickly', 'Switch direction responsively (column on mobile, row on desktop)'],
    whenNotToUse: ['Complex two‑dimensional layouts (use Grid)', 'Dense data presentations (use Table or List)'],
    alternatives: ['Grid', 'Box']
  }
});
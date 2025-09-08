// ─────────────────────────────────────────────────────────────
// src/components/primitives/Icon.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Icon',
  aliases: ['icon', 'glyph'],
  usage: {
    purpose: 'Crisp, scalable glyphs for actions, status, and decoration.',
    whenToUse: ['Augment buttons and labels with recognizable symbols', 'Communicate status at a glance'],
    whenNotToUse: ['Long labels or content (use Typography)'],
    alternatives: ['Typography', 'Avatar']
  }
});
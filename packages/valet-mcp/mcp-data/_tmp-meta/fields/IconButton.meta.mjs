// ─────────────────────────────────────────────────────────────
// src/components/fields/IconButton.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'IconButton',
  aliases: ['iconbutton', 'icon-button'],
  usage: {
    purpose: 'Compact, icon‑only button for secondary actions.',
    whenToUse: ['Space‑constrained UIs, toolbars, lists, and cards', 'Actions with well‑known glyphs (edit, delete, settings)'],
    whenNotToUse: ['Primary calls to action that need a label (use Button)', 'Ambiguous actions that require text'],
    alternatives: ['Button']
  }
});
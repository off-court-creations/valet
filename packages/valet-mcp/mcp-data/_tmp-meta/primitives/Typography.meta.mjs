// ─────────────────────────────────────────────────────────────
// src/components/primitives/Typography.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Typography',
  aliases: ['typography', 'text', 'heading', 'title'],
  usage: {
    purpose: 'Accessible text primitives for headings, paragraphs, and labels.',
    whenToUse: ['Render headings, body text, captions, and helper text', 'Communicate hierarchy and emphasis via variants and weights'],
    whenNotToUse: ['Interactive controls or links (use Button, IconButton, or anchor elements)'],
    alternatives: ['Button', 'Panel']
  }
});
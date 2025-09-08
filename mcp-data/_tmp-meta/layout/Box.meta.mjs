// ─────────────────────────────────────────────────────────────
// src/components/layout/Box.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Box',
  aliases: ['box', 'container'],
  usage: {
    purpose: 'Neutral building block for layout and cosmetic styling (padding, background, borders).',
    whenToUse: ['Wrap content to apply spacing, borders, or background without implying semantics', 'Create flex or grid containers for simple one-off layouts', 'Constrain width or height and expose CSS vars to children'],
    whenNotToUse: ['When you need semantic structure (use Typography, List, etc.)', 'As the top-level route container (use Surface)', 'For interactive controls (use Button, IconButton, fields)'],
    alternatives: ['Stack', 'Grid', 'Panel', 'Surface']
  }
});
// ─────────────────────────────────────────────────────────────
// src/components/layout/Grid.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Grid',
  aliases: ['grid'],
  usage: {
    purpose: 'Two‑dimensional layout for arranging items in responsive rows and columns.',
    whenToUse: ['Dashboards, card collections, image galleries', 'Aligning items to a column system with wrap behavior', 'Creating responsive layouts that reflow at breakpoints'],
    whenNotToUse: ['Tabular data with headers and selection (use Table)', 'Simple linear stacks (use Stack)'],
    alternatives: ['Stack', 'Table', 'List', 'Box']
  }
});
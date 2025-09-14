// ─────────────────────────────────────────────────────────────
// src/components/fields/Iterator.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Iterator',
  aliases: ['iterator'],
  usage: {
    purpose: 'Render repeated structures over collections with consistent spacing and keys.',
    whenToUse: ['Map datasets to repeated UI elements with built‑in ergonomics', 'Keep list/grid rendering logic co‑located and declarative'],
    whenNotToUse: ['Virtualized large lists (use a dedicated virtual list)', 'Data that requires tabular affordances (use Table)'],
    alternatives: ['List', 'Grid', 'Table']
  }
});
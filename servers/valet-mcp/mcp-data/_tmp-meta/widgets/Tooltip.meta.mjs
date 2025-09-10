// ─────────────────────────────────────────────────────────────
// src/components/widgets/Tooltip.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Tooltip',
  aliases: ['tooltip', 'hint'],
  usage: {
    purpose: 'Transient, non‑blocking help on hover/focus.',
    whenToUse: ['Explain icon‑only controls or abbreviations', 'Provide short hints that don’t deserve persistent text'],
    whenNotToUse: ['Critical information or actions (use Modal or Snackbar)', 'Content that should be discoverable on touch‑only devices without long‑press'],
    alternatives: ['Snackbar', 'Modal', 'Typography']
  }
});
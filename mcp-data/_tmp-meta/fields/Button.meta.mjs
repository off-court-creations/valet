// ─────────────────────────────────────────────────────────────
// src/components/fields/Button.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Button',
  aliases: ['button'],
  usage: {
    purpose: 'Trigger actions with clear, accessible affordances.',
    whenToUse: ['Primary and secondary actions in forms and panels', 'Navigation that behaves like a button (otherwise use a link)', 'Include icons to reinforce meaning or save space'],
    whenNotToUse: ['Icon‑only actions (use IconButton)', 'Inline text links for navigation (use anchor elements)'],
    alternatives: ['IconButton', 'Tabs', 'AppBar']
  }
});
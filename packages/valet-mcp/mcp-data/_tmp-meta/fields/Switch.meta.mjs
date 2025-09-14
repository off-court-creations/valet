// ─────────────────────────────────────────────────────────────
// src/components/fields/Switch.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Switch',
  aliases: ['toggle', 'switch'],
  usage: {
    purpose: 'Immediate on/off toggle for a single setting.',
    whenToUse: ['Binary state that applies instantly (Wi‑Fi on/off)', 'Settings panels and real‑time preferences'],
    whenNotToUse: ['Form submissions where value is saved on submit (use Checkbox)', 'Multiple exclusive options (use Radio)'],
    alternatives: ['Checkbox', 'Radio']
  }
});
// ─────────────────────────────────────────────────────────────
// src/components/fields/Checkbox.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'Checkbox',
  aliases: ['checkbox'],
  usage: {
    purpose: 'Boolean input for independent or multi‑select choices.',
    whenToUse: [
      'Enable/disable features that are submitted with a form',
      'Select multiple items from a list of options',
    ],
    whenNotToUse: [
      'Immediate on/off toggles (use Switch)',
      'Exactly one choice among few (use Radio)',
    ],
    alternatives: ['Switch', 'Radio', 'MetroSelect'],
  },
});

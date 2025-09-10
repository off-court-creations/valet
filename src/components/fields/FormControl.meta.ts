// ─────────────────────────────────────────────────────────────
// src/components/fields/FormControl.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'FormControl',
  aliases: ['form', 'field', 'control'],
  usage: {
    purpose: 'Provide labels, helper text, and validation messaging around input fields.',
    whenToUse: [
      'Wrap TextField, Select, Checkbox, etc. for consistent a11y and spacing',
      'Display error states and hints tied to a specific input',
    ],
    whenNotToUse: ['Non‑form content'],
    alternatives: ['Panel', 'Stack'],
  },
});

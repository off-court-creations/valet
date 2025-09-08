// ─────────────────────────────────────────────────────────────
// src/components/fields/TextField.meta.ts  | valet
// per-component meta: aliases and future structured hints
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'TextField',
  aliases: ['textinput', 'input', 'textbox'],
  usage: {
    purpose: 'Accept short or multiline text input with labels, helper text, and validation.',
    whenToUse: [
      'Forms that require free‑form or constrained text',
      'Search bars, filters, and settings',
      'Use multiline for longer text, or type=password/number/email where appropriate',
    ],
    whenNotToUse: [
      'Binary choices (use Switch or Checkbox)',
      'Small enumerations (use Radio or Select)',
    ],
    alternatives: ['Select', 'Radio', 'Checkbox', 'Switch'],
  },
});

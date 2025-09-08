// ─────────────────────────────────────────────────────────────
// src/components/fields/Radio.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'Radio',
  aliases: ['radiogroup', 'radio', 'radio-group'],
  usage: {
    purpose: 'Pick exactly one option from a small set.',
    whenToUse: [
      '2–7 mutually exclusive options visible at once',
      'Semantic clarity when choices should be compared side‑by‑side',
    ],
    whenNotToUse: [
      'Large or dynamic option sets (use Select)',
      'Multiple selections (use Checkbox or MetroSelect)',
    ],
    alternatives: ['Select', 'Checkbox', 'MetroSelect'],
  },
});

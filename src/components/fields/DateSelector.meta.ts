// ─────────────────────────────────────────────────────────────
// src/components/fields/DateSelector.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'DateSelector',
  aliases: ['datepicker', 'daterange'],
  usage: {
    purpose: 'Pick a date or a date range with correct locale and a11y.',
    whenToUse: [
      'Scheduling, filtering by date, or selecting ranges for reports',
      'Contexts that benefit from calendar visualization',
    ],
    whenNotToUse: [
      'Free‑form inputs where specific formats are required (prefer TextField with masking)',
      'Time‑only or datetime inputs (use a dedicated time or datetime picker when available)',
    ],
    alternatives: ['TextField'],
  },
});

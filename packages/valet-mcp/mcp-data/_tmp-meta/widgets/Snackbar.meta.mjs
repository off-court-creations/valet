// ─────────────────────────────────────────────────────────────
// src/components/widgets/Snackbar.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Snackbar',
  aliases: ['snackbar', 'toast', 'notification', 'alert'],
  usage: {
    purpose: 'Transient, non‑blocking notifications anchored to the viewport.',
    whenToUse: ['Confirm background actions (saved, uploaded, copied)', 'Surface minor errors with retry that don’t require navigation'],
    whenNotToUse: ['Critical or destructive decisions (use Modal)', 'Persistent messages that users need to reference later (use Panel/Alert pattern)'],
    alternatives: ['Modal', 'Tooltip']
  }
});
// ─────────────────────────────────────────────────────────────
// src/components/layout/Modal.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'Modal',
  aliases: ['modal', 'dialog'],
  usage: {
    purpose: 'Blocking overlay for focused tasks and decisions.',
    whenToUse: [
      'Confirmations and destructive actions',
      'Short, focused forms that must complete before returning to context',
      'Content that benefits from dimming the background',
    ],
    whenNotToUse: [
      'Non‑critical feedback (use Snackbar)',
      'Persistent side tools or navigation (use Drawer)',
      'Large, document‑like content that should have its own route',
    ],
    alternatives: ['Drawer', 'Snackbar', 'Panel'],
  },
});

// ─────────────────────────────────────────────────────────────
// src/components/widgets/LoadingBackdrop.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'LoadingBackdrop',
  aliases: ['backdrop', 'loading'],
  usage: {
    purpose: 'Dim background content and show a blocker while async work completes.',
    whenToUse: [
      'Block interactions during critical loads or transitions',
      'Ensure a11y focus management while disabling the underlying UI',
    ],
    whenNotToUse: [
      'Inline/section‑level loading (use Progress)',
      'Skeletonable content where layout should remain visible (use Skeleton)',
    ],
    alternatives: ['Progress', 'Skeleton', 'Modal'],
  },
});

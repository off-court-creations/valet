// ─────────────────────────────────────────────────────────────
// src/components/primitives/Skeleton.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Skeleton',
  aliases: ['skeleton', 'placeholder', 'shimmer'],
  usage: {
    purpose: 'Reserve layout with lightweight placeholders while content loads.',
    whenToUse: ['Pages where the final layout is known and should not jump', 'Lists, cards, or form sections that hydrate after data fetch'],
    whenNotToUse: ['Blocking UX where a spinner is clearer (use LoadingBackdrop or Progress)', 'Tiny, instantaneous loads that don’t warrant placeholders'],
    alternatives: ['Progress', 'LoadingBackdrop']
  }
});
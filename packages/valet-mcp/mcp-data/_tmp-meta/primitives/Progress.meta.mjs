// ─────────────────────────────────────────────────────────────
// src/components/primitives/Progress.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Progress',
  aliases: ['progress', 'spinner', 'loader'],
  usage: {
    purpose: 'Communicate ongoing operations with determinate or indeterminate progress.',
    whenToUse: ['Inline loading indicators within a component or form', 'Show percent complete when known; spinner when unknown'],
    whenNotToUse: ['Blocking the entire page (use LoadingBackdrop)', 'Skeletonable content where layout should remain stable (use Skeleton)'],
    alternatives: ['LoadingBackdrop', 'Skeleton']
  }
});
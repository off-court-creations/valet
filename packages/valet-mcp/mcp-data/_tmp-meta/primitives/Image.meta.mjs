// ─────────────────────────────────────────────────────────────
// src/components/primitives/Image.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Image',
  aliases: ['image', 'img', 'picture'],
  usage: {
    purpose: 'Optimized image rendering with sizing, fit modes, and a11y.',
    whenToUse: ['Display photos, illustrations, or product images', 'Decorative images with proper alt text policies'],
    whenNotToUse: ['Video or animated content (use Video)', 'Background effects that should not affect document flow (use ParallaxBackground or CSS backgrounds)'],
    alternatives: ['Video', 'ParallaxBackground']
  }
});
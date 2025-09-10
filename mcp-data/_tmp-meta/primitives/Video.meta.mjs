// ─────────────────────────────────────────────────────────────
// src/components/primitives/Video.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Video',
  aliases: ['video', 'player'],
  usage: {
    purpose: 'Embed and control video playback with a11y‑first defaults.',
    whenToUse: ['Marketing or educational clips within content', 'Short previews that benefit from poster images and preload control'],
    whenNotToUse: ['Static imagery (use Image)', 'Heavy decorative backgrounds (consider ParallaxBackground or CSS background video carefully)'],
    alternatives: ['Image', 'ParallaxBackground']
  }
});
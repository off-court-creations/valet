// ─────────────────────────────────────────────────────────────
// src/components/widgets/ParallaxBackground.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../../mcp/metaTypes';

export default defineComponentMeta({
  name: 'ParallaxBackground',
  aliases: ['parallax'],
  usage: {
    purpose: 'Layered background motion for hero sections and visual depth.',
    whenToUse: [
      'Branding or storytelling sections that benefit from subtle motion',
      'Non‑critical background visuals that should not affect layout',
    ],
    whenNotToUse: [
      'Content that must remain readable regardless of motion',
      'Performance‑sensitive contexts on low‑end devices',
    ],
    alternatives: ['Image', 'Video', 'Surface + CSS backgrounds'],
  },
});

// ─────────────────────────────────────────────────────────────
// src/components/widgets/Stepper.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Stepper',
  aliases: ['stepper', 'steps', 'wizard'],
  usage: {
    purpose: 'Guide users through an ordered, multi‑step flow.',
    whenToUse: ['Complex forms or configuration broken into logical steps', 'Tasks that benefit from progress indication and validation per step'],
    whenNotToUse: ['Independent peer views (use Tabs)', 'Single‑screen tasks'],
    alternatives: ['Tabs', 'Modal']
  }
});
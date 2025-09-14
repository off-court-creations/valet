// ─────────────────────────────────────────────────────────────
// src/components/fields/Slider.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Slider',
  aliases: ['slider', 'range'],
  usage: {
    purpose: 'Select a numeric value from a range using drag or click.',
    whenToUse: ['Volume, brightness, rating, or bounded numeric inputs', 'When relative, approximate selection is acceptable'],
    whenNotToUse: ['Exact values that require precision (use a numeric TextField)', 'Categorical choices (use Radio or Select)'],
    alternatives: ['TextField', 'Select', 'Radio']
  }
});
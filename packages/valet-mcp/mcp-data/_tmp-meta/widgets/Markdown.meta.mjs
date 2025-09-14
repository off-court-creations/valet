// ─────────────────────────────────────────────────────────────
// src/components/widgets/Markdown.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Markdown',
  aliases: ['markdown', 'md', 'richtext'],
  usage: {
    purpose: 'Render trusted Markdown to themed, accessible HTML.',
    whenToUse: ['Documentation, notes, and CMS content', 'Assistant output that should be formatted but not executable'],
    whenNotToUse: ['Untrusted user HTML without sanitization', 'Highly interactive layouts (use regular components)'],
    alternatives: ['Typography', 'CodeBlock']
  }
});
// ─────────────────────────────────────────────────────────────
// src/components/widgets/CodeBlock.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'CodeBlock',
  aliases: ['code', 'codeblock', 'snippet'],
  usage: {
    purpose: 'Display syntax‑highlighted code with correct theming and a11y.',
    whenToUse: ['Documentation, demos, and developer surfaces', 'Static, read‑only examples of code or config'],
    whenNotToUse: ['Editable code (use a code editor component)', 'Tiny inline fragments (use Typography with <code>)'],
    alternatives: ['Markdown', 'Typography']
  }
});
// ─────────────────────────────────────────────────────────────
// src/components/widgets/RichChat.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'RichChat',
  aliases: ['chat', 'conversation', 'thread'],
  usage: {
    purpose: 'Conversation UI for AI assistants with rich, tool‑augmented messages.',
    whenToUse: ['Show structured outputs (tables, code, files) inline with messages', 'Capture tool calls, citations, or step‑wise reasoning artifacts'],
    whenNotToUse: ['Basic chat without rich rendering (use LLMChat)'],
    alternatives: ['LLMChat', 'Markdown', 'Table']
  }
});
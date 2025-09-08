// ─────────────────────────────────────────────────────────────
// src/components/widgets/LLMChat.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'LLMChat',
  aliases: ['chat', 'assistant'],
  usage: {
    purpose: 'Message‑based interface for conversational AI interactions.',
    whenToUse: ['Chat experiences with streaming replies and turn history', 'Lightweight sandbox for model prompts and responses'],
    whenNotToUse: ['Rich, tool‑augmented transcripts (use RichChat)', 'Static logs or read‑only transcripts (use Markdown/Panel)'],
    alternatives: ['RichChat', 'Markdown']
  }
});
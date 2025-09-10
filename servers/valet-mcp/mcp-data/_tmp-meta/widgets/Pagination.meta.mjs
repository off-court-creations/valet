// ─────────────────────────────────────────────────────────────
// src/components/widgets/Pagination.meta.ts  | valet
// per-component meta
// ─────────────────────────────────────────────────────────────
import { defineComponentMeta } from '../valet-meta-shim.mjs';
export default defineComponentMeta({
  name: 'Pagination',
  aliases: ['pagination', 'pager', 'paginator'],
  usage: {
    purpose: 'Navigate large result sets by page number or next/prev controls.',
    whenToUse: ['Tables or lists with many items where pages are preferable to infinite scroll', 'Search results or archives where page position matters'],
    whenNotToUse: ['Continuous feeds where infinite scroll is a better fit', 'Small collections that fit on a single page'],
    alternatives: ['Table (built‑in paging)', 'Iterator']
  }
});
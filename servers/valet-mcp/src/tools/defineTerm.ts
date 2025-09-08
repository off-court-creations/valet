// ─────────────────────────────────────────────────────────────
// servers/valet-mcp/src/tools/defineTerm.ts  | valet-mcp
// Tool: define_term – lookup + suggestions from glossary
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getGlossary } from './shared.js';

const ParamsShape = { word: z.string().min(1), limit: z.number().int().positive().max(10).optional() } as const;

export function registerDefineTerm(server: McpServer): void {
  server.tool('define_term', ParamsShape, async (args) => {
    const { word, limit = 5 } = args as { word: string; limit?: number };
    const g = getGlossary();
    const q = word.trim().toLowerCase();
    const entries = g?.entries ?? [];
    const exact = entries.find((e) => e.term.toLowerCase() === q) || entries.find((e) => (e.aliases || []).some((a) => a.toLowerCase() === q));
    if (exact) return { content: [{ type: 'text', text: JSON.stringify({ found: true, entry: exact }) }] };
    // soft search: includes in term, alias, or definition
    const scored = entries
      .map((e) => {
        let s = 0;
        const name = e.term.toLowerCase();
        if (name.includes(q)) s += 3;
        if ((e.aliases || []).some((a) => a.toLowerCase().includes(q))) s += 2;
        if ((e.definition || '').toLowerCase().includes(q)) s += 1;
        return { e, s };
      })
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || a.e.term.localeCompare(b.e.term));
    const suggestions = scored.slice(0, limit).map((r) => r.e);
    return { content: [{ type: 'text', text: JSON.stringify({ found: false, suggestions }) }] };
  });
}


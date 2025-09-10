// ─────────────────────────────────────────────────────────────
// servers/valet-mcp/src/tools/searchComponents.ts  | valet-mcp
// Tool: search_components – fuzzy search over index
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getIndex, simpleSearch } from './shared.js';

const ParamsShape = {
  query: z.string().min(1).describe('Search string across names and summaries'),
  limit: z.number().int().positive().max(100).optional(),
  category: z.string().optional().describe('Optional category filter: primitives|fields|layout|widgets'),
} as const;

export function registerSearchComponents(server: McpServer): void {
  server.tool('search_components', ParamsShape, async (args) => {
    const { query, limit = 10, category } = args as { query: string; limit?: number; category?: string };
    const index = getIndex();
    const scored = simpleSearch(query, index, { category }).slice(0, limit);
    return { content: [{ type: 'text', text: JSON.stringify(scored.map((s) => ({ ...s.item, score: s.score }))) }] };
  });
}


// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/searchComponents.ts  | valet-mcp
// Tool: search_components – fuzzy search over index
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getComponentBySlug, getIndex, normalizeStatusFilter, simpleSearch } from './shared.js';

const ParamsShape = {
  query: z.string().min(1).describe('Search string across names and summaries'),
  limit: z.number().int().positive().max(100).optional(),
  category: z
    .string()
    .optional()
    .describe('Optional category filter: primitives|fields|layout|widgets'),
  status: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe("Optional status filter: 'golden'|'stable'|'experimental'|'unstable'|'deprecated' (string or string[] )"),
} as const;

export function registerSearchComponents(server: McpServer): void {
  // Namespaced tool id only
  server.tool('valet__search_components', ParamsShape, async (args) => {
    const { query, limit = 10, category, status } = args as {
      query: string;
      limit?: number;
      category?: string;
      status?: string | string[];
    };
    const index = getIndex();
    const scoredAll = simpleSearch(query, index, { category });
    // Normalize status filter
    const statusSet = normalizeStatusFilter(status);
    const wantStatus = statusSet.size > 0;
    const filtered = wantStatus
      ? scoredAll.filter((s) => {
          const stFromIndex = (s.item as any).status ? String((s.item as any).status).toLowerCase() : '';
          if (stFromIndex) return statusSet.has(stFromIndex);
          // Fallback to full component doc if index lacks status (older snapshots)
          const comp = getComponentBySlug(s.item.slug);
          const st = (comp?.status || '').toLowerCase();
          return st && statusSet.has(st);
        })
      : scoredAll;
    const top = filtered.slice(0, limit).map((s) => ({ ...s.item, score: s.score }));
    return { content: [{ type: 'text', text: JSON.stringify(top) }] };
  });
}

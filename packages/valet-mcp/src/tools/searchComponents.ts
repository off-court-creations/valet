// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/searchComponents.ts  | valet-mcp
// Tool: search_components – fuzzy search over index
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getComponentBySlug, getIndex, normalizeStatusFilter, simpleSearch } from './shared.js';

const ParamsSchema = {
  query: z.string().min(1, 'Enter text to search for.').describe('Search string across names and summaries.'),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(10)
    .describe('Maximum results to return (default 10).'),
  category: z
    .string()
    .optional()
    .describe('Optional category filter: primitives|fields|layout|widgets.'),
  status: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe("Optional status filter: 'production'|'stable'|'experimental'|'unstable'|'deprecated'."),
} as const;

export function registerSearchComponents(server: McpServer): void {
  server.registerTool(
    'valet__search_components',
    {
      title: 'Search Components',
      description: 'Run a relevance-ranked search across the valet component index with optional category and status filters.',
      inputSchema: ParamsSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ query, limit, category, status }) => {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) {
        return { content: [{ type: 'text', text: '[]' }] };
      }

      const index = getIndex();
      const scoredAll = simpleSearch(normalizedQuery, index, { category });
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
    }
  );
}

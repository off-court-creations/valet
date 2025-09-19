// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/searchProps.ts  | valet-mcp
// Tool: valet__search_props – search components by prop names (and optional category)
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getComponentBySlug, getIndex } from './shared.js';

const ParamsSchema = {
  query: z.string().min(1, 'Provide text to search for.').describe('Substring to match in prop names.'),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Maximum results to return (default 20).'),
  category: z.string().optional().describe('Optional category filter.'),
} as const;

export function registerSearchProps(server: McpServer): void {
  server.registerTool(
    'valet__search_props',
    {
      title: 'Search Props',
      description: 'Find components exposing props whose names contain the provided substring.',
      inputSchema: ParamsSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ query, limit, category }) => {
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) return { content: [{ type: 'text', text: '[]' }] };
      const index = getIndex();
      const items = category ? index.filter((i) => i.category === category) : index;
      const results: Array<{ name: string; slug: string; props: string[] }> = [];
      for (const it of items) {
        const comp = getComponentBySlug(it.slug);
        if (!comp || !Array.isArray(comp.props)) continue;
        const hits = comp.props
          .map((p) => p.name)
          .filter((n) => n && n.toLowerCase().includes(normalizedQuery));
        if (hits.length) results.push({ name: it.name, slug: it.slug, props: Array.from(new Set(hits)) });
      }
      // simple relevance: more hits first, then name
      results.sort((a, b) => b.props.length - a.props.length || a.name.localeCompare(b.name));
      return { content: [{ type: 'text', text: JSON.stringify(results.slice(0, limit)) }] };
    }
  );
}

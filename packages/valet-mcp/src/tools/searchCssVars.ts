// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/searchCssVars.ts  | valet-mcp
// Tool: valet__search_css_vars – search components by exposed CSS variables
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getComponentBySlug, getIndex } from './shared.js';

const Params = z.object({
  query: z.string().min(1, 'Provide text to search for.').describe('Substring to match in CSS variable names.'),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Maximum results to return (default 20).'),
  category: z.string().optional().describe('Optional category filter.'),
});
type ParamsType = z.infer<typeof Params>;

export function registerSearchCssVars(server: McpServer): void {
  server.registerTool(
    'valet__search_css_vars',
    {
      title: 'Search CSS Vars',
      description: 'Find components that expose CSS custom properties matching the provided substring.',
      inputSchema: Params.shape,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ query, limit, category }: ParamsType) => {
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) return { content: [{ type: 'text', text: '[]' }] };
      const index = getIndex();
      const items = category ? index.filter((i) => i.category === category) : index;
      const results: Array<{ name: string; slug: string; cssVars: string[] }> = [];
      for (const it of items) {
        const comp = getComponentBySlug(it.slug);
        const vars = comp?.cssVars || [];
        const hits = vars.filter((v) => String(v).toLowerCase().includes(normalizedQuery));
        if (hits.length) results.push({ name: it.name, slug: it.slug, cssVars: Array.from(new Set(hits)) });
      }
      results.sort((a, b) => b.cssVars.length - a.cssVars.length || a.name.localeCompare(b.name));
      return { content: [{ type: 'text', text: JSON.stringify(results.slice(0, limit)) }] };
    }
  );
}

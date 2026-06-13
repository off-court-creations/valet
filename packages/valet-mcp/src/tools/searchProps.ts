// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/searchProps.ts  | valet-mcp
// Tool: valet__search_props – search components by prop names (and optional category)
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  SearchPropsOutputSchema,
  getComponentBySlug,
  getIndex,
  normalizeDeprecation,
} from './shared.js';

const Params = z.object({
  query: z
    .string()
    .min(1, 'Provide text to search for.')
    .describe('Substring to match in prop names.'),
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

type MatchedProp = { name: string; deprecated: boolean; replacement?: string };

export function registerSearchProps(server: McpServer): void {
  server.registerTool(
    'valet__search_props',
    {
      title: 'Search Props',
      description:
        'Find components exposing props whose names contain the provided substring. ' +
        'Deprecated prop matches are flagged so a deprecated alias is never ' +
        'presented as if it were canonical.',
      inputSchema: Params.shape,
      outputSchema: SearchPropsOutputSchema.shape,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ query, limit, category }: ParamsType) => {
      const normalizedQuery = query.trim().toLowerCase();
      const empty = { results: [], count: 0 };
      if (!normalizedQuery) {
        return {
          content: [{ type: 'text', text: JSON.stringify(empty.results) }],
          structuredContent: empty,
        };
      }
      const index = getIndex();
      const items = category ? index.filter((i) => i.category === category) : index;
      const results: Array<{ name: string; slug: string; props: MatchedProp[] }> = [];
      for (const it of items) {
        const comp = getComponentBySlug(it.slug);
        if (!comp || !Array.isArray(comp.props)) continue;
        const seen = new Set<string>();
        const hits: MatchedProp[] = [];
        for (const p of comp.props) {
          if (!p.name || !p.name.toLowerCase().includes(normalizedQuery)) continue;
          if (seen.has(p.name)) continue;
          seen.add(p.name);
          // D4: never surface a deprecated alias as canonical — mark it.
          const dep = normalizeDeprecation(p.deprecated);
          hits.push(
            dep
              ? {
                  name: p.name,
                  deprecated: true,
                  ...(dep.replacement ? { replacement: dep.replacement } : {}),
                }
              : { name: p.name, deprecated: false },
          );
        }
        if (hits.length) results.push({ name: it.name, slug: it.slug, props: hits });
      }
      // simple relevance: more hits first, then name
      results.sort((a, b) => b.props.length - a.props.length || a.name.localeCompare(b.name));
      const capped = results.slice(0, limit);
      const structured = { results: capped, count: capped.length };
      return {
        content: [{ type: 'text', text: JSON.stringify(capped) }],
        structuredContent: structured,
      };
    },
  );
}

// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/searchCssVars.ts  | valet-mcp
// Tool: valet__search_css_vars – search components by exposed CSS variables
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getComponentBySlug, getIndex } from './shared.js';

const ParamsShape = {
  query: z.string().min(1).describe('Substring to match in CSS variable names'),
  limit: z.number().int().positive().max(100).optional(),
  category: z.string().optional().describe('Optional category filter'),
} as const;

export function registerSearchCssVars(server: McpServer): void {
  server.tool('valet__search_css_vars', ParamsShape, async (args) => {
    const { query, limit = 20, category } = args as { query: string; limit?: number; category?: string };
    const q = query.trim().toLowerCase();
    if (!q) return { content: [{ type: 'text', text: '[]' }] };
    const index = getIndex();
    const items = category ? index.filter((i) => i.category === category) : index;
    const results: Array<{ name: string; slug: string; cssVars: string[] }> = [];
    for (const it of items) {
      const comp = getComponentBySlug(it.slug);
      const vars = comp?.cssVars || [];
      const hits = vars.filter((v) => String(v).toLowerCase().includes(q));
      if (hits.length) results.push({ name: it.name, slug: it.slug, cssVars: Array.from(new Set(hits)) });
    }
    results.sort((a, b) => b.cssVars.length - a.cssVars.length || a.name.localeCompare(b.name));
    return { content: [{ type: 'text', text: JSON.stringify(results.slice(0, limit)) }] };
  });
}

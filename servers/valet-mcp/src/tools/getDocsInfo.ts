// ─────────────────────────────────────────────────────────────
// servers/valet-mcp/src/tools/getDocsInfo.ts  | valet-mcp
// Tool: get_docs_info – docs URL and best practices
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getComponentBySlug, resolveSlug } from './shared.js';

const ParamsShape = {
  name: z.string().describe('Component name, e.g., "Box"').optional(),
  slug: z.string().describe('Component slug, e.g., "components/layout/box"').optional(),
} as const;

export function registerGetDocsInfo(server: McpServer): void {
  server.tool('get_docs_info', ParamsShape, async (args) => {
    const slug = resolveSlug(args as { name?: string; slug?: string });
    if (!slug) return { content: [{ type: 'text', text: JSON.stringify({}) }] };
    const comp = getComponentBySlug(slug);
    if (!comp) return { content: [{ type: 'text', text: JSON.stringify({}) }] };
    const payload = {
      name: comp.name,
      slug: comp.slug,
      docsUrl: comp.docsUrl,
      bestPracticeSlugs: comp.bestPracticeSlugs ?? [],
      bestPractices: comp.bestPractices ?? [],
    };
    return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
  });
}


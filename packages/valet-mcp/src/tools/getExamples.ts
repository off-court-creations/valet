// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/getExamples.ts  | valet-mcp
// Tool: get_examples – example snippets for a component
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getComponentBySlug, resolveSlug } from './shared.js';

const ParamsShape = {
  name: z.string().describe('Component name, e.g., "Box"').optional(),
  slug: z.string().describe('Component slug, e.g., "components/layout/box"').optional(),
} as const;

export function registerGetExamples(server: McpServer): void {
  // Namespaced tool id only
  server.tool('valet__get_examples', ParamsShape, async (args) => {
    const slug = resolveSlug(args as { name?: string; slug?: string });
    if (!slug) return { content: [{ type: 'text', text: '[]' }] };
    const comp = getComponentBySlug(slug);
    return { content: [{ type: 'text', text: JSON.stringify(comp?.examples ?? []) }] };
  });
}

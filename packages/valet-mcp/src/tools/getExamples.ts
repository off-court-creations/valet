// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/getExamples.ts  | valet-mcp
// Tool: get_examples – example snippets for a component
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getComponentBySlug, resolveSlug } from './shared.js';

const Params = z.object({
  name: z.string().describe('Component name, e.g., "Box"').optional(),
  slug: z.string().describe('Component slug, e.g., "components/layout/box"').optional(),
});
type ParamsType = z.infer<typeof Params>;

export function registerGetExamples(server: McpServer): void {
  server.registerTool(
    'valet__get_examples',
    {
      title: 'Get Examples',
      description: 'Return vetted usage snippets for a component so agents can embed ready-made examples.',
      inputSchema: Params.shape,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args: ParamsType) => {
      const slug = resolveSlug(args);
      if (!slug) return { content: [{ type: 'text', text: '[]' }] };
      const comp = getComponentBySlug(slug);
      return { content: [{ type: 'text', text: JSON.stringify(comp?.examples ?? []) }] };
    }
  );
}

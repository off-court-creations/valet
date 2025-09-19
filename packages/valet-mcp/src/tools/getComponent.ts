// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/getComponent.ts  | valet-mcp
// Tool: get_component – fetch a full component doc by name or slug
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getComponentBySlug, resolveSlug } from './shared.js';

const ParamsSchema = {
  name: z.string().describe('Component name, e.g., "Box"').optional(),
  slug: z.string().describe('Component slug, e.g., "components/layout/box"').optional(),
} as const;

export function registerGetComponent(server: McpServer): void {
  server.registerTool(
    'valet__get_component',
    {
      title: 'Get Component',
      description: 'Fetch the full metadata payload for a component by name or slug.',
      inputSchema: ParamsSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const slug = resolveSlug(args);
      if (!slug) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: 'Component not found' }) }] };
      }
      const comp = getComponentBySlug(slug);
      if (!comp) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: 'Component doc missing' }) }] };
      }
      return { content: [{ type: 'text', text: JSON.stringify(comp) }] };
    }
  );
}

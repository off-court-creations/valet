// ─────────────────────────────────────────────────────────────
// servers/valet-mcp/src/tools/getComponent.ts  | valet-mcp
// Tool: get_component – fetch a full component doc by name or slug
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getComponentBySlug, resolveSlug } from './shared.js';

const ParamsShape = {
  name: z.string().describe('Component name, e.g., "Box"').optional(),
  slug: z.string().describe('Component slug, e.g., "components/layout/box"').optional(),
} as const;

export function registerGetComponent(server: McpServer): void {
  server.tool('get_component', ParamsShape, async (args) => {
    const slug = resolveSlug(args as { name?: string; slug?: string });
    if (!slug) return { content: [{ type: 'text', text: JSON.stringify({ error: 'Component not found' }) }] };
    const comp = getComponentBySlug(slug);
    if (!comp) return { content: [{ type: 'text', text: JSON.stringify({ error: 'Component doc missing' }) }] };
    return { content: [{ type: 'text', text: JSON.stringify(comp) }] };
  });
}


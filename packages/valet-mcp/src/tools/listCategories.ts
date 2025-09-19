// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/listCategories.ts  | valet-mcp
// Tool: valet__list_categories – enumerate unique component categories
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getIndex } from './shared.js';

export function registerListCategories(server: McpServer): void {
  server.registerTool(
    'valet__list_categories',
    {
      title: 'List Categories',
      description: 'Enumerate the distinct component categories represented in the valet index.',
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const index = getIndex();
      const cats = Array.from(new Set(index.map((i) => i.category))).sort();
      return { content: [{ type: 'text', text: JSON.stringify(cats) }] };
    }
  );
}

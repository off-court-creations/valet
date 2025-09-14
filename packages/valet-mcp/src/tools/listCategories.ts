// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/listCategories.ts  | valet-mcp
// Tool: valet__list_categories – enumerate unique component categories
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getIndex } from './shared.js';

export function registerListCategories(server: McpServer): void {
  server.tool('valet__list_categories', async () => {
    const index = getIndex();
    const cats = Array.from(new Set(index.map((i) => i.category))).sort();
    return { content: [{ type: 'text', text: JSON.stringify(cats) }] };
  });
}

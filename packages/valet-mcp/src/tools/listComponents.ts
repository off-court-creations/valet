// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/listComponents.ts  | valet-mcp
// Tool: list_components – returns basic component index
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getIndex } from './shared.js';

export function registerListComponents(server: McpServer): void {
  // Namespaced tool id only
  server.tool('valet__list_components', async () => ({
    content: [{ type: 'text', text: JSON.stringify(getIndex()) }],
  }));
}

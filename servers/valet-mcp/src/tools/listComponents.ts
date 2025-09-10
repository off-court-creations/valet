// ─────────────────────────────────────────────────────────────
// servers/valet-mcp/src/tools/listComponents.ts  | valet-mcp
// Tool: list_components – returns basic component index
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getIndex } from './shared.js';

export function registerListComponents(server: McpServer): void {
  server.tool('list_components', async () => ({
    content: [{ type: 'text', text: JSON.stringify(getIndex()) }],
  }));
}


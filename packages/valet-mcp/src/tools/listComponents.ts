// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/listComponents.ts  | valet-mcp
// Tool: list_components – returns basic component index
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getIndex } from './shared.js';

export function registerListComponents(server: McpServer): void {
  server.registerTool(
    'valet__list_components',
    {
      title: 'List Components',
      description: 'Return every component entry in the valet index, including category, status, and summary.',
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => ({
      content: [{ type: 'text', text: JSON.stringify(getIndex()) }],
    })
  );
}

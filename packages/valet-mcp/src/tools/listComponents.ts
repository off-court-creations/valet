// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/listComponents.ts  | valet-mcp
// Tool: list_components – returns basic component index
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ListComponentsOutputSchema, getIndex } from './shared.js';

export function registerListComponents(server: McpServer): void {
  server.registerTool(
    'valet__list_components',
    {
      title: 'List Components',
      description:
        'Return every component entry in the valet index, including category, status, and summary.',
      outputSchema: ListComponentsOutputSchema.shape,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const components = getIndex();
      const structured = { components, count: components.length };
      // Text stays the bare index array for back-compat; structured wraps it.
      return {
        content: [{ type: 'text', text: JSON.stringify(components) }],
        structuredContent: structured,
      };
    },
  );
}

// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/getPrimer.ts  | valet-mcp
// Tool: get_primer – opinionated context dump for agents
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PRIMER_TEXT } from '../primer.js';

export function registerGetPrimer(server: McpServer): void {
  server.registerTool(
    'valet__get_primer',
    {
      title: 'Get Primer',
      description: 'Return a condensed orientation guide for agents that need the valet mental model quickly.',
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => ({ content: [{ type: 'text', text: PRIMER_TEXT }] })
  );
}

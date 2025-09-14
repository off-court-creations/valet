// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/getPrimer.ts  | valet-mcp
// Tool: get_primer – opinionated context dump for agents
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PRIMER_TEXT } from '../primer.js';

export function registerGetPrimer(server: McpServer): void {
  // Namespaced tool id only
  server.tool('valet__get_primer', async () => ({ content: [{ type: 'text', text: PRIMER_TEXT }] }));
}

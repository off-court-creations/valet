// ─────────────────────────────────────────────────────────────
// servers/valet-mcp/src/tools/getGlossary.ts  | valet-mcp
// Tool: get_glossary – full glossary dataset
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getGlossary } from './shared.js';

export function registerGetGlossary(server: McpServer): void {
  server.tool('get_glossary', async () => {
    const g = getGlossary();
    if (!g) return { content: [{ type: 'text', text: JSON.stringify({ entries: [] }) }] };
    return { content: [{ type: 'text', text: JSON.stringify(g) }] };
  });
}


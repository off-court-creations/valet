// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/listSynonyms.ts  | valet-mcp
// Tool: valet__list_synonyms – expose component synonym mappings
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadSynonyms } from './shared.js';

type SynonymPair = { alias: string; targets: string[] };

export function registerListSynonyms(server: McpServer): void {
  server.registerTool(
    'valet__list_synonyms',
    {
      title: 'List Synonyms',
      description: 'Expose synonym mappings so agents can translate aliases (like “hero”) into canonical valet components.',
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const { map, source } = loadSynonyms();
      const pairs: SynonymPair[] = Object.entries(map)
        .map(([alias, rawTargets]) => {
          const targets = Array.from(new Set((rawTargets ?? []).map((t) => t.trim()).filter((t) => t.length > 0)))
            .sort((a, b) => a.localeCompare(b));
          return { alias, targets };
        })
        .filter((pair) => pair.targets.length > 0)
        .sort((a, b) => a.alias.localeCompare(b.alias));

      return { content: [{ type: 'text', text: JSON.stringify({ source, pairs }) }] };
    }
  );
}

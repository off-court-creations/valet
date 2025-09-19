// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/defineTerm.ts  | valet-mcp
// Tool: define_term – lookup + suggestions from glossary
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getGlossary } from './shared.js';

const ParamsSchema = {
  word: z
    .string()
    .min(1, 'Provide a term or alias to define.')
    .describe('Term or alias to define.'),
  limit: z
    .number()
    .int()
    .positive()
    .max(10)
    .default(5)
    .describe('Maximum number of alternatives to return when no exact match exists.'),
} as const;

export function registerDefineTerm(server: McpServer): void {
  server.registerTool(
    'valet__define_term',
    {
      title: 'Define Term',
      description: 'Look up a glossary definition by term or alias and fall back to the closest matches.',
      inputSchema: ParamsSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ word, limit }) => {
      const query = word.trim();
      if (!query) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ found: false, suggestions: [], error: 'Empty search term after trimming.' }),
            },
          ],
        };
      }

      const glossary = getGlossary();
      const entries = glossary?.entries ?? [];
      const normalized = query.toLowerCase();
      const exact =
        entries.find((e) => e.term.toLowerCase() === normalized) ||
        entries.find((e) => (e.aliases || []).some((alias) => alias.toLowerCase() === normalized));

      if (exact) {
        return { content: [{ type: 'text', text: JSON.stringify({ found: true, entry: exact }) }] };
      }

      const scored = entries
        .map((entry) => {
          let score = 0;
          const name = entry.term.toLowerCase();
          if (name.includes(normalized)) score += 3;
          if ((entry.aliases || []).some((alias) => alias.toLowerCase().includes(normalized))) score += 2;
          if ((entry.definition || '').toLowerCase().includes(normalized)) score += 1;
          return { entry, score };
        })
        .filter((result) => result.score > 0)
        .sort((a, b) => b.score - a.score || a.entry.term.localeCompare(b.entry.term));

      const suggestions = scored.slice(0, limit).map((result) => result.entry);
      return { content: [{ type: 'text', text: JSON.stringify({ found: false, suggestions }) }] };
    }
  );
}

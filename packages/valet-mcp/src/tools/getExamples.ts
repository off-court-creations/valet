// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/getExamples.ts  | valet-mcp
// Tool: get_examples – example snippets for a component
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getComponentBySlug, resolveSlug } from './shared.js';

const Params = z.object({
  name: z.string().describe('Component name, e.g., "Box"').optional(),
  slug: z.string().describe('Component slug, e.g., "components/layout/box"').optional(),
});
type ParamsType = z.infer<typeof Params>;

export function registerGetExamples(server: McpServer): void {
  server.registerTool(
    'valet__get_examples',
    {
      title: 'Get Examples',
      description:
        'Return vetted usage snippets for a component so agents can embed ready-made examples.',
      inputSchema: Params.shape,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args: ParamsType) => {
      const slug = resolveSlug(args);
      if (!slug) {
        const ref = args.slug ?? args.name ?? '(no name/slug provided)';
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Component not found: ${ref}. Cannot return examples for a component that does not exist. Use valet__list_components or valet__search_components to discover valid names.`,
            },
          ],
        };
      }
      const comp = getComponentBySlug(slug);
      if (!comp) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Component doc missing for slug "${slug}". The index references it but its component file could not be loaded.`,
            },
          ],
        };
      }
      // A resolved component with zero examples is a valid empty list, NOT an
      // error — the component exists, it simply has no curated snippets yet.
      return { content: [{ type: 'text', text: JSON.stringify(comp.examples ?? []) }] };
    },
  );
}

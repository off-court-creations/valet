// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/getComponent.ts  | valet-mcp
// Tool: get_component – fetch a full component doc by name or slug
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  GetComponentOutputSchema,
  getComponentBySlug,
  normalizeDeprecation,
  resolveSlug,
} from './shared.js';

const Params = z.object({
  name: z.string().describe('Component name, e.g., "Box"').optional(),
  slug: z.string().describe('Component slug, e.g., "components/layout/box"').optional(),
});
type ParamsType = z.infer<typeof Params>;

export function registerGetComponent(server: McpServer): void {
  server.registerTool(
    'valet__get_component',
    {
      title: 'Get Component',
      description:
        'Fetch the full metadata payload for a component by name or slug. ' +
        'Deprecated props are flagged with their replacement in both the text ' +
        'and the structured output.',
      inputSchema: Params.shape,
      // Pass the SCHEMA INSTANCE, not `.shape`. get_component returns the full
      // corpus doc, which carries extra top-level fields beyond this schema
      // (cssVars, events, slots, bestPractices, examples, docsUrl, …). The output
      // schema is built with `.passthrough()` so those forward fields are allowed;
      // the SDK serializes that to a JSON Schema with additionalProperties:true.
      // Passing `.shape` instead makes the SDK rebuild a plain (strip-mode)
      // z.object → additionalProperties:false, and the SDK's SERVER-SIDE ajv
      // validation of structuredContent then throws McpError -32602
      // ("Structured content does not match the tool's output schema: data must
      // NOT have additional properties") at call time. Verified against a live
      // Client/InMemory round-trip: `.shape` throws, the instance passes.
      // (search_props / list_components use `.shape` because their payloads carry
      // no extra top-level keys; only get_component returns the passthrough doc.)
      outputSchema: GetComponentOutputSchema,
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
              text: `Component not found: ${ref}. No component matches that name or slug. Use valet__list_components or valet__search_components to discover valid names.`,
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

      // ── Deprecation-aware (D4): mark each deprecated prop with a flat,
      // always-present `deprecation` view and build a top-level rollup. ──
      type PropWithDeprecation = (typeof comp.props)[number] & {
        deprecation?: { deprecated: true; replacement?: string; reason?: string };
      };
      const props: PropWithDeprecation[] = (Array.isArray(comp.props) ? comp.props : []).map(
        (p): PropWithDeprecation => {
          const dep = normalizeDeprecation(p.deprecated);
          return dep ? { ...p, deprecation: dep } : p;
        },
      );
      const deprecatedProps = props
        .filter((p) => p.deprecation)
        .map((p) => ({
          name: p.name,
          ...(p.deprecation?.replacement ? { replacement: p.deprecation.replacement } : {}),
          ...(p.deprecation?.reason ? { reason: p.deprecation.reason } : {}),
        }));

      const structured = { ...comp, props, deprecatedProps };

      // Text content stays JSON for back-compat, but now leads with a
      // human-readable deprecation banner so the warning is impossible to miss.
      let text = JSON.stringify(structured);
      if (deprecatedProps.length) {
        const banner = deprecatedProps
          .map((d) => {
            const repl = d.replacement ? ` → use \`${d.replacement}\`` : '';
            const reason = d.reason ? ` (${d.reason})` : '';
            return `  • \`${d.name}\` is DEPRECATED${repl}${reason}`;
          })
          .join('\n');
        text =
          `DEPRECATED PROPS on ${comp.name} — do not use these in new code:\n${banner}\n\n` + text;
      }

      return {
        content: [{ type: 'text', text }],
        structuredContent: structured,
      };
    },
  );
}

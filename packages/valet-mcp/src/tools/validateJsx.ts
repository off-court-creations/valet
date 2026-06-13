// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/validateJsx.ts  | valet-mcp
// Tool: valet__validate_jsx – type-check a valet JSX/TSX snippet against the
// SHIPPED @archway/valet types and return structured diagnostics so an agent
// can self-correct before emitting code.
//
// This is the one capability the corpus structurally cannot provide. The corpus
// lists props and their types as strings; it cannot tell you whether a SPECIFIC
// snippet uses an invented prop, the wrong member of a literal union, or a
// deprecated alias — that requires running the type system. This tool runs the
// real TypeScript compiler (in-process) over the snippet against the same valet
// version the server documents (versionParity), and reports each diagnostic
// with a line/col/code/message/severity.
//
// isError stays FALSE even when the snippet has type errors: a snippet that has
// type errors is a SUCCESSFUL validation reporting them, distinct from the tool
// itself failing (e.g. unable to resolve valet's types). Only the latter sets
// isError. `ok` in the structured payload is the snippet's verdict.
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { typeCheckSnippet } from '../validate/typecheck.js';

const Params = z.object({
  code: z
    .string()
    .min(1)
    .describe(
      'A valet JSX/TSX snippet to type-check. May be a bare JSX literal, an arrow ' +
        'component, or an IIFE — `React`, the valet barrel (as `Valet`), and `theme` ' +
        '(= useTheme().theme) are already in scope, and every valet tag the snippet ' +
        'uses is auto-imported. Do not include import statements.',
    ),
  deps: z
    .array(z.string())
    .optional()
    .describe(
      'Optional explicit list of valet export names to bring into scope (e.g. ' +
        '["Button","Table"]). When omitted, the valet tags used in `code` are ' +
        'auto-detected. Names that are not valet exports are ignored.',
    ),
});
type ParamsType = z.infer<typeof Params>;

const DiagnosticSchema = z.object({
  line: z
    .number()
    .int()
    .describe('1-based line within the snippet (<= 0 means the synthesized wrapper).'),
  col: z.number().int().describe('1-based column.'),
  code: z.string().describe('TypeScript diagnostic code, e.g. "TS2322".'),
  message: z.string(),
  severity: z.enum(['error', 'warning', 'suggestion', 'message']),
  deprecated: z
    .boolean()
    .describe('True when the diagnostic reports use of a @deprecated symbol (a deprecated alias).'),
});

const ValidateJsxOutputSchema = z.object({
  ok: z
    .boolean()
    .describe(
      'True iff the snippet is clean against current valet: no type errors AND no ' +
        'deprecated-alias usage. False means there is something to fix before emitting.',
    ),
  diagnostics: z.array(DiagnosticSchema),
  errorCount: z.number().int(),
  warningCount: z.number().int(),
  deprecatedCount: z
    .number()
    .int()
    .describe('Number of diagnostics flagging a deprecated valet alias.'),
  importedTags: z
    .array(z.string())
    .describe('The valet export names brought into scope for the check.'),
  valetSource: z
    .enum(['package-exports', 'package-entry', 'repo-dist', 'repo-src'])
    .describe('How the valet types were resolved (published install vs. workspace).'),
  elapsedMs: z.number().int(),
});

function summarize(r: ReturnType<typeof typeCheckSnippet>): string {
  if (r.ok && r.diagnostics.length === 0) {
    return `OK — snippet type-checks against @archway/valet (no diagnostics).`;
  }
  const errors = r.diagnostics.filter((d) => d.severity === 'error');
  const deprecated = r.diagnostics.filter((d) => d.deprecated);
  const lines: string[] = [];
  if (r.ok) {
    lines.push(
      `OK — no type errors or deprecated aliases, but ${r.diagnostics.length} other ` +
        `diagnostic${r.diagnostics.length === 1 ? '' : 's'} (see below).`,
    );
  } else {
    const parts: string[] = [];
    if (errors.length) parts.push(`${errors.length} type error${errors.length === 1 ? '' : 's'}`);
    if (deprecated.length)
      parts.push(`${deprecated.length} deprecated alias${deprecated.length === 1 ? '' : 'es'}`);
    lines.push(`FAIL — ${parts.join(' and ')} in the snippet:`);
  }
  for (const d of r.diagnostics) {
    const at = d.line >= 1 ? `line ${d.line}, col ${d.col}` : `(wrapper) col ${d.col}`;
    const tag = d.deprecated ? ' [deprecated]' : '';
    lines.push(`  ${d.severity.toUpperCase()} ${d.code}${tag} @ ${at}: ${d.message}`);
  }
  if (deprecated.length) {
    lines.push(
      `\n${deprecated.length} deprecated alias` +
        `${deprecated.length === 1 ? '' : 'es'} in use — prefer the canonical replacement.`,
    );
  }
  return lines.join('\n');
}

export function registerValidateJsx(server: McpServer): void {
  server.registerTool(
    'valet__validate_jsx',
    {
      title: 'Validate JSX',
      description:
        'Type-check a valet JSX/TSX snippet against the shipped @archway/valet types and ' +
        'return structured diagnostics (line, col, code, message, severity). Catches ' +
        'invented props, wrong literal-union values, and deprecated aliases — things the ' +
        'component corpus cannot express. Returns ok=false (NOT a tool error) when the ' +
        'snippet has type errors, so an agent can self-correct before emitting code.',
      inputSchema: Params.shape,
      outputSchema: ValidateJsxOutputSchema.shape,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args: ParamsType) => {
      let result;
      try {
        result = typeCheckSnippet(args.code, args.deps);
      } catch (err) {
        // The tool itself failed (e.g. valet types unresolvable) — this IS an
        // error, distinct from a snippet that merely has type errors.
        const message = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `validate_jsx could not run: ${message}`,
            },
          ],
        };
      }

      const errorCount = result.diagnostics.filter((d) => d.severity === 'error').length;
      const warningCount = result.diagnostics.filter((d) => d.severity === 'warning').length;
      const deprecatedCount = result.diagnostics.filter((d) => d.deprecated).length;
      const structured = {
        ok: result.ok,
        diagnostics: result.diagnostics,
        errorCount,
        warningCount,
        deprecatedCount,
        importedTags: result.importedTags,
        valetSource: result.valetSource,
        elapsedMs: result.elapsedMs,
      };
      return {
        // isError stays false: a snippet with type errors is a successful check.
        content: [{ type: 'text', text: summarize(result) }],
        structuredContent: structured,
      };
    },
  );
}

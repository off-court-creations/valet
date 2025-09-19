// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/getInfo.ts  | valet-mcp
// Tool: valet__get_info – concise server + data metadata
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createRequire } from 'node:module';
import { DATA_DIR, DATA_INFO, getGlossary, getIndex, getMeta } from './shared.js';

export function registerGetInfo(server: McpServer): void {
  const requireFromHere = createRequire(import.meta.url);
  const pkg = requireFromHere('../../package.json') as { version?: string; name?: string };
  const mcpVersion = pkg.version ?? '0.0.0';

  server.registerTool(
    'valet__get_info',
    {
      title: 'Get Server Info',
      description: 'Summarise the MCP server version, bundled data snapshot, and basic parity indicators.',
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const index = getIndex();
        const meta = getMeta();
        const glossary = getGlossary();
        const components = index.length;
        const glossaryEntries = glossary?.entries?.length ?? 0;
        const valetVersion = meta?.valetVersion;
        const schemaVersion = meta?.schemaVersion;
        const buildHash = meta?.buildHash;
        const dataSource = (DATA_INFO as any).source;
        const dataDir = DATA_DIR;
        const mcpMinor = String(mcpVersion).split('.').slice(0, 2).join('.');
        const valetMinor = valetVersion ? String(valetVersion).split('.').slice(0, 2).join('.') : undefined;
        const versionParity = typeof valetMinor === 'string' ? mcpMinor === valetMinor : undefined;

        const payload = {
          ok: true,
          server: '@archway/valet-mcp',
          mcpVersion,
          valetVersion,
          schemaVersion,
          buildHash,
          dataSource,
          dataDir,
          components,
          glossaryEntries,
          hasPrimer: true,
          versionParity,
        };
        return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
      } catch (err) {
        const error = (err as Error)?.message || String(err);
        return { content: [{ type: 'text', text: JSON.stringify({ ok: false, error }) }] };
      }
    }
  );
}

#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/index.ts  | valet-mcp
// MCP server exposing Valet component data from mcp-data/
// ─────────────────────────────────────────────────────────────
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PRIMER_TEXT } from './primer.js';
import { DATA_DIR, DATA_INFO, getComponentBySlug, getGlossary, getIndex, getMeta } from './tools/shared.js';
import { registerListComponents } from './tools/listComponents.js';
import { registerListCategories } from './tools/listCategories.js';
import { registerListSynonyms } from './tools/listSynonyms.js';
import { registerGetComponent } from './tools/getComponent.js';
import { registerSearchComponents } from './tools/searchComponents.js';
import { registerGetExamples } from './tools/getExamples.js';
import { registerGetGlossary } from './tools/getGlossary.js';
import { registerDefineTerm } from './tools/defineTerm.js';
import { registerGetPrimer } from './tools/getPrimer.js';
import { registerGetInfo } from './tools/getInfo.js';
import { registerCheckVersionParity } from './tools/checkVersionParity.js';
import { registerSearchProps } from './tools/searchProps.js';
import { registerSearchCssVars } from './tools/searchCssVars.js';
import { registerSearchBestPractices } from './tools/searchBestPractices.js';
const requireFromHere = createRequire(import.meta.url);
const pkg = requireFromHere('../package.json') as { version?: string; name?: string };
const MCP_VERSION = pkg.version ?? '0.0.0';

// helper types and functions are moved into tools/shared.ts

// Tool parameter schemas moved into individual tool modules

async function createServer() {
  const server = new McpServer({ name: '@archway/valet-mcp', version: MCP_VERSION });

  // tools
  registerListComponents(server);
  registerListCategories(server);
  registerListSynonyms(server);
  registerGetComponent(server);
  registerSearchComponents(server);
  registerSearchProps(server);
  registerSearchCssVars(server);
  registerSearchBestPractices(server);
  registerGetExamples(server);
  registerGetGlossary(server);
  registerDefineTerm(server);
  registerGetPrimer(server);
  registerGetInfo(server);
  registerCheckVersionParity(server);

  // adjust_theme tool removed

  // Optional resources (component JSON as resources)
  server.resource('valet-index', 'mcp://valet/index', { mimeType: 'application/json', name: 'Valet Components Index' }, async () => ({
    contents: [{
      uri: 'mcp://valet/index',
      mimeType: 'application/json',
      text: JSON.stringify(getIndex(), null, 2),
    }],
  }));

  // Expose each component JSON as a resource lazily
  try {
    const index = getIndex();
    for (const item of index) {
      const uri = `mcp://valet/component/${item.slug}`;
      server.resource(`valet-${item.slug}`, uri, { mimeType: 'application/json', name: `${item.name} (${item.slug})` }, async () => ({
        contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(getComponentBySlug(item.slug), null, 2) }],
      }));
    }
  } catch {
    // ignore
  }

  // Primer and Glossary as resources
  server.resource('valet-primer', 'mcp://valet/primer', { mimeType: 'text/markdown', name: 'valet Primer' }, async () => ({
    contents: [{ uri: 'mcp://valet/primer', mimeType: 'text/markdown', text: PRIMER_TEXT }],
  }));
  server.resource('valet-glossary', 'mcp://valet/glossary', { mimeType: 'application/json', name: 'valet Glossary' }, async () => ({
    contents: [{ uri: 'mcp://valet/glossary', mimeType: 'application/json', text: JSON.stringify(getGlossary() ?? { entries: [] }, null, 2) }],
  }));

  return server;
}

async function main() {
  if (process.env.MCP_SELFCHECK === '1') {
    // Quick data sanity check and exit
    try {
      const index = getIndex();
      const box = index.find((i) => i.name === 'Box');
      const hasBox = !!(box && getComponentBySlug(box.slug));
      const meta = getMeta();
      const mcpMinor = MCP_VERSION.split('.').slice(0, 2).join('.');
      const valetMinor = meta?.valetVersion ? meta.valetVersion.split('.').slice(0, 2).join('.') : undefined;
      const parity = valetMinor ? (mcpMinor === valetMinor) : undefined;
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        ok: true,
        components: index.length,
        hasBox,
        mcpVersion: MCP_VERSION,
        dataSource: (DATA_INFO as any).source,
        valetVersion: meta?.valetVersion,
        generatedAt: meta?.generatedAt,
        versionParity: parity,
        schemaVersion: meta?.schemaVersion,
        buildHash: meta?.buildHash,
        glossaryEntries: (getGlossary()?.entries?.length) ?? 0,
        hasPrimer: true,
      }, null, 2));
      process.exit(0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify({ ok: false, error: (err as Error).message, mcpVersion: MCP_VERSION }));
      process.exit(1);
    }
    return;
  }

  // If launched directly in a real terminal (not by an MCP host),
  // print a friendly status line to stderr so users see something.
  // Important: never write human messages to stdout as that carries MCP JSON-RPC.
  if (
    process.stdin.isTTY &&
    process.stdout.isTTY &&
    process.stderr.isTTY &&
    process.env.MCP_QUIET !== '1'
  ) {
    // eslint-disable-next-line no-console
    console.error(
      `[valet-mcp ${MCP_VERSION}] Waiting for MCP client on stdio. ` +
        `Data source: ${(DATA_INFO as any).source}; dir: ${DATA_DIR}. ` +
        `Press Ctrl+C to exit.`
    );
  }

  const server = await createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Run
main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal:', err);
  process.exit(1);
});

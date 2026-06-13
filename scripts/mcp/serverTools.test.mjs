// ─────────────────────────────────────────────────────────────
// scripts/mcp/serverTools.test.mjs | valet (MCP Wave 2 — slices D2–D5)
//
// End-to-end server-output-contract tests for @archway/valet-mcp, driven
// through a real MCP Client over an in-memory transport against the BUILT
// dist (so the package's own SDK ~1.29 + zod 3.25 resolve, and the SDK's
// outputSchema → structuredContent validation runs for real).
//
//  • D5  parity resolves the valet version from the bundled snapshot
//        REGARDLESS of process.cwd() (Claude Desktop / Codex host-cwd bug).
//  • D3  genuine lookup misses return isError:true; empty SEARCH stays a
//        non-error empty list.
//  • D2  get_component / search_props / list_components return
//        structuredContent that the SDK validates against outputSchema
//        (a successful call is itself the proof the shapes match).
//  • D4  deprecated props surface their replacement in text AND structure.
//
// Requires the package to be built first (npm run -w valet-mcp build, or
// the repo's mcp:server:build). The import below pulls dist/index.js.
// ─────────────────────────────────────────────────────────────
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(HERE, '..', '..', 'packages', 'valet-mcp');
const DIST_INDEX = path.join(PKG_ROOT, 'dist', 'index.js');
const SDK = '@modelcontextprotocol/sdk';

// Import from the package's own dist + node_modules so SDK/zod resolve there.
const sdkClientPath = path.join(
  PKG_ROOT,
  'node_modules',
  ...`${SDK}/dist/esm/client/index.js`.split('/'),
);
const sdkInMemoryPath = path.join(
  PKG_ROOT,
  'node_modules',
  ...`${SDK}/dist/esm/inMemory.js`.split('/'),
);

let createServer;
let Client;
let InMemoryTransport;

const distExists = fs.existsSync(DIST_INDEX);

async function makeClient() {
  const server = await createServer();
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await Promise.all([client.connect(clientT), server.connect(serverT)]);
  return { client, server };
}

function textOf(result) {
  const block = (result.content ?? []).find((c) => c.type === 'text');
  return block ? block.text : '';
}

describe.skipIf(!distExists)('valet-mcp server output contract (D2–D5)', () => {
  let origCwd;
  let foreignCwd;

  beforeAll(async () => {
    // VALET_MCP_NO_AUTOSTART stops dist/index.js from spawning the stdio
    // server on import; we drive createServer() ourselves.
    process.env.VALET_MCP_NO_AUTOSTART = '1';
    ({ createServer } = await import(DIST_INDEX));
    ({ Client } = await import(sdkClientPath));
    ({ InMemoryTransport } = await import(sdkInMemoryPath));
  });

  beforeEach(() => {
    origCwd = process.cwd();
  });
  afterEach(() => {
    process.chdir(origCwd);
    if (foreignCwd && fs.existsSync(foreignCwd)) {
      fs.rmSync(foreignCwd, { recursive: true, force: true });
      foreignCwd = undefined;
    }
  });

  it('lists every registered tool (tools/list round-trip)', async () => {
    const { client } = await makeClient();
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toContain('valet__get_component');
    expect(names).toContain('valet__search_props');
    expect(names).toContain('valet__list_components');
    expect(names).toContain('valet__check_version_parity');
    expect(names).toContain('valet__validate_jsx');
    // 15 tools are registered in src/index.ts (14 + validate_jsx, Wave 2 D1).
    expect(names.length).toBe(15);
  });

  it('declares an outputSchema on the D2 start set', async () => {
    const { client } = await makeClient();
    const { tools } = await client.listTools();
    const withSchema = (n) => tools.find((t) => t.name === n)?.outputSchema;
    expect(withSchema('valet__get_component')).toBeTruthy();
    expect(withSchema('valet__search_props')).toBeTruthy();
    expect(withSchema('valet__list_components')).toBeTruthy();
  });

  // ── D5: parity from any cwd ────────────────────────────────────────
  it('check_version_parity returns real parity from a FOREIGN cwd (host-cwd bug)', async () => {
    // Simulate Claude Desktop / Codex: cwd is an unrelated project that does
    // NOT depend on @archway/valet. The pre-fix tool read this cwd and
    // returned status:'missing-data'. The fix reads the bundled snapshot.
    foreignCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'valet-mcp-foreign-'));
    fs.writeFileSync(
      path.join(foreignCwd, 'package.json'),
      JSON.stringify({ name: 'some-unrelated-host-app', version: '9.9.9' }, null, 2),
    );
    process.chdir(foreignCwd);

    const { client } = await makeClient();
    const res = await client.callTool({ name: 'valet__check_version_parity', arguments: {} });
    const payload = JSON.parse(textOf(res));

    expect(res.isError).toBeFalsy();
    expect(payload.status).not.toBe('missing-data');
    expect(payload.status).toBe('ok');
    expect(payload.ok).toBe(true);
    // The valet version is resolved from the bundled snapshot, not the host cwd.
    expect(payload.valetVersion).toBe('0.35.0');
    expect(payload.valetSource).toBe('data');
    expect(payload.dataValetVersion).toBe('0.35.0');
    // The host cwd had no valet dependency — recorded as advisory-missing,
    // NOT fatal to the verdict.
    expect(payload.appValetSource).toBe('missing');
  });

  it('check_version_parity yields the same verdict from repo root cwd', async () => {
    // Sanity: cwd-independence means the verdict does not flip with cwd.
    const { client } = await makeClient();
    const res = await client.callTool({ name: 'valet__check_version_parity', arguments: {} });
    const payload = JSON.parse(textOf(res));
    expect(payload.status).toBe('ok');
    expect(payload.valetVersion).toBe('0.35.0');
    expect(payload.valetSource).toBe('data');
  });

  // ── D3: isError on genuine misses; empty search stays non-error ─────
  it('get_component on an unknown name returns isError:true', async () => {
    const { client } = await makeClient();
    const res = await client.callTool({
      name: 'valet__get_component',
      arguments: { name: 'DefinitelyNotAValetComponent' },
    });
    expect(res.isError).toBe(true);
    expect(textOf(res)).toMatch(/not found/i);
  });

  it('get_examples on an unknown name returns isError:true', async () => {
    const { client } = await makeClient();
    const res = await client.callTool({
      name: 'valet__get_examples',
      arguments: { name: 'NopeNotReal' },
    });
    expect(res.isError).toBe(true);
  });

  it('define_term miss returns isError:true with did-you-mean suggestions', async () => {
    const { client } = await makeClient();
    const res = await client.callTool({
      name: 'valet__define_term',
      arguments: { word: 'zzzznotaglossaryterm' },
    });
    expect(res.isError).toBe(true);
    const payload = JSON.parse(textOf(res));
    expect(payload.found).toBe(false);
    expect(Array.isArray(payload.suggestions)).toBe(true);
  });

  it('search_props with a no-match query stays a NON-error empty list', async () => {
    const { client } = await makeClient();
    const res = await client.callTool({
      name: 'valet__search_props',
      arguments: { query: 'qqzzzneverpropname' },
    });
    expect(res.isError).toBeFalsy();
    expect(res.structuredContent).toEqual({ results: [], count: 0 });
  });

  it('get_component on a real component succeeds (not an error)', async () => {
    const { client } = await makeClient();
    const res = await client.callTool({
      name: 'valet__get_component',
      arguments: { name: 'Box' },
    });
    expect(res.isError).toBeFalsy();
    expect(res.structuredContent?.name).toBe('Box');
  });

  // ── D2: structuredContent validated against outputSchema by the SDK ──
  it('list_components returns SDK-validated structuredContent', async () => {
    const { client } = await makeClient();
    const res = await client.callTool({ name: 'valet__list_components', arguments: {} });
    // If structuredContent did not match outputSchema, the SDK throws before
    // we get here — reaching this point is the validation proof.
    expect(res.structuredContent).toBeTruthy();
    expect(typeof res.structuredContent.count).toBe('number');
    expect(Array.isArray(res.structuredContent.components)).toBe(true);
    expect(res.structuredContent.count).toBe(res.structuredContent.components.length);
  });

  it('search_props returns SDK-validated structuredContent with deprecation flags', async () => {
    const { client } = await makeClient();
    const res = await client.callTool({
      name: 'valet__search_props',
      arguments: { query: 'selectable' },
    });
    expect(res.isError).toBeFalsy();
    expect(Array.isArray(res.structuredContent.results)).toBe(true);
    const table = res.structuredContent.results.find((r) => r.name === 'Table');
    expect(table).toBeTruthy();
    const selectable = table.props.find((p) => p.name === 'selectable');
    expect(selectable).toBeTruthy();
    expect(selectable.deprecated).toBe(true);
    expect(selectable.replacement).toBe('selectionMode');
  });

  // ── D4: deprecation-aware output in get_component ───────────────────
  it('get_component marks a deprecated prop with its replacement (text + structured)', async () => {
    const { client } = await makeClient();
    const res = await client.callTool({
      name: 'valet__get_component',
      arguments: { name: 'Table' },
    });
    expect(res.isError).toBeFalsy();

    // Structured: the prop carries a flat `deprecation` view and the doc
    // carries a top-level rollup.
    const sc = res.structuredContent;
    const selectable = sc.props.find((p) => p.name === 'selectable');
    expect(selectable.deprecation).toMatchObject({
      deprecated: true,
      replacement: 'selectionMode',
    });
    const rollup = sc.deprecatedProps.find((d) => d.name === 'selectable');
    expect(rollup).toMatchObject({ name: 'selectable', replacement: 'selectionMode' });
    expect(sc.deprecatedProps.find((d) => d.name === 'rowKey')).toMatchObject({
      replacement: 'getItemKey',
    });

    // Text: a human-readable banner names the deprecated prop + replacement.
    const text = textOf(res);
    expect(text).toMatch(/DEPRECATED PROPS/);
    expect(text).toMatch(/selectable/);
    expect(text).toMatch(/selectionMode/);
  });

  it('get_component on a non-deprecated component has an empty rollup', async () => {
    const { client } = await makeClient();
    const res = await client.callTool({
      name: 'valet__get_component',
      arguments: { name: 'Box' },
    });
    expect(Array.isArray(res.structuredContent.deprecatedProps)).toBe(true);
    expect(res.structuredContent.deprecatedProps.length).toBe(0);
    expect(textOf(res)).not.toMatch(/DEPRECATED PROPS/);
  });
});

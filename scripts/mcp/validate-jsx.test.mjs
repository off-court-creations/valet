// ─────────────────────────────────────────────────────────────
// scripts/mcp/validate-jsx.test.mjs | valet (MCP Wave 2 — D1)
// Regression suite for the `valet__validate_jsx` engine
// (packages/valet-mcp/src/validate/typecheck.ts) and its tool wrapper
// (packages/valet-mcp/src/tools/validateJsx.ts). vitest transforms the TS.
//
// What this proves the corpus structurally cannot: a snippet that invents a
// prop, picks the wrong member of a literal union, or uses a deprecated alias
// is caught by type-checking the snippet against the SHIPPED @archway/valet
// types. The four plan cases:
//   (a) valid valet JSX            → ok:true, no diagnostics
//   (b) Button with bogus variant  → ok:false, diagnostic naming the bad union
//   (c) Table deprecated selectable→ ok:false, deprecation flag on selectable
//   (d) a wholly invented prop     → ok:false, "does not exist" diagnostic
// Plus: explicit `deps`, the tool wrapper's isError/structuredContent contract,
// and a warm per-call latency report.
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import {
  typeCheckSnippet,
  resolveValetTypes,
  detectValetTags,
  valetBarrelExports,
} from '../../packages/valet-mcp/src/validate/typecheck.ts';

// Warm the language service once so per-test timings are warm-path.
typeCheckSnippet(`<Box />`);

describe('resolveValetTypes', () => {
  it('resolves @archway/valet shipped types to an existing declaration file', () => {
    const r = resolveValetTypes();
    expect(['package-exports', 'package-entry', 'repo-dist', 'repo-src']).toContain(r.source);
    expect(r.typesPath).toMatch(/index\.d\.m?ts$|index\.ts$/);
  });

  it('enumerates the valet barrel (Button/Table values, ButtonVariant type)', () => {
    const { typesPath } = resolveValetTypes();
    const barrel = valetBarrelExports(typesPath);
    expect(barrel.value.has('Button')).toBe(true);
    expect(barrel.value.has('Table')).toBe(true);
    expect(barrel.value.has('Stack')).toBe(true);
    expect(barrel.type.has('ButtonVariant')).toBe(true);
  });
});

describe('detectValetTags', () => {
  it('detects only real barrel members; ignores locally-defined PascalCase', () => {
    const allow = new Set(['Button', 'Stack']);
    expect(detectValetTags(`<Stack><Button/><Demo/></Stack>`, allow).sort()).toEqual([
      'Button',
      'Stack',
    ]);
  });
});

describe('typeCheckSnippet — the four plan cases', () => {
  it('(a) valid valet JSX → ok:true with no diagnostics', () => {
    const r = typeCheckSnippet(`<Stack><Button variant='outlined'>Save</Button></Stack>`);
    expect(r.ok).toBe(true);
    expect(r.diagnostics).toEqual([]);
    expect(r.importedTags.sort()).toEqual(['Button', 'Stack']);
  });

  it('(b) Button with a bogus variant → ok:false naming the bad variant', () => {
    const r = typeCheckSnippet(`<Button variant='nope'>x</Button>`);
    expect(r.ok).toBe(false);
    const err = r.diagnostics.find((d) => d.severity === 'error');
    expect(err).toBeTruthy();
    // The diagnostic names the offending literal and the real union type.
    expect(err.message).toContain('nope');
    expect(err.message).toContain('ButtonVariant');
    expect(err.code).toMatch(/^TS\d+$/);
    expect(err.line).toBe(1);
  });

  it('(c) Table with the removed `selectable`/`rowKey` aliases → ok:false, flagged as errors', () => {
    const r = typeCheckSnippet(`<Table data={[]} columns={[]} selectable='multi' rowKey='id' />`);
    expect(r.ok).toBe(false);
    // The 1.0 deprecation sweep REMOVED these aliases (selectable→selectionMode,
    // rowKey→getItemKey), so they are now hard type errors (unknown props), not
    // suggestion-severity deprecations.
    const messages = r.diagnostics
      .filter((d) => d.severity === 'error')
      .map((d) => d.message)
      .join('\n');
    expect(messages).toContain('selectable');
    expect(messages).toContain('rowKey');
    // No type-valid deprecated aliases survive in the 1.0 surface.
    expect(r.diagnostics.some((d) => d.deprecated)).toBe(false);
  });

  it('(d) a wholly invented prop → ok:false, reported as not existing', () => {
    const r = typeCheckSnippet(`<Button frobnicate={42}>x</Button>`);
    expect(r.ok).toBe(false);
    const err = r.diagnostics.find((d) => d.severity === 'error');
    expect(err).toBeTruthy();
    expect(err.message).toContain('frobnicate');
  });
});

describe('typeCheckSnippet — auxiliary behavior', () => {
  it('honors an explicit `deps` list (still type-checks against shipped types)', () => {
    const r = typeCheckSnippet(`<Button variant='nope'>x</Button>`, ['Button']);
    expect(r.importedTags).toEqual(['Button']);
    expect(r.ok).toBe(false);
  });

  it('a removed alias (selectable/rowKey) is a hard error post-1.0, not a deprecation suggestion', () => {
    const r = typeCheckSnippet(`<Table data={[]} columns={[]} selectable='multi' rowKey='id' />`);
    // Post-sweep there are no type-valid deprecated valet aliases left; the
    // removed props surface as errors instead of suggestion-severity deprecations.
    expect(r.diagnostics.some((d) => d.severity === 'error')).toBe(true);
    expect(r.diagnostics.some((d) => d.deprecated)).toBe(false);
  });

  it('maps diagnostics to the correct in-snippet line for a multi-line snippet', () => {
    const code = ['<Stack>', "  <Button variant='nope'>x</Button>", '</Stack>'].join('\n');
    const r = typeCheckSnippet(code);
    const err = r.diagnostics.find((d) => d.severity === 'error');
    expect(err.line).toBe(2);
  });
});

describe('registerValidateJsx — tool wrapper contract', () => {
  // A minimal McpServer stand-in that captures the registered handler + config
  // so we can invoke the tool exactly as the SDK would, without a transport.
  async function callTool(args) {
    const { registerValidateJsx } = await import(
      '../../packages/valet-mcp/src/tools/validateJsx.ts'
    );
    /** @type {{ name: string, config: any, handler: Function } | null} */
    let captured = null;
    const fakeServer = {
      registerTool(name, config, handler) {
        captured = { name, config, handler };
      },
    };
    registerValidateJsx(/** @type {any} */ (fakeServer));
    if (!captured) throw new Error('registerValidateJsx did not call registerTool');
    expect(captured.name).toBe('valet__validate_jsx');
    // Annotations the plan requires.
    expect(captured.config.annotations).toMatchObject({
      readOnlyHint: true,
      openWorldHint: false,
      idempotentHint: true,
    });
    expect(captured.config.outputSchema).toBeTruthy();
    return captured.handler(args);
  }

  it('a snippet with type errors is NOT a tool error (isError stays false)', async () => {
    const res = await callTool({ code: `<Button variant='nope'>x</Button>` });
    expect(res.isError).toBeFalsy();
    expect(res.structuredContent.ok).toBe(false);
    expect(res.structuredContent.errorCount).toBeGreaterThanOrEqual(1);
    expect(res.content[0].type).toBe('text');
    expect(res.content[0].text).toMatch(/FAIL/);
  });

  it('a valid snippet returns ok:true with a readable OK summary', async () => {
    const res = await callTool({ code: `<Button variant='filled'>Save</Button>` });
    expect(res.isError).toBeFalsy();
    expect(res.structuredContent.ok).toBe(true);
    expect(res.structuredContent.diagnostics).toEqual([]);
    expect(res.content[0].text).toMatch(/^OK/);
  });

  it('surfaces removed aliases as errors (no deprecated aliases remain post-1.0)', async () => {
    const res = await callTool({
      code: `<Table data={[]} columns={[]} selectable='multi' rowKey='id' />`,
    });
    expect(res.isError).toBeFalsy();
    expect(res.structuredContent.ok).toBe(false);
    expect(res.structuredContent.errorCount).toBeGreaterThanOrEqual(1);
    expect(res.structuredContent.deprecatedCount).toBe(0);
  });
});

describe('warm per-call latency', () => {
  it('reports the warm tsc latency (informational; must be < 4s)', () => {
    const samples = [];
    for (let i = 0; i < 5; i += 1) {
      const r = typeCheckSnippet(`<Button variant='filled'>n${i}</Button>`);
      samples.push(r.elapsedMs);
    }
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;

    console.log(
      `[validate_jsx] warm latency: avg ${avg.toFixed(0)}ms over ${samples.length} ` +
        `(samples: ${samples.join(', ')}ms)`,
    );
    expect(avg).toBeLessThan(4000);
  });
});

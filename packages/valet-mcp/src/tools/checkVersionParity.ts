// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/checkVersionParity.ts  | valet-mcp
// Tool: valet__check_version_parity – ensure MCP + valet minors align
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DATA_INFO, DATA_DIR, getMeta } from './shared.js';

type ParityResult = {
  ok: boolean;
  status: 'ok' | 'mismatch' | 'missing-data';
  mcpVersion: string;
  valetVersion?: string;
  mcpMinor: string;
  valetMinor?: string;
  /**
   * Where the authoritative valet version came from. `data` and `mcp-module`
   * are cwd-independent (bundled snapshot / this package's own module graph)
   * and are preferred so the tool works under Claude Desktop / Codex where
   * process.cwd() is the HOST cwd, not the consumer project. `app-module` /
   * `app-dependency-range` are the best-effort consumer-project signals.
   */
  valetSource: 'data' | 'mcp-module' | 'app-module' | 'app-dependency-range' | 'missing';
  valetRange?: string;
  appPackagePath?: string;
  /** Best-effort consumer-project @archway/valet version (cwd-dependent). */
  appValetVersion?: string;
  appValetMinor?: string;
  appValetSource: 'module' | 'dependency-range' | 'missing';
  dataValetVersion?: string;
  dataValetMinor?: string;
  dataSource: string;
  dataDir: string;
  message: string;
};

function extractMinor(version: string | undefined): string | undefined {
  if (!version) return undefined;
  const parts = String(version).trim().split('.');
  if (parts.length < 2) return undefined;
  return `${parts[0]}.${parts[1]}`;
}

function locatePackageJson(): { path: string; dir: string } | null {
  const startingDir = process.cwd();
  const candidate = path.join(startingDir, 'package.json');
  if (fs.existsSync(candidate)) {
    return { path: candidate, dir: startingDir };
  }
  return null;
}

function locateValetRange(pkg: Record<string, unknown>): string | undefined {
  const fields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
  for (const field of fields) {
    const block = pkg[field];
    if (block && typeof block === 'object') {
      const raw = (block as Record<string, unknown>)['@archway/valet'];
      if (typeof raw === 'string' && raw.trim()) return raw.trim();
    }
  }
  return undefined;
}

function extractVersionFromRange(range: string | undefined): string | undefined {
  if (!range) return undefined;
  const normalized = range
    .trim()
    .replace(/^workspace:/i, '')
    .replace(/^npm:/i, '')
    .replace(/^link:/i, '')
    .replace(/^file:/i, '')
    .replace(/^git\+.+#/, '')
    .replace(/^https?:.+#/, '');
  const match = normalized.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return undefined;
  const [, major, minor, patch] = match;
  return `${major}.${minor}.${patch ?? '0'}`;
}

/**
 * Best-effort resolution of the CONSUMER project's @archway/valet version.
 *
 * This reads process.cwd(), so it only works when the MCP server is launched
 * from inside the consumer project (e.g. an npm script). Under Claude Desktop
 * / Codex the cwd is the HOST cwd and this returns `missing`. It is therefore
 * advisory only and never the sole cause of a `missing-data` verdict — the
 * authoritative valet version comes from resolveValetVersion() below.
 */
function resolveAppValetVersion(): {
  version?: string;
  range?: string;
  source: 'module' | 'dependency-range' | 'missing';
  appPackagePath?: string;
} {
  const located = locatePackageJson();
  if (!located) {
    return { source: 'missing' };
  }

  const pkg = JSON.parse(fs.readFileSync(located.path, 'utf8')) as Record<string, unknown>;
  const range = locateValetRange(pkg);

  let version: string | undefined;
  try {
    const requireFromApp = createRequire(path.join(located.dir, 'package.json'));
    const valetPkg = requireFromApp('@archway/valet/package.json') as { version?: string };
    if (valetPkg?.version) {
      version = String(valetPkg.version);
    }
  } catch {
    // ignore resolution failures; we'll fall back to the declared range
  }

  if (!version) {
    version = extractVersionFromRange(range);
    if (!version) {
      return { source: 'missing', range, appPackagePath: located.path };
    }
    return { source: 'dependency-range', range, version, appPackagePath: located.path };
  }

  return { source: 'module', range, version, appPackagePath: located.path };
}

/**
 * Try to resolve @archway/valet's installed version from THIS package's own
 * module graph (import.meta.url), independent of process.cwd(). Works when the
 * MCP package is installed alongside valet (e.g. a project that depends on both
 * @archway/valet and @archway/valet-mcp). Returns undefined when valet is not a
 * sibling of the MCP install (the common Claude Desktop / npx case).
 */
function resolveValetFromMcpModule(): string | undefined {
  try {
    const requireFromHere = createRequire(import.meta.url);
    const valetPkg = requireFromHere('@archway/valet/package.json') as { version?: string };
    if (valetPkg?.version) return String(valetPkg.version);
  } catch {
    // valet is not resolvable from the MCP package; fine — data is authoritative.
  }
  return undefined;
}

export function registerCheckVersionParity(server: McpServer): void {
  const requireFromHere = createRequire(import.meta.url);
  const pkg = requireFromHere('../../package.json') as { version?: string };
  const mcpVersion = pkg.version ?? '0.0.0';

  server.registerTool(
    'valet__check_version_parity',
    {
      title: 'Check Version Parity',
      description:
        'Compare the MCP package minor version with the application’s @archway/valet dependency and bundled mcp-data snapshot.',
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const mcpMinor = extractMinor(mcpVersion) ?? '0.0';
        const dataSource = DATA_INFO.source ?? 'unknown';
        const dataDir = DATA_DIR;

        // ── Authoritative valet version (cwd-INDEPENDENT) ──────────────
        // _meta.json ships in the package's mcp-data; getMeta() reads it via
        // import.meta.url, never process.cwd(). This is the snapshot the
        // corpus was generated against and is the truth the server serves.
        let dataValetVersion: string | undefined;
        let dataValetMinor: string | undefined;
        try {
          const meta = getMeta();
          dataValetVersion = meta?.valetVersion;
          dataValetMinor = extractMinor(dataValetVersion);
        } catch {
          // Swallow data read errors; we still report whatever we can.
        }

        // ── Best-effort consumer-project signal (cwd-DEPENDENT) ────────
        // Advisory only: useful when launched from inside a project, absent
        // under Claude Desktop / Codex (host cwd). Never the cause of a
        // missing-data verdict on its own.
        const appValet = resolveAppValetVersion();
        const appValetVersion = appValet.version;
        const appValetMinor = extractMinor(appValetVersion);

        // ── Pick the authoritative valet version, cwd-independent first ─
        const mcpModuleValet = resolveValetFromMcpModule();
        let valetVersion: string | undefined;
        let valetSource: ParityResult['valetSource'];
        if (dataValetVersion) {
          valetVersion = dataValetVersion;
          valetSource = 'data';
        } else if (mcpModuleValet) {
          valetVersion = mcpModuleValet;
          valetSource = 'mcp-module';
        } else if (appValet.source === 'module') {
          valetVersion = appValetVersion;
          valetSource = 'app-module';
        } else if (appValet.source === 'dependency-range') {
          valetVersion = appValetVersion;
          valetSource = 'app-dependency-range';
        } else {
          valetSource = 'missing';
        }
        const valetMinor = extractMinor(valetVersion);

        const base = {
          mcpVersion,
          valetVersion,
          mcpMinor,
          valetMinor,
          valetSource,
          valetRange: appValet.range,
          appPackagePath: appValet.appPackagePath,
          appValetVersion,
          appValetMinor,
          appValetSource: appValet.source,
          dataValetVersion,
          dataValetMinor,
          dataSource,
          dataDir,
        } as const;

        if (!valetVersion || !valetMinor) {
          const payload: ParityResult = {
            ok: false,
            status: 'missing-data',
            ...base,
            message:
              'Cannot resolve a valet version from the bundled mcp-data snapshot, this package, or the consumer project. The bundled snapshot should always carry one; the corpus may be missing or corrupt.',
          };
          return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
        }

        const mismatches: string[] = [];
        // MCP package minor vs the snapshot it ships with: the load-bearing
        // self-consistency check (both cwd-independent).
        if (dataValetMinor && dataValetMinor !== mcpMinor)
          mismatches.push('MCP package vs bundled mcp-data');
        // Consumer-project dependency vs the served snapshot — only when we
        // actually resolved the app's valet version.
        if (appValetMinor && dataValetMinor && appValetMinor !== dataValetMinor)
          mismatches.push('Application dependency vs bundled mcp-data');
        if (appValetMinor && appValetMinor !== mcpMinor)
          mismatches.push('MCP package vs application dependency');

        const ok = mismatches.length === 0;
        const payload: ParityResult = ok
          ? {
              ok: true,
              status: 'ok',
              ...base,
              message:
                appValetMinor && appValetMinor === mcpMinor
                  ? `All minors aligned at ${mcpMinor}.`
                  : `MCP package and bundled mcp-data aligned at ${mcpMinor} (valet version resolved from ${valetSource}; consumer-project dependency not checked).`,
            }
          : {
              ok: false,
              status: 'mismatch',
              ...base,
              message: `Version mismatch detected: ${mismatches.join('; ')}. Rebuild mcp-data with the correct valet release and republish MCP.`,
            };

        return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
      } catch (err) {
        const error = (err as Error)?.message ?? String(err);
        const payload: ParityResult = {
          ok: false,
          status: 'missing-data',
          mcpVersion,
          mcpMinor: extractMinor(mcpVersion) ?? '0.0',
          valetSource: 'missing',
          appValetSource: 'missing',
          dataSource: DATA_INFO.source ?? 'unknown',
          dataDir: DATA_DIR,
          message: error,
        };
        return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
      }
    },
  );
}

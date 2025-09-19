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
  valetSource: 'module' | 'dependency-range' | 'missing';
  valetRange?: string;
  appPackagePath?: string;
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

function locateValetRange(pkg: Record<string, any>): string | undefined {
  const fields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
  for (const field of fields) {
    const block = pkg[field];
    if (block && typeof block === 'object' && block['@archway/valet']) {
      const raw = block['@archway/valet'];
      if (typeof raw === 'string' && raw.trim()) return raw.trim();
    }
  }
  return undefined;
}

function extractVersionFromRange(range: string | undefined): string | undefined {
  if (!range) return undefined;
  const normalized = range.trim()
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

  const pkg = JSON.parse(fs.readFileSync(located.path, 'utf8')) as Record<string, any>;
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

export function registerCheckVersionParity(server: McpServer): void {
  const requireFromHere = createRequire(import.meta.url);
  const pkg = requireFromHere('../../package.json') as { version?: string };
  const mcpVersion = pkg.version ?? '0.0.0';

  server.registerTool(
    'valet__check_version_parity',
    {
      title: 'Check Version Parity',
      description: 'Compare the MCP package minor version with the application’s @archway/valet dependency and bundled mcp-data snapshot.',
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const appValet = resolveAppValetVersion();
        const valetVersion = appValet.version;
        const valetMinor = extractMinor(valetVersion);
        const mcpMinor = extractMinor(mcpVersion) ?? '0.0';
        const dataSource = (DATA_INFO as any).source ?? 'unknown';
        const dataDir = DATA_DIR;
        let dataValetVersion: string | undefined;
        let dataValetMinor: string | undefined;
        try {
          const meta = getMeta();
          dataValetVersion = meta?.valetVersion;
          dataValetMinor = extractMinor(dataValetVersion);
        } catch {
          // Swallow data read errors; we still report whatever we can.
        }

        if (!valetVersion || !valetMinor) {
          const payload: ParityResult = {
            ok: false,
            status: 'missing-data',
            mcpVersion,
            valetVersion,
            mcpMinor,
            valetMinor,
            valetSource: appValet.source,
            valetRange: appValet.range,
            appPackagePath: appValet.appPackagePath,
            dataValetVersion,
            dataValetMinor,
            dataSource,
            dataDir,
            message:
              'Cannot resolve @archway/valet version from the nearest package.json; install or declare the dependency before running MCP parity.',
          };
          return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
        }

        const mismatches: string[] = [];
        if (mcpMinor !== valetMinor) mismatches.push('MCP package vs application dependency');
        if (dataValetMinor && dataValetMinor !== mcpMinor) mismatches.push('MCP package vs bundled mcp-data');
        if (dataValetMinor && dataValetMinor !== valetMinor) mismatches.push('Application dependency vs bundled mcp-data');

        const ok = mismatches.length === 0;
        const payload: ParityResult = ok
          ? {
              ok: true,
              status: 'ok',
              mcpVersion,
              valetVersion,
              mcpMinor,
              valetMinor,
              valetSource: appValet.source,
              valetRange: appValet.range,
              appPackagePath: appValet.appPackagePath,
              dataValetVersion,
              dataValetMinor,
              dataSource,
              dataDir,
              message: `All minors aligned at ${mcpMinor}.`,
            }
          : {
              ok: false,
              status: 'mismatch',
              mcpVersion,
              valetVersion,
              mcpMinor,
              valetMinor,
              valetSource: appValet.source,
              valetRange: appValet.range,
              appPackagePath: appValet.appPackagePath,
              dataValetVersion,
              dataValetMinor,
              dataSource,
              dataDir,
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
          dataSource: (DATA_INFO as any).source ?? 'unknown',
          dataDir: DATA_DIR,
          message: error,
        };
        return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
      }
    }
  );
}

// ─────────────────────────────────────────────────────────────
// servers/valet-mcp/src/tools/adjustTheme.ts  | valet-mcp
// Implement adjust_theme tool (see docs: docs/set_theme_in_app.md)
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';

export type AdjustThemeParams = {
  appPath: string;
  themePatch?: {
    colors?: Record<string, string>;
    spacingUnit?: string;
    radiusUnit?: string;
    strokeUnit?: string;
  };
  fonts?: {
    overrides?: { heading?: string; body?: string; mono?: string; button?: string };
    extras?: string[];
  };
};

export type AdjustThemeResult = {
  applied: boolean;
  appPath: string;
  summary: string[];
  diff?: string;
  warnings?: string[];
  snippet?: string; // provided when no-op due to missing call/markers
};

function nowIsoForPath() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function hasImportUseInitialTheme(src: string): boolean {
  const re = /import\s+\{[^}]*\buseInitialTheme\b[^}]*}\s+from\s+['"]@archway\/valet['"];?/;
  return re.test(src);
}

function ensureImport(src: string): { updated: string; added: boolean } {
  if (hasImportUseInitialTheme(src)) return { updated: src, added: false };
  // If there's any import from '@archway/valet' but without useInitialTheme, add a separate import is valid ESM.
  const importLine = "import { useInitialTheme } from '@archway/valet';\n";
  const lines = src.split(/\r?\n/);
  // Insert after last import statement, else at top
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\b/.test(lines[i])) lastImportIdx = i;
  }
  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, importLine.trimEnd());
    return { updated: lines.join('\n'), added: true };
  }
  return { updated: importLine + src, added: true };
}

function findMarkers(src: string) {
  const begin = src.indexOf('// valet-mcp:theme-begin');
  const end = src.indexOf('// valet-mcp:theme-end');
  if (begin !== -1 && end !== -1 && end > begin) {
    // include marker lines in region
    const beginLineStart = src.lastIndexOf('\n', begin) + 1;
    const endLineEnd = src.indexOf('\n', end) !== -1 ? src.indexOf('\n', end) + 1 : src.length;
    return { has: true, start: beginLineStart, end: endLineEnd };
  }
  return { has: false };
}

function findCallRegion(src: string) {
  const callIdx = src.indexOf('useInitialTheme(');
  if (callIdx === -1) return null;
  // Find matching closing paren ); with simple balanced scanning
  let i = callIdx + 'useInitialTheme'.length;
  while (i < src.length && src[i] !== '(') i++;
  if (i >= src.length) return null;
  let depthParen = 0;
  let inStr: false | '"' | "'" | '`' = false;
  let escaped = false;
  let end = -1;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (!escaped && ch === inStr) inStr = false;
      escaped = !escaped && ch === '\\';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch as any;
      continue;
    }
    if (ch === '(') depthParen++;
    else if (ch === ')') {
      depthParen--;
      if (depthParen === 0) {
        // Include trailing semicolon if present
        end = i + 1;
        if (src[end] === ';') end += 1;
        break;
      }
    }
  }
  if (end === -1) return null;
  // Expand start to the beginning of the line
  const start = src.lastIndexOf('\n', callIdx) + 1;
  return { start, end };
}

function extractBetween(src: string, start: number, end: number) {
  return src.slice(start, end);
}

function extractFirstArgObject(src: string): string | null {
  const openIdx = src.indexOf('(');
  if (openIdx === -1) return null;
  // scan to first '{' after '('
  let i = openIdx + 1;
  for (; i < src.length; i++) {
    if (src[i] === '{') break;
  }
  if (i >= src.length) return null;
  let depth = 0;
  let inStr: false | '"' | "'" | '`' = false;
  let escaped = false;
  let start = i;
  let end = -1;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (!escaped && ch === inStr) inStr = false;
      escaped = !escaped && ch === '\\';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch as any;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) return null;
  return src.slice(start, end);
}

function extractSecondArgArray(src: string): string | null {
  // After first arg object, look for a comma then '[' and capture array literal
  const firstObj = extractFirstArgObject(src);
  if (!firstObj) return null;
  const idx = src.indexOf(firstObj);
  if (idx === -1) return null;
  let i = idx + firstObj.length;
  // skip spaces and commas
  while (i < src.length && /[\s,]/.test(src[i])) i++;
  if (src[i] !== '[') return null;
  let start = i;
  let depth = 0;
  let inStr: false | '"' | "'" | '`' = false;
  let escaped = false;
  let end = -1;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (!escaped && ch === inStr) inStr = false;
      escaped = !escaped && ch === '\\';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch as any; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  if (end === -1) return null;
  return src.slice(start, end);
}

function parseFontsFromObjectLiteral(objSrc: string): { heading?: string; body?: string; mono?: string; button?: string } {
  const m = /fonts\s*:\s*\{([\s\S]*?)\}/m.exec(objSrc);
  const res: { heading?: string; body?: string; mono?: string; button?: string } = {};
  if (m) {
    const body = m[1];
    const pairs = body.split(/,\s*/).map((s) => s.trim()).filter(Boolean);
    for (const p of pairs) {
      const kv = /^(heading|body|mono|button)\s*:\s*(['"])(.*?)\2/.exec(p);
      if (kv) (res as any)[kv[1]] = kv[3];
    }
  }
  return res;
}

function parseExtrasFromArrayLiteral(arrSrc: string | null): string[] {
  if (!arrSrc) return [];
  const inner = arrSrc.trim().replace(/^\[/, '').replace(/]$/, '');
  const items = inner.split(',').map((s) => s.trim()).filter(Boolean);
  const names: string[] = [];
  for (const it of items) {
    const m = /^(['"])(.*?)\1$/.exec(it);
    if (m) names.push(m[2]);
  }
  return names;
}

function renderCall(patch: AdjustThemeParams, baseFonts: { heading?: string; body?: string; mono?: string; button?: string }, baseExtras: string[]) {
  const fonts = { ...baseFonts, ...(patch.fonts?.overrides ?? {}) };
  const extraSet = new Set<string>([...baseExtras, ...(patch.fonts?.extras ?? [])].filter(Boolean));
  // Ensure overrides are represented in extras
  Object.values(fonts).forEach((f) => f && extraSet.add(f));
  const extras = Array.from(extraSet);

  const themeParts: string[] = [];
  if (patch.themePatch?.colors && Object.keys(patch.themePatch.colors).length > 0) {
    const cols = Object.entries(patch.themePatch.colors).map(([k, v]) => `${k}: '${v}'`).join(', ');
    themeParts.push(`colors: { ${cols} }`);
  }
  if (patch.themePatch?.spacingUnit) themeParts.push(`spacingUnit: '${patch.themePatch.spacingUnit}'`);
  if (patch.themePatch?.radiusUnit) themeParts.push(`radiusUnit: '${patch.themePatch.radiusUnit}'`);
  if (patch.themePatch?.strokeUnit) themeParts.push(`strokeUnit: '${patch.themePatch.strokeUnit}'`);

  const fontsObjProps = [
    fonts.heading ? `heading: '${fonts.heading}'` : null,
    fonts.body ? `body: '${fonts.body}'` : null,
    fonts.mono ? `mono: '${fonts.mono}'` : null,
    fonts.button ? `button: '${fonts.button}'` : null,
  ].filter(Boolean).join(', ');
  themeParts.push(`fonts: { ${fontsObjProps} }`);

  const themeObj = `{
    ${themeParts.join(',\n    ')}
  }`;
  const extrasArr = `[${extras.map((e) => `'${e}'`).join(', ')}]`;
  const call = `// valet-mcp:theme-begin\nuseInitialTheme(\n  ${themeObj},\n  ${extrasArr},\n);\n// valet-mcp:theme-end`;
  return { call, extras, fonts };
}

function makeUnifiedDiff(filename: string, before: string, after: string): string {
  // Simple whole-file unified diff; sufficient for review
  const a = before.split(/\r?\n/);
  const b = after.split(/\r?\n/);
  // Naive implementation: print full removal + full add when content differs
  if (before === after) return '';
  return [
    `--- a/${filename}`,
    `+++ b/${filename}`,
    '@@',
    ...a.map((l) => `-${l}`),
    '---',
    ...b.map((l) => `+${l}`),
  ].join('\n');
}

export function adjustTheme(params: AdjustThemeParams): AdjustThemeResult {
  const warnings: string[] = [];
  const appPath = params.appPath;
  if (!appPath || !fs.existsSync(appPath)) {
    return {
      applied: false,
      appPath,
      summary: [],
      warnings: [
        'App file not found. Provide a valid path like docs/src/App.tsx.',
      ],
      snippet:
        "// valet-mcp:theme-begin\nuseInitialTheme({ fonts: { heading: 'Inter', body: 'Inter', mono: 'JetBrains Mono', button: 'Inter' } }, ['Inter','JetBrains Mono']);\n// valet-mcp:theme-end",
    };
  }

  const original = fs.readFileSync(appPath, 'utf8');
  let next = original;
  const summary: string[] = [];

  // Ensure import present
  const ensure = ensureImport(next);
  if (ensure.added) summary.push('Added import for useInitialTheme');
  next = ensure.updated;

  const markers = findMarkers(next);
  let replacedRegionStart = -1;
  let replacedRegionEnd = -1;
  let baseFonts: { heading?: string; body?: string; mono?: string; button?: string } = {};
  let baseExtras: string[] = [];

  if ((markers as any).has) {
    replacedRegionStart = (markers as any).start;
    replacedRegionEnd = (markers as any).end;
    const region = extractBetween(next, replacedRegionStart, replacedRegionEnd);
    // Try to parse any existing call inside
    const obj = extractFirstArgObject(region);
    if (obj) baseFonts = parseFontsFromObjectLiteral(obj);
    const arr = extractSecondArgArray(region);
    baseExtras = parseExtrasFromArrayLiteral(arr);
    summary.push('Editing inside existing valet-mcp theme markers');
  } else {
    const call = findCallRegion(next);
    if (call) {
      replacedRegionStart = call.start;
      replacedRegionEnd = call.end;
      const region = extractBetween(next, call.start, call.end);
      const obj = extractFirstArgObject(region);
      if (obj) baseFonts = parseFontsFromObjectLiteral(obj);
      const arr = extractSecondArgArray(region);
      baseExtras = parseExtrasFromArrayLiteral(arr);
      summary.push('Merged into existing useInitialTheme call and added markers');
    } else {
      // No markers and no call → no-op, suggest snippet
      return {
        applied: false,
        appPath,
        summary: ['No theme markers or useInitialTheme() found. Returning snippet.'],
        warnings: [
          'Place the snippet near the top-level of your App component. The tool avoids inserting brand-new calls in MVP.',
        ],
        snippet:
          "// valet-mcp:theme-begin\nuseInitialTheme({ fonts: { heading: 'Inter', body: 'Inter', mono: 'JetBrains Mono', button: 'Inter' } }, ['Inter','JetBrains Mono']);\n// valet-mcp:theme-end",
      };
    }
  }

  const rendered = renderCall(params, baseFonts, baseExtras);
  const beforeRegion = next.slice(replacedRegionStart, replacedRegionEnd);
  next = next.slice(0, replacedRegionStart) + rendered.call + next.slice(replacedRegionEnd);

  // Backup + write if applying
  let diff = makeUnifiedDiff(path.basename(appPath), original, next);
  const backupDir = path.join(path.dirname(appPath), '.valet-mcp', 'backups', nowIsoForPath());
  ensureDir(backupDir);
  fs.writeFileSync(path.join(backupDir, path.basename(appPath)), original, 'utf8');
  fs.writeFileSync(appPath, next, 'utf8');
  summary.push('Wrote backup and applied changes');

  return {
    applied: true,
    appPath,
    summary,
    diff,
    warnings: warnings.length ? warnings : undefined,
  };
}

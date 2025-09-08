# MCP Tool Proposal: `set_theme_in_app` (MVP)

Purpose: provide a safe, minimal tool that helps agents update a Valet app’s theme initialization in the App file via `useInitialTheme` — without heavy AST surgery or risky insertions.

## Goals
- Guide agents to make good, consistent theme changes.
- Be safe and idempotent; default to dry‑run.
- Work for both TSX and JSX apps when an existing call or marker is present.
- Creating a brand‑new `useInitialTheme` call if none exists (report and suggest instead).

## Non‑Goals (MVP)
- Auto‑discovering the App file path (caller supplies it).
- Injecting `setMode`/effects or broad token overhauls.

## Tool
- Name: `adjust_theme`

### Input (zod schema)
```ts
const Params = z.object({
  appPath: z.string().min(1).describe('Path to App file, e.g., docs/src/App.tsx'),
  themePatch: z
    .object({
      colors: z.record(z.string()).optional(),
      spacingUnit: z.string().optional(),
      radiusUnit: z.string().optional(),
      strokeUnit: z.string().optional(),
    })
    .optional(),
  fonts: z
    .object({
      overrides: z
        .object({ heading: z.string().optional(), body: z.string().optional(), mono: z.string().optional(), button: z.string().optional() })
        .optional(),
      extras: z.array(z.string()).optional(),
    })
    .optional(),
  dryRun: z.boolean().optional().default(true),
});
```

### Output
```ts
{
  applied: boolean;          // false in dryRun mode
  dryRun: boolean;
  appPath: string;
  summary: string[];         // human-readable steps taken
  diff?: string;             // unified diff when available
  warnings?: string[];
}
```

## Behavior
- Requires `appPath` to point to an existing `.tsx`/`.jsx`/`.ts`/`.js` file.
- If markers exist, only edit inside them:
  - `// valet-mcp:theme-begin` … `// valet-mcp:theme-end`
- Else, locate the first `useInitialTheme(` call and merge its argument object and extras array.
- If neither markers nor a call is found, do not modify the file; return a helpful suggestion and an example snippet.
- Never introduce TS-only syntax; emitted code is plain JS object/array literals (valid in TSX/JSX).

## Editing Rules (MVP)
1. Ensure an import for `useInitialTheme` exists; add if missing using the file’s module style (ESM `import`).
2. When merging:
   - `themePatch.*`: shallow-merge keys into the first argument object literal.
   - `fonts.overrides`: shallow-merge into `fonts` key of the first argument object.
   - `fonts.extras`: dedupe and merge into the second argument array if present; otherwise add it.
3. Preserve unrelated keys/order as much as feasible.
4. Dry‑run by default; when applying, write a backup to `.valet-mcp/backups/<ISO>/App.ext`.

## Failure Modes
- App file not found → error + suggestion.
- No markers and no `useInitialTheme` → no-op; return snippet and where to place it.
- Parse failure → no-op; return error + keep file unchanged.

## Examples

Input
```json
{
  "appPath": "docs/src/App.tsx",
  "themePatch": { "colors": { "primary": "#0EA5E9" }, "spacingUnit": "0.4rem" },
  "fonts": { "overrides": { "heading": "Inter" }, "extras": ["Inter"] },
  "dryRun": true
}
```

Before (excerpt)
```tsx
useInitialTheme(
  {
    fonts: { heading: 'Kumbh Sans', body: 'Inter', mono: 'JetBrains Mono', button: 'Kumbh Sans' },
  },
  ['Kumbh Sans', 'JetBrains Mono', 'Inter'],
);
```

After (within markers or merged in-place)
```tsx
// valet-mcp:theme-begin
useInitialTheme(
  {
    colors: { primary: '#0EA5E9' },
    spacingUnit: '0.4rem',
    fonts: { heading: 'Inter', body: 'Inter', mono: 'JetBrains Mono', button: 'Kumbh Sans' },
  },
  ['Inter', 'Kumbh Sans', 'JetBrains Mono'],
);
// valet-mcp:theme-end
```

## JS/JSX Support
- Works on `.jsx` and `.tsx` equally; injected code avoids types.
- Import handling uses ESM `import { useInitialTheme } from '@archway/valet'`.

## Guidance Returned to Agents
- If init is missing, return a minimal snippet and placement hint:
  - “Add near the top of `App` component (one-time):”
```tsx
// valet-mcp:theme-begin
useInitialTheme({ fonts: { heading: 'Inter', body: 'Inter', mono: 'JetBrains Mono', button: 'Inter' } }, ['Inter','JetBrains Mono']);
// valet-mcp:theme-end
```
- Link to `/theme` docs page and MCP primer for best practices.

## Future Phases (deferred)
- Auto‑discovery of `App` file; multiple app support.
- Creating the init call when missing (robust AST insert).
- Optional initial `mode` set or `toggleMode` snippet (not auto‑applied).
- Formatting via Prettier if project config is present.

## Why This MVP
- Focused on the common path (edit what’s already there).
- Minimal risk and easy to review via diff.
- Clear failure messages that help agents proceed confidently.


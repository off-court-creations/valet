// ─────────────────────────────────────────────────────────────
// src/pages/Theme.tsx  | valet-docs
// Concept: theme store, tokens, and useTheme/useInitialTheme
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel } from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import type { DocMeta } from '../../types';

export const meta: DocMeta = {
  id: 'theme-store',
  title: 'Theme Store',
  description: 'Initialize fonts and tokens with useInitialTheme; read/write tokens via useTheme.',
  pageType: 'concept',
  prerequisites: ['quickstart'],
  tldr: 'Theme is a Zustand store with typed tokens; manipulate through hooks, not ad-hoc CSS.',
};

export default function ThemePage() {
  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Theme Store
        </Typography>
        <Typography>
          The theme store holds tokens (colors, spacing, fonts) and mode. Initialize once with
          <code>useInitialTheme</code> to preload fonts and set defaults; use <code>useTheme</code>{' '}
          to read/update tokens at runtime.
        </Typography>
        <Panel fullWidth>
          <pre>
            <code>{`import { useTheme } from '@archway/valet';

function Example() {
  const { theme, setMode } = useTheme();
  return (
    <button onClick={() => setMode(theme.mode === 'light' ? 'dark' : 'light')}>
      Toggle {theme.mode}
    </button>
  );
}
`}</code>
          </pre>
        </Panel>
        <Typography>
          Spacing helpers like <code>theme.spacing(n)</code> return pixel values from the scale,
          ensuring visual rhythm and consistent gutters across components.
        </Typography>

        {/* Best Practices -------------------------------------------------- */}
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Initialize once at the app root. Call <code>useInitialTheme</code> in
            <code> App</code> to set tokens and preload fonts; avoid re‑initializing per route.
          </Typography>
          <Typography>
            - Use tokens everywhere. Replace hard‑coded values with
            <code> theme.spacing</code>, <code>theme.radius</code>, <code>theme.stroke</code>,
            <code> theme.motion</code>, and color tokens so density, mode, and branding changes
            propagate automatically.
          </Typography>
          <Typography>
            - Toggle mode through the store. Use <code>useTheme().toggleMode()</code> or
            <code> setMode</code>; do not fork palettes in component code.
          </Typography>
          <Typography>
            - Load only the fonts you use. Provide overrides to <code>useInitialTheme</code> and use
            the <code>extras</code> list for any additional faces; the loader dedupes so you keep
            pages fast.
          </Typography>
          <Typography>
            - Keep colours semantic. Map brand colours into <code>primary</code>,
            <code> secondary</code>, <code>tertiary</code>, and <code>error</code> tokens, then
            style components against those tokens for consistent light/dark contrast.
          </Typography>
          <Typography>
            - Prefer store updates over inline overrides. Use <code>setTheme</code> to patch tokens
            at runtime rather than scattering ad‑hoc CSS so docs, MCP data, and components remain in
            sync.
          </Typography>
        </Panel>
      </Stack>
    </Surface>
  );
}

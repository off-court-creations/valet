// ─────────────────────────────────────────────────────────────
// src/pages/Theme.tsx  | valet-docs
// Concept: theme store, tokens, and useTheme/useInitialTheme
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import type { DocMeta } from '../types';

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
      </Stack>
    </Surface>
  );
}

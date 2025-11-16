// ─────────────────────────────────────────────────────────────
// src/pages/getting-started/Quickstart.tsx  | valet-docs
// 10‑minute quickstart: install, bootstrap, first screen
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel, Button, CodeBlock } from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import { useNavigate } from 'react-router-dom';
import type { DocMeta } from '../../types';

export const meta: DocMeta = {
  id: 'quickstart',
  title: 'Quickstart',
  description:
    'Scaffold a valet app with create-valet-app and learn how the generated project is organised.',
  pageType: 'guide',
  prerequisites: ['installation'],
  tldr: 'Use create-valet-app, explore the generated folders, and understand how routes, presets, and state wire together.',
};

export default function QuickstartPage() {
  const navigate = useNavigate();
  const scaffoldCommand = `npm create @archway/valet-app@latest my-valet-app`;
  const fileTree = `my-valet-app/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── pages/
│   │   ├── start/Quickstart.tsx
│   │   └── second/SecondPage.tsx
│   ├── presets/globalPresets.ts
│   └── store/appStore.ts
├── public/
├── package.json
├── tsconfig.*.json
└── vite.config.ts`;
  const appShellSnippet = `// src/App.tsx (TypeScript template)
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useInitialTheme, Surface, Stack, Typography } from '@archway/valet';

const page = <T extends { default: React.ComponentType }>(loader: () => Promise<T>) =>
  lazy(() => loader().then((m) => ({ default: m.default })));

const QuickstartPage = page(() => import('@/pages/start/Quickstart'));
const SecondPage = page(() => import('@/pages/second/SecondPage'));

export function App() {
  useInitialTheme(
    {
      fonts: {
        heading: 'Kumbh Sans',
        body: 'Inter',
        mono: 'JetBrains Mono',
        button: 'Kumbh Sans',
      },
    },
    ['Kumbh Sans', 'JetBrains Mono', 'Inter'],
  );

  const fallback = (
    <Surface>
      <Stack sx={{ padding: '2rem', alignItems: 'center' }}>
        <Typography variant='subtitle'>Loading…</Typography>
      </Stack>
    </Surface>
  );

  return (
    <Suspense fallback={fallback}>
      <Routes>
        <Route path='/' element={<QuickstartPage />} />
        <Route path='/secondpage' element={<SecondPage />} />
      </Routes>
    </Suspense>
  );
}`;
  const presetsSnippet = `// src/presets/globalPresets.ts
import { definePreset } from '@archway/valet';

definePreset('fancyHolder', (t) => \`
  background   : \${t.colors['primary']};
  color        : \${t.colors['primaryText']};
  border-radius: 20px;
  box-shadow   : 0 6px 16px \${t.colors['text']}22;
  padding      : \${t.spacing(1)};
\`);
// Additional presets (glassHolder, frostedGlass, gradientHolder, codePanel)
// keep reusable styles close to your theme tokens.
`;
  const scriptsList = `npm run dev
npm run build
npm run lint
npm run lint:fix
npm run format
npm run typecheck`; // only typecheck exists in TS/hybrid; still mention

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Quickstart
        </Typography>
        <Typography>
          The fastest way to start is <code>@archway/create-valet-app</code> (CVA). It scaffolds a
          Vite + React 19 project, wires valet, and gives you ready-to-edit pages, presets, and a
          Zustand store.
        </Typography>

        <Panel fullWidth>
          <Stack gap={1.5}>
            <Typography variant='h3'>Scaffold the project</Typography>
            <Typography>
              Run the CLI with Node 18+ (flags go after <code>--</code> when using{' '}
              <code>npm create</code>). Answer “Yes” to review options or “No” to accept defaults.
            </Typography>
            <CodeBlock
              code={scaffoldCommand}
              ariaLabel='Copy create-valet-app command'
            />
            <Typography>
              Useful flags: <code>--template js|ts|hybrid</code>, <code>--no-router</code>,{' '}
              <code>--no-zustand</code>, <code>--minimal</code>, <code>--three</code>,{' '}
              <code>--pm npm|pnpm|yarn|bun</code>, and <code>--no-mcp</code> to skip MCP docs.
            </Typography>
          </Stack>
        </Panel>

        <Panel fullWidth>
          <Stack gap={1.5}>
            <Typography variant='h3'>Understand the layout</Typography>
            <Typography>
              CVA organises the app so UI, presets, and state each have a clear home. Start by
              exploring the generated folders:
            </Typography>
            <CodeBlock
              code={fileTree}
              ariaLabel='Generated project file tree'
            />
            <Typography>
              <strong>src/App.tsx</strong> owns routes, theme bootstrapping, and lazy loading.{' '}
              <strong>src/pages</strong> holds route components (namespaced directories keep related
              assets close). <strong>src/presets</strong> centralises style tokens powered by
              <code>definePreset</code>. <strong>src/store</strong> contains the optional Zustand
              example—delete it if you scaffolded with <code>--no-zustand</code>.
            </Typography>
          </Stack>
        </Panel>

        <Panel fullWidth>
          <Stack gap={1.5}>
            <Typography variant='h3'>App shell + routing</Typography>
            <Typography>
              The generated <code>App.tsx</code> wires <code>useInitialTheme</code>, sets up a
              Suspense fallback, and lazy-loads each page. React Router is included by default but
              can be turned off with <code>--no-router</code>.
            </Typography>
            <CodeBlock
              code={appShellSnippet}
              ariaLabel='Generated App shell snippet'
            />
            <Typography>
              Routes live in <code>src/App.tsx</code>; add more pages under <code>src/pages</code>{' '}
              and point <code>page(() =&gt; import(...))</code> to them. Keep every route wrapped in
              <code>&lt;Surface&gt;</code> so layout metrics and theme tokens stay consistent.
            </Typography>
          </Stack>
        </Panel>

        <Panel fullWidth>
          <Stack gap={1.5}>
            <Typography variant='h3'>Presets and reusable styling</Typography>
            <Typography>
              Global presets load before the React tree renders. They are regular functions that
              receive the live valet theme, so tweaking tokens propagates everywhere.
            </Typography>
            <CodeBlock
              code={presetsSnippet}
              ariaLabel='Preset definition example'
            />
            <Typography>
              Reference presets via the <code>preset</code> prop on any valet component. Organise
              additional registries (e.g., per-domain presets) alongside this file or split them as
              your app grows.
            </Typography>
          </Stack>
        </Panel>

        <Panel fullWidth>
          <Stack gap={1.5}>
            <Typography variant='h3'>State and data flow</Typography>
            <Typography>
              The default template ships with a tiny Zustand store in{' '}
              <code>src/store/appStore.ts</code>
              to demonstrate how to colocate state helpers. If you prefer another state tool,
              replace this folder—nothing in the template depends on it.
            </Typography>
            <Typography>
              Forms and actions should live inside valet components whenever possible so the Surface
              can capture telemetry via the Web Action Graph.
            </Typography>
          </Stack>
        </Panel>

        <Panel fullWidth>
          <Stack gap={1.5}>
            <Typography variant='h3'>Scripts and next moves</Typography>
            <Typography>
              Generated apps include agent-friendly scripts. TypeScript and Hybrid templates also
              add
              <code>typecheck</code> variants.
            </Typography>
            <CodeBlock
              code={scriptsList}
              ariaLabel='Core npm scripts'
            />
            <Typography>
              Use <code>npm run dev</code> for HMR, <code>npm run build</code> for production
              bundles, and the <code>*:agent</code> scripts when automating checks with LLM tooling.
            </Typography>
          </Stack>
        </Panel>

        <Panel
          variant='outlined'
          fullWidth
        >
          <Stack gap={1.5}>
            <Typography>
              Ready to go deeper? Dive into component patterns, the styling engine, or theme
              internals from here.
            </Typography>
            <Stack
              direction='row'
              gap={1}
              wrap
              sx={{ alignItems: 'center' }}
            >
              <Button
                variant='outlined'
                onClick={() => navigate('/component-status')}
              >
                Component status
              </Button>

              <Button
                variant='outlined'
                onClick={() => navigate('/theme-engine')}
              >
                Theme engine
              </Button>
            </Stack>
          </Stack>
        </Panel>

        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}

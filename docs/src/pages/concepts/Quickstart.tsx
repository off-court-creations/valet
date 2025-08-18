// ─────────────────────────────────────────────────────────────
// src/pages/Quickstart.tsx  | valet-docs
// 10‑minute quickstart: install, bootstrap, first screen
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel, Button, Icon, CodeBlock } from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import { useNavigate } from 'react-router-dom';
import type { DocMeta } from '../../types';

export const meta: DocMeta = {
  id: 'quickstart',
  title: 'Quickstart',
  description: 'Install valet, bootstrap a Vite + React + TS app, and render your first screen.',
  pageType: 'guide',
  prerequisites: ['installation'],
  tldr: 'Install @archway/valet, register presets, initialize theme with useInitialTheme, and wrap routes in <Surface>.',
};

export default function QuickstartPage() {
  const navigate = useNavigate();
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
        <Typography>Target: React 18+/19, TypeScript strict, Vite.</Typography>

        <Typography
          variant='h3'
          bold
        >
          1) Create app
        </Typography>
        <CodeBlock
          code={`npm create vite@latest my-app -- --template react-ts`}
          ariaLabel='Copy create-app command'
        />
        <Typography>Then install valet in your app folder:</Typography>
        <CodeBlock
          code={`cd my-app && npm install @archway/valet`}
          ariaLabel='Copy install command'
        />

        <Typography
          variant='h3'
          bold
        >
          2) Mount router and import presets
        </Typography>
        <Typography>
          Mount <code>BrowserRouter</code> and import presets before rendering.
        </Typography>
        <CodeBlock
          code={`// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './presets/globalPresets';   // import your preset registry
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
`}
          ariaLabel='Copy main.tsx snippet'
        />

        <Typography
          variant='h3'
          bold
        >
          3) Initialize theme + fonts once
        </Typography>
        <Typography>
          Call <code>useInitialTheme</code> at the top level (e.g., in <code>App</code>) and provide
          your fonts.
        </Typography>
        <CodeBlock
          code={`// src/App.tsx
  import { useInitialTheme } from '@archway/valet';
  import brandonUrl from './assets/fonts/BrandonGrotesque.otf';
  
  export function App() {
    useInitialTheme(
      {
        fonts: {
          heading: { name: 'Brandon', src: brandonUrl },
          body: 'Cabin',
          mono: 'Ubuntu Mono',
          button: 'Ubuntu',
        },
      },
      [{ name: 'Brandon', src: brandonUrl }, 'Ubuntu', 'Ubuntu Mono', 'Cabin'],
    );
    // ...
  }
  `}
          ariaLabel='Copy App.tsx snippet'
        />

        <Typography
          variant='h3'
          bold
        >
          4) First screen with Surface
        </Typography>
        <Typography>
          Wrap each route in <code>&lt;Surface&gt;</code>. Use <code>Stack</code> and{' '}
          <code>Panel</code> for fast layout.
        </Typography>
        <CodeBlock
          code={`import { Routes, Route } from 'react-router-dom';
  import { Surface, Stack, Typography, Button } from '@archway/valet';
  
  function Home() {
    return (
      <Surface>
        <Stack gap={2} sx={{ padding: '1.5rem' }}>
          <Typography variant="h2">Hello, valet</Typography>
          <Button variant="primary">Click me</Button>
        </Stack>
      </Surface>
    );
  }
  
  export function App() {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    );
  }
  `}
          ariaLabel='Copy first screen snippet'
        />

        <Typography
          variant='h3'
          bold
        >
          5) Next steps
        </Typography>
        <Panel
          variant='alt'
          fullWidth
        >
          <Stack gap={2}>
            <Typography>
              Add <code>Typography</code>, <code>Box</code>, and a simple form via{' '}
              <code>FormControl</code> + <code>TextField</code>. Read and update tokens using{' '}
              <code>useTheme</code>. Avoid nesting <code>Surface</code>.
            </Typography>
            <Stack
              direction='row'
              gap={1}
              wrap
              sx={{ alignItems: 'center' }}
            >
              {/* Hello Valet removed */}
              <Button
                variant='outlined'
                onClick={() => navigate('/components-primer')}
              >
                <Icon icon='mdi:book-open-variant' />
                &nbsp;Components primer
              </Button>
              <Button
                variant='outlined'
                onClick={() => navigate('/styled')}
              >
                <Icon icon='mdi:xml' />
                &nbsp;Styled engine
              </Button>
              <Button
                variant='outlined'
                onClick={() => navigate('/theme')}
              >
                <Icon icon='mdi:palette-outline' />
                &nbsp;Theme store
              </Button>
            </Stack>
          </Stack>
        </Panel>
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}

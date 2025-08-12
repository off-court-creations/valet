// ─────────────────────────────────────────────────────────────
// src/pages/Overview.tsx  | valet-docs
// A newcomer-friendly tour of valet: what it is, why it exists,
// the mental model, and your first steps.
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Button, Panel, Icon } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import CodeBlock from '../components/CodeBlock';
import { useNavigate } from 'react-router-dom';
import type { DocMeta } from '../types';

export const meta: DocMeta = {
  id: 'overview',
  title: 'Overview',
  description:
    'valet is a performant, AI-forward UI library for React with predictable primitives, runtime theming, and accessibility by default.',
  pageType: 'landing',
  tldr:
    'One Surface per route, tiny styled engine, typed theme store, presets for shared styles, and more than two dozen accessible components.',
};

export default function OverviewPage() {
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack gap={2} style={{ padding: '1rem', maxWidth: 1000 }}>
        <Typography variant='h2' bold>
          Meet valet
        </Typography>
        <Typography>
          valet is a small, opinionated React UI library built for speed, accessibility, and
          AI‑enhanced apps. It combines a zero‑dependency CSS‑in‑JS engine, a typed theme store, and
          predictable primitives that keep your codebase simple while enabling advanced runtime
          theming and agent-driven behavior.
        </Typography>

        <Panel fullWidth variant='alt' pad={2}>
          <Stack gap={1}>
            <Typography bold>Why valet</Typography>
            <Typography>
              • Blazing fast: atomic styles, hashed classnames, minimal runtime<br />• Accessible by
              default: keyboard, focus, and ARIA patterns baked in<br />• AI-forward: chat widgets,
              secure key storage, and a roadmap for a Semantic Interface Layer + Web Action Graph<br />•
              Predictable: small set of primitives, consistent spacing and density controls
            </Typography>
          </Stack>
        </Panel>

        <Typography variant='h3' bold>
          The big pieces
        </Typography>
        <Panel fullWidth pad={2}>
          <Stack gap={1}>
            <Typography>
              <b>Surface</b>: a top-level wrapper per route. It owns a local store that tracks
              viewport size and child metrics, and exposes CSS variables like
              <code> --valet-screen-width</code>. Surfaces must not be nested.
            </Typography>
            <Typography>
              <b>Styled engine</b>: <code>styled</code> and <code>keyframes</code> generate stable
              classnames with no external dependencies. Transient props (<code>$foo</code>) are
              filtered from the DOM.
            </Typography>
            <Typography>
              <b>Theme store</b>: a typed Zustand store with tokens for colors, spacing, radius,
              stroke, breakpoints, and fonts. Initialize once with <code>useInitialTheme</code>; read
              and update with <code>useTheme</code>.
            </Typography>
            <Typography>
              <b>Style presets</b>: register reusable styles via <code>definePreset()</code> and
              apply them with the <code>preset</code> prop to keep markup clean.
            </Typography>
            <Typography>
              <b>Forms</b>: use <code>createFormStore</code> to create typed, local form state when
              you need it.
            </Typography>
            <Typography>
              <b>AI helpers</b>: <code>KeyModal</code> to capture and encrypt provider keys;
              <code> LLMChat</code> and <code>RichChat</code> for conversation UIs that speak OpenAI
              and Anthropic formats.
            </Typography>
          </Stack>
        </Panel>

        <Typography variant='h3' bold>
          Your first minute with valet
        </Typography>
        <Typography>Install and render a first screen. See Quickstart for full steps.</Typography>
        <CodeBlock
          code={`npm install @archway/valet`}
          ariaLabel='Copy install command'
        />
        <CodeBlock
          code={`import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Surface, Stack, Typography, Button, useInitialTheme } from '@archway/valet';

function Home() {
  return (
    <Surface>
      <Stack gap={2} style={{ padding: '1rem' }}>
        <Typography variant="h2">Hello, valet</Typography>
        <Button variant="primary">Click me</Button>
      </Stack>
    </Surface>
  );
}

export function App() {
  useInitialTheme({ fonts: { body: 'Cabin', heading: 'Cabin', mono: 'Ubuntu Mono', button: 'Ubuntu' } });
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}`}
          ariaLabel='Copy minimal app snippet'
        />

        <Typography variant='h3' bold>
          Best practices at a glance
        </Typography>
        <Panel fullWidth pad={2}>
          <Typography>
            • Mount <code>BrowserRouter</code> in <code>main.tsx</code> and render <code>App</code>
            inside it<br />• Import global presets before the app renders<br />• Call
            <code> useInitialTheme</code> once in <code>App</code> to apply theme and preload fonts
            <br />• Wrap each route in a single <code>Surface</code> (do not nest)<br />• Split
            routes with <code>React.lazy</code> and <code>Suspense</code><br />• Use
            <code> Stack</code> and <code>Panel</code> for consistent, responsive layout<br />• Define
            shared styles with <code>definePreset()</code> and the <code>preset</code> prop<br />• Read
            and update tokens via <code>useTheme</code> (avoid hard-coded colors)<br />• Prefer valet
            components over raw HTML to maintain accessibility and theme cohesion
          </Typography>
        </Panel>

        <Typography variant='h3' bold>
          Where to go next
        </Typography>
        <Panel fullWidth>
          <Stack direction='row' gap={1} wrap style={{ alignItems: 'center' }}>
            <Button variant='outlined' onClick={() => navigate('/quickstart')}>
              <Icon icon='mdi:flash-outline' />&nbsp;Quickstart
            </Button>
            <Button variant='outlined' onClick={() => navigate('/hello-valet')}>
              <Icon icon='mdi:rocket-launch-outline' />&nbsp;Hello Valet
            </Button>
            <Button variant='outlined' onClick={() => navigate('/mental-model')}>
              <Icon icon='mdi:brain' />&nbsp;Mental model
            </Button>
            <Button variant='outlined' onClick={() => navigate('/components-primer')}>
              <Icon icon='mdi:book-open-variant' />&nbsp;Components primer
            </Button>
            <Button variant='outlined' onClick={() => navigate('/theme')}>
              <Icon icon='mdi:palette-outline' />&nbsp;Theme store
            </Button>
            <Button variant='outlined' onClick={() => navigate('/styled')}>
              <Icon icon='mdi:xml' />&nbsp;Styled engine
            </Button>
          </Stack>
        </Panel>

        <Typography variant='subtitle' color='var(--valet-text-color)'>
          Built for performance and accessibility. Designed for the next generation of AI‑assisted
          interfaces.
        </Typography>

        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}

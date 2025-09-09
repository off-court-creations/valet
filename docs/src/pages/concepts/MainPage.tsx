// ─────────────────────────────────────────────────────────────
// src/pages/MainPage.tsx  | valet-docs
// Next‑level docs homepage: hero, features, demos, playgrounds
// ─────────────────────────────────────────────────────────────

import { useMemo, useState, type ComponentProps } from 'react';
import {
  Surface,
  Stack,
  Grid,
  Panel,
  Typography,
  Button,
  Icon,
  Tabs,
  Table,
  CodeBlock,
  AppBar,
  SpeedDial,
  RichChat,
  KeyModal,
  styled,
  keyframes,
  useTheme,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../components/NavDrawer';

// Animated gradient overlay (GPU-friendly transform rotation)
const swirl = keyframes`
  0%   { transform: rotate(0deg); }
  50%  { transform: rotate(180deg); }
  100% { transform: rotate(360deg); }
`;

const Trippy = styled('div')<{ $dur: string; $ease: string; $opacity?: number }>`
  position: absolute;
  inset: -10%; /* bleed edges when rotating */
  z-index: 0;
  pointer-events: none;
  background: conic-gradient(from 0deg, #6ee7f9, #a78bfa, #f472b6, #fbbf24, #6ee7f9);
  filter: saturate(1.25) blur(40px);
  opacity: ${({ $opacity = 0.35 }) => String($opacity)};
  animation: ${swirl} ${({ $dur }) => $dur} ${({ $ease }) => $ease} infinite;
  will-change: transform;
  mix-blend-mode: overlay;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// Extra layers for a richer "lava lamp" effect
const floatA = keyframes`
  0%   { transform: translate3d(-30%, -10%, 0) scale(1) rotate(0deg); }
  25%  { transform: translate3d(10%, -25%, 0)  scale(1.15) rotate(40deg); }
  50%  { transform: translate3d(28%,  10%, 0)  scale(1.05) rotate(95deg); }
  75%  { transform: translate3d(-10%, 25%, 0)  scale(1.18) rotate(140deg); }
  100% { transform: translate3d(-30%, -10%, 0) scale(1) rotate(360deg); }
`;

const floatB = keyframes`
  0%   { transform: translate3d(25%, -5%, 0) scale(0.9) rotate(0deg); }
  20%  { transform: translate3d(10%, 20%, 0)  scale(1.05) rotate(60deg); }
  50%  { transform: translate3d(-20%, 15%, 0) scale(1.2) rotate(180deg); }
  80%  { transform: translate3d(-5%, -20%, 0) scale(1.05) rotate(300deg); }
  100% { transform: translate3d(25%, -5%, 0)  scale(0.9) rotate(360deg); }
`;

const floatC = keyframes`
  0%   { transform: translate3d(-10%, 15%, 0) scale(1.1) rotate(0deg); }
  33%  { transform: translate3d(20%,  5%, 0) scale(0.95) rotate(120deg); }
  66%  { transform: translate3d( 5%, -25%, 0) scale(1.25) rotate(240deg); }
  100% { transform: translate3d(-10%, 15%, 0) scale(1.1) rotate(360deg); }
`;

const Goo = styled('div')<{
  $blur?: number;
  $opacity?: number;
}>`
  position: absolute;
  inset: -8%;
  z-index: 0;
  pointer-events: none;
  filter: ${({ $blur = 40 }) => `blur(${$blur}px)`};
  opacity: ${({ $opacity = 0.45 }) => String($opacity)};
  mix-blend-mode: screen;
`;

const Blob = styled('div')<{
  $size: number;
  $color: string;
  $anim: string;
  $duration: string;
  $delay?: string;
}>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${({ $size }) => `${$size}px`};
  height: ${({ $size }) => `${$size}px`};
  margin: ${({ $size }) => `-${$size / 2}px 0 0 -${$size / 2}px`};
  border-radius: 50%;
  background: radial-gradient(
    closest-side at 50% 50%,
    ${({ $color }) => $color} 0%,
    transparent 70%
  );
  will-change: transform;
  animation: ${({ $anim }) => $anim} ${({ $duration }) => $duration}
    ${({ $delay = '0s' }) => $delay} cubic-bezier(0.22, 0.8, 0.2, 1) infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Halo = styled('div')<{ $opacity?: number; $dur?: string }>`
  position: absolute;
  inset: -12%;
  z-index: 0;
  pointer-events: none;
  background: conic-gradient(
    from 0deg,
    #ffffff00 0 20%,
    #ffffff22 35%,
    #ffffff00 60%,
    #ffffff22 80%,
    #ffffff00 100%
  );
  mask-image: radial-gradient(closest-side, transparent 60%, black 68%, black 72%, transparent 80%);
  opacity: ${({ $opacity = 0.2 }) => String($opacity)};
  animation: ${swirl} ${({ $dur = '160s' }) => $dur} linear infinite;
  will-change: transform;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

type MiniRow = { key: string; value: string };

export default function MainPage() {
  const navigate = useNavigate();
  const { theme, mode, toggleMode, setDensity, density } = useTheme();

  // ── Hero CTA targets
  const go = (p: string) => () => navigate(p);

  // ── Theme Playground: density toggle
  const nextDensity = () =>
    setDensity(
      density === 'comfortable' ? 'compact' : density === 'compact' ? 'tight' : 'comfortable',
    );

  // ── Table snapshot data (tiny, static)
  const cols = useMemo<TableColumn<MiniRow>[]>(
    () => [
      { header: 'Key', accessor: 'key' },
      { header: 'Value', accessor: 'value' },
    ],
    [],
  );
  const rows = useMemo<MiniRow[]>(
    () => [
      { key: 'Bundle', value: '~0 deps' },
      { key: 'Mode', value: mode },
      { key: 'Density', value: density },
      { key: 'Surface', value: 'CSS var metrics' },
    ],
    [mode, density],
  );

  // ── RichChat mini demo: fully local
  type R = Parameters<NonNullable<ComponentProps<typeof RichChat>['onSend']>>[0];
  const [chat, setChat] = useState<ComponentProps<typeof RichChat>['messages']>([
    {
      role: 'assistant',
      content: <Typography>Welcome to valet. Want a tour?</Typography>,
      animate: true,
    },
  ]);
  const onSend = (m: R) =>
    setChat((prev) => [
      ...prev,
      { ...m, animate: true },
      { role: 'assistant', content: <Typography>Try Quickstart next →</Typography>, animate: true },
    ]);

  // ── Key modal
  const [keyOpen, setKeyOpen] = useState(false);

  return (
    <Surface>
      <NavDrawer />

      {/* Global app bar */}
      <AppBar
        color='primary'
        left={
          <Stack
            direction='row'
            sx={{ alignItems: 'center', gap: theme.spacing(1) }}
          >
            <Icon icon='mdi:robot' />
            <Typography
              variant='h4'
              bold
            >
              valet
            </Typography>
          </Stack>
        }
        right={
          <Stack
            direction='row'
            sx={{ alignItems: 'center', gap: theme.spacing(1) }}
          >
            <Button
              size='sm'
              variant='outlined'
              onClick={go('/quickstart')}
            >
              Quickstart
            </Button>
            <Button
              size='sm'
              variant='outlined'
              onClick={go('/components-primer')}
            >
              Components
            </Button>
            <Button
              size='sm'
              variant='outlined'
              onClick={() => setKeyOpen(true)}
            >
              API Key
            </Button>
            <Button
              size='sm'
              onClick={toggleMode}
            >
              {mode === 'dark' ? 'Light' : 'Dark'}
            </Button>
          </Stack>
        }
      />

      {/* Hero (static, no parallax) */}
      <Panel
        fullWidth
        pad={2}
        background={`linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.0) 100%)`}
        sx={{ borderRadius: theme.radius(2), overflow: 'hidden' }}
      >
        <div style={{ position: 'relative', minHeight: '60vh' }}>
          {/* Gooey lava blobs */}
          <Goo aria-hidden>
            <Blob
              $size={720}
              $color='#7c3aed'
              $anim={floatA}
              $duration='95s'
              $delay='-10s'
            />
            <Blob
              $size={640}
              $color='#06b6d4'
              $anim={floatB}
              $duration='120s'
              $delay='-35s'
            />
            <Blob
              $size={560}
              $color='#f59e0b'
              $anim={floatC}
              $duration='105s'
              $delay='-20s'
            />
            <Blob
              $size={480}
              $color='#ec4899'
              $anim={floatA}
              $duration='130s'
              $delay='-55s'
            />
            <Blob
              $size={520}
              $color='#22c55e'
              $anim={floatB}
              $duration='140s'
              $delay='-80s'
            />
          </Goo>
          {/* Subtle rotating halo */}
          <Halo
            aria-hidden
            $opacity={0.18}
            $dur='180s'
          />
          {/* Background color swirl (very faint) */}
          <Trippy
            aria-hidden
            $dur='200s'
            $ease='linear'
            $opacity={0.12}
          />
          <Stack
            sx={{
              alignItems: 'center',
              gap: theme.spacing(1),
              minHeight: '60vh',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Typography
              variant='h1'
              bold
              sx={{ textAlign: 'center', color: '#fff' }}
            >
              The AI‑forward UI library
            </Typography>
            <Typography
              variant='subtitle'
              sx={{ textAlign: 'center', color: '#fff', opacity: 0.9 }}
            >
              Predictable primitives. Typed theme. Semantics for agents. Built for speed.
            </Typography>
            <Stack
              direction='row'
              sx={{ gap: theme.spacing(1), flexWrap: 'wrap', justifyContent: 'center' }}
            >
              <Button
                size='lg'
                onClick={go('/quickstart')}
              >
                <Icon icon='mdi:flash-outline' />
                &nbsp;Start in 60s
              </Button>
              <Button
                size='lg'
                variant='outlined'
                onClick={go('/components-primer')}
              >
                <Icon icon='mdi:view-grid-outline' />
                &nbsp;Explore components
              </Button>
              <Button
                size='lg'
                variant='outlined'
                onClick={go('/mcp')}
              >
                <Icon icon='mdi:database-search' />
                &nbsp;MCP & introspection
              </Button>
            </Stack>
          </Stack>
        </div>
      </Panel>

      <Panel
        fullWidth
        variant='alt'
        pad={2}
      >
        <Stack
          direction='row'
          sx={{ alignItems: 'center', gap: theme.spacing(2), flexWrap: 'wrap' }}
        >
          <Icon icon='mdi:speedometer' />
          <Typography
            variant='h3'
            bold
          >
            Fast. Opinionated. Accessible.
          </Typography>
          <div style={{ flex: 1 }} />
          <Button
            variant='outlined'
            size='sm'
            onClick={go('/overview')}
          >
            Why valet
          </Button>
        </Stack>
      </Panel>

      {/* Feature grid */}
      <Panel fullWidth>
        <Grid
          columns={3}
          adaptive
          gap={2}
        >
          {[
            {
              icon: 'mdi:speedometer',
              title: 'Performance first',
              body: 'Tiny runtime with zero heavy CSS deps. Scoped motion tokens and predictable paint.',
            },
            {
              icon: 'mdi:vector-arrange-above',
              title: 'Semantic interface layer',
              body: 'Metadata on components designed for LLM tooling—introspection, props, and usage.',
            },
            {
              icon: 'mdi:palette-swatch-variant',
              title: 'Live theming',
              body: 'Typed tokens for color, spacing, radius, stroke, breakpoints and fonts.',
            },
            {
              icon: 'mdi:state-machine',
              title: 'Context bridge',
              body: 'Zustand stores for theme, surfaces and forms keep state cohesive and simple.',
            },
            {
              icon: 'mdi:timeline-text-outline',
              title: 'Web Action Graph',
              body: 'Capture user actions for introspection and next‑step suggestions.',
            },
            {
              icon: 'mdi:human-capacity-decrease',
              title: 'Mandatory accessibility',
              body: 'Keyboard flows, focus styles and aria baked in from first principles.',
            },
          ].map((f, i) => (
            <Panel
              key={`f-${i}`}
              preset='glassHolder'
              pad={2}
            >
              <Stack>
                <Icon icon={f.icon as string} />
                <Typography
                  variant='h4'
                  bold
                >
                  {f.title}
                </Typography>
                <Typography variant='body'>{f.body}</Typography>
              </Stack>
            </Panel>
          ))}
        </Grid>
      </Panel>

      {/* Live demos */}
      <Panel fullWidth>
        <Typography
          variant='h3'
          bold
        >
          Live Demos
        </Typography>
        <Tabs>
          <Tabs.Tab label='Chat' />
          <Tabs.Panel>
            <Panel fullWidth>
              <RichChat
                messages={chat}
                onSend={onSend}
                constrainHeight
              />
            </Panel>
          </Tabs.Panel>

          <Tabs.Tab label='Table' />
          <Tabs.Panel>
            <Panel fullWidth>
              <Table
                data={rows}
                columns={cols}
                constrainHeight
              />
            </Panel>
          </Tabs.Panel>

          <Tabs.Tab label='SpeedDial' />
          <Tabs.Panel>
            <Panel fullWidth>
              <SpeedDial
                icon={<Icon icon='mdi:plus' />}
                actions={[
                  {
                    icon: <Icon icon='mdi:content-copy' />,
                    label: 'Copy',
                    onClick: () => alert('Copy'),
                  },
                  {
                    icon: <Icon icon='mdi:share-variant' />,
                    label: 'Share',
                    onClick: () => alert('Share'),
                  },
                  {
                    icon: <Icon icon='mdi:delete' />,
                    label: 'Delete',
                    onClick: () => alert('Delete'),
                  },
                ]}
              />
            </Panel>
          </Tabs.Panel>
        </Tabs>
      </Panel>

      {/* Theme & tokens playground */}
      <Panel fullWidth>
        <Typography
          variant='h3'
          bold
        >
          Theme playground
        </Typography>
        <Stack
          direction='row'
          sx={{ alignItems: 'center', gap: theme.spacing(1), flexWrap: 'wrap' }}
        >
          <Button
            variant='outlined'
            onClick={toggleMode}
          >
            Toggle {mode === 'dark' ? 'light' : 'dark'}
          </Button>
          <Button
            variant='outlined'
            onClick={nextDensity}
          >
            Density: {density}
          </Button>
          <Button onClick={() => setKeyOpen(true)}>Configure API key</Button>
        </Stack>
        <Stack sx={{ marginTop: theme.spacing(1) }}>
          <Typography variant='subtitle'>CSS variables exposed on this Surface</Typography>
          <CodeBlock
            code={`--valet-screen-width: var(${`--valet-screen-width`});
--valet-screen-height: var(${`--valet-screen-height`});
--valet-space: var(${`--valet-space`});
--valet-radius: var(${`--valet-radius`});
--valet-stroke: var(${`--valet-stroke`});`}
            ariaLabel='Surface CSS variables'
          />
        </Stack>
      </Panel>

      {/* Quickstart snippet */}
      <Panel fullWidth>
        <Typography
          variant='h3'
          bold
        >
          Your first minute with valet
        </Typography>
        <Typography variant='body'>Install, theme, and render your first Surface.</Typography>
        <CodeBlock
          code={`npm install @archway/valet

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Surface, Stack, Typography, Button, useInitialTheme } from '@archway/valet';

function Home() {
  return (
    <Surface>
      <Stack gap={2} sx={{ padding: '1rem' }}>
        <Typography variant="h2">Hello, valet</Typography>
        <Button variant="primary">Click me</Button>
      </Stack>
    </Surface>
  );
}

export function App() {
  useInitialTheme({ fonts: { body: 'Inter', heading: 'Kumbh Sans', mono: 'JetBrains Mono', button: 'Kumbh Sans' } });
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
        <Stack
          direction='row'
          sx={{ gap: theme.spacing(1), flexWrap: 'wrap' }}
        >
          <Button
            variant='outlined'
            onClick={go('/quickstart')}
          >
            Quickstart
          </Button>
          <Button
            variant='outlined'
            onClick={go('/components-primer')}
          >
            Components primer
          </Button>
          <Button
            variant='outlined'
            onClick={go('/theme')}
          >
            Theme store
          </Button>
        </Stack>
      </Panel>

      {/* MCP section */}
      <Panel
        fullWidth
        variant='alt'
      >
        <Typography
          variant='h3'
          bold
        >
          Model Context Protocol (MCP)
        </Typography>
        <Typography>
          valet ships with a first‑class MCP pipeline and server exposing structured metadata for
          components—props, css vars, best practices, and examples. Build data with{' '}
          <code>npm run mcp:build</code> and self‑check with{' '}
          <code>npm run mcp:server:selfcheck</code>.
        </Typography>
        <CodeBlock
          code={`# Generate fresh MCP data (mcp-data/)
npm run mcp:build

# Quick self‑check
npm run mcp:server:selfcheck

# Optional: run the local MCP server
npm run mcp:server:install
npm run mcp:server:build
npm run mcp:server:start`}
          ariaLabel='MCP commands'
        />
        <Stack
          direction='row'
          sx={{ gap: theme.spacing(1), flexWrap: 'wrap' }}
        >
          <Button
            onClick={go('/mcp')}
            variant='outlined'
          >
            Learn MCP
          </Button>
          <Button
            onClick={go('/glossary')}
            variant='outlined'
          >
            Glossary
          </Button>
        </Stack>
      </Panel>

      {/* Footer */}
      <Panel
        fullWidth
        variant='alt'
        pad={2}
      >
        <Stack
          direction='row'
          sx={{ alignItems: 'center', gap: theme.spacing(1), flexWrap: 'wrap' }}
        >
          <Typography variant='subtitle'>© {new Date().getFullYear()} valet</Typography>
          <div style={{ flex: 1 }} />
          <Typography variant='subtitle'>Built with zero‑fluff primitives</Typography>
        </Stack>
      </Panel>

      {/* Modals */}
      <KeyModal
        open={keyOpen}
        onClose={() => setKeyOpen(false)}
      />
    </Surface>
  );
}

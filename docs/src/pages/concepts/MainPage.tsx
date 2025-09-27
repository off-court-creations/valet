// ─────────────────────────────────────────────────────────────
// src/pages/MainPage.tsx  | valet-docs
// Next‑level docs homepage: hero, features, demos, playgrounds
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useMemo } from 'react';
import {
  Surface,
  Stack,
  Grid,
  Panel,
  Typography,
  Button,
  Icon,
  Tabs,
  CodeBlock,
  AppBar,
  useTheme,
  Table,
  DateSelector,
  Pagination,
  MetroSelect,
  Tooltip,
  IconButton,
  Divider,
  Box,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
// no table types needed in this page
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../components/NavDrawer';
import LavaLampBackgroundGL from '../../components/LavaLampBackgroundGL';

export default function MainPage() {
  const navigate = useNavigate();
  const { theme, mode, toggleMode, setDensity, density } = useTheme();
  const heroAnchorRef = useRef<HTMLDivElement | null>(null);

  // ── Hero CTA targets
  const go = (p: string) => () => navigate(p);

  // ── Theme Playground: density toggle
  const nextDensity = () =>
    setDensity(
      density === 'comfortable' ? 'compact' : density === 'compact' ? 'tight' : 'comfortable',
    );

  // ── Live demo state
  const [selectedDate, setSelectedDate] = useState('2025-01-01');
  const [demoPage, setDemoPage] = useState(1);
  const loremByPage = [
    'Greetings, programs!',
    'Stranger and stranger.',
    'On the other side of the screen, it all looks so easy.',
    'All that is visible must grow beyond itself, and extend into the realm of the invisible.',
    'Hooray for our side.',
    "Positive and negative, huh? You're a Bit, aren't you?",
    'Bring in the logic probe!',
    "He started small and he'll end small!",
    "I wonder how you'll take to working in a pocket calculator.",
    "That's the way it is for Programs, yes.",
  ];
  const [transport, setTransport] = useState('car');
  // Table demo data: author → program pairs
  type Pair = { author: string; program: string };
  const tableCols = useMemo<TableColumn<Pair>[]>(
    () => [
      { header: 'Author', accessor: 'author' },
      { header: 'Program', accessor: 'program' },
    ],
    [],
  );
  const tableRows = useMemo<Pair[]>(
    () => [
      { author: 'Alan Bradley', program: 'Tron' },
      { author: 'Dr. Lora Baines Bradley', program: 'Yori' },
      { author: 'Kevin Flynn', program: 'CLU' },
      { author: 'Dr. Walter Gibbs', program: 'Dumont' },
    ],
    [],
  );

  // no API key modal on main page

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
              fontFamily='Poppins'
              variant='h4'
            >
              valet
            </Typography>
          </Stack>
        }
        right={
          <Tooltip title='Toggle light / dark'>
            <IconButton
              size='sm'
              aria-label='Toggle theme mode'
              icon={mode === 'dark' ? 'mdi:weather-night' : 'mdi:weather-sunny'}
              onClick={toggleMode}
            />
          </Tooltip>
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
          {/* WebGL2 lava-lamp metaballs background */}
          <LavaLampBackgroundGL />

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
            <Panel
              preset='heroGlass'
              pad={2}
              alignX='center'
              sx={{ maxWidth: 'min(960px, 92vw)' }}
            >
              {/* ATTENTION AGENTS DO NOT CHANGE THE HERO COPY */}
              <Stack sx={{ alignItems: 'center', gap: theme.spacing(1) }}>
                <div
                  ref={heroAnchorRef}
                  style={{ display: 'inline-block' }}
                >
                  <Typography
                    variant='h1'
                    bold
                    sx={{ textAlign: 'center', color: '#fff' }}
                  >
                    One library. Everything UI.
                  </Typography>
                </div>
                <Typography
                  variant='h5'
                  sx={{ textAlign: 'center', color: '#fff', opacity: 0.95 }}
                >
                  Beautiful by default. Limitless when customized.
                </Typography>
                <Typography
                  variant='subtitle'
                  sx={{ textAlign: 'center', color: '#fff', opacity: 0.9 }}
                >
                  From AI to Zustand, <code>valet</code> is how it all connects.
                </Typography>
                <Stack
                  direction='row'
                  sx={{ gap: theme.spacing(1), flexWrap: 'wrap', justifyContent: 'center' }}
                >
                  <Button
                    size='lg'
                    variant='outlined'
                    onClick={go('/quickstart')}
                  >
                    <Icon icon='mdi:flash-outline' />
                    &nbsp;Start in 30s
                  </Button>
                  <Button
                    size='lg'
                    variant='outlined'
                    onClick={go('/component-status')}
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
                    &nbsp;valet MCP
                  </Button>
                </Stack>
              </Stack>
            </Panel>
          </Stack>
        </div>
      </Panel>

      {/* Feature grid */}
      <Panel
        fullWidth
        sx={{ backgroundColor: theme.colors['background'] }}
      >
        <Grid
          columns={3}
          adaptive
          gap={1}
        >
          {[
            {
              icon: 'mdi:rocket-launch',
              title: 'Performance First Principles',
              body: 'Micro-runtime components with predictable paint & motion. No CSS baggage.',
            },
            {
              icon: 'mdi:account-voice',
              title: 'Human & Agent Semantics',
              body: 'A semantic interface layer that labels and contextualizes components for your AI tools.',
            },
            {
              icon: 'mdi:auto-awesome',
              title: 'Live Theming + Typed Tokens',
              body: 'Tokens give you unified control over key design choices without the hassle.',
            },
            {
              icon: 'mdi:state-machine',
              title: 'Context bridge',
              body: 'Zustand stores for theme, surfaces and forms keep state cohesive and simple.',
            },
            {
              icon: 'mdi:chart-timeline-variant',
              title: 'Web Action Graph',
              body: 'An automatic map of what you can click and type, so agents know what they can do next.',
            },
            {
              icon: 'mdi:vpn-key',
              title: 'Accessibility, by construction',
              body: 'Keyboard flows for components, focus styles, and ARIA baked in.',
            },
          ].map((f, i) => (
            <Panel
              key={`f-${i}`}
              variant='alt'
              pad={2}
            >
              <Stack>
                <Icon
                  icon={f.icon as string}
                  color={theme.colors['text']}
                />
                <Typography
                  variant='h4'
                  bold
                  sx={{ color: theme.colors['text'] }}
                >
                  {f.title}
                </Typography>
                <Typography
                  variant='body'
                  sx={{ color: theme.colors['text'] }}
                >
                  {f.body}
                </Typography>
              </Stack>
            </Panel>
          ))}
        </Grid>
      </Panel>

      <Divider
        lineColor={theme.colors['primary']}
        thickness={2}
        pad={2}
      />

      {/* Experience: Live demos + Theme playground */}
      <Box fullWidth>
        <Grid
          columns={2}
          adaptive
          gap={2}
        >
          {/* Live demos sub-area */}
          <Box>
            <Typography
              variant='h3'
              bold
            >
              Component Demos
            </Typography>
            <Tabs>
              <Tabs.Tab label='Metro Select' />
              <Tabs.Panel>
                <Panel fullWidth>
                  <Stack>
                    <MetroSelect
                      value={transport}
                      onChange={(v) => setTransport(v as string)}
                      gap={4}
                    >
                      {[
                        { icon: 'mdi:car', label: 'Car', value: 'car' },
                        { icon: 'mdi:bike', label: 'Bike', value: 'bike' },
                        { icon: 'mdi:train', label: 'Train', value: 'train' },
                      ].map((o) => (
                        <MetroSelect.Option
                          key={o.value}
                          {...o}
                        />
                      ))}
                    </MetroSelect>
                    <Typography>Current: {transport}</Typography>
                    <Tooltip title='See docs'>
                      <IconButton
                        icon='mdi:book-open-variant'
                        aria-label='See docs'
                        onClick={go('/metroselect-demo')}
                        size='sm'
                      />
                    </Tooltip>
                  </Stack>
                </Panel>
              </Tabs.Panel>

              <Tabs.Tab label='Pagination' />
              <Tabs.Panel>
                <Panel fullWidth>
                  <Stack>
                    <Typography
                      variant='body'
                      sx={{ marginBottom: theme.spacing(1) }}
                    >
                      {loremByPage[Math.max(0, Math.min(loremByPage.length - 1, demoPage - 1))]}
                    </Typography>
                    <Pagination
                      count={loremByPage.length}
                      visibleWindow={5}
                      page={demoPage}
                      onChange={setDemoPage}
                    />
                    <Typography>Current page: {demoPage}</Typography>
                  </Stack>
                  <Tooltip title='See docs'>
                    <IconButton
                      icon='mdi:book-open-variant'
                      aria-label='See docs'
                      onClick={go('/pagination-demo')}
                      size='sm'
                      sx={{ marginLeft: theme.spacing(1) }}
                    />
                  </Tooltip>
                </Panel>
              </Tabs.Panel>

              <Tabs.Tab label='Table' />
              <Tabs.Panel>
                <Stack>
                  <Table
                    data={tableRows}
                    columns={tableCols}
                    constrainHeight
                  />
                  <Tooltip title='See docs'>
                    <IconButton
                      icon='mdi:book-open-variant'
                      aria-label='See docs'
                      onClick={go('/table-demo')}
                      size='sm'
                      sx={{ marginLeft: theme.spacing(2) }}
                    />
                  </Tooltip>
                </Stack>
              </Tabs.Panel>

              <Tabs.Tab label='Date Selector' />
              <Tabs.Panel>
                <Panel fullWidth>
                  <Stack>
                    <DateSelector
                      value={selectedDate}
                      onChange={setSelectedDate}
                    />
                    <Typography>Selected: {selectedDate}</Typography>
                    <Tooltip title='See docs'>
                      <IconButton
                        icon='mdi:book-open-variant'
                        aria-label='See docs'
                        onClick={go('/dateselector-demo')}
                        size='sm'
                      />
                    </Tooltip>
                  </Stack>
                </Panel>
              </Tabs.Panel>
            </Tabs>
          </Box>

          {/* Theme playground sub-area */}
          <Box fullWidth>
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
              {/* API key configuration removed on main page */}
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
          </Box>
        </Grid>
      </Box>

      <Divider
        lineColor={theme.colors['primary']}
        thickness={2}
        pad={2}
      />

      {/* Footer */}
      <Box fullWidth>
        <Stack direction='row'>
          <Typography variant='subtitle'>
            <code>{new Date().getFullYear()} Off Court Creations</code>
          </Typography>
          <div style={{ flex: 1 }} />
          <Typography variant='subtitle'>
            <code>valet</code>
          </Typography>
        </Stack>
      </Box>
    </Surface>
  );
}

// ─────────────────────────────────────────────────────────────
// src/pages/MainPage.tsx  | valet-docs
// Next‑level docs homepage: hero, features, demos, playgrounds
// ─────────────────────────────────────────────────────────────

import { useMemo, useState, useRef, type ComponentProps } from 'react';
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
import Starfield from '../../components/Starfield';

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

// Additional path variety for denser field
const floatD = keyframes`
  0%   { transform: translate3d( 15%, -20%, 0) scale(1.05) rotate(0deg); }
  25%  { transform: translate3d(-25%,  10%, 0) scale(1.18) rotate(70deg); }
  50%  { transform: translate3d( 20%,  20%, 0) scale(0.95) rotate(190deg); }
  75%  { transform: translate3d(-10%, -15%, 0) scale(1.12) rotate(280deg); }
  100% { transform: translate3d( 15%, -20%, 0) scale(1.05) rotate(360deg); }
`;

const hueShift = keyframes`
  0%   { filter: blur(var(--blob-blur)) hue-rotate(0deg); }
  100% { filter: blur(var(--blob-blur)) hue-rotate(360deg); }
`;

const Goo = styled('div')<{
  $blur?: number;
  $opacity?: number;
  $hueDur?: string;
}>`
  position: absolute;
  inset: -8%;
  z-index: 0;
  pointer-events: none;
  --blob-blur: ${({ $blur = 40 }) => `${$blur}px`};
  filter: blur(var(--blob-blur)) hue-rotate(0deg);
  opacity: ${({ $opacity = 0.45 }) => String($opacity)};
  mix-blend-mode: screen;
  animation: ${hueShift} ${({ $hueDur = '160s' }) => $hueDur} linear infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    filter: blur(var(--blob-blur));
  }
`;

const Blob = styled('div')<{
  $size: number;
  $color: string;
  $anim: string;
  $duration: string;
  $delay?: string;
  $cx?: number; // center X in % of container
  $cy?: number; // center Y in % of container
  $hue?: number; // base hue offset in degrees
}>`
  position: absolute;
  top: ${({ $cy = 50 }) => `${$cy}%`};
  left: ${({ $cx = 50 }) => `${$cx}%`};
  width: ${({ $size }) => `${$size}px`};
  height: ${({ $size }) => `${$size}px`};
  margin: ${({ $size }) => `-${$size / 2}px 0 0 -${$size / 2}px`};
  border-radius: 50%;
  background: radial-gradient(
    closest-side at 50% 50%,
    ${({ $color }) => $color} 0%,
    transparent 70%
  );
  filter: ${({ $hue = 0 }) => `hue-rotate(${$hue}deg)`};
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
    #ffffff00 0 18%,
    #ffffff3b 32%,
    #ffffff00 58%,
    #ffffff3b 78%,
    #ffffff00 100%
  );
  mask-image: radial-gradient(closest-side, transparent 58%, black 67%, black 76%, transparent 85%);
  opacity: ${({ $opacity = 0.3 }) => String($opacity)};
  animation: ${swirl} ${({ $dur = '160s' }) => $dur} linear infinite;
  mix-blend-mode: screen;
  filter: saturate(1.08) brightness(1.05);
  will-change: transform;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

type MiniRow = { key: string; value: string };

export default function MainPage() {
  const navigate = useNavigate();
  const { theme, mode, toggleMode, setDensity, density } = useTheme();
  const heroAnchorRef = useRef<HTMLDivElement | null>(null);

  // Speed multiplier for hero animations (lower = faster)
  const speed = 0.25; // snappier blobs (~4x base durations)

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
          {/* Hyperspace starfield (beneath blobs) */}
          <Starfield
            density={140}
            speed={126}
            streak={0.85}
            opacity={0.40}
            centerZero={0.05}
            centerFull={0.55}
            midOpacity={0.55}
            outerOpacity={0.35}
            anchorRef={heroAnchorRef}
            startDelayMs={50}
            fadeMs={8000}
            preSimBoost={32}
            minRevealSpreadRatio={1.2}
            revealRadiusFrac={0.42}
            hiddenSpawnMinRadiusFrac={0.45}
          />
          {/* Gooey lava blobs */}
          <Goo
            aria-hidden
            $hueDur={`${160 * speed}s`}
          >
            <Blob
              $size={720}
              $color='#7c3aed' /* purple */
              $anim={floatA}
              $duration={`${95 * speed}s`}
              $delay={`${-10 * speed}s`}
              $cx={28}
              $cy={38}
              $hue={-12}
            />
            <Blob
              $size={640}
              $color='#8b5cf6' /* purple */
              $anim={floatB}
              $duration={`${120 * speed}s`}
              $delay={`${-35 * speed}s`}
              $cx={72}
              $cy={30}
              $hue={8}
            />
            <Blob
              $size={560}
              $color='#6d28d9' /* purple */
              $anim={floatC}
              $duration={`${105 * speed}s`}
              $delay={`${-20 * speed}s`}
              $cx={58}
              $cy={72}
              $hue={18}
            />
            <Blob
              $size={480}
              $color='#a78bfa' /* purple */
              $anim={floatA}
              $duration={`${130 * speed}s`}
              $delay={`${-55 * speed}s`}
              $cx={34}
              $cy={65}
              $hue={-24}
            />
            <Blob
              $size={520}
              $color='#5b21b6' /* purple */
              $anim={floatB}
              $duration={`${140 * speed}s`}
              $delay={`${-80 * speed}s`}
              $cx={78}
              $cy={60}
              $hue={30}
            />

            {/* Additional blobs for fuller coverage and overlap */}
            <Blob
              $size={2000}
              $color='#7c3aed'
              $anim={floatD}
              $duration={`${150 * speed}s`}
              $delay={`${-25 * speed}s`}
              $cx={15}
              $cy={22}
              $hue={-16}
            />
            <Blob
              $size={880}
              $color='#6d28d9'
              $anim={floatB}
              $duration={`${135 * speed}s`}
              $delay={`${-70 * speed}s`}
              $cx={85}
              $cy={78}
              $hue={20}
            />
            <Blob
              $size={680}
              $color='#8b5cf6'
              $anim={floatC}
              $duration={`${125 * speed}s`}
              $delay={`${-95 * speed}s`}
              $cx={12}
              $cy={68}
              $hue={-6}
            />
            <Blob
              $size={600}
              $color='#5b21b6'
              $anim={floatA}
              $duration={`${110 * speed}s`}
              $delay={`${-15 * speed}s`}
              $cx={88}
              $cy={24}
              $hue={12}
            />
            <Blob
              $size={540}
              $color='#7c3aed'
              $anim={floatD}
              $duration={`${118 * speed}s`}
              $delay={`${-45 * speed}s`}
              $cx={50}
              $cy={86}
              $hue={-10}
            />
            <Blob
              $size={420}
              $color='#6d28d9'
              $anim={floatB}
              $duration={`${100 * speed}s`}
              $delay={`${-30 * speed}s`}
              $cx={10}
              $cy={42}
              $hue={26}
            />
            <Blob
              $size={380}
              $color='#8b5cf6'
              $anim={floatC}
              $duration={`${90 * speed}s`}
              $delay={`${-62 * speed}s`}
              $cx={90}
              $cy={46}
              $hue={-22}
            />
            <Blob
              $size={340}
              $color='#a78bfa'
              $anim={floatA}
              $duration={`${85 * speed}s`}
              $delay={`${-12 * speed}s`}
              $cx={42}
              $cy={12}
              $hue={14}
            />
            <Blob
              $size={320}
              $color='#5b21b6'
              $anim={floatD}
              $duration={`${82 * speed}s`}
              $delay={`${-28 * speed}s`}
              $cx={63}
              $cy={18}
              $hue={-8}
            />
            <Blob
              $size={240}
              $color='#7c3aed'
              $anim={floatB}
              $duration={`${78 * speed}s`}
              $delay={`${-40 * speed}s`}
              $cx={38}
              $cy={82}
              $hue={6}
            />

            {/* Extra 50% more blobs (8 new) for denser field */}
            <Blob
              $size={760}
              $color='#6d28d9'
              $anim={floatA}
              $duration={`${128 * speed}s`}
              $delay={`${-22 * speed}s`}
              $cx={6}
              $cy={30}
              $hue={-18}
            />
            <Blob
              $size={700}
              $color='#8b5cf6'
              $anim={floatD}
              $duration={`${112 * speed}s`}
              $delay={`${-38 * speed}s`}
              $cx={94}
              $cy={70}
              $hue={22}
            />
            <Blob
              $size={520}
              $color='#7c3aed'
              $anim={floatB}
              $duration={`${108 * speed}s`}
              $delay={`${-18 * speed}s`}
              $cx={25}
              $cy={88}
              $hue={-14}
            />
            <Blob
              $size={480}
              $color='#a78bfa'
              $anim={floatC}
              $duration={`${96 * speed}s`}
              $delay={`${-52 * speed}s`}
              $cx={74}
              $cy={12}
              $hue={16}
            />
            <Blob
              $size={420}
              $color='#5b21b6'
              $anim={floatA}
              $duration={`${88 * speed}s`}
              $delay={`${-8 * speed}s`}
              $cx={55}
              $cy={6}
              $hue={-20}
            />
            <Blob
              $size={360}
              $color='#6d28d9'
              $anim={floatD}
              $duration={`${84 * speed}s`}
              $delay={`${-68 * speed}s`}
              $cx={5}
              $cy={90}
              $hue={24}
            />
            <Blob
              $size={300}
              $color='#8b5cf6'
              $anim={floatB}
              $duration={`${80 * speed}s`}
              $delay={`${-48 * speed}s`}
              $cx={96}
              $cy={40}
              $hue={-26}
            />
            <Blob
              $size={260}
              $color='#7c3aed'
              $anim={floatC}
              $duration={`${76 * speed}s`}
              $delay={`${-32 * speed}s`}
              $cx={48}
              $cy={50}
              $hue={28}
            />

            {/* +30% blobs: add 7 more for denser coverage with varied sizes */}
            <Blob
              $size={1600}
              $color='#6d28d9'
              $anim={floatA}
              $duration={`${140 * speed}s`}
              $delay={`${-58 * speed}s`}
              $cx={50}
              $cy={8}
              $hue={18}
            />
            <Blob
              $size={1400}
              $color='#5b21b6'
              $anim={floatB}
              $duration={`${132 * speed}s`}
              $delay={`${-12 * speed}s`}
              $cx={6}
              $cy={84}
              $hue={-20}
            />
            <Blob
              $size={960}
              $color='#8b5cf6'
              $anim={floatD}
              $duration={`${126 * speed}s`}
              $delay={`${-44 * speed}s`}
              $cx={94}
              $cy={56}
              $hue={22}
            />
            <Blob
              $size={720}
              $color='#7c3aed'
              $anim={floatC}
              $duration={`${116 * speed}s`}
              $delay={`${-26 * speed}s`}
              $cx={30}
              $cy={6}
              $hue={-10}
            />
            <Blob
              $size={520}
              $color='#a78bfa'
              $anim={floatA}
              $duration={`${92 * speed}s`}
              $delay={`${-72 * speed}s`}
              $cx={70}
              $cy={90}
              $hue={12}
            />
            <Blob
              $size={380}
              $color='#6d28d9'
              $anim={floatB}
              $duration={`${82 * speed}s`}
              $delay={`${-8 * speed}s`}
              $cx={20}
              $cy={50}
              $hue={-14}
            />
            <Blob
              $size={280}
              $color='#8b5cf6'
              $anim={floatD}
              $duration={`${74 * speed}s`}
              $delay={`${-52 * speed}s`}
              $cx={80}
              $cy={34}
              $hue={28}
            />
            {/* Additional pop for richer field (3 more blobs) */}
            <Blob
              $size={1100}
              $color='#7c3aed'
              $anim={floatB}
              $duration={`${120 * speed}s`}
              $delay={`${-66 * speed}s`}
              $cx={12}
              $cy={28}
              $hue={10}
            />
            <Blob
              $size={760}
              $color='#a78bfa'
              $anim={floatC}
              $duration={`${98 * speed}s`}
              $delay={`${-34 * speed}s`}
              $cx={76}
              $cy={12}
              $hue={-18}
            />
            <Blob
              $size={540}
              $color='#5b21b6'
              $anim={floatA}
              $duration={`${88 * speed}s`}
              $delay={`${-22 * speed}s`}
              $cx={54}
              $cy={88}
              $hue={22}
            />
          </Goo>
          {/* Subtle rotating halo */}
          <Halo
            aria-hidden
            $opacity={0.31}
            $dur={`${180 * speed}s`}
          />
          {/* Background color swirl (very faint) */}
          <Trippy
            aria-hidden
            $dur={`${200 * speed}s`}
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
              sx={{ textAlign: 'center', color: '#fff', opacity: 0.9 }}
            >
              Beautiful by default. Limitless when customized.
              {/* Predictable primitives. Typed theme. Semantics for agents. Built for speed. */}
            </Typography>
            <Typography
              variant='subtitle'
              sx={{ textAlign: 'center', color: '#fff', opacity: 0.9 }}
            >
              From AI to Zustand, <code>valet</code> is how it all connects.
              {/* Predictable primitives. Typed theme. Semantics for agents. Built for speed. */}
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
                &nbsp;valet MCP
              </Button>
            </Stack>
          </Stack>
        </div>
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

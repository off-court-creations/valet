// ─────────────────────────────────────────────────────────────
// src/pages/getting-started/Spacing.tsx  | valet-docs
// The two spacing axes: density (scale) and compact (zero + cascade)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Panel,
  Stack,
  Box,
  Grid,
  Typography,
  Divider,
  Button,
  useTheme,
  CodeBlock,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../components/NavDrawer';
import PageHero from '../../components/PageHero';
import type { DocMeta } from '../../types';

export const meta: DocMeta = {
  id: 'spacing',
  title: 'Spacing — Density & Compact',
  description:
    'valet has two orthogonal spacing axes: density scales spacing, and compact zeros it and cascades. Learn how each works and when to reach for which.',
  pageType: 'concept',
  prerequisites: ['theme-engine'],
  components: ['Surface', 'Panel', 'Stack', 'Box', 'Grid'],
  tldr: 'density = scale the spacing unit (tight 0.9× / standard 1× / comfortable 1.15×) on a Surface or any layout container; compact = hard-zero layout pad/gap that cascades to descendants, with compact={false} to opt a subtree back out. They are independent and combine.',
};

type Density = 'tight' | 'standard' | 'comfortable';

const DENSITY_SNIPPET = `// Global — scale the whole screen
<Surface density="comfortable"> … </Surface>

// Subtree — scale just one region
<Panel density="tight">
  <Stack> … </Stack>   {/* gap + pads re-rhythm to 0.9× */}
</Panel>

// tight = 0.9×   standard = 1×   comfortable = 1.15×
// Every theme.spacing(n) resolves to calc(var(--valet-space) * n),
// so one prop re-rhythms the whole subtree.`;

const COMPACT_SNIPPET = `// Zero the layout spacing of a region AND everything inside it
<Panel compact>
  <Stack>                    {/* gap → 0 */}
    <Box pad={2}>A</Box>     {/* pad → 0 (inherited) */}
    <Panel pad={1}>B</Panel> {/* pad → 0 (inherited) */}

    <Panel compact={false} pad={1}>
      {/* opted out — keeps its padding */}
    </Panel>
  </Stack>
</Panel>`;

export default function SpacingPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [density, setDensity] = useState<Density>('standard');
  const [compact, setCompact] = useState(false);

  /* A small, repeated content block used by both demos. */
  const demoItems = ['Alpha', 'Bravo', 'Charlie'];

  return (
    <Surface>
      <NavDrawer />
      <Stack sx={{ gap: theme.spacing(1) }}>
        <PageHero
          title='Spacing — Density &amp; Compact'
          subtitle='Two independent axes: density scales spacing, compact zeros it and cascades.'
        />

        {/* ── Mental model ─────────────────────────────────────── */}
        <Panel
          fullWidth
          pad={1}
        >
          <Typography>
            Every valet spacing value flows through <code>theme.spacing(n)</code>, which resolves to{' '}
            <code>calc(var(--valet-space) * n)</code>. That single variable is the knob behind both
            controls on this page — <b>density</b> changes its multiplier; <b>compact</b>{' '}
            short-circuits spacing to <code>0</code>. They are orthogonal: you can run a tight,
            comfortable, or standard subtree, and independently collapse any region to zero.
          </Typography>
          <Divider thickness={2} />
          <Grid
            columns={2}
            gap={1}
            adaptive
          >
            <Panel pad={1}>
              <Typography
                variant='h4'
                bold
              >
                density — <i>scale</i>
              </Typography>
              <Typography>
                A tier: <code>tight</code> · <code>standard</code> · <code>comfortable</code>. Keeps
                rhythm, just tighter or looser. Cascades via CSS (<code>--valet-space</code>).
              </Typography>
            </Panel>
            <Panel pad={1}>
              <Typography
                variant='h4'
                bold
              >
                compact — <i>zero</i>
              </Typography>
              <Typography>
                A boolean: hard-zeros container pad/gap. Cascades to descendants via React context;{' '}
                <code>compact={'{false}'}</code> opts a subtree back out.
              </Typography>
            </Panel>
          </Grid>
        </Panel>

        {/* ── Density ──────────────────────────────────────────── */}
        <Panel
          fullWidth
          pad={1}
        >
          <Typography
            variant='h3'
            bold
          >
            Density — scale the spacing unit
          </Typography>
          <Typography>
            <code>density</code> multiplies the spacing unit for a subtree: <code>tight</code> ={' '}
            0.9×, <code>standard</code> = 1×, <code>comfortable</code> = 1.15×. Set it on a{' '}
            <code>&lt;Surface&gt;</code> to re-rhythm a whole screen, or on any layout container (
            <code>Stack</code>, <code>Panel</code>, <code>Grid</code>, <code>Tabs</code>) to scale
            just that region. Because it rides <code>--valet-space</code>, every nested{' '}
            <code>gap</code>/<code>pad</code> follows automatically.
          </Typography>

          <Stack
            direction='row'
            gap={1}
            sx={{ flexWrap: 'wrap' }}
          >
            {(['tight', 'standard', 'comfortable'] as const).map((d) => (
              <Button
                key={d}
                variant={density === d ? 'filled' : 'outlined'}
                onClick={() => setDensity(d)}
              >
                {d}
              </Button>
            ))}
          </Stack>

          <Panel
            density={density}
            fullWidth
            pad={1}
            variant='outlined'
          >
            <Typography variant='subtitle'>
              This Panel is <code>density=&quot;{density}&quot;</code> — its pad, the Stack gap, and
              the nested Panels all scale together.
            </Typography>
            <Stack>
              {demoItems.map((t) => (
                <Panel
                  key={t}
                  pad={1}
                >
                  <Typography>{t}</Typography>
                </Panel>
              ))}
            </Stack>
          </Panel>

          <CodeBlock
            code={DENSITY_SNIPPET}
            ariaLabel='Density usage example'
          />
        </Panel>

        {/* ── Compact ──────────────────────────────────────────── */}
        <Panel
          fullWidth
          pad={1}
        >
          <Typography
            variant='h3'
            bold
          >
            Compact — zero the spacing, and cascade
          </Typography>
          <Typography>
            <code>compact</code> is a hard zero of <i>layout</i> spacing — container{' '}
            <code>pad</code>, <code>gap</code>, and spacing-margins all become <code>0</code> — and
            it <b>cascades</b> to every spacing-aware descendant. Reach for it when a region must
            sit flush (dense toolbars, embedded chrome, tight cards). A nested{' '}
            <code>compact={'{false}'}</code> opts that subtree back out.
          </Typography>

          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Button
              variant={compact ? 'filled' : 'outlined'}
              onClick={() => setCompact((c) => !c)}
            >
              compact: {compact ? 'on' : 'off'}
            </Button>
            <Typography variant='subtitle'>Toggle and watch the whole subtree collapse.</Typography>
          </Stack>

          <Panel
            compact={compact}
            fullWidth
            pad={1}
            variant='outlined'
          >
            <Typography variant='subtitle'>
              Outer Panel (<code>compact={`{${String(compact)}}`}</code>)
            </Typography>
            <Stack>
              {demoItems.map((t) => (
                <Panel
                  key={t}
                  pad={1}
                >
                  <Typography>{t} — inherits compact</Typography>
                </Panel>
              ))}
              <Panel
                compact={false}
                pad={1}
              >
                <Typography>
                  I set <code>compact={'{false}'}</code> — I keep my padding even when the ancestor
                  is compact.
                </Typography>
              </Panel>
            </Stack>
          </Panel>

          <CodeBlock
            code={COMPACT_SNIPPET}
            ariaLabel='Compact usage example'
          />

          <Typography variant='subtitle'>
            Compact zeros <i>spacing</i>, never structure. It preserves:
          </Typography>
          <Box
            as='ul'
            sx={{ marginBlock: 0, paddingInlineStart: theme.spacing(2) }}
          >
            <li>control-internal padding (Select trigger, Chip pill, field insets)</li>
            <li>alignment &amp; centering (alignX, centerContent, auto-margins)</li>
            <li>structural geometry (Tree indentation &amp; connector lines)</li>
            <li>border-radius, glyph/icon sizes, control heights</li>
            <li>safe-area insets, viewport gutters, and any spacing you set via sx</li>
          </Box>
        </Panel>

        {/* ── Combine + migration ──────────────────────────────── */}
        <Panel
          fullWidth
          pad={1}
        >
          <Typography
            variant='h3'
            bold
          >
            They combine
          </Typography>
          <Typography>
            The axes are independent, so they compose: a <code>comfortable</code> screen can still
            hold a <code>compact</code> toolbar, and a <code>tight</code> dashboard can give one
            card room with <code>compact={'{false}'}</code>. Density sets the rhythm; compact
            removes it where you need flush edges.
          </Typography>
          <Divider thickness={2} />
          <Typography variant='subtitle'>
            Migrating from an older valet? The density tier <code>&quot;compact&quot;</code> was
            renamed to <code>&quot;tight&quot;</code> (hard rename, no alias). Replace{' '}
            <code>density=&quot;compact&quot;</code> with <code>density=&quot;tight&quot;</code>;
            the boolean <code>compact</code> prop is unrelated and now means zero-and-cascade.
          </Typography>
        </Panel>

        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}

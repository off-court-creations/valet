// ─────────────────────────────────────────────────────────────
// src/pages/SpacingContract.tsx  | valet-docs
// Spacing & Density contract: gap, pad, compact, density scaling
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel, Box, Tabs, Grid } from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';

export default function SpacingContractPage() {
  return (
    <Surface>
      <NavDrawer />
      <Stack
        gap={2}
        pad={2}
      >
        <Typography
          variant='h2'
          bold
        >
          Spacing Contract
        </Typography>
        <Typography>
          Valet components share a consistent spacing model driven by <code>gap</code>,
          <code> pad</code>, and <code>compact</code>, all mapped through the theme’s density-aware{' '}
          <code>spacing()</code>. Numbers are treated as spacing units; strings pass through
          unchanged.
        </Typography>

        <Panel
          variant='alt'
          pad={2}
        >
          <Typography
            variant='h4'
            bold
          >
            Rules
          </Typography>
          <ul>
            <li>
              <b>Type</b>: <code>Space = number | string</code>.
            </li>
            <li>
              <b>Numbers</b> → <code>theme.spacing(n)</code> =
              <code> calc(var(--valet-space, 0.5rem) * n)</code>.
            </li>
            <li>
              <b>Strings</b> → used verbatim (e.g. <code>8px</code>, <code>1rem</code>,
              <code> var(--token)</code>).
            </li>
            <li>
              <b>compact</b>: forces zero spacing for pad/gap on supported components.
            </li>
            <li>
              <b>Defaults</b>: gap defaults to <code>1</code> (Stack, Grid, Tabs), pad defaults to
              <code> 1</code> (Stack, Grid, Tabs, Box, Panel, Accordion, Modal).
            </li>
          </ul>
        </Panel>

        <Panel
          variant='alt'
          pad={2}
        >
          <Typography
            variant='h4'
            bold
          >
            Density
          </Typography>
          <Typography>
            <code>&lt;Surface density=&quot;comfortable|compact|tight|zero&quot; /&gt;</code>{' '}
            controls
            <code> --valet-space</code>, which scales all numeric pad/gap values. This makes layouts
            and components shrink or grow rhythmically.
          </Typography>
        </Panel>

        <Typography
          variant='h4'
          bold
        >
          Examples
        </Typography>
        <Grid
          columns={2}
          gap={2}
        >
          <Box
            pad={2}
            background='var(--valet-bg)'
          >
            <Typography bold>Numbers scale with density</Typography>
            <Stack
              gap={2}
              pad={1}
            >
              <Box
                pad={1}
                background='var(--valet-bg)'
              >
                pad=1
              </Box>
              <Box
                pad={2}
                background='var(--valet-bg)'
              >
                pad=2
              </Box>
            </Stack>
          </Box>
          <Box
            pad='1rem'
            background='var(--valet-bg)'
          >
            <Typography bold>Strings pass through</Typography>
            <Typography>pad=&apos;1rem&apos; uses exact CSS value</Typography>
          </Box>
          <Box
            pad={2}
            background='var(--valet-bg)'
          >
            <Typography bold>Compact</Typography>
            <Tabs
              pad={1}
              gap={1}
              compact
            >
              <Tabs.Tab>One</Tabs.Tab>
              <Tabs.Tab>Two</Tabs.Tab>
              <Tabs.Panel>Panel content with zeroed pad/gap.</Tabs.Panel>
              <Tabs.Panel>Second panel</Tabs.Panel>
            </Tabs>
          </Box>
        </Grid>
      </Stack>
    </Surface>
  );
}

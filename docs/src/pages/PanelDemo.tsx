// ─────────────────────────────────────────────────────────────────────────────
// src/pages/PanelDemoPage.tsx
// A comprehensive live demo of every Panel capability in ZeroUI
// ─────────────────────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Panel,
  Typography,
  Button,
  Tabs,
  Table,
  useTheme,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import NavDrawer from '../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */

export default function PanelDemoPage() {
  const { theme, toggleMode } = useTheme(); // live theme switch

  interface Row {
    prop: ReactNode;
    type: ReactNode;
    default: ReactNode;
    description: ReactNode;
  }

  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const data: Row[] = [
    {
      prop: <code>variant</code>,
      type: <code>'main' | 'alt'</code>,
      default: <code>'main'</code>,
      description: 'Visual style selection',
    },
    {
      prop: <code>background</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Background colour override',
    },
    {
      prop: <code>fullWidth</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Expand to full width',
    },
    {
      prop: <code>compact</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Remove margin and padding',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface /* Surface already defaults to theme background */>
      <NavDrawer />
      <Stack
        preset="showcaseStack"
      >
        {/* Page header ----------------------------------------------------- */}
        <Typography variant="h2" bold>
          Panel Showcase
        </Typography>
        <Typography variant="subtitle">
          All props & tricks, neatly demonstrated
        </Typography>

        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Typography variant="h3">1. Default Panel (variant=&quot;main&quot;)</Typography>
            <Panel style={{ padding: theme.spacing(1) }}>
              <Typography>(no props) — inherits theme backgroundAlt &amp; text</Typography>
            </Panel>

        {/* 2. alt variant --------------------------------------------------- */}
        <Typography variant="h3">2. variant=&quot;alt&quot;</Typography>
        <Panel variant="alt" style={{ padding: theme.spacing(1) }}>
          <Typography>Transparent with outline by default</Typography>
        </Panel>

        {/* 3. background override ------------------------------------------ */}
        <Typography variant="h3">3. background&nbsp;prop</Typography>
        <Stack>
          <Panel
            background={theme.colors['primary']}
            style={{ padding: theme.spacing(1) }}
          >
            <Typography>{`background=${theme.colors['primary']}`}</Typography>
          </Panel>
        </Stack>

        {/* 4. fullWidth prop ----------------------------------------------- */}
        <Typography variant="h3">4. fullWidth&nbsp;prop</Typography>
        <Panel
          fullWidth
          style={{
            padding: theme.spacing(1),
            textAlign: 'center',
          }}
        >
          <Typography>Stretch me edge-to-edge with <code>fullWidth</code></Typography>
        </Panel>

        {/* 5. Inline style overrides --------------------------------------- */}
        <Typography variant="h3">5. Inline style</Typography>
        <Panel
          style={{
            padding      : theme.spacing(1),
            borderRadius : 12,
            border       : `2px dashed ${theme.colors['text']}`,
          }}
        >
          <Typography>Custom dashed border &amp; radius via <code>style</code></Typography>
        </Panel>

        {/* 6. Nested Panels & colour inheritance --------------------------- */}
        <Typography variant="h3">6. Nested Panels</Typography>
        <Panel background={theme.colors['primary']} style={{ padding: theme.spacing(1) }}>
          <Panel variant="alt" fullWidth style={{ padding: theme.spacing(1) }}>
            <Typography>
              Parent sets&nbsp;
              <code style={{ color: 'var(--zero-text-color)' }}>--zero-text-color</code>
              &nbsp;for child
            </Typography>
          </Panel>
        </Panel>

        {/* 7. Preset demos -------------------------------------------------- */}
        <Typography variant="h3">7. Presets</Typography>
        <Stack>
          <Panel preset="fancyHolder">
            <Typography>preset=&quot;fancyHolder&quot;</Typography>
          </Panel>

          <Panel preset="glassHolder">
            <Typography>preset=&quot;glassHolder&quot;</Typography>
          </Panel>

          <Panel preset="gradientHolder">
            <Typography>preset=&quot;gradientHolder&quot;</Typography>
          </Panel>

          <Panel preset={['glassHolder', 'fancyHolder']}>
            <Typography>
              Combination&nbsp;
              <code>preset={['glassHolder','fancyHolder']}</code>
            </Typography>
          </Panel>
        </Stack>

        {/* 9. Live theme validation ---------------------------------------- */}
        <Typography variant="h3">9. Theme coupling</Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Toggle light / dark mode
        </Button>

          </Tabs.Panel>

          <Tabs.Tab label="Reference" />
          <Tabs.Panel>
            <Typography variant="h3">Prop reference</Typography>
            <Table data={data} columns={columns} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Surface>
  );
}

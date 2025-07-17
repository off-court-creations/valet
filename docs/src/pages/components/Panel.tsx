// ─────────────────────────────────────────────────────────────────────────────
// src/pages/PanelDemoPage.tsx
// A comprehensive live demo of every Panel capability in ZeroUI
// ─────────────────────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,          // tidy vertical layout
  Panel,
  Typography,
  Button,
  useTheme,
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */

export default function PanelDemoPage() {
  const { theme, toggleMode } = useTheme();      // live theme switch
  const navigate = useNavigate();

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
      description: 'Visual style: filled or outlined',
    },
    {
      prop: <code>fullWidth</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Stretch to 100% width',
    },
    {
      prop: <code>background</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Explicit background override',
    },
    {
      prop: <code>centered</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Center contents using flexbox',
    },
    {
      prop: <code>compact</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Remove default margin and padding',
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
      <Stack>
        {/* Page header ----------------------------------------------------- */}
        <Typography variant="h2" bold>
          Panel
        </Typography>
        <Typography variant="subtitle">
          A basic, visible content container
        </Typography>

        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Stack>
              {/* 1. 
              Default Panel ------------------------------------------- */}
              <Typography variant="h3">Default Panel</Typography>
              <Panel style={{ padding: theme.spacing(1), marginBottom: theme.spacing(4) }}>
                <Typography>(no props) — inherits theme backgroundAlt &amp; text</Typography>
              </Panel>

              {/* 2. alt variant --------------------------------------------------- */}
              <Typography variant="h3"><code>variant</code>=&quot;alt&quot;</Typography>
              <Panel variant="alt" style={{ padding: theme.spacing(1), marginBottom: theme.spacing(4) }}>
                <Typography>Transparent with outline by default</Typography>
              </Panel>

              {/* 3. background override ------------------------------------------ */}
              <Typography variant="h3"><code>background</code> prop</Typography>
              <Stack>
                <Panel
                  background={theme.colors['primary']}
                  style={{ padding: theme.spacing(1), marginBottom: theme.spacing(4) }}
                >
                  <Typography>{`background=${theme.colors['primary']}`}</Typography>
                </Panel>
              </Stack>

              {/* 4. fullWidth prop ----------------------------------------------- */}
              <Typography variant="h3"><code>fullWidth</code> prop</Typography>
              <Panel
                fullWidth
                style={{ padding: theme.spacing(1), marginBottom: theme.spacing(4) }}
              >
                <Typography>Stretch me edge-to-edge with <code>fullWidth</code></Typography>
              </Panel>

              {/* 5. Inline style overrides --------------------------------------- */}
              <Typography variant="h3">Inline style</Typography>
              <Panel
                style={{
                  padding: theme.spacing(1),
                  borderRadius: 12,
                  border: `2px dashed ${theme.colors['text']}`,
                  marginBottom: theme.spacing(4)
                }}
              >
                <Typography>Custom dashed border &amp; radius via <code>style</code></Typography>
              </Panel>

              {/* 6. Nested Panels & colour inheritance --------------------------- */}
              <Typography variant="h3">Nested Panels</Typography>
              <Panel background={theme.colors['primary']} style={{ padding: theme.spacing(1), marginBottom: theme.spacing(4) }}>
                <Panel variant="alt" fullWidth style={{ padding: theme.spacing(1) }}>
                  <Typography>
                    Parent sets&nbsp;
                    <code style={{ color: 'var(--zero-text-color)' }}>--zero-text-color</code>
                    &nbsp;for child
                  </Typography>
                </Panel>
              </Panel>

              {/* 7. Preset demos -------------------------------------------------- */}
              <Typography variant="h3">Presets</Typography>
              <Stack style={{ marginBottom: theme.spacing(4) }}>
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
                    <code>preset={['glassHolder', 'fancyHolder']}</code>
                  </Typography>
                </Panel>
              </Stack>

              {/* 8. centered prop ----------------------------------------------- */}
              <Typography variant="h3"><code>centered</code> prop</Typography>
              <Panel centered fullWidth>
                <Typography>
                  Contents centered with <code>centered</code>
                </Typography>
              </Panel>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label="Reference" />
          <Tabs.Panel>
            <Table data={data} columns={columns} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Surface>
  );
}

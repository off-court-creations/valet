// ─────────────────────────────────────────────────────────────
// src/pages/BoxDemo.tsx | valet
// Showcase of Box component
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack, // for tidy vertical layout
  Box,
  Typography,
  Button,
  useTheme,
  definePreset,
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Style presets                                                              */
// Fancy card-like container
definePreset('fancyBox', (t) => `
    background   : ${t.colors['primary']};
    color        : ${t.colors['primaryText']};
    border-radius: 20px;
    box-shadow   : 0 6px 16px ${t.colors['text']}22;
    padding      : ${t.spacing(1)};
    margin       : ${t.spacing(1)};
  `);

// Frosted-glass effect (needs backdrop-filter support)
definePreset('glassBox', (t) => `
    background      : ${t.colors['background']}CC;
    backdrop-filter : blur(6px) saturate(180%);
    border          : 1px solid ${t.colors['text']}22;
    padding         : ${t.spacing(1)};
    border-radius   : 12px;
  `);

// Loud gradient banner
definePreset('gradientBox', () => `
    background: linear-gradient(135deg,#ff6b6b 0%,#f7b267 50%,#4bd0d2 100%);
    color     : #ffffff;
    padding   : 32px;
    border-radius: 8px;
    text-align: center;
  `);

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function BoxDemoPage() {
  const { theme, toggleMode } = useTheme();   // live theme switch
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
      prop: <code>background</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Background colour override',
    },
    {
      prop: <code>textColor</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Explicit text colour',
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
    <Surface>
      <Stack preset="showcaseStack">
        <Typography variant="h2" bold>
          Box Showcase
        </Typography>

        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Typography variant="h3">1. Default Box</Typography>
            <Box>
              <Typography>(no props) — inherits parent background, uses theme text colour</Typography>
            </Box>

            <Typography variant="h3">2. background&nbsp;prop</Typography>
            <Stack spacing={1}>
              <Box background={theme.colors['primary']}>
                <Typography variant="h4">{`background=${theme.colors['primary']}`}</Typography>
              </Box>
              <Box background={theme.colors['secondary']}>
                <Typography variant="h4">{`background=${theme.colors['secondary']}`}</Typography>
              </Box>
              <Box background={theme.colors['tertiary']}>
                <Typography variant="h4">{`background=${theme.colors['tertiary']}`}</Typography>
              </Box>
            </Stack>

            <Typography variant="h3">3. textColor&nbsp;override</Typography>
            <Box
              background="#333333"
              textColor={theme.colors['tertiary']}
              style={{ padding: theme.spacing(1) }}
            >
              <Typography>
                Greetings Programs!
                <br />
                {`textColor=${theme.colors['primary']}`}
              </Typography>
            </Box>

            <Typography variant="h3">4. Inline style</Typography>
            <Box
              background={theme.colors['tertiary']}
              style={{
                border: `2px dashed ${theme.colors['text']}`,
                padding: theme.spacing(1),
                borderRadius: 12,
              }}
            >
              <Typography>Dashed border, custom radius, padding via <code>style</code></Typography>
            </Box>

            <Typography variant="h3">5. Nested Boxes</Typography>
            <Box background={theme.colors['primary']} style={{ padding: theme.spacing(1) }}>
              <Box background={theme.colors['secondary']} style={{ padding: theme.spacing(1) }}>
                <Typography>
                  Child automatically receives&nbsp;
                  <code style={{ color: 'var(--zero-text-color)' }}>--zero-text-color</code>
                </Typography>
              </Box>
            </Box>

            <Typography variant="h3">6. Presets</Typography>
            <Stack spacing={1}>
              <Box preset="fancyBox">
                <Typography>preset="fancyBox"</Typography>
              </Box>

              <Box preset="glassBox">
                <Typography>preset="glassBox"</Typography>
              </Box>

              <Box preset="gradientBox">
                <Typography>preset="gradientBox"</Typography>
              </Box>

              <Box preset={['glassBox', 'fancyBox']}>
                <Typography>
                  Combination&nbsp;
                  <code>preset=['glassBox','fancyBox']</code>
                </Typography>
              </Box>
            </Stack>

            <Typography variant="h3">7. Theme coupling</Typography>
            <Button variant="outlined" onClick={toggleMode}>Toggle light / dark mode</Button>
          </Tabs.Panel>

          <Tabs.Tab label="Reference" />
          <Tabs.Panel>
            <Typography variant="h3">Prop reference</Typography>
            <Table data={data} columns={columns} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>

        <Button
          size="lg"
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}

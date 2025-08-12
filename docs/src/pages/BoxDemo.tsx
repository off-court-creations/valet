// ─────────────────────────────────────────────────────────────
// docs/src/pages/BoxDemo.tsx  | valet-docs
// Showcase of Box component
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack, // for tidy vertical layout
  Box,
  Typography,
  Button,
  useTheme,
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import NavDrawer from '../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function BoxDemoPage() {
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
      prop: <code>fullWidth</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Stretch to 100% width of the container',
    },
    {
      prop: <code>compact</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Reduce default internal padding',
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
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Box Showcase
        </Typography>

        <Typography variant='subtitle'>Baseline container for backgrounds and centring</Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography variant='h3'>1. Default Box</Typography>
            <Box>
              <Typography>
                (no props) — inherits parent background, uses theme text colour
              </Typography>
            </Box>

            <Typography variant='h3'>2. background&nbsp;prop</Typography>
            <Stack>
              <Box background={theme.colors['primary']}>
                <Typography variant='h4'>{`background=${theme.colors['primary']}`}</Typography>
              </Box>
              <Box background={theme.colors['secondary']}>
                <Typography variant='h4'>{`background=${theme.colors['secondary']}`}</Typography>
              </Box>
              <Box background={theme.colors['tertiary']}>
                <Typography variant='h4'>{`background=${theme.colors['tertiary']}`}</Typography>
              </Box>
            </Stack>

            <Typography variant='h3'>3. textColor&nbsp;override</Typography>
            <Box
              background='#333333'
              textColor={theme.colors['tertiary']}
            >
              <Typography>
                Greetings Programs!
                <br />
                {`textColor=${theme.colors['primary']}`}
              </Typography>
            </Box>

            <Typography variant='h3'>4. Inline style</Typography>
            <Box
              background={theme.colors['tertiary']}
              style={{
                border: `2px dashed ${theme.colors['text']}`,
                padding: theme.spacing(1),
                borderRadius: 12,
              }}
            >
              <Typography>
                Dashed border, custom radius, padding via <code>style</code>
              </Typography>
            </Box>

            <Typography variant='h3'>5. Width behaviour</Typography>
            <Stack>
              <Box style={{ border: `1px dashed ${theme.colors['text']}` }}>
                <Typography>Default width: shrinks to content (inline-block)</Typography>
              </Box>
              <Box
                fullWidth
                style={{ border: `1px dashed ${theme.colors['text']}` }}
              >
                <Typography>fullWidth: stretches to the width of the parent</Typography>
              </Box>
            </Stack>

            <Typography variant='h3'>6. Nested Boxes</Typography>
            <Box background={theme.colors['primary']}>
              <Box background={theme.colors['secondary']}>
                <Typography>
                  Child automatically receives&nbsp;
                  <code style={{ color: 'var(--zero-text-color)' }}>--zero-text-color</code>
                </Typography>
              </Box>
            </Box>

            <Typography variant='h3'>7. Presets</Typography>
            <Stack>
              <Box preset='fancyHolder'>
                <Typography>preset=&quot;fancyHolder&quot;</Typography>
              </Box>

              <Box preset='glassHolder'>
                <Typography>preset=&quot;glassHolder&quot;</Typography>
              </Box>

              <Box preset='gradientHolder'>
                <Typography>preset=&quot;gradientHolder&quot;</Typography>
              </Box>

              <Box preset={['glassHolder', 'fancyHolder']}>
                <Typography>
                  Combination&nbsp;
                  <code>preset=[&apos;glassHolder&apos;,&apos;fancyHolder&apos;]</code>
                </Typography>
              </Box>
            </Stack>

            <Typography variant='h3'>8. Theme coupling</Typography>
            <Button
              variant='outlined'
              onClick={toggleMode}
            >
              Toggle light / dark mode
            </Button>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Typography variant='h3'>Prop reference</Typography>
            <Table
              data={data}
              columns={columns}
              constrainHeight={false}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Surface>
  );
}

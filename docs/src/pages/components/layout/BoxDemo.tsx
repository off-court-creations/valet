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
  Panel,
  Select,
  Iterator,
  Switch,
  CodeBlock,
  Divider,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useState } from 'react';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import BoxMeta from '../../../../../src/components/layout/Box.meta.json';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function BoxDemoPage() {
  const { theme, toggleMode } = useTheme(); // live theme switch
  const [bgKey, setBgKey] = useState<'none' | 'primary' | 'secondary' | 'tertiary'>('none');
  const [pad, setPad] = useState<number>(1);
  const [centerContent, setCenterContent] = useState(false);
  const [fullWidth, setFullWidth] = useState(false);
  const [alignX, setAlignX] = useState<'left' | 'right' | 'center'>('left');
  const bgValue: string | undefined =
    bgKey === 'none'
      ? undefined
      : bgKey === 'primary'
        ? theme.colors['primary']
        : bgKey === 'secondary'
          ? theme.colors['secondary']
          : theme.colors['tertiary'];

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
      default: <code>—</code>,
      description:
        'Background colour override. When set to a theme tone (primary/secondary/tertiary), text colour is derived automatically.',
    },
    {
      prop: <code>textColor</code>,
      type: <code>string</code>,
      default: <code>—</code>,
      description: 'Explicit text colour',
    },
    {
      prop: <code>pad</code>,
      type: <code>number | string</code>,
      default: <code>1</code>,
      description:
        'Container padding. Numbers map via theme.spacing(n); strings pass through (e.g., "12px").',
    },
    {
      prop: <code>centerContent</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Center inner content using flexbox',
    },
    {
      prop: <code>fullWidth</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Stretch to 100% width of the parent container',
    },
    {
      prop: <code>alignX</code>,
      type: <code>&apos;left&apos; | &apos;right&apos; | &apos;center&apos;</code>,
      default: <code>&apos;left&apos;</code>,
      description: (
        <>
          When not <code>fullWidth</code>, horizontally places the box within its parent. Use{' '}
          <code>alignX=&apos;right&apos;</code> for right‑bound, or{' '}
          <code>alignX=&apos;center&apos;</code> to center it.
        </>
      ),
    },
    {
      prop: <code>compact</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Zero out internal padding (overrides pad).',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>—</code>,
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero
          title='Box'
          subtitle='Baseline container for backgrounds and centring'
        />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Typography variant='h3'>Default Box</Typography>
              <Box>
                <Typography>
                  (no props) — inherits parent background, uses theme text colour
                </Typography>
              </Box>

              {/* Visualize bounds of the default box */}
              <Box sx={{ border: `1px dashed ${theme.colors['text']}` }}>
                <Typography>
                  (no props) — inherits parent background, uses theme text colour
                </Typography>
              </Box>
              <Typography variant='subtitle'>
                Boundary visualization — dashed border added only for demonstration so you can see
                the default Box&apos;s intrinsic bounds.
              </Typography>

              <CodeBlock
                code={`<Box>
  <Typography>
    (no props) — inherits parent background, uses theme text colour
  </Typography>
</Box>`}
              />

              <Button
                variant='outlined'
                onClick={toggleMode}
              >
                Toggle light / dark mode
              </Button>

              <Divider />

              <Typography variant='h3'>background&nbsp;prop</Typography>
              <Stack>
                <Box background={theme.colors['secondary']}>
                  <Typography>{`background=${theme.colors['secondary']}`}</Typography>
                </Box>
                <Box background={theme.colors['tertiary']}>
                  <Typography>{`background=${theme.colors['tertiary']}`}</Typography>
                </Box>
              </Stack>

              <Divider />

              <Typography variant='h3'>textColor&nbsp;override</Typography>
              <Box textColor={theme.colors['primaryText']}>
                <Typography>
                  Greetings Programs!
                  <br />
                  {`textColor=${theme.colors['primaryText']}`}
                </Typography>
              </Box>

              <Divider />

              <Typography variant='h3'>Inline sx</Typography>
              <CodeBlock
                code={`<Box
  background={theme.colors['tertiary']}
  sx={{
    border: \`2px dashed \${theme.colors['text']}\`,
    padding: theme.spacing(1),
    borderRadius: 12,
  }}
>
  <Typography>
    Dashed border, custom radius, padding via <code>sx</code>
  </Typography>
</Box>`}
              />
              <Box
                background={theme.colors['tertiary']}
                sx={{
                  border: `2px dashed ${theme.colors['text']}`,
                  padding: theme.spacing(1),
                  borderRadius: 12,
                }}
              >
                <Typography>
                  Dashed border, custom radius, padding via <code>sx</code>
                </Typography>
              </Box>

              <Divider />

              <Typography variant='h3'>Width behaviour</Typography>
              <Stack>
                <Box sx={{ border: `1px dashed ${theme.colors['text']}` }}>
                  <Typography>Default: content width anchored left</Typography>
                </Box>
                <Box
                  fullWidth
                  sx={{ border: `1px dashed ${theme.colors['text']}` }}
                >
                  <Typography>
                    <b>fullWidth</b>: stretches to the width of the parent
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              <Typography variant='h3'>Right‑bound content</Typography>
              <Box
                alignX='right'
                sx={{ border: `1px dashed ${theme.colors['text']}` }}
              >
                <Typography>
                  Anchored to the right with intrinsic width (alignX=&apos;right&apos;)
                </Typography>
              </Box>

              <Divider />

              <Typography variant='h3'>Centered placement</Typography>
              <Box
                alignX='center'
                sx={{ border: `1px dashed ${theme.colors['text']}` }}
              >
                <Typography>
                  Horizontally centered with intrinsic width (alignX=&apos;center&apos;)
                </Typography>
              </Box>

              <Divider />

              <Typography variant='h3'>Nested Boxes</Typography>
              <Box background={theme.colors['primary']}>
                <Box background={theme.colors['tertiary']}>
                  <Typography>
                    Child automatically receives&nbsp;
                    <code style={{ color: 'var(--valet-text-color)' }}>--valet-text-color</code>
                  </Typography>
                </Box>
              </Box>

              <Divider />

              <Typography variant='h3'>Presets</Typography>
              <Panel variant='alt'>
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
              </Panel>

              <Divider />

              <Typography variant='h3'>Pass-through HTML props</Typography>
              <Typography>
                Box forwards standard <code>div</code> attributes and events to the DOM element.
                Example:
              </Typography>
              <CodeBlock
                code={`<Box
  id="hero"
  role="region"
  aria-label="Hero banner"
  onClick={() => console.log('clicked')}
  sx={{ border: '1px solid currentColor' }}
>
  Content
</Box>`}
              />
              <Box
                id='hero'
                role='region'
                aria-label='Hero banner'
                onClick={() => console.log('clicked')}
                sx={{
                  border: `1px solid ${theme.colors['text']}`,
                  padding: theme.spacing(1),
                  cursor: 'pointer',
                }}
              >
                <Typography>content</Typography>
              </Box>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Playground' />
          <Tabs.Panel>
            <Stack gap={1}>
              <Stack
                direction='row'
                wrap={false}
                gap={1}
              >
                <Stack gap={0.25}>
                  <Typography variant='subtitle'>Background</Typography>
                  <Select
                    placeholder='background'
                    value={bgKey}
                    onChange={(v) => setBgKey(v as 'none' | 'primary' | 'secondary' | 'tertiary')}
                    sx={{ width: 200 }}
                  >
                    <Select.Option value='none'>no background</Select.Option>
                    <Select.Option value='primary'>primary</Select.Option>
                    <Select.Option value='secondary'>secondary</Select.Option>
                    <Select.Option value='tertiary'>tertiary</Select.Option>
                  </Select>
                </Stack>
                <Stack gap={0.25}>
                  <Typography variant='subtitle'>Padding (units)</Typography>
                  <Iterator
                    width={180}
                    min={0}
                    max={8}
                    step={0.5}
                    value={pad}
                    onChange={(n) => setPad(n)}
                    aria-label='Padding units'
                  />
                </Stack>
                <Stack
                  direction='row'
                  wrap={false}
                  gap={1}
                  sx={{ alignItems: 'center' }}
                >
                  <Typography variant='subtitle'>center content</Typography>
                  <Switch
                    checked={centerContent}
                    onChange={setCenterContent}
                    aria-label='Toggle centerContent'
                  />
                </Stack>
                <Stack
                  direction='row'
                  wrap={false}
                  gap={1}
                  sx={{ alignItems: 'center' }}
                >
                  <Typography variant='subtitle'>fullWidth</Typography>
                  <Switch
                    checked={fullWidth}
                    onChange={setFullWidth}
                    aria-label='Toggle fullWidth'
                  />
                </Stack>
                <Stack gap={0.25}>
                  <Typography variant='subtitle'>alignX</Typography>
                  <Select
                    placeholder='alignX'
                    value={alignX}
                    onChange={(v) => setAlignX(v as 'left' | 'right' | 'center')}
                    sx={{ width: 160 }}
                    disabled={fullWidth}
                  >
                    <Select.Option value='left'>left</Select.Option>
                    <Select.Option value='center'>center</Select.Option>
                    <Select.Option value='right'>right</Select.Option>
                  </Select>
                </Stack>
              </Stack>
              <Box
                background={bgValue}
                pad={pad}
                centerContent={centerContent}
                fullWidth={fullWidth}
                alignX={alignX}
                sx={{
                  background: bgValue,
                  border: `1px dashed ${theme.colors['text']}`,
                }}
              >
                <Typography>Preview content — try toggling the controls above.</Typography>
              </Box>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Table
              data={data}
              columns={columns}
              constrainHeight={false}
            />
          </Tabs.Panel>
        </Tabs>

        <CuratedExamples examples={getExamples(BoxMeta)} />
        <BestPractices items={getBestPractices(BoxMeta)} />
      </Stack>
    </Surface>
  );
}

// docs/src/pages/TypographyDemoPage.tsx
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import { Surface, Stack, Typography, Panel, Button, Table, useTheme, Tabs } from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';

export default function TypographyDemoPage() {
  const { theme, toggleMode } = useTheme();
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
      type: (
        <code>
          &#39;h1&#39; | &#39;h2&#39; | &#39;h3&#39; | &#39;h4&#39; | &#39;h5&#39; | &#39;h6&#39; |
          &#39;body&#39; | &#39;subtitle&#39; | &#39;button&#39;
        </code>
      ),
      default: <code>&#39;body&#39;</code>,
      description: 'Typography style preset',
    },
    {
      prop: <code>bold</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Use font-weight\u00A0700',
    },
    {
      prop: <code>italic</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Use italic font style',
    },
    {
      prop: <code>centered</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Center-align text and element within flex/grid parents',
    },
    {
      prop: <code>family</code>,
      type: <code>&#39;heading&#39; | &#39;body&#39; | &#39;mono&#39; | &#39;button&#39;</code>,
      default: <code>&#39;-&#39;</code>,
      description: 'Select a theme font family',
    },
    {
      prop: <code>fontFamily</code>,
      type: <code>string</code>,
      default: <code>&#39;-&#39;</code>,
      description: 'Override theme font family',
    },
    {
      prop: <code>fontSize</code>,
      type: <code>string</code>,
      default: <code>&#39;-&#39;</code>,
      description: 'Explicit CSS font-size',
    },
    {
      prop: <code>scale</code>,
      type: <code>number</code>,
      default: <code>&#39;-&#39;</code>,
      description: 'Multiply the final size (autoSize aware)',
    },
    {
      prop: <code>autoSize</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Resize to the current breakpoint',
    },
    {
      prop: <code>color</code>,
      type: <code>string</code>,
      default: <code>&#39;-&#39;</code>,
      description: 'Override text colour',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>&#39;-&#39;</code>,
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant='h2'>Typography</Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography variant='h3'>Variants</Typography>
            <Panel compact>
              <Typography variant='h1'>variant=&quot;h1&quot;</Typography>
              <Typography variant='h2'>variant=&quot;h2&quot;</Typography>
              <Typography variant='h3'>variant=&quot;h3&quot;</Typography>
              <Typography variant='h4'>variant=&quot;h4&quot;</Typography>
              <Typography variant='h5'>variant=&quot;h5&quot;</Typography>
              <Typography variant='h6'>variant=&quot;h6&quot;</Typography>
              <Typography variant='subtitle'>variant=&quot;subtitle&quot;</Typography>
              <Typography variant='body'>variant=&quot;body&quot;</Typography>
              <Typography variant='button'>variant=&quot;button&quot;</Typography>
            </Panel>

            <Typography variant='h3'>Styling props</Typography>
            <Panel
              fullWidth
              compact
            >
              <Typography variant='body'>(regular body text)</Typography>
              <Typography
                variant='body'
                bold
              >
                bold
              </Typography>
              <Typography
                variant='body'
                italic
              >
                italic
              </Typography>
              <Typography
                variant='body'
                bold
                italic
              >
                bold italic
              </Typography>
              <Typography
                variant='body'
                centered
              >
                centered text
              </Typography>
            </Panel>

            {/* 3. Font & size overrides ---------------------------------------- */}
            <Typography variant='h3'>Font &amp; size overrides</Typography>
            <Panel compact>
              <Typography fontFamily='Poppins'>fontFamily=&quot;Poppins&quot;</Typography>
              <Typography fontFamily='Brandon'>fontFamily=&quot;Brandon&quot;</Typography>
              <Typography family='mono'>family=&quot;mono&quot;</Typography>
              <Typography family='heading'>family=&quot;heading&quot;</Typography>
              <Typography family='button'>family=&quot;button&quot;</Typography>
              <Typography fontSize='1.5rem'>fontSize=&quot;1.5rem&quot;</Typography>
              <Typography scale={1.25}>scale=1.25</Typography>
              <Typography
                autoSize
                scale={1.25}
              >
                autoSize + scale (resize viewport)
              </Typography>
              <Typography
                variant='body'
                autoSize
              >
                autoSize
              </Typography>
            </Panel>

            <Typography variant='h3'>Colour override &amp; adaptation</Typography>
            <Panel compact>
              <Typography color='#e91e63'>color=&quot;#e91e63&quot;</Typography>
              <Panel background={theme.colors['primary']}>
                <Typography variant='h6'>Inside Panel inherits text colour</Typography>
              </Panel>
              <Button>
                <Typography
                  variant='button'
                  bold
                >
                  Typography inside Button
                </Typography>
              </Button>
            </Panel>

            <Typography variant='h3'>Theme coupling</Typography>
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

        {/* Back nav --------------------------------------------------------- */}
        <Button
          size='lg'
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}

// src/pages/TypographyDemoPage.tsx
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';
import {
  Surface,
  Stack,
  Typography,
  Panel,
  Button,
  Table,
  useTheme,
  Tabs
} from '@archway/valet';
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
      type: <code>'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'subtitle' | 'button'</code>,
      default: <code>'body'</code>,
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
      description:
        'Center-align text and element within flex/grid parents',
    },
    {
      prop: <code>family</code>,
      type: <code>'heading' | 'body' | 'mono' | 'button'</code>,
      default: <code>'-'</code>,
      description: 'Select a theme font family',
    },
    {
      prop: <code>fontFamily</code>,
      type: <code>string</code>,
      default: '-',
      description: 'Override theme font family',
    },
    {
      prop: <code>fontSize</code>,
      type: <code>string</code>,
      default: '-',
      description: 'Explicit CSS font-size',
    },
    {
      prop: <code>scale</code>,
      type: <code>number</code>,
      default: '-',
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
      default: '-',
      description: 'Override text colour',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: '-',
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2">
          Typography
        </Typography>

        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Typography variant="h3">Variants</Typography>
            <Panel compact>
              <Typography variant="h1">variant="h1"</Typography>
              <Typography variant="h2">variant="h2"</Typography>
              <Typography variant="h3">variant="h3"</Typography>
              <Typography variant="h4">variant="h4"</Typography>
              <Typography variant="h5">variant="h5"</Typography>
              <Typography variant="h6">variant="h6"</Typography>
              <Typography variant="subtitle">variant="subtitle"</Typography>
              <Typography variant="body">variant="body"</Typography>
              <Typography variant="button">variant="button"</Typography>
            </Panel>

            <Typography variant="h3">Styling props</Typography>
            <Panel fullWidth compact>
              <Typography variant="body">
                (regular body text)
              </Typography>
              <Typography variant="body" bold>
                bold
              </Typography>
              <Typography variant="body" italic>
                italic
              </Typography>
              <Typography variant="body" bold italic>
                bold italic
              </Typography>
              <Typography variant="body" centered>
                centered text
              </Typography>
            </Panel>

            {/* 3. Font & size overrides ---------------------------------------- */}
            <Typography variant="h3">Font &amp; size overrides</Typography>
            <Panel compact>
              <Typography fontFamily="Poppins">fontFamily="Poppins"</Typography>
              <Typography family="mono">family="mono"</Typography>
              <Typography family="heading">family="heading"</Typography>
              <Typography family="button">family="button"</Typography>
              <Typography fontSize="1.5rem">fontSize="1.5rem"</Typography>
              <Typography scale={1.25}>scale=1.25</Typography>
              <Typography autoSize scale={1.25}>
                autoSize + scale (resize viewport)
              </Typography>
              <Typography variant="body" autoSize>
                autoSize
              </Typography>
            </Panel>

            <Typography variant="h3">Colour override &amp; adaptation</Typography>
            <Panel compact>
              <Typography color="#e91e63">color="#e91e63"</Typography>
              <Panel background={theme.colors['primary']}>
                <Typography variant="h6">Inside Panel inherits text colour</Typography>
              </Panel>
              <Button>
                <Typography variant="button" bold>
                  Typography inside Button
                </Typography>
              </Button>
            </Panel>

            <Typography variant="h3">Theme coupling</Typography>
            <Button variant="outlined" onClick={toggleMode}>
              Toggle light / dark mode
            </Button>
          </Tabs.Panel>

          <Tabs.Tab label="Reference" />
          <Tabs.Panel>
            <Typography variant="h3">Prop reference</Typography>
            <Table data={data} columns={columns} constrainHeight={false}/>
          </Tabs.Panel>
        </Tabs>

        {/* Back nav --------------------------------------------------------- */}
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

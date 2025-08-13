// ─────────────────────────────────────────────────────────────
// src/pages/MarkdownDemo.tsx | valet-docs
// Demo of Markdown component
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Typography,
  Tabs,
  Table,
  Panel,
  Button,
  Markdown as MarkdownRenderer,
  useTheme,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function MarkdownDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  const sample = `# Markdown Demo\n\nThis text **renders** *Markdown* using valet components.\n\n## Table Example\n| Fruit | Colour |\n| ----- | ------ |\n| Apple | Red    |\n| Pear  | Green  |\n\n\`\`\`ts\nconst x = 42;\nconsole.log(x);\n\`\`\``;

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
      prop: <code>data</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Markdown source text',
    },
    {
      prop: <code>codeBackground</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Override background for fenced code blocks',
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
          Markdown
        </Typography>
        <Typography variant='subtitle'>Render Markdown text with valet primitives</Typography>
        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Typography>
                The <code>Markdown</code> component parses a Markdown string and renders each
                element with equivalent valet components. Provide your Markdown source via the{' '}
                <code>data</code> prop. Set
                <code>codeBackground</code> to control fenced code block styling.
              </Typography>
              <Typography variant='h3'>Source text</Typography>
              <Panel preset='codePanel'>
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{sample}</pre>
              </Panel>
              <Typography variant='h3'>Rendered output</Typography>
              <MarkdownRenderer data={sample} />
              <Button
                variant='outlined'
                onClick={toggleMode}
                style={{ marginTop: theme.spacing(1) }}
              >
                Toggle light / dark mode
              </Button>
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

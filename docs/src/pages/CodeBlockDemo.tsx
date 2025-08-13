// ─────────────────────────────────────────────────────────────
// docs/src/pages/CodeBlockDemo.tsx  | valet-docs
// Showcase of CodeBlock widget
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Typography,
  Tabs,
  Table,
  Select,
  Switch,
  TextField,
  CodeBlock,
  type TableColumn,
} from '@archway/valet';
import type { ReactNode } from 'react';
import { useState } from 'react';
import NavDrawer from '../components/NavDrawer';

export default function CodeBlockDemoPage() {
  const [language, setLanguage] = useState<'typescript' | 'javascript' | 'css'>('typescript');
  const [code, setCode] = useState<string>("const hello = 'world';\nconsole.log(hello);");
  const [fullWidth, setFullWidth] = useState(false);

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
      prop: <code>code</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Source code to render',
    },
    {
      prop: <code>language</code>,
      type: <code>string</code>,
      default: <code>'typescript'</code>,
      description: 'Highlight.js language key',
    },
    {
      prop: <code>fullWidth</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Stretch block to fill its container',
    },
    {
      prop: <code>ariaLabel</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Copy button aria-label',
    },
    {
      prop: <code>title</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Copy button tooltip',
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
          CodeBlock
        </Typography>
        <Typography variant='subtitle'>Highlight code snippets with copy feedback</Typography>
        <Tabs>
          <Tabs.Tab label='Overview' />
          <Tabs.Panel>
            <Stack gap={1}>
              <Typography>
                <code>CodeBlock</code> displays syntax highlighted code with a copy button that
                triggers a snackbar for quick feedback.
              </Typography>
              <CodeBlock
                code={code}
                language={language}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Playground' />
          <Tabs.Panel>
            <Stack gap={1}>
              <Stack
                direction='row'
                gap={1}
                wrap={false}
              >
                <Stack gap={0.25}>
                  <Typography variant='subtitle'>language</Typography>
                  <Select
                    placeholder='language'
                    value={language}
                    onChange={(v) => setLanguage(v as 'typescript' | 'javascript' | 'css')}
                    style={{ width: 160 }}
                  >
                    <Select.Option value='typescript'>typescript</Select.Option>
                    <Select.Option value='javascript'>javascript</Select.Option>
                    <Select.Option value='css'>css</Select.Option>
                  </Select>
                </Stack>
                <Stack
                  direction='row'
                  gap={1}
                  wrap={false}
                  style={{ alignItems: 'center' }}
                >
                  <Typography variant='subtitle'>fullWidth</Typography>
                  <Switch
                    checked={fullWidth}
                    onChange={setFullWidth}
                    aria-label='Toggle fullWidth'
                  />
                </Stack>
              </Stack>
              <TextField
                as='textarea'
                name='code'
                value={code}
                rows={6}
                onChange={(e) => setCode(e.target.value)}
                fontFamily='monospace'
                fullWidth
              />
              <CodeBlock
                code={code}
                language={language}
                fullWidth={fullWidth}
              />
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
      </Stack>
    </Surface>
  );
}

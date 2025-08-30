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
  TextField,
  CodeBlock,
  Panel,
  type TableColumn,
} from '@archway/valet';
import type { ReactNode } from 'react';
import { useState } from 'react';
import NavDrawer from '../../../components/NavDrawer';

export default function CodeBlockDemoPage() {
  const [language, setLanguage] = useState<'typescript' | 'javascript' | 'css'>('typescript');
  const [code, setCode] = useState<string>("const hello = 'world';\nconsole.log(hello);");

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
      default: <code>—</code>,
      description: 'Source code to render',
    },
    {
      prop: <code>language</code>,
      type: <code>string</code>,
      default: <code>&apos;typescript&apos;</code>,
      description: 'Highlight.js language key',
    },
    {
      prop: <code>ariaLabel</code>,
      type: <code>string</code>,
      default: <code>—</code>,
      description: 'Copy button aria-label',
    },
    {
      prop: <code>title</code>,
      type: <code>string</code>,
      default: <code>—</code>,
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
              <Stack gap={0.25}>
                <Typography variant='subtitle'>language</Typography>
                <Select
                  placeholder='language'
                  value={language}
                  onChange={(v) => setLanguage(v as 'typescript' | 'javascript' | 'css')}
                  sx={{ width: 160 }}
                >
                  <Select.Option value='typescript'>typescript</Select.Option>
                  <Select.Option value='javascript'>javascript</Select.Option>
                  <Select.Option value='css'>css</Select.Option>
                </Select>
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
        {/* Best Practices ------------------------------------------------- */}
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Specify the language. Pass a valid Highlight.js key (e.g., &apos;typescript&apos;) so
            tokens and keywords render correctly.
          </Typography>
          <Typography>
            - Use a monospace font and preserve whitespace. Pair with <code>Typography</code>
            <code> whitespace</code> controls when embedding code fragments elsewhere.
          </Typography>
          <Typography>
            - Keep snippets focused. Avoid very large blocks; extract long examples into files and
            link out to keep pages readable and fast.
          </Typography>
          <Typography>
            - Accessible copy affordance. Provide a descriptive <code>ariaLabel</code> (e.g.,
            &quot;Copy code&quot;) and a <code>title</code> tooltip for clarity.
          </Typography>
          <Typography>
            - Security hygiene. Never render untrusted code as executable; CodeBlock is purely
            presentational and should not eval content.
          </Typography>
        </Panel>
      </Stack>
    </Surface>
  );
}

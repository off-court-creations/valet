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
  type TableColumn,
} from '@archway/valet';
import type { ReactNode } from 'react';
import { useState } from 'react';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import CodeBlockMeta from '../../../../../src/components/widgets/CodeBlock.meta.json';

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
        <PageHero title='Code Block' />
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
        <CuratedExamples examples={getExamples(CodeBlockMeta)} />
        <BestPractices items={getBestPractices(CodeBlockMeta)} />
      </Stack>
    </Surface>
  );
}

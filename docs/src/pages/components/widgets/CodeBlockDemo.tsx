// ─────────────────────────────────────────────────────────────
// docs/src/pages/CodeBlockDemo.tsx  | valet-docs
// Showcase of CodeBlock widget
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Tabs, Select, TextField, CodeBlock } from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';

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

  // Reference handled by ReferenceSection

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
            <ReferenceSection slug='components/widgets/codeblock' />
          </Tabs.Panel>
        </Tabs>
        <CuratedExamples examples={getExamples(CodeBlockMeta)} />
        <BestPractices items={getBestPractices(CodeBlockMeta)} />
      </Stack>
    </Surface>
  );
}

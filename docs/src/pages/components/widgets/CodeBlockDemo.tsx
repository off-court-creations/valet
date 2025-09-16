// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/CodeBlockDemo.tsx  | valet-docs
// Migrated to ComponentMetaPage – usage + playground
// ─────────────────────────────────────────────────────────────
import { Stack, Typography, Select, TextField, CodeBlock } from '@archway/valet';
import { useState } from 'react';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import CodeBlockMeta from '../../../../../src/components/widgets/CodeBlock.meta.json';

export default function CodeBlockDemoPage() {
  const [language, setLanguage] = useState<'typescript' | 'javascript' | 'css'>('typescript');
  const [code, setCode] = useState<string>("const hello = 'world';\nconsole.log(hello);");

  const usage = (
    <Stack gap={1}>
      <Typography>
        <code>CodeBlock</code> displays syntax highlighted code with a copy button that triggers a
        snackbar for quick feedback.
      </Typography>
      <CodeBlock
        code={code}
        language={language}
      />
    </Stack>
  );

  const playground = (
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
  );

  return (
    <ComponentMetaPage
      title='Code Block'
      subtitle='Syntax highlighting with copy-to-clipboard'
      slug='components/widgets/codeblock'
      meta={CodeBlockMeta}
      usage={usage}
      playground={playground}
    />
  );
}

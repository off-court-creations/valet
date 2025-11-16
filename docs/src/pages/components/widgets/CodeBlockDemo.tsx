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
  const wideLongCode = `import { Surface, Stack, Panel, Typography, Grid, Button, IconButton, Checkbox, Switch, Slider, Progress, Table, Iterator, DateSelector, Tooltip, Modal, Tabs, Snackbar, CodeBlock } from '@archway/valet';

type Role = 'admin' | 'editor' | 'viewer';
type Density = 'comfortable' | 'compact' | 'tight' | 'zero';

type User = { id: string; name: string; email: string; role: Role; lastLogin: string; isActive: boolean; preferences: { theme: 'light' | 'dark'; density: Density } };

export function BigExampleComponent() {
  const items: Array<User> = Array.from({ length: 36 }, (_, i) => ({ id: String(i + 1), name: 'User ' + (i + 1), email: 'user' + (i + 1) + '@example.com', role: (i % 3 === 0 ? 'admin' : i % 2 ? 'editor' : 'viewer'), lastLogin: new Date(Date.now() - i * 86400000).toISOString(), isActive: i % 2 === 0, preferences: { theme: i % 2 ? 'light' : 'dark', density: 'comfortable' } }));
  return <Surface><Stack gap={1}><Panel fullWidth pad={1}><Typography variant='h4'>Massive, single-line heavy render with long props and values to test horizontal overflow and copy behavior</Typography></Panel><Panel fullWidth pad={0.75}><Table columns={[{ header: 'ID', accessor: 'id', sortable: true }, { header: 'Name', accessor: 'name', sortable: true }, { header: 'Email', accessor: 'email', sortable: true }, { header: 'Role', accessor: 'role', sortable: true }, { header: 'Active', accessor: 'isActive', align: 'center', sortable: true }, { header: 'Last Login', accessor: 'lastLogin', sortable: true }]} data={items} striped hoverable dividers constrainHeight /></Panel><Panel pad={0.5}><Stack direction='row' gap={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}><Button variant='filled' color='#4f46e5'>Primary Action</Button><IconButton icon='mdi:content-copy' variant='outlined' title='Copy'></IconButton><Checkbox name='agree' defaultChecked label={<Typography>I agree to the terms described in this extremely long single line of descriptive copy that keeps going to test the width of the code block and ensure it can handle a wide set of characters gracefully without wrapping unexpectedly</Typography>} /><Switch name='feature' defaultChecked /><Slider min={0} max={100} defaultValue={42} sx={{ width: '18rem' }} /><Tooltip title='Hover details'><Button variant='plain'>Hover me</Button></Tooltip><Tabs><Tabs.Tab label='A' /><Tabs.Tab label='B' /><Tabs.Tab label='C' /><Tabs.Panel>Alpha</Tabs.Panel><Tabs.Panel>Beta</Tabs.Panel><Tabs.Panel>Gamma</Tabs.Panel></Tabs><Snackbar message='Saved successfully with lots of context and metadata shown here' /></Stack></Panel></Stack></Surface>;
}`;

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
      <Typography variant='h3'>Wide single-line example</Typography>
      <Typography variant='subtitle'>Large snippet with long, wide LOCs</Typography>
      <CodeBlock
        code={wideLongCode}
        language='typescript'
        ariaLabel='Large wide-lines code sample'
        title='Copy large sample'
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
          onValueChange={(v) => setLanguage(v as 'typescript' | 'javascript' | 'css')}
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

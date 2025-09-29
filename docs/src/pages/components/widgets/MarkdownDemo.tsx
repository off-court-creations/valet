// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/MarkdownDemo.tsx  | valet-docs
// Migrated to ComponentMetaPage – Markdown renderer usage
// ─────────────────────────────────────────────────────────────
import {
  Stack,
  Typography,
  Panel,
  Button,
  Markdown as MarkdownRenderer,
  Select,
  useTheme,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import MarkdownMeta from '../../../../../src/components/widgets/Markdown.meta.json';

export default function MarkdownDemoPage() {
  const { theme, toggleMode } = useTheme();

  // Basics (headings, inline, code block)
  const basics = `# Markdown Demo\n\nThis text **renders** *Markdown* using valet components.\nLinks like [valet](https://github.com/off-court-creations/valet) are supported.\n\n\`inline code\` and a fenced block:\n\n\`\`\`ts\nconst x: number = 42;\nconsole.log(x);\n\`\`\``;

  // Lists (unordered, ordered) and task lists
  const lists = `### Lists & Tasks\n\n- Item one\n- Item two with **bold** and a [link](https://example.com)\n\n1. First\n2. Second\n3. Third\n\n- [ ] Unchecked task\n- [x] Completed task\n- [ ] Partially **formatted** task with \`code\``;

  // Blockquote, hr, soft break
  const blocks = `> Blockquote with nested **emphasis** and a link to [docs](https://react.dev).\n>\n> - Point A\n> - Point B\n\n---\n\nSoft break below:  \nSecond line (two spaces above)`;

  // Table with alignment + inline formatting inside cells
  const tableMd = `| Feature | Support | Notes |\n|:--------|:-------:|------:|\n| Bold    |  yes    | **strong** |\n| Code    |  yes    | \`inline\` & blocks |\n| Links   |  yes    | [safe](https://example.com) |`;

  // Links and images (unsafe links are sanitized)
  const linksImages = `Safe: [archway](https://archway.design)\n\nMail: [email](mailto:test@example.com)\n\nUnsafe (sanitized): [do not click](javascript:alert(1))\n\nImage:\n\n![Placeholder](https://placehold.co/160x80/png)`;

  // Language fallback for unknown code fence
  const codeMd = [
    '```ts',
    "const greet = (name: string) => 'Hello, ' + name;",
    '```',
    '',
    '```brainfuck',
    '>+[,.]  // unknown language; falls back to plaintext',
    '```',
  ].join('\n');

  const usage = (
    <Stack>
      <Typography>
        The <code>Markdown</code> component parses Markdown and renders it with valet primitives
        (Typography, Panel, Table, Image). It supports GFM features such as tables, task lists,
        strikethrough, and autolinks. Provide Markdown via <code>data</code>. Use
        <code>codeBackground</code> to style fenced code blocks.
      </Typography>

      <Typography variant='h3'>Basics</Typography>
      <Panel preset='codePanel'>
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{basics}</pre>
      </Panel>
      <MarkdownRenderer data={basics} />

      <Typography variant='h3'>Lists & Tasks</Typography>
      <Panel preset='codePanel'>
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{lists}</pre>
      </Panel>
      <MarkdownRenderer data={lists} />

      <Typography variant='h3'>Blockquote & Rule</Typography>
      <Panel preset='codePanel'>
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{blocks}</pre>
      </Panel>
      <MarkdownRenderer data={blocks} />

      <Typography variant='h3'>Table with alignment</Typography>
      <Panel preset='codePanel'>
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{tableMd}</pre>
      </Panel>
      <MarkdownRenderer data={tableMd} />

      <Typography variant='h3'>Links and Images</Typography>
      <Panel preset='codePanel'>
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{linksImages}</pre>
      </Panel>
      <MarkdownRenderer data={linksImages} />

      <Typography variant='h3'>Code highlighting & fallback</Typography>
      <Panel preset='codePanel'>
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{codeMd}</pre>
      </Panel>
      <MarkdownRenderer data={codeMd} />

      <Button
        variant='outlined'
        onClick={toggleMode}
        sx={{ marginTop: theme.spacing(1) }}
      >
        Toggle light / dark mode
      </Button>
    </Stack>
  );

  const codeBG: string = theme.colors['surfaceElevated'] || '#1e1e1e';
  const playground = (
    <Stack gap={1}>
      <Typography variant='subtitle'>Code block background for fenced blocks</Typography>
      <Select
        placeholder='codeBackground'
        onChange={() => void 0}
        value={'surfaceElevated'}
        disabled
        sx={{ width: 220 }}
      >
        <Select.Option value='surfaceElevated'>theme.colors.surfaceElevated</Select.Option>
      </Select>
      <MarkdownRenderer
        data={basics}
        codeBackground={codeBG}
      />
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Markdown'
      subtitle='Render Markdown via themed, accessible components'
      slug='components/widgets/markdown'
      meta={MarkdownMeta}
      usage={usage}
      playground={playground}
    />
  );
}

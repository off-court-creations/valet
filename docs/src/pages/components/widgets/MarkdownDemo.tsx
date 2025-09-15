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

  const sample = `# Markdown Demo\n\nThis text **renders** *Markdown* using valet components.\n\n## Table Example\n| Fruit | Colour |\n| ----- | ------ |\n| Apple | Red    |\n| Pear  | Green  |\n\n\`\`\`ts\nconst x = 42;\nconsole.log(x);\n\`\`\``;

  const usage = (
    <Stack>
      <Typography>
        The <code>Markdown</code> component parses a Markdown string and renders each element with
        equivalent valet components. Provide Markdown via <code>data</code>. Use
        <code>codeBackground</code> to style fenced code blocks.
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
        data={sample}
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

// src/pages/MarkdownDemo.tsx
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';
import {
  Surface,
  Stack,
  Typography,
  Panel,
  Button,
  Markdown as MarkdownRenderer,
  useTheme,
} from '@archway/valet';

export default function MarkdownDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  const sample = `# Markdown Demo\n\nThis text **renders** *Markdown* using valet components.\n\n## Table Example\n| Fruit | Colour |\n| ----- | ------ |\n| Apple | Red    |\n| Pear  | Green  |\n\n\`\`\`ts\nconst x = 42;\nconsole.log(x);\n\`\`\``;

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>
          Markdown
        </Typography>
        <Typography variant="subtitle">
          Render Markdown text with valet primitives
        </Typography>

        <Typography variant="h3">Raw Text</Typography>
        <Panel preset="codePanel">
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{sample}</pre>
        </Panel>

        <Typography variant="h3">Markdown Component</Typography>
        <MarkdownRenderer data={sample} />

        <Button variant="outlined" onClick={toggleMode} style={{ marginTop: theme.spacing(1) }}>
          Toggle light / dark mode
        </Button>

        <Button size="lg" onClick={() => navigate(-1)} style={{ marginTop: theme.spacing(1) }}>
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}

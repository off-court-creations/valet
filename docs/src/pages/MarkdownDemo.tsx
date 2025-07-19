// ─────────────────────────────────────────────────────────────
// src/pages/MarkdownDemo.tsx | valet
// Demo page for Markdown component
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Tabs, Panel, useTheme, Markdown } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';

export default function MarkdownDemo() {
  const { theme } = useTheme();
  const sample = `# Markdown Example

This is **markdown** rendered with _valet_.

![Kitten](https://placecats.com/400/200)

| Animal | Sound |
| ------ | ----- |
| Cat    | Meow  |
| Dog    | Woof  |

\`\`\`ts
console.log('hello');
\`\`\``;

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>
          Markdown
        </Typography>

        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Typography variant="h3">Raw text</Typography>
            <Panel preset="codePanel">
              <pre style={{ margin: 0 }}>{sample}</pre>
            </Panel>

            <Typography variant="h3">Markdown component</Typography>
            <Markdown data={sample} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Surface>
  );
}

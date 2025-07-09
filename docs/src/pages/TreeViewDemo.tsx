// ─────────────────────────────────────────────────────────────────────────────
// src/pages/TreeViewDemo.tsx | valet
// Showcase for <TreeView/> component
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Surface, Stack, Typography, Button, TreeView, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';

export default function TreeViewDemo() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState<string[]>(['root']);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Surface>
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>TreeView Showcase</Typography>
        <Typography variant="subtitle">Nested hierarchy with keyboard navigation</Typography>

        <TreeView
          open={open}
          onOpenChange={setOpen}
          selected={selected ?? undefined}
          onSelect={setSelected}
        >
          <TreeView.Item id="root" label="Root 📁">
            <TreeView.Item id="file1" label="File 1.txt 📝" />
            <TreeView.Item id="folder" label="Folder 📂">
              <TreeView.Item id="deep" label="Deep item 😃" />
            </TreeView.Item>
          </TreeView.Item>
          <TreeView.Item id="misc" label="Misc 🍀" />
        </TreeView>

        <Typography variant="body">
          Selected: <code>{selected ?? 'none'}</code>
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={toggleMode}>Toggle light / dark</Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}

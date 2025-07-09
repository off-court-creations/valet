// ─────────────────────────────────────────────────────────────
// src/pages/TreeViewDemo.tsx | valet
// Demo page for TreeView component
// ─────────────────────────────────────────────────────────────
import React from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  TreeView,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';

/*───────────────────────────────────────────────────────────*/
export default function TreeViewDemo() {
  const { theme, toggleMode, mode } = useTheme();
  const navigate = useNavigate();
  return (
    <Surface>
      <Stack preset="showcaseStack" spacing={1}>
        <Typography variant="h2" bold>
          TreeView Showcase
        </Typography>

        <Typography variant="h3">1. Basic usage</Typography>
        <TreeView defaultExpanded={["src"]}>
          <TreeView.Item id="src" label="src" icon="📁">
            <TreeView.Item id="components" label="components" icon="📁">
              <TreeView.Item id="button" label="Button.tsx" icon="📄" />
              <TreeView.Item id="box" label="Box.tsx" icon="📄" />
            </TreeView.Item>
            <TreeView.Item id="index" label="index.ts" icon="📄" />
          </TreeView.Item>
          <TreeView.Item id="README" label="README.md" icon="📄" />
        </TreeView>

        <Typography variant="h3">2. Theme coupling</Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Toggle {mode === 'light' ? 'dark' : 'light'} mode
        </Button>

        <Button
          size="lg"
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}


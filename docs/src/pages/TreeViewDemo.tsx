// src/pages/TreeViewDemo.tsx
import { useState } from 'react';
import { Surface, Stack, Typography, Button, TreeView, type TreeNode, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';

interface Item {
  label: React.ReactNode;
}

const DATA: TreeNode<Item>[] = [
  {
    id: 'fruit',
    data: { label: '🍎 Fruit' },
    children: [
      { id: 'apple', data: { label: 'Green Apple 🍏' } },
      { id: 'banana', data: { label: 'Banana 🍌' } },
    ],
  },
  {
    id: 'dairy',
    data: { label: '🧀 Dairy' },
    children: [
      { id: 'milk', data: { label: 'Milk 🥛' } },
      { id: 'cheese', data: { label: 'Cheese 🧀' } },
    ],
  },
];

export default function TreeViewDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');

  return (
    <Surface>
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>TreeView Showcase</Typography>
        <Typography variant="subtitle">Keyboard navigation with two visual styles</Typography>

        <Typography variant="h3">1. Chevron Variant</Typography>
        <TreeView<Item>
          nodes={DATA}
          getLabel={(n) => n.label}
          defaultExpanded={['fruit']}
          onNodeSelect={(n) => setSelected(String(n.label))}
        />

        <Typography variant="h3">2. List Variant</Typography>
        <TreeView<Item>
          variant="list"
          nodes={DATA}
          getLabel={(n) => n.label}
          defaultExpanded={['fruit']}
          onNodeSelect={(n) => setSelected(String(n.label))}
        />
        <Typography variant="body">
          Selected: <code>{selected}</code>
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={toggleMode}>Toggle light / dark</Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}

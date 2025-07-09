// src/pages/TreeViewDemo.tsx
import { useState } from 'react';
import { Surface, Stack, Typography, Button, TreeView, type TreeNode, type TreeViewVariant, useTheme } from '@archway/valet';
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
  const [variant, setVariant] = useState<TreeViewVariant>('chevron');

  return (
    <Surface>
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>TreeView Showcase</Typography>
        <Typography variant="subtitle">Nested list with keyboard navigation</Typography>

        <TreeView<Item>
          nodes={DATA}
          getLabel={(n) => n.label}
          defaultExpanded={['fruit']}
          onNodeSelect={(n) => setSelected(String(n.label))}
          variant={variant}
        />
        <Typography variant="body">
          Selected: <code>{selected}</code>
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            variant={variant === 'chevron' ? 'contained' : 'outlined'}
            onClick={() => setVariant('chevron')}
          >
            Chevron
          </Button>
          <Button
            variant={variant === 'list' ? 'contained' : 'outlined'}
            onClick={() => setVariant('list')}
          >
            List
          </Button>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={toggleMode}>Toggle light / dark</Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}

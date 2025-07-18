// src/pages/TreeDemo.tsx
import { useState } from 'react';
import { Surface, Stack, Typography, Button, Tree, type TreeNode, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

interface Item {
  label: React.ReactNode;
}

const DATA: TreeNode<Item>[] = [
  {
    id: 'fruit',
    data: { label: '🍎 Fruit' },
    children: [
      {
        id: 'apple',
        data: { label: 'Green Apple 🍏' },
        children: [
          { id: 'granny', data: { label: 'Granny Smith' } },
          { id: 'fuji', data: { label: 'Fuji' } },
        ],
      },
      { id: 'banana', data: { label: 'Banana 🍌' } },
    ],
  },
  {
    id: 'dairy',
    data: { label: '🧀 Dairy' },
    children: [
      {
        id: 'milk',
        data: { label: 'Milk 🥛' },
        children: [
          { id: 'whole', data: { label: 'Whole Milk' } },
          { id: 'skim', data: { label: 'Skim Milk' } },
        ],
      },
      { id: 'cheese', data: { label: 'Cheese 🧀' } },
    ],
  },
];

const FILES: TreeNode<Item>[] = [
  {
    id: 'src',
    data: { label: 'src' },
    children: [
      {
        id: 'components',
        data: { label: 'components' },
        children: [
          { id: 'Button.tsx', data: { label: 'Button.tsx' } },
          { id: 'Tree.tsx', data: { label: 'Tree.tsx' } },
        ],
      },
      { id: 'index.ts', data: { label: 'index.ts' } },
    ],
  },
  { id: 'package.json', data: { label: 'package.json' } },
];

export default function TreeDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>Tree Showcase</Typography>
        <Typography variant="subtitle">Nested list with keyboard navigation</Typography>

        <Typography variant="h3">1. Chevron variant</Typography>
        <Tree<Item>
          nodes={DATA}
          getLabel={(n) => n.label}
          defaultExpanded={['fruit', 'dairy']}
          onNodeSelect={(n) => setSelected(String(n.label))}
          variant="chevron"
        />
        <Typography variant="body">
          Selected: <code>{selected}</code>
        </Typography>

        <Typography variant="h3">2. List variant</Typography>
        <Tree<Item>
          nodes={DATA}
          getLabel={(n) => n.label}
          defaultExpanded={['fruit', 'dairy']}
          variant="list"
        />

        <Typography variant="h3">3. Files variant</Typography>
        <Tree<Item>
          nodes={FILES}
          getLabel={(n) => n.label}
          defaultExpanded={['src', 'components']}
          variant="files"
        />

        <Stack direction="row">
          <Button variant="outlined" onClick={toggleMode}>Toggle light / dark</Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}

// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/TreeDemo.tsx  | valet-docs
// Migrated to ComponentMetaPage – variants (chevron, list, files) + playground
// ─────────────────────────────────────────────────────────────
import { Stack, Typography, Button, Tree, Select, useTheme, type TreeNode } from '@archway/valet';
import type { ReactNode } from 'react';
import { useState } from 'react';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import TreeMeta from '../../../../../src/components/widgets/Tree.meta.json';

interface Item {
  label: ReactNode;
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
  const { toggleMode } = useTheme();
  const [selected, setSelected] = useState('');

  const usage = (
    <Stack>
      <Typography variant='h3'>
        Variant <code>chevron</code>
      </Typography>
      <Tree<Item>
        nodes={DATA}
        getLabel={(n) => n.label}
        defaultExpanded={['fruit', 'dairy']}
        onNodeSelect={(n) => setSelected(String(n.label))}
        variant='chevron'
      />
      <Typography variant='body'>
        Selected: <code>{selected}</code>
      </Typography>

      <Typography variant='h3'>
        Variant <code>list</code>
      </Typography>
      <Tree<Item>
        nodes={DATA}
        getLabel={(n) => n.label}
        defaultExpanded={['fruit', 'dairy']}
        variant='list'
      />

      <Typography variant='h3'>
        Variant <code>files</code>
      </Typography>
      <Tree<Item>
        nodes={FILES}
        getLabel={(n) => n.label}
        defaultExpanded={['src', 'components']}
        variant='files'
      />

      <Button
        variant='outlined'
        onClick={toggleMode}
      >
        Toggle light / dark
      </Button>
    </Stack>
  );

  const [variant, setVariant] = useState<'chevron' | 'list' | 'files'>('chevron');
  const playground = (
    <Stack gap={1}>
      <Typography variant='subtitle'>variant</Typography>
      <Select
        placeholder='variant'
        value={variant}
        onValueChange={(v) => setVariant(v as 'chevron' | 'list' | 'files')}
        sx={{ width: 200 }}
      >
        <Select.Option value='chevron'>chevron</Select.Option>
        <Select.Option value='list'>list</Select.Option>
        <Select.Option value='files'>files</Select.Option>
      </Select>
      <Tree<Item>
        nodes={variant === 'files' ? FILES : DATA}
        getLabel={(n) => n.label}
        defaultExpanded={variant === 'files' ? ['src', 'components'] : ['fruit', 'dairy']}
        variant={variant}
      />
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Tree'
      subtitle='Hierarchical lists with accessible keyboard navigation'
      slug='components/widgets/tree'
      meta={TreeMeta}
      usage={usage}
      playground={playground}
    />
  );
}

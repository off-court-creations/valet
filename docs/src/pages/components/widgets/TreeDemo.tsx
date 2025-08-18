// ─────────────────────────────────────────────────────────────
// docs/src/pages/TreeDemo.tsx | valet-docs
// Showcase of Tree component
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Typography,
  Button,
  Tree,
  Tabs,
  Table,
  useTheme,
  type TreeNode,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';

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

interface Row {
  prop: ReactNode;
  type: ReactNode;
  default: ReactNode;
  description: ReactNode;
}

const columns: TableColumn<Row>[] = [
  { header: 'Prop', accessor: 'prop' },
  { header: 'Type', accessor: 'type' },
  { header: 'Default', accessor: 'default' },
  { header: 'Description', accessor: 'description' },
];

const data: Row[] = [
  {
    prop: <code>nodes</code>,
    type: <code>TreeNode&lt;T&gt;[]</code>,
    default: <code>-</code>,
    description: 'Array of tree nodes',
  },
  {
    prop: <code>getLabel</code>,
    type: <code>(n: T) =&gt; ReactNode</code>,
    default: <code>-</code>,
    description: 'Return label for a node',
  },
  {
    prop: <code>defaultExpanded</code>,
    type: <code>string[]</code>,
    default: <code>[]</code>,
    description: 'Node ids expanded on mount',
  },
  {
    prop: <code>expanded</code>,
    type: <code>string[]</code>,
    default: <code>-</code>,
    description: 'Controlled expanded node ids',
  },
  {
    prop: <code>onExpandedChange</code>,
    type: <code>(ids: string[]) =&gt; void</code>,
    default: <code>-</code>,
    description: 'Handle expand/collapse changes',
  },
  {
    prop: <code>selected</code>,
    type: <code>string</code>,
    default: <code>-</code>,
    description: 'Controlled selected node id',
  },
  {
    prop: <code>defaultSelected</code>,
    type: <code>string</code>,
    default: <code>-</code>,
    description: 'Uncontrolled starting selection',
  },
  {
    prop: <code>onNodeSelect</code>,
    type: <code>(n: T) =&gt; void</code>,
    default: <code>-</code>,
    description: 'Called when a node is selected',
  },
  {
    prop: <code>variant</code>,
    type: <code>&#39;chevron&#39; | &#39;list&#39; | &#39;files&#39;</code>,
    default: <code>&#39;chevron&#39;</code>,
    description: 'Visual style of branches',
  },
  {
    prop: <code>preset</code>,
    type: <code>string | string[]</code>,
    default: <code>-</code>,
    description: 'Apply style presets',
  },
];

export default function TreeDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Tree
        </Typography>
        <Typography variant='subtitle'>Nested list with keyboard navigation</Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Typography variant='h3'>Variant &quot;chevron&quot;</Typography>
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

              <Typography variant='h3'>Variant &quot;list&quot;</Typography>
              <Tree<Item>
                nodes={DATA}
                getLabel={(n) => n.label}
                defaultExpanded={['fruit', 'dairy']}
                variant='list'
              />

              <Typography variant='h3'>Variant &quot;files&quot;</Typography>
              <Tree<Item>
                nodes={FILES}
                getLabel={(n) => n.label}
                defaultExpanded={['src', 'components']}
                variant='files'
              />

              <Button
                variant='outlined'
                onClick={toggleMode}
                sx={{ marginTop: theme.spacing(1) }}
              >
                Toggle light / dark mode
              </Button>
            </Stack>
          </Tabs.Panel>
          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Table
              data={data}
              columns={columns}
              constrainHeight={false}
            />
          </Tabs.Panel>
        </Tabs>

        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}

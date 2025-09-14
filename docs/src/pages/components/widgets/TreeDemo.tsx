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
  useTheme,
  type TreeNode,
} from '@archway/valet';

import ReferenceSection from '../../../components/ReferenceSection';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import TreeMeta from '../../../../../src/components/widgets/Tree.meta.json';
import PageHero from '../../../components/PageHero';

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

// Manual reference removed; handled by ReferenceSection

export default function TreeDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Tree' />

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
            <ReferenceSection slug='components/widgets/tree' />
          </Tabs.Panel>
        </Tabs>

        <CuratedExamples examples={getExamples(TreeMeta)} />
        <BestPractices items={getBestPractices(TreeMeta)} />

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

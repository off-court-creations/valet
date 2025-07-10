// ─────────────────────────────────────────────────────────────
// src/pages/DocsLayout.tsx  | valet
// Reusable docs layout with navigation drawer
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Surface,
  Drawer,
  Stack,
  Tree,
  useTheme,
  useSurface,
  type TreeNode,
} from '@archway/valet';

interface Item {
  label: string;
  path?: string;
}

const components: [string, string][] = [
  ['Accordion', '/accordion-demo'],
  ['Avatar', '/avatar-demo'],
  ['Box', '/box-demo'],
  ['Button', '/button-demo'],
  ['Checkbox', '/checkbox-demo'],
  ['Chat', '/chat-demo'],
  ['Drawer', '/drawer-demo'],
  ['FormControl + Textfield', '/text-form-demo'],
  ['Grid', '/grid-demo'],
  ['Icon', '/icon-demo'],
  ['Icon Button', '/icon-button-demo'],
  ['List', '/list-demo'],
  ['Modal', '/modal-demo'],
  ['Pagination', '/pagination-demo'],
  ['Panel', '/panel-demo'],
  ['Progress', '/progress-demo'],
  ['Radio Group', '/radio-demo'],
  ['Slider', '/slider-demo'],
  ['Select', '/select-demo'],
  ['Snackbar', '/snackbar-demo'],
  ['Switch', '/switch-demo'],
  ['Table', '/table-demo'],
  ['Tabs', '/tabs-demo'],
  ['Tooltip', '/tooltip-demo'],
  ['Typography', '/typography'],
  ['Video', '/video-demo'],
  ['AppBar', '/appbar-demo'],
  ['Speed Dial', '/speeddial-demo'],
  ['Stepper', '/stepper-demo'],
  ['Tree', '/tree-demo'],
];

const demos: [string, string][] = [
  ['Presets', '/presets'],
  ['Form', '/form'],
  ['Parallax', '/parallax'],
  ['Radio Button', '/test'],
];

const treeData: TreeNode<Item>[] = [
  {
    id: 'getting-started',
    data: { label: 'Getting Started' },
    children: [
      { id: '/overview', data: { label: 'Overview', path: '/overview' } },
      { id: '/installation', data: { label: 'Installation', path: '/installation' } },
      { id: '/usage', data: { label: 'Usage', path: '/usage' } },
    ],
  },
  {
    id: 'components',
    data: { label: 'Components' },
    children: components.map(([label, path]) => ({
      id: path,
      data: { label, path },
    })),
  },
  {
    id: 'demos',
    data: { label: 'Demos' },
    children: demos.map(([label, path]) => ({
      id: path,
      data: { label, path },
    })),
  },
];

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { width, height } = useSurface();
  const landscape = width >= height;

  return (
    <Surface>
      <Drawer responsive anchor="left" size="16rem">
        <Tree<Item>
          nodes={treeData}
          getLabel={(n) => n.label}
          variant="list"
          selected={location.pathname}
          defaultExpanded={['getting-started', 'components', 'demos']}
          onNodeSelect={(n) => n.path && navigate(n.path)}
          style={{ padding: theme.spacing(1) }}
        />
      </Drawer>
      <Stack style={{ padding: theme.spacing(1), marginLeft: landscape ? '16rem' : 0, maxWidth: 980 }}>
        {children}
      </Stack>
    </Surface>
  );
}

export default DocsLayout;

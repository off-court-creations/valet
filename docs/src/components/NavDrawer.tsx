// ─────────────────────────────────────────────────────────────
// src/components/NavDrawer.tsx  | valet docs
// Reusable navigation drawer for docs
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  Tree,
  type TreeNode,
  useTheme,
} from '@archway/valet';

interface Item {
  label: string;
  path?: string;
}

const primitives: [string, string][] = [
  ['Avatar', '/avatar-demo'],
  ['Icon', '/icon-demo'],
  ['Image', '/image-demo'],
  ['Modal', '/modal-demo'],
  ['Progress', '/progress-demo'],
  ['Typography', '/typography'],
  ['Video', '/video-demo'],
];

const layoutPrimitives: [string, string][] = [
  ['Box', '/box-demo'],
  ['Grid', '/grid-demo'],
  ['Panel', '/panel-demo'],
  ['Stack', '/stack-demo'],
  ['Surface', '/surface'],
];

const fields: [string, string][] = [
  ['Button', '/button-demo'],
  ['Checkbox', '/checkbox-demo'],
  ['DateTime Picker', '/datetime-demo'],
  ['Icon Button', '/icon-button-demo'],
  ['Radio Group', '/radio-demo'],
  ['Select', '/select-demo'],
  ['Slider', '/slider-demo'],
  ['Switch', '/switch-demo'],
  ['TextField', '/text-form-demo'],
];

const widgets: [string, string][] = [
  ['Accordion', '/accordion-demo'],
  ['AppBar', '/appbar-demo'],
  ['OAIChat', '/chat-demo'],
  ['Drawer', '/drawer-demo'],
  ['List', '/list-demo'],
  ['Pagination', '/pagination-demo'],
  ['Parallax', '/parallax'],
  ['Snackbar', '/snackbar-demo'],
  ['Speed Dial', '/speeddial-demo'],
  ['Stepper', '/stepper-demo'],
  ['Table', '/table-demo'],
  ['Tabs', '/tabs-demo'],
  ['Tooltip', '/tooltip-demo'],
  ['Tree', '/tree-demo'],
];

const demos: [string, string][] = [
  ['Form', '/form'],
  ['Parallax', '/parallax'],
  ['Presets', '/presets'],
  ['Radio Button', '/test'],
];

const DEFAULT_EXPANDED = [
  'getting-started',
  'primitives',
  'layout',
  'fields',
  'widgets',
  'demos',
];

const treeData: TreeNode<Item>[] = [
  {
    id: 'welcome',
    data: { label: 'Welcome', path: '/' },
  },
  {
    id: 'getting-started',
    data: { label: 'Getting Started' },
    children: [
      { id: '/overview', data: { label: 'Overview', path: '/overview' } },
      { id: '/installation', data: { label: 'Installation', path: '/installation' } },
      { id: '/usage', data: { label: 'Usage', path: '/usage' } },
      { id: '/prop-patterns', data: { label: 'Prop Patterns', path: '/prop-patterns' } },
    ],
  },
  {
    id: 'components',
    data: { label: 'Components' },
    children: [
      {
        id: 'layout',
        data: { label: 'Layout Primitives' },
        children: layoutPrimitives.map(([label, path]) => ({
          id: path,
          data: { label, path },
        })),
      },
      {
        id: 'primitives',
        data: { label: 'Primitives' },
        children: primitives.map(([label, path]) => ({
          id: path,
          data: { label, path },
        })),
      },
      {
        id: 'fields',
        data: { label: 'Fields' },
        children: fields.map(([label, path]) => ({
          id: path,
          data: { label, path },
        })),
      },
      {
        id: 'widgets',
        data: { label: 'Widgets' },
        children: widgets.map(([label, path]) => ({
          id: path,
          data: { label, path },
        })),
      },
    ],
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

export default function NavDrawer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('navExpanded');
      return raw ? JSON.parse(raw) : DEFAULT_EXPANDED;
    } catch {
      return DEFAULT_EXPANDED;
    }
  });

  const handleExpandedChange = (ids: string[]) => {
    setExpanded(ids);
    try {
      localStorage.setItem('navExpanded', JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  };
  return (
    <Drawer adaptive anchor="left" size="16rem">
      <Tree<Item>
        nodes={treeData}
        getLabel={(n) => n.label}
        variant="list"
        selected={location.pathname}
        expanded={expanded}
        onExpandedChange={handleExpandedChange}
        onNodeSelect={(n) => n.path && navigate(n.path)}
        style={{ padding: theme.spacing(1) }}
      />
    </Drawer>
  );
}

// ─────────────────────────────────────────────────────────────
// src/components/NavDrawer.tsx  | valet docs
// Reusable navigation drawer for docs
// ─────────────────────────────────────────────────────────────
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
  ['Box', '/box-demo'],
  ['Typography', '/typography'],
  ['Icon', '/icon-demo'],
  ['Panel', '/panel-demo'],
];

const layoutPrimitives: [string, string][] = [
  ['Grid', '/grid-demo'],
];

const fields: [string, string][] = [
  ['Button', '/button-demo'],
  ['Checkbox', '/checkbox-demo'],
  ['Switch', '/switch-demo'],
  ['Radio Group', '/radio-demo'],
  ['Slider', '/slider-demo'],
  ['FormControl + Textfield', '/text-form-demo'],
  ['Select', '/select-demo'],
];

const widgets: [string, string][] = [
  ['Accordion', '/accordion-demo'],
  ['Tabs', '/tabs-demo'],
  ['Drawer', '/drawer-demo'],
  ['Modal', '/modal-demo'],
  ['Stepper', '/stepper-demo'],
  ['Speed Dial', '/speeddial-demo'],
  ['Pagination', '/pagination-demo'],
  ['Table', '/table-demo'],
  ['Video', '/video-demo'],
  ['Avatar', '/avatar-demo'],
  ['Chat', '/chat-demo'],
  ['DateTime Picker', '/datetime-demo'],
  ['Icon Button', '/icon-button-demo'],
  ['List', '/list-demo'],
  ['Progress', '/progress-demo'],
  ['Snackbar', '/snackbar-demo'],
  ['Tooltip', '/tooltip-demo'],
  ['Tree', '/tree-demo'],
  ['AppBar', '/appbar-demo'],
];

const demos: [string, string][] = [
  ['Presets', '/presets'],
  ['Form', '/form'],
  ['Parallax', '/parallax'],
  ['Radio Button', '/test'],
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
    ],
  },
  {
    id: 'components',
    data: { label: 'Components' },
    children: [
      {
        id: 'primitives',
        data: { label: 'Primitives' },
        children: primitives.map(([label, path]) => ({ id: path, data: { label, path } })),
      },
      {
        id: 'layout-primitives',
        data: { label: 'Layout Primitives' },
        children: layoutPrimitives.map(([label, path]) => ({ id: path, data: { label, path } })),
      },
      {
        id: 'fields',
        data: { label: 'Fields' },
        children: fields.map(([label, path]) => ({ id: path, data: { label, path } })),
      },
      {
        id: 'widgets',
        data: { label: 'Widgets' },
        children: widgets.map(([label, path]) => ({ id: path, data: { label, path } })),
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
  return (
    <Drawer responsive anchor="left" size="16rem">
      <Tree<Item>
        nodes={treeData}
        getLabel={(n) => n.label}
        variant="list"
        selected={location.pathname}
        defaultExpanded={['getting-started', 'components', 'primitives', 'layout-primitives', 'fields', 'widgets', 'demos']}
        onNodeSelect={(n) => n.path && navigate(n.path)}
        style={{ padding: theme.spacing(1) }}
      />
    </Drawer>
  );
}

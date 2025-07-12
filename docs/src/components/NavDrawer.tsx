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
  ['Avatar', '/avatar-demo'],
  ['Box', '/box-demo'],
  ['Icon', '/icon-demo'],
  ['Panel', '/panel-demo'],
  ['Typography', '/typography'],
];

const layoutPrimitives: [string, string][] = [
  ['Grid', '/grid-demo'],
];

const fields: [string, string][] = [
  ['Button', '/button-demo'],
  ['Checkbox', '/checkbox-demo'],
  ['Icon Button', '/icon-button-demo'],
  ['Radio Group', '/radio-demo'],
  ['Select', '/select-demo'],
  ['Slider', '/slider-demo'],
  ['Switch', '/switch-demo'],
  ['TextField', '/text-form-demo'],
  ['DateTime Picker', '/datetime-demo'],
];

const widgets: [string, string][] = [
  ['Accordion', '/accordion-demo'],
  ['AppBar', '/appbar-demo'],
  ['Chat', '/chat-demo'],
  ['Drawer', '/drawer-demo'],
  ['List', '/list-demo'],
  ['Modal', '/modal-demo'],
  ['Pagination', '/pagination-demo'],
  ['Snackbar', '/snackbar-demo'],
  ['Speed Dial', '/speeddial-demo'],
  ['Stepper', '/stepper-demo'],
  ['Table', '/table-demo'],
  ['Tabs', '/tabs-demo'],
  ['Tooltip', '/tooltip-demo'],
  ['Tree', '/tree-demo'],
  ['Video', '/video-demo'],
  ['Progress', '/progress-demo'],
  ['Parallax', '/parallax'],
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
        children: primitives.map(([label, path]) => ({
          id: path,
          data: { label, path },
        })),
      },
      {
        id: 'layout',
        data: { label: 'Layout Primitives' },
        children: layoutPrimitives.map(([label, path]) => ({
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
  return (
    <Drawer responsive anchor="left" size="16rem">
      <Tree<Item>
        nodes={treeData}
        getLabel={(n) => n.label}
        variant="list"
        selected={location.pathname}
        defaultExpanded={[
          'getting-started',
          'components',
          'primitives',
          'layout',
          'fields',
          'widgets',
          'demos',
        ]}
        onNodeSelect={(n) => n.path && navigate(n.path)}
        style={{ padding: theme.spacing(1) }}
      />
    </Drawer>
  );
}

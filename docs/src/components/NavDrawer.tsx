// ─────────────────────────────────────────────────────────────
// src/components/NavDrawer.tsx  | valet-docs
// Reusable navigation drawer for docs
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Drawer, Tree, type TreeNode, useTheme } from '@archway/valet';

interface Item {
  label: string;
  path?: string;
}

const primitives: [string, string][] = [
  ['Avatar', '/avatar-demo'],
  ['Icon', '/icon-demo'],
  ['Image', '/image-demo'],
  ['Divider', '/divider-demo'],
  ['Progress', '/progress-demo'],
  ['Skeleton', '/skeleton-demo'],
  ['Typography', '/typography'],
  ['Video', '/video-demo'],
];

const layoutComponents: [string, string][] = [
  ['Accordion', '/accordion-demo'],
  ['AppBar', '/appbar-demo'],
  ['Box', '/box-demo'],
  ['Drawer', '/drawer-demo'],
  ['Grid', '/grid-demo'],
  ['List', '/list-demo'],
  ['Modal', '/modal-demo'],
  ['Panel', '/panel-demo'],
  ['Stack', '/stack-demo'],
  ['Surface', '/surface'],
  ['Tabs', '/tabs-demo'],
];

const fields: [string, string][] = [
  ['Button', '/button-demo'],
  ['Checkbox', '/checkbox-demo'],
  ['Date Selector', '/dateselector-demo'],
  ['Icon Button', '/icon-button-demo'],
  ['Radio Group', '/radio-demo'],
  ['Select', '/select-demo'],
  ['Metro Select', '/metroselect-demo'],
  ['Iterator', '/iterator-demo'],
  ['Slider', '/slider-demo'],
  ['Switch', '/switch-demo'],
  ['TextField', '/text-form-demo'],
];

const widgets: [string, string][] = [
  ['CodeBlock', '/codeblock-demo'],
  ['LLMChat', '/llmchat'],
  ['RichChat', '/richchat'],
  ['Pagination', '/pagination-demo'],
  ['Snackbar', '/snackbar-demo'],
  ['Speed Dial', '/speeddial-demo'],
  ['Stepper', '/stepper-demo'],
  ['Table', '/table-demo'],
  ['Tooltip', '/tooltip-demo'],
  ['Dropzone', '/dropzone-demo'],
  ['Tree', '/tree-demo'],
  ['Markdown', '/markdown-demo'],
];

const examples: [string, string][] = [
  ['Form', '/form'],
  ['Presets', '/presets'],
  ['LLMChat', '/chat-demo'],
  ['RichChat', '/rich-chat-demo'],
  ['Complicated Dashboard', '/dashboard-demo'],
];

const DEFAULT_EXPANDED = [
  'getting-started',
  'primitives',
  'layout',
  'fields',
  'widgets',
  'examples',
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
      { id: '/quickstart', data: { label: 'Quickstart', path: '/quickstart' } },
      { id: '/overview', data: { label: 'Overview', path: '/overview' } },
      { id: '/mcp', data: { label: 'MCP & Introspection', path: '/mcp' } },
      {
        id: '/prop-patterns',
        data: { label: 'Prop Patterns', path: '/prop-patterns' },
      },
    ],
  },
  {
    id: 'concepts',
    data: { label: 'Concepts' },
    children: [
      { id: '/mental-model', data: { label: 'Mental Model', path: '/mental-model' } },
      { id: '/theme', data: { label: 'Theme Store', path: '/theme' } },
      { id: '/styled', data: { label: 'Styled Engine', path: '/styled' } },
      { id: '/spacing', data: { label: 'Spacing Contract', path: '/spacing' } },
      {
        id: '/components-primer',
        data: { label: 'Components Primer', path: '/components-primer' },
      },
    ],
  },
  {
    id: 'components',
    data: { label: 'Components' },
    children: [
      {
        id: 'layout',
        data: { label: 'Layout' },
        children: layoutComponents.map(([label, path]) => ({
          id: path,
          data: { label, path },
        })),
      },
      {
        id: 'primitives',
        data: { label: 'Primitive' },
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
    id: 'examples',
    data: { label: 'Examples' },
    children: examples.map(([label, path]) => ({
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
    <Drawer
      adaptive
      anchor='left'
      size='16rem'
    >
      <Tree<Item>
        nodes={treeData}
        getLabel={(n) => n.label}
        variant='list'
        selected={location.pathname}
        expanded={expanded}
        onExpandedChange={handleExpandedChange}
        onNodeSelect={(n) => n.path && navigate(n.path)}
        sx={{ padding: theme.spacing(1) }}
      />
    </Drawer>
  );
}

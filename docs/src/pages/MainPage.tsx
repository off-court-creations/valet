// ─────────────────────────────────────────────────────────────
// src/pages/MainPage.tsx  | valet
// Doc home with responsive drawer navigation
// ─────────────────────────────────────────────────────────────
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Surface,
  Drawer,
  Stack,
  Button,
  Typography,
  Tree,
  type TreeNode,
  useTheme,
} from '@archway/valet';

export default function MainPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, mode, toggleMode } = useTheme();

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

  interface Item { label: string; path?: string }

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

  function Content() {
    return (
      <Stack
        spacing={1}
        style={{
          padding: theme.spacing(1),
          maxWidth: 980,
        }}
      >
        <Typography variant="h1" bold>
          valet
        </Typography>
        <Typography variant="subtitle">
          A lightweight React component kit bridging AI and the web.
        </Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Switch to {mode === 'light' ? 'dark' : 'light'} mode
        </Button>
      </Stack>
    );
  }

  return (
    <Surface>
      <Drawer responsive anchor="left" size="16rem" pushContent>
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
      <Content />
    </Surface>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// src/pages/TreeViewDemo.tsx | valet
// Live demo showcasing <TreeView /> functionality
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Panel,
  Typography,
  Button,
  TreeView,
  Icon,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';

interface Node {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: Node[];
}

const data: Node[] = [
  {
    id: 'animals',
    label: 'Animals',
    icon: <Icon icon="mdi:paw" />,
    children: [
      {
        id: 'mammals',
        label: 'Mammals 🐾',
        children: [
          { id: 'dogs', label: 'Dogs 🐕' },
          { id: 'cats', label: 'Cats 🐈' },
        ],
      },
      { id: 'birds', label: 'Birds 🐦' },
    ],
  },
  {
    id: 'plants',
    label: 'Plants',
    icon: <Icon icon="mdi:leaf" />,
    children: [
      { id: 'trees', label: 'Trees 🌳' },
      { id: 'flowers', label: 'Flowers 🌸' },
    ],
  },
];

function render(nodes: Node[]): React.ReactNode {
  return nodes.map((n) => (
    <TreeView.Item key={n.id} itemId={n.id} label={n.label} icon={n.icon}>
      {n.children && render(n.children)}
    </TreeView.Item>
  ));
}

export default function TreeViewDemo() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <Surface>
      <Stack spacing={2} style={{ padding: theme.spacing(1) }}>
        <Typography variant="h2">Tree View</Typography>

        <Panel>
          <TreeView multiSelect onSelect={setSelected} defaultExpanded={["animals"]}>
            {render(data)}
          </TreeView>
        </Panel>

        <Typography variant="subtitle">Selected: {selected.join(', ') || 'none'}</Typography>
        <Button variant="outlined" onClick={toggleMode}>Toggle light / dark mode</Button>
        <Button size="lg" onClick={() => navigate(-1)} style={{ marginTop: theme.spacing(1) }}>
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// src/pages/ListDemoPage.tsx | valet
// Comprehensive live‑demo showcasing every <List/> feature & edge‑case
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import {
  Surface,
  Stack,
  Panel,
  Typography,
  Checkbox,
  Button,
  List,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo data                                                                  */
interface Character {
  name: string;
  role: string;
}

const INITIAL: Character[] = [
  { name: 'Sam Flynn', role: 'User of the Grid' },
  { name: 'Quorra', role: 'Isomorphic algorithm' },
  { name: 'Kevin Flynn', role: 'Creator of the Grid' },
  { name: 'Clu', role: 'System administrator' },
  { name: 'Rinzler', role: 'Elite enforcer' },
];

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function ListDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  /* Live state for demo controls ----------------------------------------- */
  const [items, setItems] = useState<Character[]>(INITIAL);
  const [striped, setStriped] = useState(true);
  const [hoverable, setHoverable] = useState(true);

  const orderLabel = useMemo(
    () => items.map((i) => i.name).join(' → '),
    [items],
  );

  return (
    <Surface>
      <NavDrawer />
      <Stack
        preset="showcaseStack"
      >
        {/* Header --------------------------------------------------------- */}
        <Typography variant="h2" bold>List Showcase</Typography>
        <Typography variant="subtitle">
          Drag‑and‑drop reordering, striped rows, hover states & more
        </Typography>

        {/* 1. Default list ------------------------------------------------ */}
        <Typography variant="h3">1. Default List</Typography>
        <List<Character>
          hoverable={true}
          data={INITIAL}
          getTitle={(c) => c.name}
        />

        {/* 2. striped & hoverable props ---------------------------------- */}
        <Typography variant="h3">2. <code>striped</code> & <code>hoverable</code></Typography>
        <Panel variant="alt" style={{ padding: theme.spacing(1) }}>
          <Stack direction="row" wrap={false}>
            <Checkbox
              label="striped"
              checked={striped}
              onChange={setStriped}
              name="striped"
            />
            <Checkbox
              label="hoverable"
              checked={hoverable}
              onChange={setHoverable}
              name="hoverable"
            />
          </Stack>

          <List<Character>
            data={INITIAL}
            striped={striped}
            hoverable={hoverable}
            getTitle={(c) => c.name}
          />
        </Panel>

        {/* 3. Title + subtitle ------------------------------------------- */}
        <Typography variant="h3">3. Subtitle rendering</Typography>
        <List<Character>
          data={INITIAL}
          striped
          hoverable
          getTitle={(c) => c.name}
          getSubtitle={(c) => c.role}
        />

        {/* 4. Live drag‑and‑drop reorder --------------------------------- */}
        <Typography variant="h3">4. onReorder callback</Typography>
        <Typography variant="subtitle">
          Drag rows to reorder – the label below updates instantly.
        </Typography>
        <List<Character>
          data={items}
          striped
          hoverable
          getTitle={(c) => c.name}
          onReorder={setItems}
        />
        <Typography variant="body">
          Current order:&nbsp;<code>{orderLabel}</code>
        </Typography>

        {/* 5. Theme validation ------------------------------------------- */}
        <Typography variant="h3">5. Theme coupling</Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Toggle light / dark mode
        </Button>

        {/* Back nav ------------------------------------------------------- */}
        <Button
          size="lg"
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}

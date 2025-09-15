// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/layout/ListDemoPage.tsx  | valet-docs
// Migrated to ComponentMetaPage – usage + playground
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import { Stack, Panel, Typography, List, Switch, Button, useTheme } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import ListMeta from '../../../../../src/components/layout/List.meta.json';

/*───────────────────────────────────────────────────────────*/
/* Demo data                                                */
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

export default function ListDemoPage() {
  const { toggleMode } = useTheme();

  // Playground state
  const [items, setItems] = useState<Character[]>(INITIAL);
  const [striped, setStriped] = useState(true);
  const [hoverable, setHoverable] = useState(true);
  const [selectable, setSelectable] = useState(true);
  const [reorderable, setReorderable] = useState(true);
  const [selected, setSelected] = useState<Character | null>(null);

  const orderLabel = useMemo(() => items.map((i) => i.name).join(' → '), [items]);
  const orderHint = `Order: ${orderLabel}`;

  /* Usage --------------------------------------------------------------- */
  const usageContent = (
    <Panel fullWidth>
      <List<Character>
        data={items}
        getTitle={(i) => i.name}
        getSubtitle={(i) => i.role}
        striped
        hoverable
      />
    </Panel>
  );

  /* Playground ---------------------------------------------------------- */
  const playgroundContent = (
    <Stack>
      <Panel
        variant='alt'
        fullWidth
      >
        <Stack
          direction='row'
          sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 12 }}
        >
          <Stack
            direction='row'
            sx={{ alignItems: 'center', gap: 6 }}
          >
            <Switch
              name='striped'
              checked={striped}
              onChange={setStriped}
            />
            <Typography>Striped</Typography>
          </Stack>
          <Stack
            direction='row'
            sx={{ alignItems: 'center', gap: 6 }}
          >
            <Switch
              name='hoverable'
              checked={hoverable}
              onChange={setHoverable}
            />
            <Typography>Hoverable</Typography>
          </Stack>
          <Stack
            direction='row'
            sx={{ alignItems: 'center', gap: 6 }}
          >
            <Switch
              name='selectable'
              checked={selectable}
              onChange={setSelectable}
            />
            <Typography>Selectable</Typography>
          </Stack>
          <Stack
            direction='row'
            sx={{ alignItems: 'center', gap: 6 }}
          >
            <Switch
              name='reorderable'
              checked={reorderable}
              onChange={setReorderable}
            />
            <Typography>Reorderable</Typography>
          </Stack>
          <Button
            variant='outlined'
            onClick={toggleMode}
          >
            Toggle light / dark
          </Button>
        </Stack>
      </Panel>

      <Panel fullWidth>
        <List<Character>
          data={items}
          getTitle={(i) => i.name}
          getSubtitle={(i) => i.role}
          striped={striped}
          hoverable={hoverable}
          selectable={selectable}
          reorderable={reorderable}
          selected={selected}
          onSelectionChange={(it) => setSelected(it)}
          onReorder={(it) => setItems(it)}
        />
      </Panel>
      <Typography variant='subtitle'>{orderHint}</Typography>
      <Typography variant='subtitle'>Selected: {selected?.name || '—'}</Typography>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='List'
      subtitle='Simple, flexible rows with selection and reorder.'
      slug='components/layout/list'
      meta={ListMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}

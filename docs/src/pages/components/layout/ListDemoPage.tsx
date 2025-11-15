// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/layout/ListDemoPage.tsx  | valet-docs
// Migrated to ComponentMetaPage – usage + playground
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import { Stack, Panel, Typography, List, Switch, Button, useTheme, Select } from '@archway/valet';
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
  const [focusMode, setFocusMode] = useState<'auto' | 'row' | 'none'>('auto');

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
        variant='outlined'
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
              onValueChange={(v) => setStriped(!!v)}
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
              onValueChange={(v) => setHoverable(!!v)}
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
              onValueChange={(v) => setSelectable(!!v)}
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
              onValueChange={(v) => setReorderable(!!v)}
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
        <Stack
          direction='row'
          sx={{ alignItems: 'center', gap: 6 }}
        >
          <Typography>Focus mode</Typography>
          <Select
            name='focusMode'
            value={focusMode}
            onValueChange={(v) => setFocusMode(v as 'auto' | 'row' | 'none')}
            sx={{ minWidth: '8rem' }}
          >
            <Select.Option value='auto'>auto</Select.Option>
            <Select.Option value='row'>row</Select.Option>
            <Select.Option value='none'>none</Select.Option>
          </Select>
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
          focusMode={focusMode}
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

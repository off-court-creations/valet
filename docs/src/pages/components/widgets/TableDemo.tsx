// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/TableDemo.tsx  | valet-docs
// Table docs using ComponentMetaPage (Usage, Playground, Examples, Reference)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import { Stack, Panel, TextField, Checkbox, IconButton, Table, useTheme } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import TableMeta from '../../../../../src/components/widgets/Table.meta.json';
import type { TableColumn } from '@archway/valet';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Sample-data helpers                                                         */
interface Person {
  id: number;
  name: string;
  age: number;
  city: string;
  join: Date;
}

const CITIES = ['Los Angeles', 'New York', 'Chicago', 'Austin', 'Seattle', 'Denver'] as const;

const NAMES = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Katherine Johnson',
  'Linus Torvalds',
  'Margaret Hamilton',
  'Tim Berners-Lee',
] as const;

/** Safe picker – always returns a concrete string */
const rand = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)] as T;

const makePeople = (n: number): Person[] =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: rand(NAMES),
    age: 18 + Math.floor(Math.random() * 50),
    city: rand(CITIES),
    join: new Date(Date.now() - Math.random() * 2.5e11),
  }));

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo component                                                              */
export default function TableDemoPage() {
  useTheme();

  /* UI controls ----------------------------------------------------------- */
  const [rows, setRows] = useState(30);
  const [striped, setStriped] = useState(true);
  const [hoverable, setHoverable] = useState(true);
  const [dividers, setDividers] = useState(true);
  const [selEnabled, setSelEnabled] = useState(false);
  const [multiSelect, setMultiSelect] = useState(false);

  const [seed, setSeed] = useState(0); // triggers fresh random data
  const handleRefresh = () => setSeed((s) => s + 1);

  /* Data & columns -------------------------------------------------------- */
  // Tie the memo to `seed` without affecting the argument value.
  const data = useMemo(() => makePeople(rows + (seed & 0)), [rows, seed]);

  const columns: TableColumn<Person>[] = useMemo(
    () => [
      { header: 'ID', accessor: 'id', align: 'right', sortable: true },
      { header: 'Name', accessor: 'name', sortable: true },
      { header: 'Age', accessor: 'age', align: 'right', sortable: true },
      { header: 'City', accessor: 'city', sortable: true },
      {
        header: 'Joined',
        accessor: 'join',
        align: 'right',
        sortable: true,
        render: (p) =>
          p.join.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
      },
    ],
    [],
  );

  /* Derive table-selection mode ------------------------------------------ */
  const selectable = selEnabled ? (multiSelect ? 'multi' : 'single') : undefined;

  // Minimal usage example ---------------------------------------------------
  const smallData = useMemo(() => makePeople(6), []);
  const smallCols: TableColumn<Person>[] = [
    { header: 'ID', accessor: 'id', align: 'right' },
    { header: 'Name', accessor: 'name' },
    { header: 'City', accessor: 'city' },
  ];
  const usageContent = (
    <Stack>
      <Panel fullWidth>
        <Table
          data={smallData}
          columns={smallCols}
          striped
          hoverable
          constrainHeight
        />
      </Panel>
    </Stack>
  );

  // Playground (full controls) ---------------------------------------------
  const playgroundContent = (
    <Stack>
      <Panel
        variant='alt'
        fullWidth
      >
        <Stack
          direction='row'
          sx={{ flexWrap: 'wrap', alignItems: 'flex-end' }}
        >
          <TextField
            as='input'
            type='number'
            name='rows'
            label='Rows'
            min={1}
            max={500}
            value={rows}
            onChange={(e) =>
              setRows(Math.max(1, Math.min(500, Number((e.target as HTMLInputElement).value))))
            }
            sx={{ width: 120 }}
          />

          <Checkbox
            name='striped'
            checked={striped}
            onChange={setStriped}
            label='Striped rows'
          />
          <Checkbox
            name='hover'
            checked={hoverable}
            onChange={setHoverable}
            label='Row hover'
          />
          <Checkbox
            name='lines'
            checked={dividers}
            onChange={setDividers}
            label='Column dividers'
          />

          <Checkbox
            name='enableSel'
            checked={selEnabled}
            onChange={(c) => {
              setSelEnabled(c);
              if (!c) setMultiSelect(false);
            }}
            label='Enable selection'
          />
          <Checkbox
            name='multiSel'
            checked={multiSelect}
            disabled={!selEnabled}
            onChange={setMultiSelect}
            label='Multi-select'
          />

          <IconButton
            aria-label='Refresh data'
            icon='mdi:refresh'
            onClick={handleRefresh}
          />
        </Stack>
      </Panel>
      <Panel fullWidth>
        <Table
          data={data}
          columns={columns}
          striped={striped}
          hoverable={hoverable}
          dividers={dividers}
          selectable={selectable}
          initialSort={{ index: 0 }}
          constrainHeight
        />
      </Panel>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Table'
      subtitle='Flexible data table with sorting, stripes, hover, and selection.'
      slug='components/widgets/table'
      meta={TableMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}

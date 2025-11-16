// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/TableDemo.tsx  | valet-docs
// Table docs using ComponentMetaPage (Usage, Playground, Examples, Reference)
// Updated to showcase smart height + pagination (minConstrainedRows/maxExpandedRows/paginate)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import {
  Stack,
  Panel,
  TextField,
  Checkbox,
  IconButton,
  Table,
  Typography,
  useTheme,
} from '@archway/valet';
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

  // Height + pagination controls --------------------------------------------
  const [constrainHeight, setConstrainHeight] = useState(true);
  const [minRows, setMinRows] = useState(4);
  const [maxRows, setMaxRows] = useState(30);
  const [paginate, setPaginate] = useState(false);
  const [windowSize, setWindowSize] = useState<number | undefined>(7);
  const [pageCtrl, setPageCtrl] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedUsageRows, setSelectedUsageRows] = useState<Person[]>([]);

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
    <Stack gap={1.5}>
      <Stack gap={0.5}>
        <Typography variant='h3'>1. Define columns + rows</Typography>
        <Typography>
          Create a typed array of <code>TableColumn&lt;T&gt;</code> definitions and pass data that
          always matches that shape. Memoising both inputs keeps expensive renders down when the
          surrounding page re-renders.
        </Typography>
        <Panel fullWidth>
          <Table
            data={smallData}
            columns={smallCols}
            striped
            hoverable
            dividers
          />
        </Panel>
      </Stack>

      <Stack gap={0.5}>
        <Typography variant='h3'>2. Let height adapt before paginating</Typography>
        <Typography>
          Opt into smart height with <code>constrainHeight</code>. If the surface would show fewer
          than <code>minConstrainedRows</code>, the table expands temporarily. Once the dataset is
          still larger than <code>maxExpandedRows</code>, pagination automatically takes over so the
          user never fights a tiny scrollbar.
        </Typography>
        <Panel fullWidth>
          <Table
            data={smallData}
            columns={smallCols}
            striped
            hoverable
            constrainHeight
            minConstrainedRows={4}
            maxExpandedRows={30}
          />
        </Panel>
      </Stack>

      <Stack gap={0.5}>
        <Typography variant='h3'>3. Enable selection when actions depend on rows</Typography>
        <Typography>
          Switch on <code>selectable</code> for row selection. The table maintains focus semantics
          for screen readers, and <code>onSelectionChange</code> keeps external state in sync.
        </Typography>
        <Panel fullWidth>
          <Stack gap={0.5}>
            <Table
              data={smallData}
              columns={smallCols}
              striped
              hoverable
              selectable='multi'
              onSelectionChange={setSelectedUsageRows}
            />
            <Typography>
              Selected IDs:{' '}
              {selectedUsageRows.length > 0
                ? selectedUsageRows.map((person) => person.id).join(', ')
                : 'none'}
            </Typography>
          </Stack>
        </Panel>
      </Stack>
    </Stack>
  );

  // Playground (full controls) ---------------------------------------------
  const playgroundContent = (
    <Stack>
      <Panel
        variant='outlined'
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
            onValueChange={(v) => setStriped(!!v)}
            label='Striped rows'
          />
          <Checkbox
            name='hover'
            checked={hoverable}
            onValueChange={(v) => setHoverable(!!v)}
            label='Row hover'
          />
          <Checkbox
            name='lines'
            checked={dividers}
            onValueChange={(v) => setDividers(!!v)}
            label='Column dividers'
          />

          <Checkbox
            name='constrainHeight'
            checked={constrainHeight}
            onValueChange={(v) => setConstrainHeight(!!v)}
            label='Constrain height'
          />

          <TextField
            as='input'
            type='number'
            name='minRows'
            label='minConstrainedRows'
            min={1}
            max={20}
            value={minRows}
            onChange={(e) =>
              setMinRows(Math.max(1, Math.min(20, Number((e.target as HTMLInputElement).value))))
            }
            sx={{ width: 180 }}
          />
          <TextField
            as='input'
            type='number'
            name='maxRows'
            label='maxExpandedRows'
            min={5}
            max={500}
            value={maxRows}
            onChange={(e) =>
              setMaxRows(Math.max(5, Math.min(500, Number((e.target as HTMLInputElement).value))))
            }
            sx={{ width: 180 }}
          />

          <Checkbox
            name='paginate'
            checked={paginate}
            onValueChange={(v) => setPaginate(!!v)}
            label='Force pagination'
          />
          <TextField
            as='input'
            type='number'
            name='window'
            label='paginationWindow'
            min={3}
            max={15}
            value={windowSize ?? ''}
            onChange={(e) => {
              const v = Number((e.target as HTMLInputElement).value);
              setWindowSize(Number.isFinite(v) ? Math.max(3, Math.min(15, v)) : undefined);
            }}
            sx={{ width: 190 }}
          />

          <Checkbox
            name='pageCtrl'
            checked={pageCtrl}
            onValueChange={(c) => {
              setPageCtrl(!!c);
              if (!c) setPage(1);
            }}
            label='Control page externally'
          />
          <TextField
            as='input'
            type='number'
            name='page'
            label='page'
            min={1}
            max={Math.max(1, Math.ceil(rows / Math.max(1, maxRows)))}
            value={page}
            disabled={!pageCtrl}
            onChange={(e) => setPage(Math.max(1, Number((e.target as HTMLInputElement).value)))}
            sx={{ width: 120 }}
          />

          <Checkbox
            name='enableSel'
            checked={selEnabled}
            onValueChange={(c) => {
              setSelEnabled(!!c);
              if (!c) setMultiSelect(false);
            }}
            label='Enable selection'
          />
          <Checkbox
            name='multiSel'
            checked={multiSelect}
            disabled={!selEnabled}
            onValueChange={(v) => setMultiSelect(!!v)}
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
        <Typography
          variant='subtitle'
          sx={{ marginBottom: 8 }}
        >
          Smart height: when fewer than <code>minConstrainedRows</code> would be visible in the
          constrained viewport, the table avoids a tiny scroller. If total rows exceed
          <code>maxExpandedRows</code>, it paginates with that many rows per page. Toggle
          <code>Force pagination</code> to always paginate regardless of viewport.
        </Typography>
        <Table
          data={data}
          columns={columns}
          striped={striped}
          hoverable={hoverable}
          dividers={dividers}
          selectable={selectable}
          initialSort={{ index: 0 }}
          constrainHeight={constrainHeight}
          minConstrainedRows={minRows}
          maxExpandedRows={maxRows}
          paginate={paginate}
          {...(windowSize !== undefined ? { paginationWindow: windowSize } : {})}
          {...(pageCtrl ? { page, onPageChange: setPage } : {})}
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

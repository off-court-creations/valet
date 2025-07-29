// ─────────────────────────────────────────────────────────────
// src/pages/components/Table.tsx | valet
// Interactive Table component docs with usage/reference layout
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Typography,
  Tabs,
  Table,
  Button,
  useTheme,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../components/NavDrawer';

interface Person {
  id: number;
  name: string;
  age: number;
  city: string;
}

const data: Person[] = [
  { id: 1, name: 'Ada Lovelace', age: 36, city: 'London' },
  { id: 2, name: 'Alan Turing', age: 41, city: 'London' },
  { id: 3, name: 'Grace Hopper', age: 39, city: 'New York' },
  { id: 4, name: 'Linus Torvalds', age: 54, city: 'Helsinki' },
];

const columns: TableColumn<Person>[] = [
  { header: 'ID', accessor: 'id', align: 'right' },
  { header: 'Name', accessor: 'name', sortable: true },
  { header: 'Age', accessor: 'age', align: 'right', sortable: true },
  { header: 'City', accessor: 'city' },
];

export default function TablePage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  interface Row {
    prop: ReactNode;
    type: ReactNode;
    default: ReactNode;
    description: ReactNode;
  }

  const refCols: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const refData: Row[] = [
    {
      prop: <code>data</code>,
      type: <code>T[]</code>,
      default: <code>-</code>,
      description: 'Rows to display',
    },
    {
      prop: <code>columns</code>,
      type: <code>TableColumn&lt;T&gt;[]</code>,
      default: <code>-</code>,
      description: 'Column definitions',
    },
    {
      prop: <code>striped</code>,
      type: <code>boolean</code>,
      default: <code>true</code>,
      description: 'Apply zebra striping',
    },
    {
      prop: <code>hoverable</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Highlight row on hover',
    },
    {
      prop: <code>dividers</code>,
      type: <code>boolean</code>,
      default: <code>true</code>,
      description: 'Show column dividers',
    },
    {
      prop: <code>selectable</code>,
      type: <code>'single' | 'multi'</code>,
      default: <code>-</code>,
      description: 'Enable row selection',
    },
    {
      prop: <code>initialSort</code>,
      type: <code>{'{'} index: number; desc?: boolean {'}'}</code>,
      default: <code>-</code>,
      description: 'Starting sort column',
    },
    {
      prop: <code>onSortChange</code>,
      type: <code>(i: number, d: boolean) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Notify sort changes',
    },
    {
      prop: <code>onSelectionChange</code>,
      type: <code>(rows: T[]) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Notify row selection',
    },
    {
      prop: <code>constrainHeight</code>,
      type: <code>boolean</code>,
      default: <code>true</code>,
      description: 'Fit within surface height',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>
          Table
        </Typography>
        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Stack>
              <Typography variant="subtitle">
                Sortable data table with optional row selection.
              </Typography>
              <Typography variant="h3">Basic table</Typography>
              <Table
                data={data}
                columns={columns}
                striped
                hoverable
                dividers
              />
            </Stack>
          </Tabs.Panel>
          <Tabs.Tab label="Reference" />
          <Tabs.Panel>
            <Table data={refData} columns={refCols} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>
        <Button
          size="lg"
          onClick={() => navigate('/table-demo')}
          style={{ marginTop: theme.spacing(1) }}
        >
          View Example →
        </Button>
      </Stack>
    </Surface>
  );
}

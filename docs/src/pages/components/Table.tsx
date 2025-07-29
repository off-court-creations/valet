// ─────────────────────────────────────────────────────────────
// src/pages/components/Table.tsx | valet
// Documentation page for Table component
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

export default function TablePage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  interface Person {
    id: number;
    name: string;
    age: number;
  }

  const columns: TableColumn<Person>[] = [
    { header: 'ID', accessor: 'id', align: 'right', sortable: true },
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Age', accessor: 'age', align: 'right', sortable: true },
  ];

  const rows: Person[] = [
    { id: 1, name: 'Ada Lovelace', age: 36 },
    { id: 2, name: 'Grace Hopper', age: 85 },
    { id: 3, name: 'Alan Turing', age: 41 },
  ];

  interface Row {
    prop: ReactNode;
    type: ReactNode;
    default: ReactNode;
    description: ReactNode;
  }

  const refColumns: TableColumn<Row>[] = [
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
      description: 'Table rows',
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
      description: 'Zebra stripe rows',
    },
    {
      prop: <code>hoverable</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Highlight rows on hover',
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
      type: <code>{`{ index: number; desc?: boolean }`}</code>,
      default: <code>-</code>,
      description: 'Default sort column',
    },
    {
      prop: <code>onSortChange</code>,
      type: <code>(i: number, d: boolean) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Sort callback',
    },
    {
      prop: <code>onSelectionChange</code>,
      type: <code>(rows: T[]) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Selection callback',
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
        <Typography variant="subtitle">Sortable and selectable data grid</Typography>
        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Stack>
              <Typography>
                Provide an array of rows via <code>data</code> and describe each column with <code>columns</code>.
              </Typography>
              <Typography variant="h3">Basic Table</Typography>
              <Table
                data={rows}
                columns={columns}
                hoverable
                selectable="single"
              />
              <Button variant="outlined" onClick={toggleMode} style={{ marginTop: theme.spacing(1) }}>
                Toggle light / dark mode
              </Button>
            </Stack>
          </Tabs.Panel>
          <Tabs.Tab label="Reference" />
          <Tabs.Panel>
            <Table data={refData} columns={refColumns} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>
        <Button size="lg" onClick={() => navigate('/table-demo')} style={{ marginTop: theme.spacing(1) }}>
          View Demo →
        </Button>
      </Stack>
    </Surface>
  );
}


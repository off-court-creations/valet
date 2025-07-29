// src/pages/PaginationDemo.tsx
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Pagination,
  useTheme,
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function PaginationDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  interface Row {
    prop: ReactNode;
    type: ReactNode;
    default: ReactNode;
    description: ReactNode;
  }

  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const data: Row[] = [
    {
      prop       : <code>count</code>,
      type       : <code>number</code>,
      default    : <code>1</code>,
      description: 'Total pages',
    },
    {
      prop       : <code>page</code>,
      type       : <code>number</code>,
      default    : <code>1</code>,
      description: 'Current page',
    },
    {
      prop       : <code>onChange</code>,
      type       : <code>(p: number) =&gt; void</code>,
      default    : <code>-</code>,
      description: 'Change handler',
    },
    {
      prop       : <code>preset</code>,
      type       : <code>string | string[]</code>,
      default    : <code>-</code>,
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>Pagination Showcase</Typography>
        <Typography variant="subtitle">Controlled page selection</Typography>

        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Stack>
              <Pagination count={5} page={page} onChange={setPage} />
              <Typography variant="body">Current page: {page}</Typography>
              <Button variant="outlined" onClick={toggleMode}>
                Toggle light / dark
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label="Reference" />
          <Tabs.Panel>
            <Typography variant="h3">Prop reference</Typography>
            <Table data={data} columns={columns} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>

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

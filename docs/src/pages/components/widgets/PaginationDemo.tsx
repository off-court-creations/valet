// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/PaginationDemo.tsx  | valet-docs
// Production docs layout for Pagination: Usage / Playground / Reference
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Surface, Stack, Typography, Tabs, Table, Iterator, Pagination } from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import NavDrawer from '../../../components/NavDrawer';

export default function PaginationDemoPage() {
  const [usagePage, setUsagePage] = useState(1);
  const [count, setCount] = useState<number>(7);
  const [page, setPage] = useState<number>(3);

  type Row = {
    prop: React.ReactNode;
    type: React.ReactNode;
    default: React.ReactNode;
    description: React.ReactNode;
  };

  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const rows: Row[] = [
    {
      prop: <code>count</code>,
      type: <code>number</code>,
      default: <code>-</code>,
      description: <>Total number of pages (≥ 1).</>,
    },
    {
      prop: <code>page</code>,
      type: <code>number</code>,
      default: <code>1</code>,
      description: <>Currently selected page (1-based). Controlled component.</>,
    },
    {
      prop: <code>onChange</code>,
      type: <code>(page: number) =&gt; void</code>,
      default: <code>-</code>,
      description: <>Called with the next page when a page button is clicked.</>,
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: (
        <>
          Apply style presets registered via <code>definePreset()</code>.
        </>
      ),
    },
    {
      prop: <code>HTML nav props</code>,
      type: <code>React.ComponentProps&lt;&apos;nav&apos;&gt;</code>,
      default: <code>-</code>,
      description: (
        <>
          Standard attributes pass through to the root <code>nav</code> element (e.g.,{' '}
          <code>id</code>, <code>role</code>, <code>aria-*</code>, <code>className</code>,{' '}
          <code>style</code>).
        </>
      ),
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Pagination
        </Typography>
        <Typography variant='subtitle'>
          Controlled page selection with animated active underline
        </Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Typography variant='h3'>Controlled Pagination</Typography>
              <Pagination
                count={5}
                page={usagePage}
                onChange={setUsagePage}
              />
              <Typography>Current page: {usagePage}</Typography>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Playground' />
          <Tabs.Panel>
            <Stack gap={1}>
              <Stack
                direction='row'
                wrap={false}
                gap={1}
              >
                <Stack gap={0.25}>
                  <Typography variant='subtitle'>count</Typography>
                  <Iterator
                    width={160}
                    min={1}
                    max={20}
                    step={1}
                    value={count}
                    onChange={(n) => {
                      setCount(n);
                      setPage((p) => Math.min(n, Math.max(1, p)));
                    }}
                    aria-label='count'
                  />
                </Stack>
              </Stack>

              <Pagination
                count={count}
                page={page}
                onChange={setPage}
              />
              <Typography>Current page: {page}</Typography>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Table
              data={rows}
              columns={columns}
              constrainHeight={false}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Surface>
  );
}

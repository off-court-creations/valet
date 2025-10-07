// ─────────────────────────────────────────────────────────────
// src/pages/examples/ComponentQCLab.tsx  | valet-docs
// A dense playground with a top "Hero" slot for focused QC
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Grid,
  Panel,
  Box,
  Typography,
  Table,
  type TableColumn,
  List,
  Markdown,
  Image,
  Tabs,
  Button,
} from '@archway/valet';
// (no querystring logic; swap the hero in code directly)

import NavDrawer from '../../components/NavDrawer';

type Order = {
  id: string;
  customer: string;
  total: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
};

const customerNames = ['Alice', 'Bob', 'Chloe', 'Diego', 'Eve', 'Fay', 'Gus'] as const;
const orderStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'] as const;

const orders: Order[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `ORD-${1000 + i}`,
  customer: customerNames[i % customerNames.length]!,
  total: Math.round(50 + Math.random() * 950),
  status: orderStatuses[i % orderStatuses.length]!,
}));

const orderCols: TableColumn<Order>[] = [
  { header: 'Order #', accessor: 'id' },
  { header: 'Customer', accessor: 'customer' },
  { header: 'Total ($)', render: (r) => r.total.toLocaleString() },
  { header: 'Status', accessor: 'status' },
];

const tasks = [
  { t: 'Write docs on spacing contract', s: 'High priority' },
  { t: 'Audit a11y focus rings', s: 'Component sweep' },
  { t: 'Refine Table zebra/hover tokens', s: 'Visual polish' },
  { t: 'LLMChat prompt helpers', s: 'Product iteration' },
  { t: 'Add density demos', s: 'Docs' },
];

const md = `
### QC Playground Notes

- This page places a single "Hero" component within a busy layout to
  verify spacing, focus, density, and contrast under stress.
- Swap the hero component in code by editing the HeroSlot below.

> Keep behaviour close to defaults to reveal baseline ergonomics.
`;

function HeroSlot() {
  return (
    <Panel variant='alt'>
      <Stack>
        <Typography
          variant='h4'
          bold
        >
          Component Under Test
        </Typography>
        <Box
          background='var(--valet-bg)'
          sx={{
            border: '1px dashed var(--valet-border)',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <Typography
            variant='subtitle'
            sx={{ opacity: 0.8 }}
          >
            Hero Slot
          </Typography>
          <Typography>Replace this with the component under test.</Typography>
        </Box>
      </Stack>
    </Panel>
  );
}

export default function ComponentQCLab() {
  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Component QC Playground
        </Typography>
        <Typography variant='subtitle'>
          Stress-test a single hero component within a busy, mixed-content layout.
        </Typography>

        {/* Top row: Hero slot spans full width */}
        <Grid
          columns={1}
          adaptive
        >
          <HeroSlot />
        </Grid>

        {/* Surrounding layout – intentionally varied to exercise spacing + density */}
        <Grid
          columns={3}
          adaptive
        >
          <Panel>
            <Tabs>
              <Tabs.Tab>Gallery</Tabs.Tab>
              <Tabs.Tab>Notes</Tabs.Tab>
              <Tabs.Panel>
                <Grid columns={3}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <Image
                      key={n}
                      src={`https://picsum.photos/seed/qc-${n}/300/200`}
                      alt={`qc-${n}`}
                      sx={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  ))}
                </Grid>
              </Tabs.Panel>
              <Tabs.Panel>
                <Stack>
                  <Typography bold>Scratchpad</Typography>
                  <Markdown data={'- [ ] Edge cases\n- [x] Focus order\n- [ ] Density sweep'} />
                  <Button variant='outlined'>Export</Button>
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </Panel>

          <Panel variant='alt'>
            <Typography
              variant='h5'
              bold
            >
              KPIs
            </Typography>
            <Stack
              direction='row'
              wrap
            >
              {[
                ['Revenue', '$84,223'],
                ['Users', '12,450'],
                ['Tickets', '142'],
                ['Latency', '112ms'],
              ].map(([label, value], i) => (
                <Box
                  key={i}
                  background='var(--valet-bg)'
                  sx={{ minWidth: '12rem', flex: '1 1 auto' }}
                >
                  <Typography variant='subtitle'>{label}</Typography>
                  <Typography
                    variant='h4'
                    bold
                  >
                    {value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Panel>

          <Panel>
            <Typography
              variant='h4'
              bold
            >
              Release Notes
            </Typography>
            <Markdown data={md} />
          </Panel>

          <Panel>
            <Typography
              variant='h4'
              bold
            >
              Team Tasks
            </Typography>
            <List
              data={tasks}
              getTitle={(x) => x.t}
              getSubtitle={(x) => x.s}
              striped
              hoverable
              sx={{ marginTop: '0.5rem' }}
            />
          </Panel>

          <Panel>
            <Typography
              variant='h4'
              bold
            >
              Recent Orders
            </Typography>
            <Table<Order>
              data={orders}
              columns={orderCols}
              striped
              hoverable
              dividers
              constrainHeight
              sx={{ marginTop: '0.5rem' }}
            />
          </Panel>

          <Panel variant='alt'>
            <Typography
              variant='h5'
              bold
            >
              Info
            </Typography>
            <Typography>
              The hero slot lives above, surrounded by varied widgets to simulate real pages.
              Replace the slot with any component under test to check layout and a11y in context.
            </Typography>
          </Panel>
        </Grid>
      </Stack>
    </Surface>
  );
}

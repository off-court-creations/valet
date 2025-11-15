// ─────────────────────────────────────────────────────────────
// src/pages/ComplicatedDashboard.tsx  | valet-docs
// A dense, mixed-content dashboard showcasing valet's spacing/nesting
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

import NavDrawer from '../../components/NavDrawer';

type Order = {
  id: string;
  customer: string;
  total: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
};

const customerNames = ['Alice', 'Bob', 'Chloe', 'Diego', 'Eve', 'Fay', 'Gus'] as const;
const orderStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'] as const;

const orders: Order[] = Array.from({ length: 12 }).map((_, i) => ({
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
### Release Notes (Excerpt)

- Density-driven spacing via \
  \
  \
  
  
  \`--valet-space\` and \`theme.spacing(n)\`.
- New \`Space\`/\`SpacingProps\` for ergonomics.
- Consistent defaults: \`gap=1\`, \`pad=1\` in layout components.

> This page demonstrates mixed widgets with minimal prop tweaking.
`;

export default function ComplicatedDashboard() {
  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Complicated Dashboard
        </Typography>
        <Typography variant='subtitle'>
          Mixed content assembled with default spacing — no custom CSS.
        </Typography>

        <Grid
          columns={3}
          adaptive
        >
          <Panel variant='outlined'>
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
            <Tabs>
              <Tabs.Tab>Gallery</Tabs.Tab>
              <Tabs.Tab>Notes</Tabs.Tab>
              <Tabs.Panel>
                <Grid columns={3}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <Image
                      key={n}
                      src={`https://picsum.photos/seed/${n}/300/200`}
                      alt={`random-${n}`}
                      sx={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  ))}
                </Grid>
              </Tabs.Panel>
              <Tabs.Panel>
                <Stack>
                  <Typography bold>Scratchpad</Typography>
                  <Markdown data={'- [ ] Design review\n- [x] Fix spacing\n- [ ] Prep release'} />
                  <Button variant='outlined'>Export</Button>
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </Panel>

          <Panel variant='outlined'>
            <Typography
              variant='h5'
              bold
            >
              Info
            </Typography>
            <Typography>
              Panels, Stacks, Tabs, and Grids intentionally share defaults to compose cleanly.
              Density changes will scale numeric spacing uniformly.
            </Typography>
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
              Release Notes
            </Typography>
            <Markdown data={md} />
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
        </Grid>
      </Stack>
    </Surface>
  );
}

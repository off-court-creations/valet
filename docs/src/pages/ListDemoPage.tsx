// ─────────────────────────────────────────────────────────────────────────────
// src/pages/ListDemoPage.tsx | valet-docs
// List usage, playground, and reference (like Box docs)
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import {
  Surface,
  Stack,
  Panel,
  Typography,
  List,
  Tabs,
  Table,
  Switch,
  Button,
  useTheme,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import CodeBlock from '../components/CodeBlock';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo data                                                                  */
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

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function ListDemoPage() {
  const { theme, toggleMode } = useTheme();

  // Playground state
  const [items, setItems] = useState<Character[]>(INITIAL);
  const [striped, setStriped] = useState(true);
  const [hoverable, setHoverable] = useState(true);
  const [selectable, setSelectable] = useState(true);
  const [reorderable, setReorderable] = useState(true);
  const [selected, setSelected] = useState<Character | null>(null);

  const orderLabel = useMemo(() => items.map((i) => i.name).join(' → '), [items]);

  // Reference table
  interface Row {
    prop: React.ReactNode;
    type: React.ReactNode;
    def: React.ReactNode;
    description: React.ReactNode;
  }
  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'def' },
    { header: 'Description', accessor: 'description' },
  ];
  const data: Row[] = [
    {
      prop: <code>data</code>,
      type: <code>T[]</code>,
      def: <code>-</code>,
      description: 'Items to render.',
    },
    {
      prop: <code>getTitle</code>,
      type: <code>(item: T) =&gt; ReactNode</code>,
      def: <code>-</code>,
      description: 'Primary content for each row.',
    },
    {
      prop: <code>getSubtitle</code>,
      type: <code>(item: T) =&gt; ReactNode</code>,
      def: <code>-</code>,
      description: 'Optional secondary line for each row.',
    },
    {
      prop: <code>striped</code>,
      type: <code>boolean</code>,
      def: <code>false</code>,
      description: 'Apply zebra striping.',
    },
    {
      prop: <code>hoverable</code>,
      type: <code>boolean</code>,
      def: <code>!striped</code>,
      description: 'Hover tint. Enabled by default for non‑striped lists.',
    },
    {
      prop: <code>reorderable</code>,
      type: <code>boolean</code>,
      def: <code>true</code>,
      description: 'Enable drag‑and‑drop reordering. When false, drag is disabled.',
    },
    {
      prop: <code>selectable</code>,
      type: <code>boolean</code>,
      def: <code>false</code>,
      description: 'Enable single selection. Click or drag to select the active item.',
    },
    {
      prop: <code>selected</code>,
      type: <code>T | null</code>,
      def: <code>-</code>,
      description: 'Controlled selected item (by reference).',
    },
    {
      prop: <code>defaultSelected</code>,
      type: <code>T | null</code>,
      def: <code>null</code>,
      description: 'Uncontrolled initial selected item.',
    },
    {
      prop: <code>onSelectionChange</code>,
      type: <code>(item: T, index: number) =&gt; void</code>,
      def: <code>-</code>,
      description: 'Fires on selection change (click or drag‑select).',
    },
    {
      prop: <code>onReorder</code>,
      type: <code>(items: T[]) =&gt; void</code>,
      def: <code>-</code>,
      description: 'Fires after a drag operation ends with the new order.',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      def: <code>-</code>,
      description: 'Apply style presets.',
    },
    {
      prop: <code>HTML ul props</code>,
      type: (
        <code>Omit&lt;React.HTMLAttributes&lt;HTMLUListElement&gt;, 'children'&gt;</code>
      ),
      def: <code>-</code>,
      description:
        "Standard HTML attributes for <ul> (excluding 'children') pass through.",
    },
  ];

  const usage = `import { List } from '@archway/valet';

type Person = { name: string; role?: string };
const data: Person[] = [
  { name: 'Sam Flynn', role: 'User of the Grid' },
  { name: 'Quorra', role: 'ISO' },
];

// Selectable, reorderable list
<List<Person>
  data={data}
  selectable
  reorderable
  getTitle={(p) => p.name}
  getSubtitle={(p) => p.role}
  onSelectionChange={(item, idx) => console.log('selected', item, idx)}
  onReorder={(items) => console.log('order', items)}
/>`;

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          List Showcase
        </Typography>
        <Typography variant='subtitle'>
          Selectable list with optional drag‑and‑drop reordering
        </Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Typography variant='h3'>1. Example</Typography>
              <List<Character>
                data={INITIAL}
                striped
                hoverable
                selectable
                getTitle={(c) => c.name}
                getSubtitle={(c) => c.role}
              />

              <Typography variant='h3'>2. Code</Typography>
              <CodeBlock
                fullWidth
                code={usage}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Playground' />
          <Tabs.Panel>
            <Stack gap={1}>
              <Stack
                direction='row'
                wrap={false}
                gap={1}
                style={{ alignItems: 'center' }}
              >
                <Typography variant='subtitle'>striped</Typography>
                <Switch
                  checked={striped}
                  onChange={setStriped}
                  aria-label='Toggle striped'
                />

                <Typography variant='subtitle'>hoverable</Typography>
                <Switch
                  checked={hoverable}
                  onChange={setHoverable}
                  aria-label='Toggle hoverable'
                />

                <Typography variant='subtitle'>selectable</Typography>
                <Switch
                  checked={selectable}
                  onChange={setSelectable}
                  aria-label='Toggle selectable'
                />

                <Typography variant='subtitle'>reorderable</Typography>
                <Switch
                  checked={reorderable}
                  onChange={setReorderable}
                  aria-label='Toggle reorderable'
                />
              </Stack>

              <Panel variant='alt'>
                <List<Character>
                  data={items}
                  striped={striped}
                  hoverable={hoverable}
                  selectable={selectable}
                  reorderable={reorderable}
                  getTitle={(c) => c.name}
                  getSubtitle={(c) => c.role}
                  onSelectionChange={(item) => setSelected(item)}
                  onReorder={setItems}
                />
              </Panel>

              {reorderable && (
                <Typography variant='body'>
                  Current order:&nbsp;<code>{orderLabel}</code>
                </Typography>
              )}
              {selectable && (
                <Typography variant='body'>
                  Selected:&nbsp;<code>{selected ? selected.name : 'None'}</code>
                </Typography>
              )}
              <Button
                variant='outlined'
                onClick={toggleMode}
              >
                Toggle light / dark mode
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Table
              data={data}
              columns={columns}
              constrainHeight={false}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Surface>
  );
}

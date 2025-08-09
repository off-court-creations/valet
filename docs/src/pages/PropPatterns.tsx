// ─────────────────────────────────────────────────────────────
// src/pages/PropPatterns.tsx  | valet
// Getting started usage page
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Button, Table } from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import { useNavigate } from 'react-router-dom';

export default function UsagePage() {
  const navigate = useNavigate();

  interface Row {
    prop: React.ReactNode;
    purpose: React.ReactNode;
    components: React.ReactNode;
  }

  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Purpose', accessor: 'purpose' },
    { header: 'Components', accessor: 'components' },
  ];

  const data: Row[] = [
    {
      prop: <code>preset</code>,
      purpose: 'Apply named style presets',
      components: "All components (besides Surface's internal LoadingBackdrop)",
    },
    {
      prop: <code>size</code>,
      purpose: (
        <p>
          <b>"xs", "sm", "md", "lg", "xl"</b> em-based tokens. Other <code>STRING</code> values are
          treated as CSS like <b>"24px"</b> or <b>"3em"</b>
        </p>
      ),
      components:
        'Avatar, Button, Icon, IconButton, Checkbox, RadioGroup, Select, Slider, Progress',
    },
    {
      prop: <code>variant</code>,
      purpose: 'Switch visual style',
      components: 'Button, IconButton, Panel, Modal, Progress, Typography, Tree',
    },
    {
      prop: <code>color</code>,
      purpose: 'Override theme colours',
      components: 'Progress, Icon, AppBar, Button',
    },
    {
      prop: <code>fullWidth</code>,
      purpose: 'Stretch to fill parent width',
      components: 'Panel, Button, Modal',
    },
    {
      prop: <code>compact</code>,
      purpose: 'Remove default spacing',
      components: 'Box, Panel, Stack',
    },
    {
      prop: <code>centered</code>,
      purpose: 'Center content or text',
      components: 'Box, Typography, Panel',
    },
    {
      prop: <code>open</code>,
      purpose: 'Controlled visibility (with defaultOpen)',
      components: 'Accordion, Modal, Drawer, Snackbar, Tooltip',
    },
    {
      prop: <code>constrainHeight</code>,
      purpose: 'Clamp height using Surface metrics',
      components: 'Accordion, LLMChat, Table',
    },
    {
      prop: <code>value</code>,
      purpose: 'Controlled value (with defaultValue)',
      components: 'Slider, Select, Checkbox, Switch, RadioGroup, TextField',
    },
    {
      prop: <code>orientation</code>,
      purpose: 'Horizontal or vertical layout',
      components: 'Stack, Tabs, SpeedDial',
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
          Property Patterns
        </Typography>
        <Typography>
          Many props repeat across components. Use this table as a quick reference for the most
          common patterns.
        </Typography>
        <Table
          data={data}
          columns={columns}
          constrainHeight={false}
        />
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}

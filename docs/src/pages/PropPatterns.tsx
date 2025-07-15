// ─────────────────────────────────────────────────────────────
// src/pages/PropPatterns.tsx  | valet
// Getting started usage page
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Typography,
  Button,
  Table,
} from '@archway/valet';
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
      components: 'All components',
    },
    {
      prop: <code>size</code>,
      purpose: 'Control geometry (sm / md / lg …)',
      components:
        'Avatar, Button, Icon, IconButton, Checkbox, RadioGroup, Select, Slider, Progress, SpeedDial',
    },
    {
      prop: <code>variant</code>,
      purpose: 'Switch visual style',
      components: 'Panel, Button, Progress, Modal, Typography, Tabs',
    },
    {
      prop: <code>color</code>,
      purpose: 'Override theme colours',
      components: 'Box, Panel, Button, AppBar, Icon, Progress, Video',
    },
    {
      prop: <code>fullWidth</code>,
      purpose: 'Stretch to fill parent width',
      components: 'Panel, Button, Modal, Chat',
    },
    {
      prop: <code>compact</code>,
      purpose: 'Remove default spacing',
      components: 'Box, Panel, Stack, Chat',
    },
    {
      prop: <code>centered</code>,
      purpose: 'Center content or text',
      components: 'Box, Typography',
    },
    {
      prop: <code>open</code>,
      purpose: 'Controlled visibility (with defaultOpen)',
      components: 'Accordion, Modal, Drawer, Snackbar, Tooltip',
    },
    {
      prop: <code>constrainHeight</code>,
      purpose: 'Clamp height using Surface metrics',
      components: 'Accordion, Chat, Table',
    },
    {
      prop: <code>value</code>,
      purpose: 'Controlled value (with defaultValue)',
      components:
        'Slider, Select, Checkbox, Switch, RadioGroup, DateTimePicker, TextField',
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
      <Stack preset="showcaseStack">
        <Typography variant="h2" bold>Property Patterns</Typography>
        <Typography>
          Many props repeat across components. Use this table as a quick
          reference for the most common patterns.
        </Typography>
        <Table data={data} columns={columns} constrainHeight={false} />
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}

// ─────────────────────────────────────────────────────────────
// src/pages/MetroSelectDemo.tsx | valet
// Showcase of MetroSelect component
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  MetroSelect,
  Tabs,
  Table,
  useTheme,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function MetroSelectDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

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
      prop: <code>value</code>,
      type: <code>string | number</code>,
      default: <code>-</code>,
      description: 'Controlled value',
    },
    {
      prop: <code>defaultValue</code>,
      type: <code>string | number</code>,
      default: <code>-</code>,
      description: 'Uncontrolled initial value',
    },
    {
      prop: <code>gap</code>,
      type: <code>number | string</code>,
      default: <code>4</code>,
      description: 'Spacing between tiles (theme units if number)',
    },
    {
      prop: <code>onChange</code>,
      type: <code>(val: Primitive) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Change handler',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: 'Apply style presets',
    },
    {
      prop: <code>children</code>,
      type: <code>React.ReactNode</code>,
      default: <code>-</code>,
      description: 'MetroSelect.Option elements',
    },
  ];

  const optionColumns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const optionData: Row[] = [
    {
      prop: <code>value</code>,
      type: <code>string | number</code>,
      default: <code>-</code>,
      description: 'Value for selection',
    },
    {
      prop: <code>icon</code>,
      type: <code>string | ReactElement</code>,
      default: <code>-</code>,
      description: 'Icon element or Iconify name',
    },
    {
      prop: <code>label</code>,
      type: <code>React.ReactNode</code>,
      default: <code>-</code>,
      description: 'Text displayed below the icon',
    },
    {
      prop: <code>disabled</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Disable selection',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: 'Apply style presets',
    },
  ];

  // Sample option lists -------------------------------------------------
  const basic = [
    { icon: 'mdi:home', label: 'Home', value: 'home' },
    { icon: 'mdi:briefcase', label: 'Work', value: 'work', disabled: true },
    { icon: 'mdi:airplane', label: 'Travel', value: 'travel' },
  ];

  const [transport, setTransport] = useState('car');
  const controlled = [
    { icon: 'mdi:car', label: 'Car', value: 'car' },
    { icon: 'mdi:bike', label: 'Bike', value: 'bike' },
    { icon: 'mdi:train', label: 'Train', value: 'train' },
  ];

  const many = [
    { icon: 'mdi:home', value: 'home', label: 'Home' },
    { icon: 'mdi:briefcase', value: 'work', label: 'Work' },
    { icon: 'mdi:airplane', value: 'travel', label: 'Travel' },
    { icon: 'mdi:school', value: 'school', label: 'School' },
    { icon: 'mdi:cog', value: 'settings', label: 'Settings' },
    { icon: 'mdi:information', value: 'info', label: 'Info' },
    { icon: 'mdi:music', value: 'music', label: 'Music' },
    { icon: 'mdi:film', value: 'film', label: 'Film' },
    { icon: 'mdi:email', value: 'email', label: 'Email' },
    { icon: 'mdi:message', value: 'chat', label: 'Chat' },
    { icon: 'mdi:camera', value: 'camera', label: 'Camera' },
    { icon: 'mdi:gamepad-variant', value: 'games', label: 'Games' },
    { icon: 'mdi:phone', value: 'phone', label: 'Phone' },
    { icon: 'mdi:wifi', value: 'wifi', label: 'WiFi' },
    { icon: 'mdi:bluetooth', value: 'bt', label: 'Bluetooth' },
    { icon: 'mdi:power', value: 'power', label: 'Power' },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          MetroSelect
        </Typography>
        <Typography variant='subtitle'>Touch-friendly grid selection</Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography variant='h3'>1. Uncontrolled</Typography>
            <MetroSelect
              defaultValue='home'
              gap={4}
            >
              {basic.map((o) => (
                <MetroSelect.Option
                  key={o.value}
                  {...o}
                />
              ))}
            </MetroSelect>

            <Typography variant='h3'>2. Controlled value</Typography>
            <MetroSelect
              value={transport}
              onChange={(v) => setTransport(v as string)}
              gap={4}
            >
              {controlled.map((o) => (
                <MetroSelect.Option
                  key={o.value}
                  {...o}
                />
              ))}
            </MetroSelect>
            <Typography>
              Current: <b>{transport}</b>
            </Typography>

            <Typography variant='h3'>3. Many options</Typography>
            <MetroSelect gap={4}>
              {many.map((o) => (
                <MetroSelect.Option
                  key={o.value}
                  {...o}
                />
              ))}
            </MetroSelect>
            <Stack direction='row'>
              <Button
                variant='outlined'
                onClick={toggleMode}
              >
                Toggle light / dark
              </Button>
              <Button onClick={() => navigate(-1)}>← Back</Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Typography variant='h3'>MetroSelect props</Typography>
            <Table
              data={data}
              columns={columns}
              constrainHeight={false}
            />
            <Typography
              variant='h3'
              style={{ marginTop: theme.spacing(3) }}
            >
              Option props
            </Typography>
            <Table
              data={optionData}
              columns={optionColumns}
              constrainHeight={false}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Surface>
  );
}

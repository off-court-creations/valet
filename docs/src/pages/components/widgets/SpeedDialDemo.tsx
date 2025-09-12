// src/pages/SpeedDialDemo.tsx
import {
  Surface,
  Stack,
  Typography,
  Button,
  SpeedDial,
  Icon,
  Tabs,
  Table,
  useTheme,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import SpeedDialMeta from '../../../../../src/components/widgets/SpeedDial.meta.json';

export default function SpeedDialDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  const actions = [
    {
      icon: <Icon icon='mdi:content-copy' />,
      label: 'Copy',
      onClick: () => alert('Copy'),
    },
    {
      icon: <Icon icon='mdi:share-variant' />,
      label: 'Share',
      onClick: () => alert('Share'),
    },
    {
      icon: <Icon icon='mdi:delete' />,
      label: 'Delete',
      onClick: () => alert('Delete'),
    },
  ];

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
      prop: <code>icon</code>,
      type: <code>React.ReactNode</code>,
      default: <code>—</code>,
      description: 'Main floating action button icon',
    },
    {
      prop: <code>actions</code>,
      type: <code>SpeedDialAction[]</code>,
      default: <code>—</code>,
      description: 'Array of action buttons',
    },
    {
      prop: <code>direction</code>,
      type: <code>&#39;up&#39; | &#39;down&#39; | &#39;left&#39; | &#39;right&#39;</code>,
      default: <code>&#39;up&#39;</code>,
      description: 'Expansion direction',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>—</code>,
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Speed Dial' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Typography variant='h3'>Example</Typography>
              <Typography variant='body'>Click the fab to reveal actions.</Typography>
              <SpeedDial
                icon={<Icon icon='mdi:plus' />}
                actions={actions}
              />
              <Button
                variant='outlined'
                onClick={toggleMode}
              >
                Toggle light / dark
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Typography variant='h3'>Prop reference</Typography>
            <Table
              data={data}
              columns={columns}
              constrainHeight={false}
            />
          </Tabs.Panel>
        </Tabs>

        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>

        <CuratedExamples examples={getExamples(SpeedDialMeta)} />
        <BestPractices items={getBestPractices(SpeedDialMeta)} />
      </Stack>
    </Surface>
  );
}

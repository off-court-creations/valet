// ─────────────────────────────────────────────────────────────
// src/pages/concepts/Events.tsx  | valet-docs
// Event trio guide: onChange, onValueChange, onValueCommit
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Stack,
  Typography,
  Panel,
  CodeBlock,
  Select,
  Slider,
  TextField,
  Iterator,
  Tabs,
  Button,
  useTheme,
} from '@archway/valet';

export default function EventsConceptPage() {
  const { theme } = useTheme();

  // Live vs commit examples
  const [petLive, setPetLive] = useState<string | null>(null);
  const [petCommit, setPetCommit] = useState<string | null>(null);

  const [sLive, setSLive] = useState(25);
  const [sCommit, setSCommit] = useState(25);

  const [nameLive, setNameLive] = useState('');
  const [nameCommit, setNameCommit] = useState('');

  const [iterLive, setIterLive] = useState(2);
  const [iterCommit, setIterCommit] = useState(2);

  const [tab, setTab] = useState<string | number>(0);

  const matrix = `Component      onValueChange (phase: input)      onValueCommit (phase: commit)
TextField     on input (type/paste)             on blur or Enter
Checkbox      on toggle                          same moment as change
RadioGroup    on select                          same moment as change
Select        (optional) during highlight        on selection/confirm
MetroSelect   on tile (each toggle)              on tile (each toggle)
Slider        while dragging                     on pointer up / blur
Iterator      on step or typing (optional)       on button/wheel/Enter/blur
Tabs          on tab navigation                  on tab selection
DateSelector  on interim selection               on day confirm / range complete`;

  return (
    <Stack gap={1}>
      <Typography variant='h1'>Events & Commit Semantics</Typography>
      <Typography>
        Valet fields expose a trio of events wherever a user can change a value:
      </Typography>
      <CodeBlock
        code={`onChange(event) // DOM parity (raw SyntheticEvent)
onValueChange(value, info) // fires for every mutation (phase: 'input')
onValueCommit(value, info) // fires when the change is committed (phase: 'commit')`}
        ariaLabel='Event trio overview'
      />

      <Typography variant='h3'>ChangeInfo payload</Typography>
      <CodeBlock
        code={`type ChangeInfo<T> = {
  previousValue?: T;
  phase: 'input' | 'commit';
  source: 'keyboard' | 'pointer' | 'clipboard' | 'programmatic';
  name?: string; // when the component is a Form field
  event?: React.SyntheticEvent; // if available
}`}
        ariaLabel='ChangeInfo<T> payload'
      />

      <Typography variant='h3'>Commit matrix (common components)</Typography>
      <Panel
        variant='outlined'
        sx={{ padding: theme.spacing(1), overflowX: 'auto' }}
      >
        <pre style={{ margin: 0 }}>{matrix}</pre>
      </Panel>

      <Typography variant='h2'>Examples</Typography>

      <Typography variant='h3'>Select – live vs commit</Typography>
      <Stack
        direction='row'
        gap={1}
      >
        <Select
          placeholder='Pet'
          onValueChange={(v) => setPetLive(v as string)}
          onValueCommit={(v) => setPetCommit(v as string)}
          sx={{ minWidth: 200 }}
        >
          <Select.Option value='cat'>Cat</Select.Option>
          <Select.Option value='dog'>Dog</Select.Option>
          <Select.Option value='bird'>Bird</Select.Option>
        </Select>
        <Typography>live: {String(petLive ?? '—')}</Typography>
        <Typography>commit: {String(petCommit ?? '—')}</Typography>
      </Stack>

      <Typography variant='h3'>Slider – commit on pointer up</Typography>
      <Stack
        direction='row'
        gap={1}
      >
        <Slider
          value={sLive}
          onValueChange={(v) => setSLive(v)}
          onValueCommit={(v) => setSCommit(v)}
          showValue
        />
        <Typography>live: {sLive}</Typography>
        <Typography>commit: {sCommit}</Typography>
      </Stack>

      <Typography variant='h3'>TextField – commit on blur/Enter</Typography>
      <Stack
        direction='row'
        gap={1}
      >
        <TextField
          name='example'
          placeholder='Type and press Enter or blur…'
          value={nameLive}
          onChange={(e) => setNameLive(e.target.value)}
          onValueCommit={(v) => setNameCommit(v)}
          sx={{ width: 320 }}
        />
        <Typography>live: {nameLive || '—'}</Typography>
        <Typography>commit: {nameCommit || '—'}</Typography>
      </Stack>

      <Typography variant='h3'>Iterator – commit on buttons/wheel (or Enter/blur)</Typography>
      <Stack
        direction='row'
        gap={1}
      >
        <Iterator
          value={iterLive}
          onValueChange={(v) => setIterLive(v)}
          onValueCommit={(v) => setIterCommit(v)}
        />
        <Typography>live: {iterLive}</Typography>
        <Typography>commit: {iterCommit}</Typography>
      </Stack>

      <Typography variant='h3'>Tabs – commit on tab selection</Typography>
      <Tabs
        value={tab}
        onValueCommit={(v) => setTab(v)}
      >
        <Tabs.Tab label='One' />
        <Tabs.Panel>One</Tabs.Panel>
        <Tabs.Tab label='Two' />
        <Tabs.Panel>Two</Tabs.Panel>
      </Tabs>

      <Typography variant='h2'>Tips</Typography>
      <ul>
        <li>Use onValueChange for live previews and responsive UI.</li>
        <li>Use onValueCommit to trigger expensive work, persistence, or navigation.</li>
        <li>For text inputs, commit on Enter or blur; for sliders, commit on pointer up.</li>
      </ul>

      <Button
        as='a'
        href='/component-status'
        variant='outlined'
      >
        Browse components →
      </Button>
    </Stack>
  );
}

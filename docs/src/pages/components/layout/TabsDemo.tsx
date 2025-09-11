// ─────────────────────────────────────────────────────────────────────────────
// src/pages/TabsDemoPage.tsx | valet-docs
// Demonstrates placement-aware <Tabs/> with varied panel content.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Tabs,
  Icon,
  useTheme,
  Table,
  Box,
  Panel,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Simple lorem snippets so every panel differs                               */
const ONE = 'One → Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
const TWO = 'Two → Vestibulum non lectus eget justo dignissim pulvinar.';
const THREE = 'Three → Cras feugiat orci in elit aliquet, a imperdiet odio.';
const FOUR = 'Four → Nulla facilisi. Praesent quis leo sem.';
const FIVE = 'Five → Sed cursus, augue non dignissim scelerisque, felis dui.';
const SIX = 'Six → Morbi tristique, sapien nec fringilla cursus, nisi risus.';

/*─────────────────────────────────────────────────────────────────────────────*/
export default function TabsDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  /* Controlled example state -------------------------------------------- */
  const [activeCtl, setActiveCtl] = useState(0);

  /* Reference table ----------------------------------------------------- */
  interface Row {
    prop: React.ReactNode;
    type: React.ReactNode;
    default: React.ReactNode;
    description: React.ReactNode;
  }

  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const data: Row[] = [
    {
      prop: <code>alignX</code>,
      type: <code>{`'left' | 'right' | 'center' | 'centered'`}</code>,
      default: <code>{`'left'`}</code>,
      description: 'Horizontal alignment of the tab strip (horizontal orientation).',
    },
    {
      prop: <code>orientation</code>,
      type: <code>{`'horizontal' | 'vertical'`}</code>,
      default: <code>{`'horizontal'`}</code>,
      description: 'Layout direction for the tab strip and panel.',
    },
    {
      prop: <code>placement</code>,
      type: <code>{`'top' | 'bottom' | 'left' | 'right'`}</code>,
      default: <code>{`'top'`}</code>,
      description: 'Which side the tab strip sits on relative to the panel.',
    },
    {
      prop: <code>active</code>,
      type: <code>number</code>,
      default: <code>—</code>,
      description: 'Controlled index of the active tab.',
    },
    {
      prop: <code>defaultActive</code>,
      type: <code>number</code>,
      default: <code>0</code>,
      description: 'Uncontrolled initial active tab index.',
    },
    {
      prop: <code>onTabChange</code>,
      type: <code>(i: number) =&gt; void</code>,
      default: <code>—</code>,
      description: 'Callback when the active tab changes.',
    },
    {
      prop: (
        <>
          <code>gap</code>, <code>pad</code>
        </>
      ),
      type: <code>number | string</code>,
      default: (
        <>
          <code>gap=1</code>, <code>pad=1</code>
        </>
      ),
      description: 'Spacing tokens; numbers map to theme.spacing(n), strings pass through.',
    },
    {
      prop: <code>compact</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Reduce internal spacing density.',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>—</code>,
      description: 'Apply style presets to the container.',
    },
    {
      prop: <code>sx</code>,
      type: <code>object</code>,
      default: <code>—</code>,
      description: 'Inline style overrides (CSS object; supports CSS vars).',
    },
  ];

  // Many tabs to demonstrate wrapping on narrow widths
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Tabs' />

        {/* 1. Horizontal - top (default) ---------------------------------- */}
        <Typography variant='h3'>1. Horizontal – top (default)</Typography>
        <Tabs>
          <Tabs.Tab label='One' />
          <Tabs.Panel>{ONE}</Tabs.Panel>

          <Tabs.Tab label='Two' />
          <Tabs.Panel>{TWO}</Tabs.Panel>

          <Tabs.Tab label='Three' />
          <Tabs.Panel>{THREE}</Tabs.Panel>
        </Tabs>

        {/* 2. Horizontal - bottom ---------------------------------------- */}
        <Typography variant='h3'>2. Horizontal – bottom</Typography>
        <Tabs placement='bottom'>
          <Tabs.Tab label='Alpha' />
          <Tabs.Panel>{FOUR}</Tabs.Panel>

          <Tabs.Tab label='Beta' />
          <Tabs.Panel>{FIVE}</Tabs.Panel>
        </Tabs>

        {/* 3. Vertical - left (default) ----------------------------------- */}
        <Typography variant='h3'>3. Vertical – left (default)</Typography>
        <Tabs
          orientation='vertical'
          sx={{ height: 200 }}
        >
          <Tabs.Tab label='Apple' />
          <Tabs.Panel>{'Apple → ' + ONE}</Tabs.Panel>

          <Tabs.Tab label='Banana' />
          <Tabs.Panel>{'Banana → ' + TWO}</Tabs.Panel>

          <Tabs.Tab label='Cherry' />
          <Tabs.Panel>{'Cherry → ' + THREE}</Tabs.Panel>
        </Tabs>

        {/* 4. Vertical - right ------------------------------------------- */}
        <Typography variant='h3'>4. Vertical – right</Typography>
        <Tabs
          orientation='vertical'
          placement='right'
          sx={{ height: 200 }}
        >
          <Tabs.Tab label='Left Brain' />
          <Tabs.Panel>{'Left → ' + FOUR}</Tabs.Panel>

          <Tabs.Tab label='Right Brain' />
          <Tabs.Panel>{'Right → ' + FIVE}</Tabs.Panel>
        </Tabs>

        {/* 5. Controlled example ----------------------------------------- */}
        <Typography variant='h3'>5. Controlled example</Typography>
        <Button
          size='sm'
          variant='outlined'
          onClick={() => setActiveCtl((prev) => (prev === 2 ? 0 : prev + 1))}
          sx={{ alignSelf: 'flex-start' }}
        >
          Next tab programmatically
        </Button>
        <Tabs
          active={activeCtl}
          onTabChange={setActiveCtl}
        >
          <Tabs.Tab label='First' />
          <Tabs.Panel>{'First → ' + ONE}</Tabs.Panel>

          <Tabs.Tab label='Second' />
          <Tabs.Panel>{'Second → ' + TWO}</Tabs.Panel>

          <Tabs.Tab label='Third' />
          <Tabs.Panel>{'Third → ' + SIX}</Tabs.Panel>
        </Tabs>

        {/* 6. Icon headings ----------------------------------------------- */}
        <Typography variant='h3'>6. Icon headings</Typography>
        <Tabs>
          <Tabs.Tab
            label={<Icon icon='mdi:home' />}
            aria-label='Home'
            tooltip='Home'
          />
          <Tabs.Panel>{'Home → ' + ONE}</Tabs.Panel>

          <Tabs.Tab
            label={<Icon icon='mdi:account' />}
            aria-label='Profile'
            tooltip='Profile'
          />
          <Tabs.Panel>{'Profile → ' + TWO}</Tabs.Panel>

          <Tabs.Tab
            label={<Icon icon='mdi:cog' />}
            aria-label='Settings'
            tooltip='Settings'
          />
          <Tabs.Panel>{'Settings → ' + THREE}</Tabs.Panel>
        </Tabs>

        {/* 7. Centered headings ------------------------------------------- */}
        <Typography variant='h3'>7. Centered headings</Typography>
        <Tabs alignX='center'>
          <Tabs.Tab
            label={
              <Stack
                direction='row'
                sx={{ alignItems: 'center', gap: theme.spacing(0.5) }}
              >
                <Icon icon='mdi:home' />
                <Typography>Home</Typography>
              </Stack>
            }
          />
          <Tabs.Panel>{'Home → ' + ONE}</Tabs.Panel>

          <Tabs.Tab
            label={
              <Stack
                direction='row'
                sx={{ alignItems: 'center', gap: theme.spacing(0.5) }}
              >
                <Icon icon='mdi:account' />
                <Typography>Profile</Typography>
              </Stack>
            }
          />
          <Tabs.Panel>{'Profile → ' + TWO}</Tabs.Panel>

          <Tabs.Tab
            label={
              <Stack
                direction='row'
                sx={{ alignItems: 'center', gap: theme.spacing(0.5) }}
              >
                <Icon icon='mdi:cog' />
                <Typography>Settings</Typography>
              </Stack>
            }
          />
          <Tabs.Panel>{'Settings → ' + THREE}</Tabs.Panel>
        </Tabs>

        {/* 8. Vertical - left centered ---------------------------------- */}
        <Typography variant='h3'>8. Vertical – left centered</Typography>
        <Tabs
          orientation='vertical'
          alignX='center'
          sx={{ height: 200 }}
        >
          <Tabs.Tab
            label={<Icon icon='mdi:home' />}
            aria-label='Home'
            tooltip='Home'
          />
          <Tabs.Panel>{'Home → ' + ONE}</Tabs.Panel>

          <Tabs.Tab
            label={<Icon icon='mdi:account' />}
            aria-label='Profile'
            tooltip='Profile'
          />
          <Tabs.Panel>{'Profile → ' + TWO}</Tabs.Panel>

          <Tabs.Tab
            label={<Icon icon='mdi:cog' />}
            aria-label='Settings'
            tooltip='Settings'
          />
          <Tabs.Panel>{'Settings → ' + THREE}</Tabs.Panel>
        </Tabs>

        {/* Theme switcher -------------------------------------------------- */}
        <Typography variant='h3'>9. Theme coupling</Typography>
        <Button
          variant='outlined'
          onClick={toggleMode}
        >
          Toggle light / dark
        </Button>

        {/* Reference ------------------------------------------------------- */}
        <Typography variant='h3'>10. Reference</Typography>
        <Table
          data={data}
          columns={columns}
          constrainHeight={false}
        />

        {/* 11. Many tabs – wrapping demo --------------------------------- */}
        <Typography variant='h3'>11. Many tabs – wrapping demo</Typography>
        <Typography variant='body'>
          Resize the window narrow or on a phone to see the tab list wrap into multiple rows.
        </Typography>
        <Box>
          <Tabs>
            {months.map((m) => (
              <Tabs.Tab
                key={`t-${m}`}
                label={m}
              />
            ))}
            {months.map((m, i) => (
              <Tabs.Panel key={`p-${m}-${i}`}>{m + ' → Lorem ipsum dolor sit amet.'}</Tabs.Panel>
            ))}
          </Tabs>
        </Box>

        {/* Best Practices ------------------------------------------------- */}
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Keep tab labels short and predictable. Prefer 1–2 words; avoid wrapping when possible.
          </Typography>
          <Typography>
            - Choose placement by layout: <code>top</code> is the default; use vertical placement
            for dense navigation sidebars.
          </Typography>
          <Typography>
            - Reflect app state with controlled tabs (<code>active</code> +<code>onTabChange</code>)
            when routes or external state should drive selection.
          </Typography>
          <Typography>
            - Use <code>gap</code>/<code>pad</code> to match surrounding density; apply
            <code>alignX</code> to align the strip with nearby content.
          </Typography>
          <Typography>
            - For icon‑only tabs, supply <code>aria-label</code> and (optionally) a
            <code>tooltip</code> for discoverability.
          </Typography>
          <Typography>
            - Keep DOM order logical (Tab → Panel pairs) to preserve keyboard and screen‑reader
            flow.
          </Typography>
          <Typography>
            - Respect overflow ergonomics. When tabs exceed width, valet keeps a single row with
            horizontal scroll and edge fades; avoid forcing multi‑row tabs, which harms
            discoverability.
          </Typography>
          <Typography>
            - Lean on motion tokens. The active underline should feel crisp; pair durations/easing
            to <code>theme.motion</code> for consistent UX across components.
          </Typography>
          <Typography>
            - Route integration. When tabs represent routes, control them from the router and keep
            URLs canonical so reload/share preserves the active view.
          </Typography>
        </Panel>

        {/* Back nav -------------------------------------------------------- */}
        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// src/pages/IconDemoPage.tsx
// A comprehensive live demo of every Icon capability in ZeroUI
// ─────────────────────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Box,
  Typography,
  Button,
  Icon,
  useTheme,
  definePreset,
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';
import mymoSVG from "../assets/mygymlogo.svg?raw"

/*─────────────────────────────────────────────────────────────────────────────*/
/* Style presets – demonstrate Icon inside themed containers                   */
definePreset('iconCard', t => `
    background   : ${t.colors['secondary']};
    color        : ${t.colors['secondaryText']};
    padding      : ${t.spacing(1)};
    border-radius: 16px;
    box-shadow   : 0 4px 12px ${t.colors['text']}22;
    display      : inline-flex;
    align-items  : center;
    gap          : ${t.spacing(1)};
  `);

/*─────────────────────────────────────────────────────────────────────────────*/
/* Example custom SVGs                                                         */
const HeartSvg = (
  <svg viewBox="0 0 24 24" stroke="none">
    <path
      d="M12 21s-6.4-4.35-9.32-7.27C.9 11.94.5 8.77 2.53 6.5 4.08 4.69 6.89 4.21 9 5.44c2.11-1.23 4.92-.75 6.47 1.06 2.03 2.27 1.63 5.44-.15 7.23C18.4 16.65 12 21 12 21Z"
      fill="currentColor"
    />
  </svg>
);

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                   */
export default function IconDemoPage() {
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
      prop: <code>icon</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Iconify name',
    },
    {
      prop: <code>svg</code>,
      type: <code>string | ReactElement</code>,
      default: <code>-</code>,
      description: 'Custom SVG content',
    },
    {
      prop: <code>size</code>,
      type: <code>'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string</code>,
      default: <code>'md'</code>,
      description: 'Icon dimensions',
    },
    {
      prop: <code>color</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Colour override',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        {/* Page header ----------------------------------------------------- */}
        <Typography variant="h2" bold>
          Icon Showcase
        </Typography>

        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Typography variant="subtitle">
              Built-in Iconify names, custom SVGs, presets, and theme coupling
            </Typography>

        {/* 1. Inline usage -------------------------------------------------- */}
        <Typography variant="h3">1. Inline with text</Typography>
        <Typography>
          Icons inherit text colour automatically&nbsp;
          <Icon icon="mdi:rocket-launch-outline" size="1.25em" />
          &nbsp;anywhere in your prose.
        </Typography>

        {/* 2. Sizing -------------------------------------------------------- */}
        <Typography variant="h3">2. Size prop</Typography>
        <Stack direction="row">
          <Icon icon="mdi:home" size="xs" aria-label="home-xs" />
          <Icon icon="mdi:home" size="sm" aria-label="home-sm" />
          <Icon icon="mdi:home" size="md" aria-label="home-md" />
          <Icon icon="mdi:home" size="lg" aria-label="home-lg" />
          <Icon icon="mdi:home" size="xl" aria-label="home-xl" />
        </Stack>

        {/* 3. Color override ---------------------------------------------- */}
        <Typography variant="h3">3. Colour override</Typography>
        <Stack direction="row">
          <Icon icon="carbon:warning-filled" color={theme.colors['primary']} size={32} />
          <Icon icon="carbon:warning-filled" color="#ff6b6b" size={32} />
          <Icon icon="carbon:warning-filled" color="gold" size={32} />
        </Stack>

        {/* 4. Custom SVG (React element) ----------------------------------- */}
        <Typography variant="h3">4. Custom SVG element</Typography>
        <Icon svg={mymoSVG} size={40} aria-label="heart" />

        {/* 6. Icon presets -------------------------------------------------- */}
        <Typography variant="h3">5. Presets</Typography>
        <Box preset="iconCard">
          <Icon icon="mdi:credit-card-outline" size={48} />
          <Typography variant="h4" bold>
            iconCard preset
          </Typography>
        </Box>

        {/* 7. Icon inside Button ------------------------------------------- */}
        <Typography variant="h3">6. Icon in other components</Typography>
        <Stack direction="row">
          <Button>
            <Icon icon="mdi:thumb-up" size={18} style={{ marginRight: 8 }} />
            Like
          </Button>
          <Button variant="outlined">
            <Icon icon="mdi:share-variant" size={18} style={{ marginRight: 8 }} />
            Share
          </Button>
        </Stack>

          {/* 8. Live theme validation ---------------------------------------- */}
          <Typography variant="h3">7. Theme coupling</Typography>
          <Button variant="outlined" onClick={toggleMode}>
            Toggle light / dark mode
          </Button>
        </Tabs.Panel>

        <Tabs.Tab label="Reference" />
        <Tabs.Panel>
          <Typography variant="h3">Prop reference</Typography>
          <Table data={data} columns={columns} constrainHeight={false} />
        </Tabs.Panel>
        </Tabs>

        {/* Back nav -------------------------------------------------------- */}
        <Button
          size="lg"
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}

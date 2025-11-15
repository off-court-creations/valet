// ─────────────────────────────────────────────────────────────
// src/pages/getting-started/ThemeEngine.tsx  | valet-docs
// Theme engine tour: palette, tokens, and runtime store best practices
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Panel,
  Stack,
  Grid,
  Typography,
  Divider,
  Button,
  IconButton,
  Checkbox,
  Switch,
  Slider,
  Progress,
  Table,
  Iterator,
  DateSelector,
  useTheme,
  CodeBlock,
} from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import PageHero from '../../components/PageHero';
import type { DocMeta } from '../../types';

export const meta: DocMeta = {
  id: 'theme-engine',
  title: 'Theme Engine',
  description:
    'Explore valet’s palette tokens and learn how the theme store, presets, and runtime mode switching fit together.',
  pageType: 'concept',
  prerequisites: ['quickstart'],
  tldr: 'Initialize the theme once with useInitialTheme, read/update tokens via useTheme, and lean on presets plus named colors for light/dark parity.',
};

type TokenKey =
  | 'primary'
  | 'primaryText'
  | 'secondary'
  | 'secondaryText'
  | 'tertiary'
  | 'tertiaryText'
  | 'error'
  | 'errorText'
  | 'primaryButtonText'
  | 'secondaryButtonText'
  | 'tertiaryButtonText'
  | 'background'
  | 'backgroundAlt'
  | 'text';

// Names are retrieved from theme.colorNames at runtime

// WCAG relative luminance and contrast utilities (local to the page)
// hexToRgb removed (unused)

// relLuminance removed (unused)

// placeholder: no contrast calculations rendered currently

function Swatch({
  title,
  subtitle,
  hex,
  on,
}: {
  title: string;
  subtitle?: string;
  hex: string;
  on?: string | undefined; // text colour
}) {
  const { theme } = useTheme();
  const text = on ?? theme.colors['text'];
  const hexUpper = hex.toUpperCase();
  const onUpper = on ? on.toUpperCase() : undefined;
  return (
    <Panel
      pad={0.75}
      color={hex}
      sx={{ borderRadius: theme.radius(1), minHeight: '6rem' }}
      fullWidth
    >
      <Stack sx={{ gap: theme.spacing(0.25) }}>
        <Typography
          variant='subtitle'
          sx={{ color: on ?? theme.colors['primaryText'] }}
        >
          {title}
        </Typography>
        <Typography
          variant='body'
          sx={{ color: text }}
        >
          BG: {hexUpper}
          {onUpper ? ` • Text: ${onUpper}` : ''}
        </Typography>
        {subtitle ? (
          <Typography
            variant='subtitle'
            sx={{ color: text, opacity: 0.8 }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
    </Panel>
  );
}

function ButtonSwatch({
  name,
  colorName,
  bg,
  text,
}: {
  name: string;
  colorName: string;
  bg: string;
  text: string;
}) {
  const { theme } = useTheme();
  return (
    <Panel
      pad={0.5}
      sx={{ borderRadius: theme.radius(1), minHeight: '6rem' }}
      fullWidth
    >
      <Stack sx={{ gap: theme.spacing(0.5) }}>
        <Button
          variant='filled'
          color={bg}
        >
          {name}
        </Button>
        <Typography
          variant='subtitle'
          sx={{ opacity: 0.9, color: theme.colors['text'] }}
        >
          {colorName} — BG: {bg.toUpperCase()} • Text: {text.toUpperCase()}
        </Typography>
      </Stack>
    </Panel>
  );
}

// ContrastRow removed (contrast data not shown for now)

export default function ThemeEnginePage() {
  const { theme, mode, toggleMode } = useTheme();
  const t = theme.colors as Record<TokenKey, string>;
  const names: Record<string, string> = {
    primary: 'Primary',
    primaryText: 'PrimaryText',
    secondary: 'Secondary',
    secondaryText: 'SecondaryText',
    tertiary: 'Tertiary',
    tertiaryText: 'TertiaryText',
    error: 'Error',
    errorText: 'ErrorText',
    primaryButtonText: 'Primary Button Text',
    secondaryButtonText: 'Secondary Button Text',
    tertiaryButtonText: 'Tertiary Button Text',
    background: 'Background',
    backgroundAlt: 'Background Alt',
    text: 'Text',
  };

  const themeStoreSnippet = `import { useTheme } from '@archway/valet';

function Example() {
  const { theme, setMode } = useTheme();
  return (
    <button onClick={() => setMode(theme.mode === 'light' ? 'dark' : 'light')}>
      Toggle {theme.mode}
    </button>
  );
}`;

  const bestPractices = [
    'Initialize once. Call useInitialTheme in your root App to set tokens and preload fonts; avoid re-running it per route.',
    'Use tokens everywhere. Prefer theme.spacing/radius/stroke/motion over hard-coded values so density and branding updates propagate.',
    'Toggle mode through the store. Reach for useTheme().toggleMode() or setMode instead of branching palettes in components.',
    'Load only the fonts you ship. Pass overrides to useInitialTheme and use the extras array for secondary faces; the loader dedupes requests.',
    'Keep colours semantic. Map brand colours into primary/secondary/tertiary/error tokens to maintain contrast across light/dark themes.',
    'Patch via setTheme. Update the store rather than sprinkling inline overrides so docs, MCP data, and components stay in sync.',
  ];

  // token listing not needed for the current layout

  return (
    <Surface>
      <NavDrawer />
      <Stack sx={{ gap: theme.spacing(1) }}>
        <PageHero
          title='Theme Engine'
          subtitle='Palette tokens, runtime mode toggling, and the theme store best practices in one place.'
        />

        {/* Mode controls */}
        <Stack
          direction='row'
          gap={2}
        >
          <Button
            variant='filled'
            color={t['primary']}
            onClick={toggleMode}
          >
            Toggle Mode
          </Button>
          <Typography variant='subtitle'>Current: {mode}</Typography>
        </Stack>

        {/* Palette legend */}
        <Panel
          fullWidth
          pad={1}
        >
          <Typography
            variant='h3'
            bold
          >
            Palette Names
          </Typography>
          <Divider thickness={2} />
          <Grid
            columns={3}
            gap={1}
            adaptive
          >
            <Swatch
              title='Text on BackgroundAlt'
              subtitle={`${names['text'] ?? 'Text'} on ${names['backgroundAlt'] ?? 'BackgroundAlt'}`}
              hex={t['backgroundAlt']}
              on={t['text']}
            />

            {/* Matched text-on-accent pairs */}
            <Swatch
              title='PrimaryText on Primary'
              subtitle={`${names['primaryText'] ?? 'Text'} on ${names['primary'] ?? 'Primary'}`}
              hex={t['primary']}
              on={t['primaryText']}
            />
            <Swatch
              title='SecondaryText on Secondary'
              subtitle={`${names['secondaryText'] ?? 'Text'} on ${names['secondary'] ?? 'Secondary'}`}
              hex={t['secondary']}
              on={t['secondaryText']}
            />
            <Swatch
              title='TertiaryText on Tertiary'
              subtitle={`${names['tertiaryText'] ?? 'Text'} on ${names['tertiary'] ?? 'Tertiary'}`}
              hex={t['tertiary']}
              on={t['tertiaryText']}
            />

            {/* Surfaces */}
            <Swatch
              title='Text on Background'
              subtitle={`${names['text'] ?? 'Text'} on ${names['background'] ?? 'Background'}`}
              hex={t['background']}
              on={t['text']}
            />
          </Grid>

          <Grid
            columns={4}
            gap={1}
            adaptive
          >
            {/* Accent colors as buttons */}
            <ButtonSwatch
              name='Primary'
              colorName={names['primary'] ?? 'Primary'}
              bg={t['primary']}
              text={t['primaryButtonText']}
            />
            <ButtonSwatch
              name='Secondary'
              colorName={names['secondary'] ?? 'Secondary'}
              bg={t['secondary']}
              text={t['secondaryButtonText']}
            />
            <ButtonSwatch
              name='Tertiary'
              colorName={names['tertiary'] ?? 'Tertiary'}
              bg={t['tertiary']}
              text={t['tertiaryButtonText']}
            />

            {/* Error as an accent button too */}
            <ButtonSwatch
              name='Error'
              colorName={names['error'] ?? 'Error'}
              bg={t['error']}
              text={t['errorText']}
            />
          </Grid>
        </Panel>

        {/* Contrast section temporarily removed */}

        {/* Usage examples */}
        <Panel
          fullWidth
          pad={1}
        >
          <Typography
            variant='h3'
            bold
          >
            Examples
          </Typography>
          <Divider thickness={2} />
          <Grid
            columns={2}
            gap={1}
            adaptive
          >
            <Panel
              pad={1}
              color={t['backgroundAlt']}
              sx={{ borderRadius: theme.radius(1) }}
            >
              <Stack sx={{ gap: theme.spacing(0.75) }}>
                <Typography bold>Controls on backgroundAlt</Typography>
                <Stack
                  direction='row'
                  sx={{ gap: theme.spacing(0.5), flexWrap: 'wrap' }}
                >
                  <Button
                    variant='filled'
                    color={t['primary']}
                  >
                    Primary
                  </Button>
                  <Button
                    variant='filled'
                    color={t['secondary']}
                  >
                    Secondary
                  </Button>
                  <Button
                    variant='filled'
                    color={t['tertiary']}
                  >
                    Tertiary
                  </Button>
                  <Button
                    variant='filled'
                    color={t['error']}
                  >
                    Error
                  </Button>
                  <IconButton
                    icon='mdi:brush'
                    variant='filled'
                    color={t['primary']}
                  />
                  <IconButton
                    icon='mdi:alert'
                    variant='filled'
                    color={t['error']}
                  />
                </Stack>
              </Stack>
            </Panel>

            <Panel pad={1}>
              <Stack sx={{ gap: theme.spacing(0.75) }}>
                <Typography bold>Dividers and Lines</Typography>
                <Typography variant='subtitle'>Secondary divider</Typography>
                <Divider
                  lineColor={t['secondary']}
                  thickness={3}
                />
                <Typography variant='subtitle'>Error divider</Typography>
                <Divider
                  lineColor={t['error']}
                  thickness={3}
                />
                <Typography variant='subtitle'>Primary divider</Typography>
                <Divider
                  lineColor={t['primary']}
                  thickness={3}
                />
              </Stack>
            </Panel>

            <Panel pad={1}>
              <Stack sx={{ gap: theme.spacing(0.75) }}>
                <Typography bold>Form Controls</Typography>
                <Stack
                  direction='row'
                  sx={{ gap: theme.spacing(1), alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <Checkbox
                    name='chk1'
                    defaultChecked
                    label={<Typography>Checkbox</Typography>}
                  />
                  <Switch
                    name='sw1'
                    defaultChecked
                  />
                  <Iterator
                    width={160}
                    min={0}
                    max={10}
                    step={1}
                    value={5}
                  />
                </Stack>
              </Stack>
            </Panel>

            <Panel pad={1}>
              <Stack sx={{ gap: theme.spacing(0.75) }}>
                <Typography bold>Slider & Progress</Typography>
                <Stack
                  direction='row'
                  sx={{ gap: theme.spacing(1), alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <Progress
                    variant='circular'
                    mode='indeterminate'
                    sx={{ width: '10rem' }}
                  />

                  <Slider
                    min={0}
                    max={100}
                    defaultValue={42}
                    sx={{ width: '16rem' }}
                  />
                </Stack>
              </Stack>
            </Panel>

            <Panel pad={1}>
              <Stack sx={{ gap: theme.spacing(0.75) }}>
                <Typography bold>Date Selector</Typography>
                <DateSelector
                  density='compact'
                  minDate='2020-01-01'
                  maxDate='2030-12-31'
                />
              </Stack>
            </Panel>

            <Panel pad={1}>
              <Stack sx={{ gap: theme.spacing(0.75) }}>
                <Typography bold>Table</Typography>
                <Table
                  columns={[
                    { header: 'Name', accessor: 'name', sortable: true },
                    { header: 'Role', accessor: 'role', sortable: true },
                    { header: 'Score', accessor: 'score', align: 'right', sortable: true },
                  ]}
                  data={[
                    { name: 'Ada', role: 'Engineer', score: 98 },
                    { name: 'Lin', role: 'Designer', score: 87 },
                    { name: 'Kai', role: 'PM', score: 92 },
                  ]}
                  striped
                  hoverable
                  dividers
                />
              </Stack>
            </Panel>
          </Grid>
        </Panel>

        {/* Text samples */}
        <Panel
          fullWidth
          pad={1}
          color={t['background']}
        >
          <Typography
            variant='h3'
            bold
          >
            Typography on Surfaces
          </Typography>
          <Divider pad={0.5} />
          <Grid
            columns={2}
            gap={1}
            adaptive
          >
            <Panel pad={1}>
              <Typography
                variant='h4'
                bold
              >
                On background
              </Typography>
              <Typography variant='body'>
                Body text uses <code>theme.colors.text</code>.
              </Typography>
              <Typography
                variant='body'
                sx={{ color: t['secondary'] }}
              >
                Inline highlight: secondary
              </Typography>
              <Typography
                variant='body'
                sx={{ color: t['error'] }}
              >
                Inline warning: error
              </Typography>
            </Panel>
            <Panel
              pad={1}
              color={t['backgroundAlt']}
            >
              <Typography
                variant='h4'
                sx={{ color: t['primaryText'] }}
                bold
              >
                On backgroundAlt
              </Typography>
              <Typography
                variant='body'
                sx={{ color: t['primaryText'] }}
              >
                Body text uses off‑white for legibility.
              </Typography>
              <Typography
                variant='body'
                sx={{ color: t['tertiary'] }}
              >
                Tertiary accent sample
              </Typography>
            </Panel>
          </Grid>
        </Panel>

        <Panel
          fullWidth
          pad={1}
        >
          <Typography
            variant='h3'
            bold
          >
            Theme store fundamentals
          </Typography>
          <Divider
            thickness={2}
            pad={0.5}
          />
          <Typography>
            The theme store is a Zustand slice that carries tokens—colours, spacing, radii, motion,
            fonts—and the current mode. Call <code>useInitialTheme</code> once near the root to set
            defaults and preload fonts, then read or update tokens anywhere via{' '}
            <code>useTheme</code>.
          </Typography>
          <CodeBlock
            code={themeStoreSnippet}
            ariaLabel='Toggle theme mode example'
          />
          <Typography>
            Helpers like <code>theme.spacing(n)</code> return unit-aware values so layout rhythm
            stays consistent across density changes. Radius and stroke helpers piggyback on the same
            base.
          </Typography>
        </Panel>

        <Panel
          fullWidth
          pad={1}
        >
          <Typography
            variant='h3'
            bold
          >
            Best practices
          </Typography>
          <Divider
            thickness={2}
            pad={0.5}
          />
          <Stack sx={{ gap: theme.spacing(0.5) }}>
            {bestPractices.map((tip) => (
              <Typography
                key={tip}
                variant='body'
              >
                • {tip}
              </Typography>
            ))}
          </Stack>
        </Panel>
      </Stack>
    </Surface>
  );
}

// ─────────────────────────────────────────────────────────────
// src/pages/getting-started/MigrateFromMUI.tsx  | valet-docs
// Guide: migrating from MUI to valet – surfaces, theme, and components
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel, Divider, CodeBlock, Grid, Chip } from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import PageHero from '../../components/PageHero';
import type { DocMeta } from '../../types';

export const meta: DocMeta = {
  id: 'migrate-from-mui',
  title: 'Migrate from MUI to valet',
  description:
    'Map MUI patterns to valet: replace ThemeProvider with useInitialTheme, move to Surface-based layouts, and translate common components and sx usage into presets and semantic props.',
  pageType: 'guide',
  components: ['Surface', 'Stack', 'Panel', 'Button', 'Table', 'Modal', 'useInitialTheme'],
  prerequisites: ['quickstart', 'theme-engine'],
  tldr: 'Keep your React router and business logic, then migrate in layers: initialize a valet theme, wrap routes in Surface, swap MUI layout primitives and components for valet equivalents, and fold repeated sx into presets.',
};

const muiAppShellSnippet = `// before: MUI app shell
import * as React from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#0E65C0' },
    background: { default: '#121212' },
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'system-ui'].join(','),
  },
});

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            color: 'text.primary',
          }}
        >
          <Stack sx={{ p: 3 }}>
            <Routes>
              <Route path='/' element={<HomePage />} />
              <Route path='/settings' element={<SettingsPage />} />
            </Routes>
          </Stack>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}`;

const valetAppShellSnippet = `// after: valet app shell
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useInitialTheme, Surface, Stack, Typography } from '@archway/valet';

export function App() {
  useInitialTheme(
    {
      colors: {
        primary: '#0E65C0',
        background: '#121212',
        text: '#F7F7F7',
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
        mono: 'JetBrains Mono',
        button: 'Inter',
      },
    },
    ['Inter', 'JetBrains Mono'],
  );

  const fallback = (
    <Surface>
      <Stack sx={{ padding: '2rem', alignItems: 'center' }}>
        <Typography variant='subtitle'>Loading…</Typography>
      </Stack>
    </Surface>
  );

  return (
    <BrowserRouter>
      <Suspense fallback={fallback}>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/settings' element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}`;

const muiThemeSnippet = `// before: MUI theme (simplified)
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0E65C0',
      contrastText: '#F7F7F7',
    },
    secondary: {
      main: '#45706C',
      contrastText: '#F7F7F7',
    },
    error: {
      main: '#D32F2F',
      contrastText: '#F7F7F7',
    },
    background: {
      default: '#161616',
      paper: '#242424',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI"',
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
});`;

const valetThemeSnippet = `// after: valet theme via useInitialTheme
import { useInitialTheme } from '@archway/valet';

export function App() {
  useInitialTheme(
    {
      colors: {
        primary: '#0E65C0',
        primaryText: '#F7F7F7',
        secondary: '#45706C',
        secondaryText: '#F7F7F7',
        error: '#D32F2F',
        errorText: '#F7F7F7',
        background: '#161616',
        backgroundAlt: '#242424',
        text: '#F7F7F7',
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
        mono: 'JetBrains Mono',
        button: 'Inter',
      },
      // Optional: tighten or relax text rhythm per family/variant
      typographyFamilies: {
        heading: {
          lineHeight: { h1: 1.15, h2: 1.2 },
        },
        body: {
          lineHeight: { body: 1.5, subtitle: 1.35 },
        },
      },
    },
    ['Inter', 'JetBrains Mono'],
  );
  // ...
}`;

const layoutMappingSnippet = `// before: MUI Box + Stack layout
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

function SettingsLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 3,
      }}
    >
      <Stack
        spacing={3}
        sx={{ maxWidth: 960, mx: 'auto' }}
      >
        {/* page content */}
      </Stack>
    </Box>
  );
}

// after: valet Surface + Stack + Panel
import { Surface, Stack, Panel } from '@archway/valet';

function SettingsPage() {
  return (
    <Surface>
      <Stack
        sx={{ padding: '1rem', maxWidth: 960, margin: '0 auto' }}
        gap={1}
      >
        <Panel fullWidth pad={1}>
          {/* page content */}
        </Panel>
      </Stack>
    </Surface>
  );
}`;

const presetSnippet = `// before: scattered MUI sx overrides
<Paper
  elevation={4}
  sx={{
    borderRadius: 3,
    background: 'rgba(15,15,15,0.9)',
    backdropFilter: 'blur(18px)',
  }}
>
  {/* content */}
</Paper>

// after: reusable valet preset
// src/presets/globalPresets.ts
import { definePreset } from '@archway/valet';

definePreset('glassHolder', (t) => \`
  background   : rgba(15, 15, 15, 0.9);
  color        : \${t.colors['text']};
  border-radius: \${t.radius(2)};
  box-shadow   : 0 10px 40px \${t.colors['text']}33;
  backdrop-filter: blur(18px);
  padding      : \${t.spacing(1)};
\`);

// usage
import { Panel } from '@archway/valet';

<Panel preset='glassHolder'>
  {/* content */}
</Panel>;`;

const componentMappingSnippet = `MUI → valet (rough equivalence)

Layout
- Box              → Box (generic container)
- Stack            → Stack
- Grid             → Grid
- Paper            → Panel
- AppBar           → AppBar
- Drawer           → Drawer
- Tabs/TabsList    → Tabs
- Dialog           → Modal

Inputs & fields
- Button           → Button
- IconButton       → IconButton
- TextField        → TextField
- Select           → Select / MetroSelect
- Checkbox         → Checkbox
- Switch           → Switch
- Slider           → Slider
- RadioGroup       → RadioGroup
- Pagination       → Pagination

Feedback & data
- Snackbar         → Snackbar
- Tooltip          → Tooltip
- Table            → Table
`;

export default function MigrateFromMUIPage() {
  return (
    <Surface>
      <NavDrawer />
      <Stack sx={{ padding: '1rem', maxWidth: 1120, margin: '0 auto', gap: '1rem' }}>
        <PageHero
          title='Migrate from MUI to valet'
          subtitle='Translate your existing MUI theme, layout, and components into valet’s Surface-first, token-driven model without rewriting your whole app at once.'
          below={
            <Stack
              direction='row'
              sx={{ gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}
            >
              <Chip label='One Surface per route' />
              <Chip label='Runtime theming via useInitialTheme' />
              <Chip label='Presets over ad-hoc sx' />
            </Stack>
          }
        />

        <Panel
          fullWidth
          pad={1}
        >
          <Typography
            variant='h3'
            bold
          >
            How to think about this migration
          </Typography>
          <Divider pad={0.5} />
          <Typography>
            You do not have to rewrite your app. Keep your router, data fetching, and business
            logic, then switch the UI layer in layers: first theme and surfaces, then layout
            primitives, then individual components and <code>sx</code> usages.
          </Typography>
          <Typography>
            valet’s mental model maps well onto MUI: <code>&lt;ThemeProvider&gt;</code> becomes a{' '}
            single <code>useInitialTheme</code> call, <code>&lt;Box&gt;</code> and{' '}
            <code>&lt;Stack&gt;</code> become <code>&lt;Surface&gt;</code>,{' '}
            <code>&lt;Stack&gt;</code>, and <code>&lt;Panel&gt;</code>, and your palette/typography
            migrate into a small theme patch.
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
            Step 1 – Replace ThemeProvider with useInitialTheme
          </Typography>
          <Divider pad={0.5} />
          <Typography>
            In MUI you typically wrap the app with <code>ThemeProvider</code> and{' '}
            <code>CssBaseline</code>, then read tokens through the <code>theme</code> object in
            styled components and <code>sx</code> callbacks. In valet, theme is a Zustand store: you
            call <code>useInitialTheme</code> once near the root and then read/update tokens via{' '}
            <code>useTheme</code>.
          </Typography>
          <Grid
            columns={2}
            gap={1}
            adaptive
          >
            <Panel pad={1}>
              <Typography
                variant='subtitle'
                bold
              >
                Before: MUI shell
              </Typography>
              <CodeBlock
                code={muiAppShellSnippet}
                ariaLabel='MUI app shell example'
              />
            </Panel>
            <Panel pad={1}>
              <Typography
                variant='subtitle'
                bold
              >
                After: valet shell
              </Typography>
              <CodeBlock
                code={valetAppShellSnippet}
                ariaLabel='valet app shell example'
              />
            </Panel>
          </Grid>
          <Typography>
            The router and pages stay the same; only the outer shell changes. Once{' '}
            <code>useInitialTheme</code> runs, <code>Surface</code> and other components pick up
            palette, spacing, radii, and font information automatically.
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
            Step 2 – Port your theme: palette, typography, and shape
          </Typography>
          <Divider pad={0.5} />
          <Typography>
            MUI&apos;s <code>createTheme</code> combines palette, typography, spacing, and shape in
            one object. valet lets you patch the built-in theme with the same information via{' '}
            <code>useInitialTheme</code> (on startup) or <code>useTheme().setTheme</code> (later).
          </Typography>
          <Grid
            columns={2}
            gap={1}
            adaptive
          >
            <Panel pad={1}>
              <Typography
                variant='subtitle'
                bold
              >
                Before: MUI theme
              </Typography>
              <CodeBlock
                code={muiThemeSnippet}
                ariaLabel='MUI theme example'
              />
            </Panel>
            <Panel pad={1}>
              <Typography
                variant='subtitle'
                bold
              >
                After: valet theme patch
              </Typography>
              <CodeBlock
                code={valetThemeSnippet}
                ariaLabel='valet theme patch example'
              />
            </Panel>
          </Grid>
          <Typography>
            Start by mapping your primary, secondary, error, background, and text colours. Then
            align typography and fonts. Spacing, radii, and strokes piggyback on{' '}
            <code>--valet-space</code>, which you can adjust per <code>&lt;Surface&gt;</code> via
            the <code>density</code> prop instead of hard-coding global spacing multipliers.
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
            Step 3 – Move to Surface-based layouts
          </Typography>
          <Divider pad={0.5} />
          <Typography>
            A typical MUI layout wraps the viewport in a <code>&lt;Box&gt;</code> and uses{' '}
            <code>Stack</code> or <code>Grid</code> inside. In valet, each route renders exactly one{' '}
            <code>&lt;Surface&gt;</code>, which owns viewport state and exposes CSS variables such
            as <code>--valet-screen-width</code> and <code>--valet-screen-height</code>.
          </Typography>
          <CodeBlock
            code={layoutMappingSnippet}
            ariaLabel='Layout migration example from MUI Box/Stack to valet Surface/Stack/Panel'
          />
          <Typography>
            Components created with <code>createStyled</code> register with the surface store and
            expose <code>--valet-el-width</code> and <code>--valet-el-height</code>, so complex
            widgets like <code>Table</code> can size themselves without consulting{' '}
            <code>window.innerWidth</code>. Keep one surface per route to avoid nested stores.
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
            Step 4 – Translate components and sx into presets
          </Typography>
          <Divider pad={0.5} />
          <Typography>
            Most MUI components have a direct valet counterpart—often with simpler, more opinionated
            props. Instead of sprinkling <code>sx</code> everywhere, move shared styling into{' '}
            <code>definePreset</code> and apply it via the <code>preset</code> prop.
          </Typography>
          <Grid
            columns={2}
            gap={1}
            adaptive
          >
            <Panel pad={1}>
              <Typography
                variant='subtitle'
                bold
              >
                From scattered sx to presets
              </Typography>
              <CodeBlock
                code={presetSnippet}
                ariaLabel='Preset migration example from MUI Paper sx to valet Panel preset'
              />
            </Panel>
            <Panel pad={1}>
              <Typography
                variant='subtitle'
                bold
              >
                Component mapping (high level)
              </Typography>
              <CodeBlock
                code={componentMappingSnippet}
                ariaLabel='Component mapping from MUI to valet'
              />
            </Panel>
          </Grid>
          <Typography>
            When you reach for <code>sx</code> in valet, first ask whether a component prop (e.g.,{' '}
            <code>fullWidth</code>, <code>variant</code>, <code>density</code>, <code>alignX</code>)
            or a preset would better encode your intent. This keeps the UI introspectable for MCP
            and easier to restyle later.
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
            Suggested migration order
          </Typography>
          <Divider pad={0.5} />
          <Stack gap={0.5}>
            <Typography>1. Keep your routes and data as-is; install @archway/valet.</Typography>
            <Typography>
              2. Add <code>useInitialTheme</code> in your root <code>App</code> and remove MUI
              <code>ThemeProvider</code>/<code>CssBaseline</code>.
            </Typography>
            <Typography>
              3. Wrap each route in a <code>&lt;Surface&gt;</code>; delete full-height{' '}
              <code>Box</code> wrappers and page-level <code>Paper</code> shells.
            </Typography>
            <Typography>
              4. Swap layout primitives: <code>Box</code>/<code>Stack</code>/<code>Grid</code> to{' '}
              <code>Stack</code>, <code>Panel</code>, and <code>Grid</code>.
            </Typography>
            <Typography>
              5. Replace field and widget components gradually (Buttons, TextFields, Tables,
              Dialogs/Modals, Snackbars, Tooltips).
            </Typography>
            <Typography>
              6. Consolidate repeated styles into presets, then tighten theme tokens (spacing,
              radii, motion) and density per surface.
            </Typography>
          </Stack>
        </Panel>

        <Panel
          fullWidth
          pad={1}
        >
          <Typography
            variant='h3'
            bold
          >
            Common pitfalls when moving from MUI
          </Typography>
          <Divider pad={0.5} />
          <Stack gap={0.5}>
            <Typography>
              • Nesting <code>&lt;Surface&gt;</code> components. valet expects one surface per
              route; nested surfaces throw an error so the layout remains predictable.
            </Typography>
            <Typography>
              • Re-running <code>useInitialTheme</code> in multiple components. Call it once near
              the root; use <code>useTheme</code> to read or patch tokens elsewhere.
            </Typography>
            <Typography>
              • Assuming <code>sx</code> behaves like MUI&apos;s theme callback. valet&apos;s{' '}
              <code>sx</code> is a thin style object with CSS variable support; prefer tokens and
              presets over ad-hoc logic.
            </Typography>
            <Typography>
              • Forgetting to translate semantic variants. Reserve strong visual variants (e.g.,
              contained buttons, error colours) for important or destructive actions just as you
              would in MUI.
            </Typography>
            <Typography>
              • Letting tables control page scroll. valet tables are height-aware by default and
              scroll internally so they play nicely with <code>&lt;Surface&gt;</code>; only opt out
              when the page truly needs full-document scroll.
            </Typography>
          </Stack>
        </Panel>
      </Stack>
    </Surface>
  );
}

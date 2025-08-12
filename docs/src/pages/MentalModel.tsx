// ─────────────────────────────────────────────────────────────
// src/pages/MentalModel.tsx  | valet-docs
// Mental model + MUI mapping for fast onboarding
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel, Button } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import { useNavigate } from 'react-router-dom';
import type { DocMeta } from '../types';

export const meta: DocMeta = {
  id: 'mental-model',
  title: 'Mental Model',
  description:
    'How valet thinks: primitives, theming, surfaces, and a direct mapping from common MUI habits.',
  pageType: 'guide',
  tldr: 'Opinionated primitives + one Surface per route + tokens via useTheme + presets instead of ad-hoc CSS.',
};

export default function MentalModelPage() {
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Mental Model
        </Typography>
        <Typography>
          valet favors a small set of predictable primitives over a kitchen-sink of variants. State
          and tokens live close to components, and routes sit on top of a single{' '}
          <code>Surface</code> to expose sizing and theme variables as CSS custom properties.
        </Typography>

        <Typography
          variant='h3'
          bold
        >
          Principles
        </Typography>
        <Panel fullWidth>
          <Typography>• One Surface per route; never nest surfaces.</Typography>
          <Typography>• Use Stack/Grid for layout; avoid manual margins.</Typography>
          <Typography>• Read/write tokens via useTheme; avoid hard-coded colors.</Typography>
          <Typography>• Share styles with definePreset() and use the preset prop.</Typography>
          <Typography>• Keep forms typed via createFormStore when needed.</Typography>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          If you did X in MUI, do Y in valet
        </Typography>
        <Panel fullWidth>
          <Typography>
            <b>ThemeProvider + SX:</b> Use <code>useInitialTheme</code> once, then{' '}
            <code>useTheme</code> and the
            <code>preset</code> prop for reusable styles.
          </Typography>
          <Typography>
            <b>Box + sx={{ p: 2 }}:</b> Prefer <code>Stack</code> with <code>gap</code> and a
            wrapping <code>Panel</code> for visual grouping; spacing comes from the theme scale via{' '}
            <code>theme.spacing(n)</code>.
          </Typography>
          <Typography>
            <b>Typography variants:</b> Use <code>Typography</code> with named <code>variant</code>{' '}
            and responsive sizes baked in.
          </Typography>
          <Typography>
            <b>DataGrid/Table:</b> Use valet <code>Table</code>; content scrolls within available
            height by default.
          </Typography>
          <Typography>
            <b>Snackbar/Alert:</b> Use <code>Snackbar</code> for transient messages; compose inside
            a <code>Surface</code>.
          </Typography>
          <Typography>
            <b>Modal/Dialog:</b> Use <code>Modal</code> with escape handling and accessible
            structure.
          </Typography>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          Why surfaces aren’t nestable
        </Typography>
        <Typography>
          Each surface owns a small store for viewport and child sizing and emits CSS variables such
          as
          <code>--valet-screen-width</code>. Nesting would create ambiguous sizing contexts and
          duplicated state, leading to brittle layouts. Keep it flat per route.
        </Typography>

        <Typography
          variant='h3'
          bold
        >
          Theming vs. CSS overrides
        </Typography>
        <Typography>
          Instead of ad-hoc CSS, change tokens through <code>useTheme</code> and factor shared
          styles into presets with <code>definePreset()</code> applied via the <code>preset</code>{' '}
          prop. This preserves consistency, a11y, and enables AI systems to reason over your design
          intent.
        </Typography>

        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}

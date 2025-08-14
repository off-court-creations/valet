// ─────────────────────────────────────────────────────────────
// src/pages/ComponentsPrimer.tsx  | valet-docs
// Primer: choose the right primitive and patterns
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel } from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import type { DocMeta } from '../../types';

export const meta: DocMeta = {
  id: 'components-primer',
  title: 'Components Primer',
  description: 'When to use Stack vs Grid, Box vs Panel, and how to compose inputs and feedback.',
  pageType: 'guide',
  tldr: 'Use Stack/Grid for layout, Panel for grouping, Typography for text, and keep flows keyboard-first.',
};

export default function ComponentsPrimerPage() {
  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Components Primer
        </Typography>
        <Typography>
          This page helps you choose the right primitive quickly and compose common patterns.
        </Typography>
        <Typography
          variant='h3'
          bold
        >
          Layout
        </Typography>
        <Panel fullWidth>
          <Typography>• Stack: 1D layouts and gaps; direction=row/column.</Typography>
          <Typography>• Grid: 2D layouts with spans and responsive tracks.</Typography>
          <Typography>• Panel: Visual grouping, borders, and surfaces.</Typography>
          <Typography>• Surface: Route root with CSS variables and sizing.</Typography>
        </Panel>
        <Typography
          variant='h3'
          bold
        >
          Inputs and Feedback
        </Typography>
        <Panel fullWidth>
          <Typography>• TextField, Select, Checkbox, RadioGroup for common fields.</Typography>
          <Typography>• FormControl wires labels, errors, disabled state accessibly.</Typography>
          <Typography>• Snackbar for transient messages; Modal for blocking flows.</Typography>
          <Typography>• Progress for async; Iterator and Slider for numeric input.</Typography>
        </Panel>
        <Typography
          variant='h3'
          bold
        >
          Data display
        </Typography>
        <Panel fullWidth>
          <Typography>• Table with built-in height constraints.</Typography>
          <Typography>• List and Tree for structured items.</Typography>
        </Panel>
      </Stack>
    </Surface>
  );
}

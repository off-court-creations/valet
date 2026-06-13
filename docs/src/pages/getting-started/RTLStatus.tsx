// ─────────────────────────────────────────────────────────────
// src/pages/getting-started/RTLStatus.tsx  | valet-docs
// Honest RTL / bidirectional-text support status (A11Y S12).
// "RTL Phase A" — what works today, what is explicitly deferred.
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Typography,
  Panel,
  CodeBlock,
  Table,
  type TableColumn,
} from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import type { DocMeta } from '../../types';

export const meta: DocMeta = {
  id: 'rtl-status',
  title: 'RTL Status',
  description:
    'Honest status of valet’s right-to-left (RTL) and bidirectional support: logical CSS properties, dir plumbing and start/end Drawer anchors work today; interactive drag math, underline-animation direction and full mirroring are deferred.',
  pageType: 'reference',
  prerequisites: ['quickstart'],
  components: ['Surface', 'Drawer', 'ValetLocaleProvider'],
  tldr: 'RTL Phase A is live: wrap the app in <ValetLocaleProvider locale="ar-EG"> (or pass dir="rtl"); Surface stamps dir on its root, valet styles use logical properties, and Drawer gains start/end anchors. Not yet: interactive drag math (Slider/Pagination), text-underline animation direction, and full visual mirroring. Static layout flips; some interactive geometry stays physical.',
};

/*───────────────────────────────────────────────────────────*/
/* Status matrix                                             */

interface RtlRow {
  area: string;
  status: 'Works' | 'Partial' | 'Deferred';
  detail: string;
}

const ROWS: RtlRow[] = [
  {
    area: 'Direction plumbing',
    status: 'Works',
    detail:
      'Surface stamps dir="ltr"|"rtl" on its single root element from the ValetLocaleProvider, so the whole subtree inherits direction. SSR-safe (context only — no document access).',
  },
  {
    area: 'Logical CSS properties',
    status: 'Works',
    detail:
      'The component styles use logical properties (inset-inline-*, margin-inline-*, padding-inline-*, border-inline-*, text-align:start/end). They resolve to the trailing/leading edge automatically under dir="rtl". LTR rendering is pixel-identical to before.',
  },
  {
    area: 'Drawer start/end anchors',
    status: 'Works',
    detail:
      "anchor='start' / anchor='end' resolve to left/right per direction (start = leading edge). Explicit 'left'/'right'/'top'/'bottom' are direction-invariant and never flip.",
  },
  {
    area: 'Snackbar / SpeedDial placement',
    status: 'Works',
    detail:
      'Both pin with inset-inline-end, so they sit at the trailing corner — bottom-left under RTL, bottom-right under LTR.',
  },
  {
    area: 'Built-in strings & labels',
    status: 'Partial',
    detail:
      'Component labels are translatable via the labels prop or ValetLocaleProvider strings, but valet ships only the English (en) table. You supply the translated strings; valet supplies the direction.',
  },
  {
    area: 'Slider / Pagination drag math',
    status: 'Deferred',
    detail:
      'Pointer-to-value math (gBCR, translate offsets) is computed in physical pixels and is NOT mirrored. A thumb dragged right still increases under RTL. Annotated `rtl: physical-by-design`.',
  },
  {
    area: 'Tabs underline animation direction',
    status: 'Deferred',
    detail:
      'The animated active-tab underline is positioned with measured pixels; its travel direction is not yet direction-aware.',
  },
  {
    area: 'Full visual mirroring',
    status: 'Deferred',
    detail:
      'Slide transforms, icon glyphs, and decorative directional affordances are not auto-mirrored. Only the box model (via logical properties) and dir-driven inline flow flip.',
  },
];

const STATUS_COLOR: Record<RtlRow['status'], string> = {
  Works: '#22C55E',
  Partial: '#EAB308',
  Deferred: '#EF4444',
};

export default function RTLStatusPage() {
  const columns: TableColumn<RtlRow>[] = [
    { header: 'Area', accessor: 'area', sortable: true },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => (
        <Typography
          variant='subtitle'
          bold
          sx={{ color: STATUS_COLOR[row.status] }}
        >
          {row.status}
        </Typography>
      ),
    },
    { header: 'Detail', accessor: 'detail' },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack
        gap={2}
        sx={{ padding: '1rem', maxWidth: 1100 }}
      >
        <Typography
          variant='h2'
          bold
        >
          RTL & Bidirectional Status
        </Typography>
        <Typography>
          valet supports right-to-left (RTL) layout in what the overhaul calls{' '}
          <strong>Phase A</strong>: direction plumbing, logical CSS properties, and direction-aware
          Drawer anchors. This page is deliberately honest about what flips today and what does{' '}
          <em>not</em> yet — so you can decide whether the current level of support fits your app.
        </Typography>

        <Panel
          fullWidth
          variant='outlined'
          pad={2}
        >
          <Typography>
            <strong>TL;DR.</strong> Wrap your app in a <code>ValetLocaleProvider</code> with an RTL
            locale (or an explicit <code>dir</code>). <code>Surface</code> stamps the direction on
            its root, the box model flips via logical properties, and <code>Drawer</code> gains{' '}
            <code>start</code>/<code>end</code> anchors. Interactive geometry (drag math, animated
            underlines) and full glyph mirroring are <strong>not</strong> handled yet.
          </Typography>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          Turning RTL on
        </Typography>
        <Typography>
          Direction comes from the locale context. Either pass an RTL locale (valet derives the
          direction with <code>Intl.Locale</code> + a script/language fallback) or set{' '}
          <code>dir</code> explicitly:
        </Typography>
        <CodeBlock
          ariaLabel='Enabling RTL with ValetLocaleProvider'
          code={`import { ValetLocaleProvider, Surface } from '@archway/valet';

// (a) derive direction from the locale
<ValetLocaleProvider locale='ar-EG'>
  <Surface>{/* dir="rtl" is stamped on the Surface root */}</Surface>
</ValetLocaleProvider>

// (b) or set direction explicitly (locale stays whatever you pass)
<ValetLocaleProvider locale='en-US' dir='rtl'>
  <Surface>…</Surface>
</ValetLocaleProvider>`}
        />
        <Typography>
          A bare <code>dir</code> prop on a specific <code>Surface</code> still wins over the
          provider, so you can scope an island of LTR (e.g. a code panel) inside an RTL screen.
        </Typography>

        <Typography
          variant='h3'
          bold
        >
          Direction-aware Drawer anchors
        </Typography>
        <Typography>
          The four physical anchors are unchanged and never flip. The additive logical anchors
          follow direction — <code>start</code> is the leading edge, <code>end</code> the trailing
          edge:
        </Typography>
        <CodeBlock
          ariaLabel='Drawer logical anchors'
          code={`<Drawer anchor='start' aria-label='Nav'>…</Drawer>
// dir="ltr" → opens from the left
// dir="rtl" → opens from the right

<Drawer anchor='left' aria-label='Nav'>…</Drawer>
// stays on the left in BOTH directions (physical, by design)`}
        />

        <Typography
          variant='h3'
          bold
        >
          What works / what doesn’t
        </Typography>
        <Panel fullWidth>
          <Table
            data={ROWS}
            columns={columns}
            striped
            dividers
            constrainHeight={false}
          />
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          Why some geometry stays physical
        </Typography>
        <Typography>
          A few effects compute layout from measured pixels (e.g. a Slider thumb’s pointer math, the
          Pagination window scroll, the animated Tabs underline). Mirroring those correctly is{' '}
          <em>interactive</em> RTL — a logged deferral, not an oversight. Those declarations are
          annotated <code>{'/* rtl: physical-by-design */'}</code> in the source and are enforced by
          the <code>check:rtl</code> gate: every physical property is either migrated to a logical
          one or explicitly annotated, so a regression can’t sneak a physical property back in
          unnoticed.
        </Typography>

        <Panel
          fullWidth
          variant='outlined'
          pad={2}
        >
          <Typography>
            <strong>Bottom line.</strong> Static layout, inline flow, and Drawer placement are
            RTL-ready. If your app needs fully mirrored interactive widgets (RTL drag direction,
            mirrored animations), that is on the roadmap but not shipped — test the specific widgets
            you rely on before committing to a full RTL launch.
          </Typography>
        </Panel>
      </Stack>
    </Surface>
  );
}

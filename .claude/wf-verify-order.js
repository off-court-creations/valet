export const meta = {
  name: 'valet-verify-order',
  description: 'Derive the ideal bottom-up (topological) component verification order for the 1.0 re-test pass',
  phases: [
    { title: 'Map', detail: 'per-tier dependency profiles (component imports + runtime/system deps + risk)' },
    { title: 'Order', detail: 'synthesize the topological verification order + handle back-edges' },
  ],
}

const CONTEXT = `
PROJECT: @archway/valet (cwd /home/xbenc/occ/valet, branch feat/valet-1.0). Every component was just
flagged status:'experimental' for a pre-1.0 re-verification pass; the maintainer will test each and
promote back to 'stable'. GOAL: determine the IDEAL ORDER to verify components so that when a component
is tested, everything it depends on is ALREADY verified+locked — avoiding rework (the "fix a foundation
after its dependents" chicken-and-egg).

This is a TOPOLOGICAL-SORT problem over the dependency graph. Verify leaves/foundations first, composites last.

Recent 1.0 changes that raise re-test risk (note which components they touch):
- Deprecation sweep (removed alias props) across Accordion/Pagination/RadioGroup/Panel/Table/List/Switch.
- A11y label wiring into Switch/Slider/Select/Iterator (+ DateSelector internal Selects).
- SSR guards in AppBar/Drawer; Accordion reduced-motion via usePrefersReducedMotion.
- Type-surface curation (sendChat, barrel) — affects LLMChat/RichChat/KeyModal (aiKeyStore).
- SPACING/DENSITY RETUNE (cross-cutting, affects EVERYTHING): Grid default gap 1->2, Panel default pad
  1->2, Grid now equalizes child widths via --valet-panel-width, and the density scale was retuned +
  centralized (tight 0.8 / standard 0.9 / comfortable 1.0) in src/system/densityScale.ts.

KNOWN cross-component import edges (already extracted via grep — Component -> sibling components it imports):
  Button->Typography; IconButton->Icon; MetroSelect->Icon,Panel,Stack,Typography; Accordion->Typography;
  AppBar->Button; Drawer->IconButton; List->Typography; Surface->LoadingBackdrop; Tabs->Tooltip,Typography;
  Chip->Icon,Typography; CodeBlock->IconButton; Dropzone->Grid,Icon,Panel,Progress,Stack;
  KeyModal->Button,Modal,Panel,Stack,Typography; LLMChat->Avatar,IconButton,Panel,Select,Stack,TextField,Typography;
  LoadingBackdrop->Progress; Markdown->Divider,Image,Panel,Stack,Typography; Pagination->Typography;
  RichChat->Avatar,IconButton,Panel,TextField,Typography; Snackbar->Typography; Table->Checkbox; Tree->Icon,Typography.

NOTE the layering inversions to handle: Surface->LoadingBackdrop->Progress, and Tabs->Tooltip.

You may read source under src/components and src/system. Cite file:line for any dependency you add beyond the
grep edges above.
`

const MAP_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['tier', 'components'],
  properties: {
    tier: { type: 'string' },
    components: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'componentDeps', 'systemDeps', 'retestRisk', 'notes'],
        properties: {
          name: { type: 'string' },
          componentDeps: {
            type: 'array',
            items: { type: 'string' },
            description: 'sibling components it imports OR renders at runtime (incl. any the grep missed; cite)',
          },
          systemDeps: {
            type: 'array',
            items: { type: 'string' },
            description:
              'cross-cutting runtime deps that gate verification: e.g. requires-Surface (useSurface), overlay engine, form store (useForm/FormControl), theme/spacing/density, events vocabulary, aiKeyStore',
          },
          retestRisk: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: 'how exposed is this component to the recent 1.0 changes (esp. spacing/density + its listed changes)',
          },
          notes: { type: 'string', description: 'back-edges, cycles, or special verification considerations' },
        },
      },
    },
  },
}

const FOUNDATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['foundations'],
  properties: {
    foundations: {
      type: 'array',
      description: 'cross-cutting subsystems (NOT components) that must be verified BEFORE any component, in order',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'why', 'verifyHow'],
        properties: {
          name: { type: 'string' },
          why: { type: 'string' },
          verifyHow: { type: 'string', description: 'concrete way to verify it (existing test, check script, or what to look at)' },
        },
      },
    },
  },
}

const ORDER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['tiers', 'backEdges', 'orderedChecklist', 'rationale'],
  properties: {
    tiers: {
      type: 'array',
      description: 'topological tiers, tier 0 first (most-depended-upon)',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['tier', 'label', 'components', 'why'],
        properties: {
          tier: { type: 'number' },
          label: { type: 'string' },
          components: { type: 'array', items: { type: 'string' } },
          why: { type: 'string' },
        },
      },
    },
    backEdges: {
      type: 'array',
      description: 'layering inversions / cycles and how to handle them in the order',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['edge', 'handling'],
        properties: { edge: { type: 'string' }, handling: { type: 'string' } },
      },
    },
    orderedChecklist: {
      type: 'array',
      description: 'the final flat verification order (foundations first, then components bottom-up)',
      items: { type: 'string' },
    },
    rationale: { type: 'string', description: '3-6 sentences on the ordering principle + how it kills the chicken-and-egg' },
  },
}

const TIERS = {
  primitives:
    'Avatar, Icon, Image, Divider, Progress (ProgressBar/ProgressRing), Typography, Video, WebGLCanvas',
  layout: 'Accordion, AppBar, Box, Drawer, Grid, List, Modal, Panel, Stack, Surface, Tabs',
  fields:
    'Button, Checkbox, DateSelector, FormControl, IconButton, Iterator, MetroSelect, Radio, RadioGroup, Select, Slider, Switch, TextField',
  widgets:
    'Chip, CodeBlock, Dropzone, KeyModal, LLMChat, Markdown, Pagination, ParallaxBackground, ParallaxLayer, ParallaxScroll, RichChat, Snackbar, SpeedDial, Table, Tooltip, Tree, ValetErrorBoundary, LoadingBackdrop',
}

phase('Map')
log('Mapping per-tier dependency profiles (component + runtime/system deps + re-test risk) in parallel.')

const mapThunks = Object.entries(TIERS).map(([tier, list]) => () =>
  agent(
    `${CONTEXT}\n\nYOUR TIER: ${tier}. Components: ${list}.\n` +
      `For EACH component in your tier, read its source under src/components and report: (1) componentDeps — ` +
      `every sibling component it imports OR renders at runtime (start from the grep edges, add any it missed, ` +
      `cite file:line for additions); (2) systemDeps — cross-cutting runtime deps that gate verification ` +
      `(requires-Surface, overlay engine, form store, theme/spacing/density, events, aiKeyStore); (3) retestRisk ` +
      `given the recent 1.0 changes (the spacing/density retune touches ALL container-using components); ` +
      `(4) notes on any back-edge/cycle/special consideration. Be precise and complete for the whole tier.`,
    { label: `map:${tier}`, phase: 'Map', schema: MAP_SCHEMA },
  ),
)

const foundationThunk = () =>
  agent(
    `${CONTEXT}\n\nYOU MAP THE CROSS-CUTTING FOUNDATIONS (not components) that underpin every component and ` +
      `must be verified FIRST: the CSS engine (src/css), the theme/spacing/density system (themeStore, ` +
      `densityScale, --valet-space, compact cascade), the Surface/surfaceStore context, the overlay engine ` +
      `(src/system/overlay), the form store (createFormStore/FormControl), and the events vocabulary. For each, ` +
      `say why it gates component verification and how to verify it (existing tests / check scripts / what to ` +
      `inspect). Order them by how foundational they are. Since the spacing/density retune is the freshest ` +
      `cross-cutting change, weight it.`,
    { label: 'map:foundations', phase: 'Map', schema: FOUNDATION_SCHEMA },
  )

const [maps, foundationsRes] = await Promise.all([
  parallel(mapThunks),
  parallel([foundationThunk]).then((r) => r[0]),
])

const tierMaps = (maps || []).filter(Boolean)
const foundations = foundationsRes?.foundations ?? []

phase('Order')
log('Synthesizing the topological verification order from the tier maps + foundations.')

const order = await agent(
  `${CONTEXT}\n\nHere are the per-tier dependency maps (JSON):\n${JSON.stringify(tierMaps)}\n\n` +
    `And the cross-cutting foundations to verify first (JSON):\n${JSON.stringify(foundations)}\n\n` +
    `Produce the IDEAL bottom-up VERIFICATION ORDER as a topological sort of the dependency graph:\n` +
    `- Group components into topological TIERS (tier 0 = leaves/most-depended-upon like Typography/Icon, ` +
    `last tier = most composite widgets). Every component must appear after ALL its componentDeps.\n` +
    `- Identify BACK-EDGES / layering inversions (e.g. Surface->LoadingBackdrop->Progress, Tabs->Tooltip) and ` +
    `say exactly how to sequence them so verification doesn't loop (e.g. verify Progress+LoadingBackdrop before ` +
    `Surface; verify Tooltip before Tabs — even though they're 'widgets').\n` +
    `- Put the cross-cutting FOUNDATIONS first in the flat orderedChecklist (engine, theme/spacing/density, ` +
    `Surface context, overlay, forms), THEN the component tiers bottom-up.\n` +
    `- The orderedChecklist is the actionable sequence the maintainer follows. Keep it concrete.\n` +
    `Default to verifying a dependency BEFORE its dependents whenever there's any doubt.`,
  { label: 'synthesize:order', phase: 'Order', schema: ORDER_SCHEMA },
)

return { foundations, tierMaps, order }

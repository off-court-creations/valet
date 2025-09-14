// ─────────────────────────────────────────────────────────────
// docs/src/data/componentsStatus.ts  | valet-docs
// Snapshot of component statuses derived from MCP build output
// ─────────────────────────────────────────────────────────────

export type ComponentStatus = {
  name: string;
  category: string;
  slug: string;
  status: 'golden' | 'stable' | 'experimental' | 'unstable' | 'deprecated';
};

export const COMPONENTS_STATUS: ComponentStatus[] = [
  { name: 'Button', category: 'fields', slug: 'components/fields/button', status: 'experimental' },
  {
    name: 'Checkbox',
    category: 'fields',
    slug: 'components/fields/checkbox',
    status: 'experimental',
  },
  {
    name: 'DateSelector',
    category: 'fields',
    slug: 'components/fields/dateselector',
    status: 'experimental',
  },
  {
    name: 'FormControl',
    category: 'fields',
    slug: 'components/fields/formcontrol',
    status: 'experimental',
  },
  {
    name: 'IconButton',
    category: 'fields',
    slug: 'components/fields/iconbutton',
    status: 'experimental',
  },
  {
    name: 'Iterator',
    category: 'fields',
    slug: 'components/fields/iterator',
    status: 'experimental',
  },
  {
    name: 'MetroSelect',
    category: 'fields',
    slug: 'components/fields/metroselect',
    status: 'experimental',
  },
  { name: 'Radio', category: 'fields', slug: 'components/fields/radio', status: 'experimental' },
  { name: 'Select', category: 'fields', slug: 'components/fields/select', status: 'experimental' },
  { name: 'Slider', category: 'fields', slug: 'components/fields/slider', status: 'experimental' },
  { name: 'Switch', category: 'fields', slug: 'components/fields/switch', status: 'experimental' },
  {
    name: 'TextField',
    category: 'fields',
    slug: 'components/fields/textfield',
    status: 'experimental',
  },
  {
    name: 'Accordion',
    category: 'layout',
    slug: 'components/layout/accordion',
    status: 'experimental',
  },
  { name: 'AppBar', category: 'layout', slug: 'components/layout/appbar', status: 'experimental' },
  { name: 'Box', category: 'layout', slug: 'components/layout/box', status: 'experimental' },
  { name: 'Drawer', category: 'layout', slug: 'components/layout/drawer', status: 'experimental' },
  { name: 'Grid', category: 'layout', slug: 'components/layout/grid', status: 'experimental' },
  { name: 'List', category: 'layout', slug: 'components/layout/list', status: 'unstable' },
  { name: 'Modal', category: 'layout', slug: 'components/layout/modal', status: 'experimental' },
  { name: 'Panel', category: 'layout', slug: 'components/layout/panel', status: 'experimental' },
  { name: 'Stack', category: 'layout', slug: 'components/layout/stack', status: 'experimental' },
  { name: 'Surface', category: 'layout', slug: 'components/layout/surface', status: 'golden' },
  { name: 'Tabs', category: 'layout', slug: 'components/layout/tabs', status: 'experimental' },
  {
    name: 'Avatar',
    category: 'primitives',
    slug: 'components/primitives/avatar',
    status: 'experimental',
  },
  {
    name: 'Divider',
    category: 'primitives',
    slug: 'components/primitives/divider',
    status: 'experimental',
  },
  {
    name: 'Icon',
    category: 'primitives',
    slug: 'components/primitives/icon',
    status: 'experimental',
  },
  {
    name: 'Image',
    category: 'primitives',
    slug: 'components/primitives/image',
    status: 'experimental',
  },
  {
    name: 'Progress',
    category: 'primitives',
    slug: 'components/primitives/progress',
    status: 'unstable',
  },
  {
    name: 'Skeleton',
    category: 'primitives',
    slug: 'components/primitives/skeleton',
    status: 'experimental',
  },
  {
    name: 'Typography',
    category: 'primitives',
    slug: 'components/primitives/typography',
    status: 'experimental',
  },
  {
    name: 'Video',
    category: 'primitives',
    slug: 'components/primitives/video',
    status: 'experimental',
  },
  {
    name: 'CodeBlock',
    category: 'widgets',
    slug: 'components/widgets/codeblock',
    status: 'experimental',
  },
  {
    name: 'Dropzone',
    category: 'widgets',
    slug: 'components/widgets/dropzone',
    status: 'experimental',
  },
  {
    name: 'LLMChat',
    category: 'widgets',
    slug: 'components/widgets/llmchat',
    status: 'experimental',
  },
  {
    name: 'LoadingBackdrop',
    category: 'widgets',
    slug: 'components/widgets/loadingbackdrop',
    status: 'experimental',
  },
  {
    name: 'Markdown',
    category: 'widgets',
    slug: 'components/widgets/markdown',
    status: 'experimental',
  },
  {
    name: 'Pagination',
    category: 'widgets',
    slug: 'components/widgets/pagination',
    status: 'experimental',
  },
  {
    name: 'ParallaxBackground',
    category: 'widgets',
    slug: 'components/widgets/parallaxbackground',
    status: 'experimental',
  },
  {
    name: 'RichChat',
    category: 'widgets',
    slug: 'components/widgets/richchat',
    status: 'experimental',
  },
  {
    name: 'Snackbar',
    category: 'widgets',
    slug: 'components/widgets/snackbar',
    status: 'experimental',
  },
  {
    name: 'SpeedDial',
    category: 'widgets',
    slug: 'components/widgets/speeddial',
    status: 'experimental',
  },
  {
    name: 'Stepper',
    category: 'widgets',
    slug: 'components/widgets/stepper',
    status: 'experimental',
  },
  { name: 'Table', category: 'widgets', slug: 'components/widgets/table', status: 'experimental' },
  {
    name: 'Tooltip',
    category: 'widgets',
    slug: 'components/widgets/tooltip',
    status: 'experimental',
  },
  { name: 'Tree', category: 'widgets', slug: 'components/widgets/tree', status: 'experimental' },
];

export function sortComponents(a: ComponentStatus, b: ComponentStatus) {
  return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
}

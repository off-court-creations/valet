// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/layout/Surface.tsx  | valet-docs
// Reusable docs for <Surface>: explainer (Usage), Best Practices, Reference
// ─────────────────────────────────────────────────────────────
import { Stack, Typography, Panel } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import SurfaceMeta from '../../../../../src/components/layout/Surface.meta.json';

export default function SurfaceDocsPage() {
  const usage = (
    <Stack>
      <Typography>
        The <code>{'<Surface>'}</code> component wraps each route and provides the background,
        breakpoints and sizing variables for everything inside.
      </Typography>
      <Typography>
        <b>Never nest surfaces!</b> Each route should render exactly one at the highest level so
        components can subscribe to its store with <code>useSurface</code>.
      </Typography>
      <Panel
        compact
        fullWidth
      >
        <Typography>
          The surface store tracks screen size and every registered child element. Components
          created with <code>createStyled</code> update their dimensions via{' '}
          <code>--valet-el-width</code>
          and <code>--valet-el-height</code>. The surface exposes <code>--valet-screen-width</code>
          and <code>--valet-screen-height</code> for responsive layouts.
        </Typography>
      </Panel>
      <Typography>
        Other components such as <code>{'<Drawer>'}</code>, <code>{'<Accordion>'}</code> and
        <code>{' <Table>'}</code> read this store to align themselves with the available space.
      </Typography>
      <Panel compact>
        <Typography>
          {`<Surface>`}
          <br /> &nbsp;{`<MyRoute />`}
          <br />
          {`</Surface>`}
        </Typography>
      </Panel>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Surface'
      subtitle='Route-level container owning screen state and sizing variables.'
      slug='components/layout/surface'
      meta={SurfaceMeta}
      usage={usage}
    />
  );
}

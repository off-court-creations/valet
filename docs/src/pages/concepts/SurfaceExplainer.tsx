// ─────────────────────────────────────────────────────────────
// src/pages/SurfaceExplainer.tsx | valet-docs
// Explainer for using <Surface>
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel, Button } from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import { useNavigate } from 'react-router-dom';

export default function SurfaceExplainerPage() {
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant='h2'>Surface</Typography>
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
            <code>--valet-el-width</code> and <code>--valet-el-height</code>. The surface exposes{' '}
            <code>--valet-screen-width</code> and <code>--valet-screen-height</code> for responsive
            layouts.
          </Typography>
        </Panel>
        <Typography>
          Other components such as <code>{'<Drawer>'}</code>, <code>{'<Accordion>'}</code> and{' '}
          <code>{'<Table>'}</code> read this store to align themselves with the available space.
        </Typography>
        <Panel compact>
          <Typography>
            {`<Surface>`}
            <br /> &nbsp;{`<MyRoute />`}
            <br />
            {`</Surface>`}
          </Typography>
        </Panel>
        {/* Best Practices -------------------------------------------------- */}
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Use exactly one surface per route. Mount it at the highest level and never nest
            surfaces so children can subscribe to a single store via <code>useSurface</code>.
          </Typography>
          <Typography>
            - Prefer surface CSS variables over window APIs. Read
            <code> --valet-screen-width</code> and <code>--valet-screen-height</code> in styles (or
            query <code>useSurface</code>) instead of <code>window.innerWidth</code> to keep layout
            deterministic and testable.
          </Typography>
          <Typography>
            - Build on <code>createStyled</code>. Components made with <code>styled</code> register
            automatically and expose <code>--valet-el-width</code> / <code>--valet-el-height</code>,
            which the surface updates via ResizeObserver for responsive sizing without layout
            thrash.
          </Typography>
          <Typography>
            - Keep portalled overlays out of the registry. Drawers/Modals rendered outside the
            surface root are intentionally not tracked to avoid unnecessary observers. Size them via
            tokens and breakpoints, not child metrics.
          </Typography>
          <Typography>
            - Respect height constraints. Tables are height‑aware by default; let their content
            scroll inside the component. Only pass <code>{'constrainHeight={false}'}</code> when
            page context requires full‑document scroll.
          </Typography>
          <Typography>
            - Drive spacing and density with variables. Adjust <code>--valet-space</code>,
            <code> --valet-radius</code>, and <code>--valet-stroke</code> on the surface to shift an
            entire view without changing component code.
          </Typography>
        </Panel>
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}

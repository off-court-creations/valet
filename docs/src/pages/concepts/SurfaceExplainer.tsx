// ─────────────────────────────────────────────────────────────
// src/pages/SurfaceExplainer.tsx | valet-docs
// Explainer for using <Surface>
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel, Button } from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import { useNavigate } from 'react-router-dom';
import BestPractices from '../../components/BestPractices';
import { getBestPractices } from '../../utils/sidecar';
import SurfaceMeta from '../../../../src/components/layout/Surface.meta.json';

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
        {/* Best Practices (from sidecar) ---------------------------------- */}
        <BestPractices items={getBestPractices(SurfaceMeta)} />
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}

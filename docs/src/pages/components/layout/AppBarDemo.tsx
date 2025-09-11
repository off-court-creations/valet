// src/pages/AppBarDemo.tsx
import { Surface, Stack, Typography, Button, AppBar, Icon, Panel, useTheme } from '@archway/valet';
import PageHero from '../../../components/PageHero';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';

export default function AppBarDemoPage() {
  const { toggleMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <AppBar
        left={
          <>
            <Icon icon='mdi:car' />
            <Typography fontFamily='Cabin'>AppBar Slots</Typography>
          </>
        }
        right={
          <Button
            variant='outlined'
            onClick={toggleMode}
          >
            Toggle
          </Button>
        }
      />
      <Stack>
        <PageHero title='AppBar' />

        <Stack>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>

          <Button
            variant='outlined'
            onClick={toggleMode}
          >
            Toggle light / dark
          </Button>

          {/* Best Practices ---------------------------------------------- */}
          <Panel fullWidth>
            <Typography variant='h4'>Best Practices</Typography>
            <Typography>
              - Use a single AppBar per route. It registers with the current{' '}
              <code>{'<Surface>'}</code>
              and automatically offsets content; avoid adding manual top padding/margins.
            </Typography>
            <Typography>
              - Prefer tokens and presets. Set <code>color</code> to{' '}
              <code>&apos;primary&apos;</code>,<code> &apos;secondary&apos;</code>, or{' '}
              <code>&apos;tertiary&apos;</code> and adjust spacing via the
              <code> pad</code> prop using <code>theme.spacing</code>. Use <code>preset</code> to
              standardize variants.
            </Typography>
            <Typography>
              - Keep slot content purposeful. Place brand/navigation in <code>left</code> and
              primary actions in <code>right</code>. For icon-only controls, provide
              <code> aria-label</code> for accessibility.
            </Typography>
            <Typography>
              - Avoid fixed heights. Let padding and typography define height so the AppBar adapts
              to density, fonts, and breakpoints without magic numbers.
            </Typography>
            <Typography>
              - Mind stacking contexts. The AppBar is portalled to <code>document.body</code> with a
              high z-index. Avoid creating local stacking contexts that unintentionally cover it.
            </Typography>
          </Panel>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}

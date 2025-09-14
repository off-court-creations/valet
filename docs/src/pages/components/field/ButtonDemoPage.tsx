// ─────────────────────────────────────────────────────────────
// src/pages/ButtonDemoPage.tsx | valet-docs
// Comprehensive Button showcase (no redundancy, toggle last)
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Box, Typography, Button, Icon, useTheme, Tabs } from '@archway/valet';
type ComponentMeta = { slug?: string };
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import ReferenceSection from '../../../components/ReferenceSection';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import ButtonMeta from '../../../../../src/components/fields/Button.meta.json';

/*─────────────────────────────────────────────────────────────*/
export default function ButtonDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Button' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography variant='subtitle'>Variants, sizes, palettes &amp; more</Typography>

            {/* 1 ▸ Variants -------------------------------------------------- */}
            <Typography variant='h3'>1. Variants</Typography>
            <Stack direction='row'>
              <Button>contained (default)</Button>
              <Button variant='outlined'>outlined</Button>
            </Stack>

            {/* 2 ▸ Sizes ----------------------------------------------------- */}
            <Typography variant='h3'>2. Sizes</Typography>
            <Stack direction='row'>
              <Button size='xs'>xs</Button>
              <Button size='sm'>sm</Button>
              <Button>md (default)</Button>
              <Button size='lg'>lg</Button>
              <Button size='xl'>xl</Button>
            </Stack>
            <Stack direction='row'>
              <Button size='2rem'>2rem</Button>
              <Button size='32px'>32px</Button>
            </Stack>

            {/* 3 ▸ Full-width ---------------------------------------------- */}
            <Typography variant='h3'>3. fullWidth</Typography>
            <Box sx={{ maxWidth: 360 }}>
              <Button fullWidth>Stretch to parent</Button>
            </Box>

            {/* 4 ▸ Palette tokens ------------------------------------------ */}
            <Typography variant='h3'>4. Palette tokens</Typography>
            <Stack direction='row'>
              <Button color='primary'>primary</Button>
              <Button color='secondary'>secondary</Button>
              <Button color='tertiary'>tertiary</Button>
            </Stack>

            {/* 5 ▸ Custom colours ------------------------------------------ */}
            <Typography variant='h3'>5. Custom backgrounds</Typography>
            <Stack direction='row'>
              <Button color='#9C27B0'>#9C27B0</Button>
              <Button color='#00BFA5'>#00BFA5</Button>
            </Stack>

            {/* 6 ▸ Icons & text ------------------------------------------- */}
            <Typography variant='h3'>6. Icons &amp; text</Typography>
            <Button>
              <Icon
                icon='carbon:chat'
                sx={{ marginRight: theme.spacing(1) }}
              />
              With icon
            </Button>

            {/* 7 ▸ Outlined overrides -------------------------------------- */}
            <Typography variant='h3'>7. Outlined colour override</Typography>
            <Stack direction='row'>
              <Button variant='outlined'>default outline</Button>
              <Button
                variant='outlined'
                color='secondary'
              >
                secondary outline
              </Button>
              <Button
                variant='outlined'
                color='tertiary'
              >
                tertiary outline
              </Button>
              <Button
                variant='outlined'
                color='#e91e63'
              >
                <Typography>#e91e63 outline</Typography>
              </Button>
            </Stack>

            {/* 8 ▸ Disabled ------------------------------------------------- */}
            <Typography variant='h3'>8. Disabled</Typography>
            <Stack direction='row'>
              <Button disabled>contained</Button>
              <Button
                variant='outlined'
                disabled
              >
                outlined
              </Button>
              <Button
                color='secondary'
                disabled
              >
                palette
              </Button>
            </Stack>

            {/* 9 ▸ Custom label variants ----------------------------------- */}
            <Typography variant='h3'>9. Custom label variants</Typography>
            <Stack direction='row'>
              <Button>
                <Typography variant='h4'>h4 in button</Typography>
              </Button>
              <Button>
                <Typography variant='subtitle'>subtitle text</Typography>
              </Button>
              <Button variant='outlined'>
                <Typography variant='h5'>h5 outlined</Typography>
              </Button>
            </Stack>

            {/* 10 ▸ Theme toggle (LAST) ------------------------------------ */}
            <Typography variant='h3'>10. Theme toggle</Typography>
            <Button
              variant='outlined'
              onClick={toggleMode}
            >
              Toggle light / dark mode
            </Button>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection
              slug={(ButtonMeta as ComponentMeta)?.slug || 'components/fields/button'}
            />
          </Tabs.Panel>
        </Tabs>

        <CuratedExamples examples={getExamples(ButtonMeta)} />
        <BestPractices items={getBestPractices(ButtonMeta)} />

        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}

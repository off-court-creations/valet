// ─────────────────────────────────────────────────────────────────────────────
// src/pages/IconButtonDemoPage.tsx
// A comprehensive live demo of ZeroUI <IconButton />
// ─────────────────────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Box,
  Typography,
  Button,
  IconButton,
  Icon,
  useTheme,
  definePreset,
  Tabs,
} from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import IconButtonMeta from '../../../../../src/components/fields/IconButton.meta.json';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Style preset showcasing IconButton inside a card                            */
definePreset(
  'actionCard',
  (t) => `
    background   : ${t.colors['backgroundAlt']};
    padding      : ${t.spacing(1)};
    border-radius: 16px;
    box-shadow   : 0 4px 12px ${t.colors['text']}22;
    display      : flex;
    align-items  : center;
    gap          : ${t.spacing(1)};
  `,
);

/*─────────────────────────────────────────────────────────────────────────────*/
/* Example custom SVGs                                                         */
const HeartSvg = (
  <svg
    viewBox='0 0 24 24'
    stroke='none'
  >
    <path
      d='M12 21s-6.4-4.35-9.32-7.27C.9 11.94.5 8.77 2.53 6.5 4.08 4.69 6.89 4.21 9 5.44c2.11-1.23 4.92-.75 6.47 1.06 2.03 2.27 1.63 5.44-.15 7.23C18.4 16.65 12 21 12 21Z'
      fill='currentColor'
    />
  </svg>
);

/*─────────────────────────────────────────────────────────────────────────────*/
export default function IconButtonDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Icon Button' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography variant='subtitle'>
              Circular icon-only buttons with contained &amp; outlined styles
            </Typography>

            {/* 1. Contained sizes --------------------------------------------- */}
            <Typography variant='h3'>1. Contained sizes</Typography>
            <Stack direction='row'>
              <IconButton
                icon='mdi:play'
                size='xs'
                aria-label='Play xs'
              />
              <IconButton
                icon='mdi:play'
                size='sm'
                aria-label='Play small'
              />
              <IconButton
                icon='mdi:play'
                size='md'
                aria-label='Play medium'
              />
              <IconButton
                icon='mdi:play'
                size='lg'
                aria-label='Play large'
              />
              <IconButton
                icon='mdi:play'
                size='xl'
                aria-label='Play extra'
              />
            </Stack>

            {/* 2. Outlined sizes ---------------------------------------------- */}
            <Typography variant='h3'>2. Outlined sizes</Typography>
            <Stack direction='row'>
              <IconButton
                variant='outlined'
                icon='mdi:pause'
                size='xs'
                aria-label='Pause xs'
              />
              <IconButton
                variant='outlined'
                icon='mdi:pause'
                size='sm'
                aria-label='Pause small'
              />
              <IconButton
                variant='outlined'
                icon='mdi:pause'
                size='md'
                aria-label='Pause medium'
              />
              <IconButton
                variant='outlined'
                icon='mdi:pause'
                size='lg'
                aria-label='Pause large'
              />
              <IconButton
                variant='outlined'
                icon='mdi:pause'
                size='xl'
                aria-label='Pause extra'
              />
            </Stack>

            {/* 3. Colour override --------------------------------------------- */}
            <Typography variant='h3'>3. Icon colour override</Typography>
            <Stack direction='row'>
              <IconButton
                icon='mdi:heart'
                iconColor='#ff5e5e'
                aria-label='Favorite'
              />
              <IconButton
                variant='outlined'
                icon='mdi:pencil'
                iconColor={theme.colors['secondary']}
                aria-label='Edit'
              />
            </Stack>

            {/* 4. Custom SVG --------------------------------------------------- */}
            <Typography variant='h3'>4. Custom SVG graphics</Typography>
            <Stack direction='row'>
              <IconButton
                svg={HeartSvg}
                aria-label='Heart'
              />
            </Stack>

            {/* 5. Custom sizes ------------------------------------------------- */}
            <Typography variant='h3'>5. Custom sizes</Typography>
            <Stack direction='row'>
              <IconButton
                icon='mdi:play'
                size='3em'
                aria-label='Play 3em'
              />
              <IconButton
                icon='mdi:star'
                size={56}
                aria-label='Star 56px'
              />
            </Stack>

            {/* 6. Disabled & active states ------------------------------------ */}
            <Typography variant='h3'>6. Disabled state</Typography>
            <IconButton
              icon='mdi:delete'
              size='md'
              disabled
              aria-label='Delete disabled'
            />

            {/* 7. Preset usage ------------------------------------------------- */}
            <Typography variant='h3'>7. Preset integration</Typography>
            <Box preset='actionCard'>
              <IconButton
                icon='mdi:credit-card'
                size='md'
                aria-label='Pay now'
              />
              <Typography>Pay now</Typography>
            </Box>

            {/* 8. Theme coupling ---------------------------------------------- */}
            <Typography variant='h3'>8. Theme demonstration</Typography>
            <Button
              variant='outlined'
              onClick={toggleMode}
            >
              Toggle light / dark mode&nbsp;
              <Icon
                icon='mdi:theme-light-dark'
                size='1.2em'
              />
            </Button>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/fields/iconbutton' />
          </Tabs.Panel>
        </Tabs>

        {/* Back nav -------------------------------------------------------- */}
        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>

        <CuratedExamples examples={getExamples(IconButtonMeta)} />
        <BestPractices items={getBestPractices(IconButtonMeta)} />
      </Stack>
    </Surface>
  );
}
